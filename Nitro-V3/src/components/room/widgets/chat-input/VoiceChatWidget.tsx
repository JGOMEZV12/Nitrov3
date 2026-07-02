import { GetGuestRoomResultEvent } from '@nitrots/nitro-renderer';
import
    {
        createLocalAudioTrack,
        LocalAudioTrack,
        RemoteParticipant,
        RemoteTrack,
        RemoteTrackPublication,
        Room,
        RoomEvent,
        Track,
    } from 'livekit-client';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { GetConfigurationValue, GetSessionDataManager } from '../../../../api';
import { useMessageEvent, useRoom } from '../../../../hooks';

const TOKEN_ENDPOINT = '/engine/livekit-token.php';

interface VoiceChatWidgetProps {
    onAudioBlocked?: (blocked: boolean) => void;
    onStartAudio?: (fn: () => void) => void;
    onMicActiveChange?: (active: boolean) => void;   // <-- nuevo
}

export const VoiceChatWidget: FC<VoiceChatWidgetProps> = ({ onAudioBlocked, onStartAudio, onMicActiveChange }) =>
{
    const { roomSession } = useRoom();

    const [ voiceEnabled, setVoiceEnabled ]   = useState<boolean>(false);   // Activado/Desativado
    const [ micActive, setMicActive ]         = useState<boolean>(false);   // mute/unmute
    const [ muteAll, setMuteAll ]             = useState<boolean>(false);
    const [ selfHear, setSelfHear ]           = useState<boolean>(false);
    const [ voiceDistance, setVoiceDistance ] = useState<number>(6);
    const [ volume, setVolume ]               = useState<number>(100);
    const [ participants, setParticipants ]   = useState<string[]>([]);
    const [ status, setStatus ]               = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    const [ errorMsg, setErrorMsg ]           = useState<string>('');
    const [ audioBlocked, setAudioBlocked ]   = useState<boolean>(false);
    // Selector de micrófono
    const [ micDevices, setMicDevices ]       = useState<MediaDeviceInfo[]>([]);
    const [ selectedMicId, setSelectedMicId ] = useState<string>('');

    const roomRef         = useRef<Room | null>(null);
    const audioTrackRef   = useRef<LocalAudioTrack | null>(null);
    const audioContainRef = useRef<HTMLDivElement>(null);
    const muteAllRef      = useRef<boolean>(false);
    const volumeRef       = useRef<number>(100);

    const habboRoomId = roomSession?.roomId?.toString() ?? 'default';
    const username    = GetSessionDataManager()?.userName ?? 'guest';

    // ── Obtener micrófonos disponibles ───────────────────
    useEffect(() =>
    {
        navigator.mediaDevices.enumerateDevices().then(devices =>
        {
            const mics = devices.filter(d => d.kind === 'audioinput');
            setMicDevices(mics);
            if(mics.length > 0) setSelectedMicId(mics[0].deviceId);
        });
    }, []);

    useEffect(() => {
    onMicActiveChange?.(micActive);
}, [micActive, onMicActiveChange]);
    // ── Adjuntar track remoto al DOM ─────────────────────
    const attachRemoteTrack = useCallback((track: RemoteTrack) =>
    {
        if(track.kind !== Track.Kind.Audio) return;
        if(!audioContainRef.current) return;
        const el = track.attach() as HTMLAudioElement;
        el.volume = volumeRef.current / 100;
        el.muted  = muteAllRef.current;
        el.dataset.trackSid = track.sid;
        audioContainRef.current.appendChild(el);
        console.log('[VoiceChat] Track adjuntado:', track.sid);
    }, []);

    const detachRemoteTrack = useCallback((track: RemoteTrack) =>
    {
        if(!audioContainRef.current) return;
        const el = audioContainRef.current.querySelector(`[data-track-sid="${track.sid}"]`);
        if(el) { track.detach(el as HTMLAudioElement); el.remove(); }
    }, []);

    // ── Conectar y crear/unirse a sala ───────────────────
    const connect = useCallback(async (targetRoomId?: string) =>
    {
        if(roomRef.current) return;
        setStatus('connecting');
        setErrorMsg('');

        const roomId = targetRoomId ?? habboRoomId;

        try
        {
            const formData = new FormData();
            formData.append('room', `habbo_room_${roomId}`);
            formData.append('user', username);

            const webUrl = GetConfigurationValue<string>('web.url');
            const res    = await fetch(webUrl + TOKEN_ENDPOINT, { method: 'POST', body: formData });
            const data   = await res.json();

            if(!data.token) throw new Error('Sin token: ' + JSON.stringify(data));

            const lkRoom = new Room({ adaptiveStream: true });

            lkRoom
                .on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub: RemoteTrackPublication, participant: RemoteParticipant) =>
                {
                    console.log('[VoiceChat] TrackSubscribed de:', participant.identity, 'kind:', track.kind);
                    attachRemoteTrack(track);
                })
                .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) =>
                {
                    detachRemoteTrack(track);
                })
                .on(RoomEvent.TrackPublished, (pub: RemoteTrackPublication, participant: RemoteParticipant) =>
                {
                    // Alguien publicó un track — forzar suscripción
                    console.log('[VoiceChat] TrackPublished de:', participant.identity);
                    pub.setSubscribed(true);
                })
                .on(RoomEvent.ParticipantConnected, (p: RemoteParticipant) =>
                {
                    console.log('[VoiceChat] Nuevo participante:', p.identity);
                    setParticipants(prev => [...new Set([...prev, p.identity])]);
                    // Suscribirse a sus tracks existentes
                    p.audioTrackPublications.forEach(pub =>
                    {
                        if(!pub.isSubscribed) pub.setSubscribed(true);
                        else if(pub.track) attachRemoteTrack(pub.track as RemoteTrack);
                    });
                })
                .on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) =>
                {
                    console.log('[VoiceChat] Participante salió:', p.identity);
                    setParticipants(prev => prev.filter(id => id !== p.identity));
                })
                .on(RoomEvent.Disconnected, () =>
                {
                    setStatus('idle');
                    setVoiceEnabled(false);
                    setMicActive(false);
                    setParticipants([]);
                    if(audioContainRef.current) audioContainRef.current.innerHTML = '';
                    roomRef.current = null;
                })
                .on(RoomEvent.AudioPlaybackStatusChanged, () =>
                {
                    const blocked = !lkRoom.canPlaybackAudio;
                    setAudioBlocked(blocked);
                    onAudioBlocked?.(blocked);
                });

            await lkRoom.connect(data.ws_url, data.token);
            roomRef.current = lkRoom;

            // Adjuntar tracks ya existentes
            lkRoom.remoteParticipants.forEach((participant: RemoteParticipant) =>
            {
                participant.audioTrackPublications.forEach(pub =>
                {
                    if(pub.track && pub.isSubscribed) attachRemoteTrack(pub.track as RemoteTrack);
                });
            });

            // Adjuntar tracks de participantes ya presentes al conectarse
            lkRoom.remoteParticipants.forEach((participant: RemoteParticipant) =>
            {
                console.log('[VoiceChat] Participante ya en sala:', participant.identity);
                participant.audioTrackPublications.forEach(pub =>
                {
                    if(pub.isSubscribed && pub.track)
                    {
                        console.log('[VoiceChat] Adjuntando track existente de:', participant.identity);
                        attachRemoteTrack(pub.track as RemoteTrack);
                    }
                    else if(!pub.isSubscribed)
                    {
                        // Forzar suscripción si no está suscrito aún
                        console.log('[VoiceChat] Forzando suscripción a track de:', participant.identity);
                        pub.setSubscribed(true);
                    }
                });
            });

            setParticipants(Array.from(lkRoom.remoteParticipants.values()).map(p => p.identity));
            setStatus('connected');
            setVoiceEnabled(false);
            setMicActive(false);
            console.log('[VoiceChat] Conectado a sala:', lkRoom.name);
        }
        catch(e)
        {
            const msg = e instanceof Error ? e.message : String(e);
            console.error('[VoiceChat] Error:', msg);
            setErrorMsg(msg);
            setStatus('error');
        }
    }, [ habboRoomId, username, selectedMicId, attachRemoteTrack, detachRemoteTrack ]);

    // ── Desconectar ──────────────────────────────────────
    const disconnect = useCallback(async () =>
    {
        if(audioTrackRef.current)
        {
            await roomRef.current?.localParticipant?.unpublishTrack(audioTrackRef.current);
            audioTrackRef.current.stop();
            audioTrackRef.current = null;
        }
        roomRef.current?.disconnect();
        roomRef.current = null;
        if(audioContainRef.current) audioContainRef.current.innerHTML = '';
        setMicActive(true);
        setVoiceEnabled(false);
        setStatus('idle');
        setParticipants([]);
    }, []);

    // ── Ligar microfone — publica el track la primera vez, luego mute/unmute ──
    const toggleMic = useCallback(async () =>
    {
        if(!roomRef.current) return;

        if(!micActive)
        {
            // Primera vez o si no hay track: pedir mic y publicar
            if(!audioTrackRef.current)
            {
                try
                {
                    const track = await createLocalAudioTrack({
                        deviceId:        selectedMicId || undefined,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl:  true,
                    });
                    await roomRef.current.localParticipant.publishTrack(track);
                    audioTrackRef.current = track;
                }
                catch(e)
                {
                    const msg = e instanceof Error ? e.message : String(e);
                    setErrorMsg('Mic: ' + msg);
                    return;
                }
            }
            // Unmute
            audioTrackRef.current.mediaStreamTrack.enabled = true;
            setMicActive(true);
            setVoiceEnabled(true);
        }
        else
        {
            // Solo mute — no unpublish, los demás siguen en la sala
            if(audioTrackRef.current)
                audioTrackRef.current.mediaStreamTrack.enabled = false;
            setMicActive(false);
            setVoiceEnabled(false);
        }
    }, [ micActive, selectedMicId ]);

    // ── Mutar todos los remotos ──────────────────────────
    // ── Desbloquear audio del navegador ─────────────────
    const startAudio = useCallback(async () =>
    {
        if(!roomRef.current) return;
        await roomRef.current.startAudio();
        setAudioBlocked(false);
        onAudioBlocked?.(false);
    }, [ onAudioBlocked ]);

    useEffect(() => { onStartAudio?.(startAudio); }, [ startAudio, onStartAudio ]);

    const toggleMuteAll = useCallback(() =>
    {
        const next = !muteAll;
        muteAllRef.current = next;
        if(audioContainRef.current)
            audioContainRef.current.querySelectorAll('audio').forEach(el => { el.muted = next; });
        setMuteAll(next);
    }, [ muteAll ]);

    // ── Se ouvir ─────────────────────────────────────────
    const toggleSelfHear = useCallback(() =>
    {
        const next = !selfHear;
        const audio = document.getElementById('voice-self-hear') as HTMLAudioElement;
        if(audio)
        {
            if(next && audioTrackRef.current)
            {
                const ms = new MediaStream([ audioTrackRef.current.mediaStreamTrack ]);
                audio.srcObject = ms;
                audio.play().catch(console.error);
            }
            else { audio.srcObject = null; }
        }
        setSelfHear(next);
    }, [ selfHear ]);

    // ── Cambiar micrófono en caliente ────────────────────
    const changeMic = useCallback(async (deviceId: string) =>
    {
        setSelectedMicId(deviceId);
        if(!roomRef.current || !audioTrackRef.current) return;

        try
        {
            // Despublicar el track viejo
            await roomRef.current.localParticipant.unpublishTrack(audioTrackRef.current);
            audioTrackRef.current.stop();

            // Publicar el nuevo dispositivo
            const newTrack = await createLocalAudioTrack({
                deviceId,
                echoCancellation: true,
                noiseSuppression:  true,
                autoGainControl:   true,
            });
            newTrack.mediaStreamTrack.enabled = micActive;
            await roomRef.current.localParticipant.publishTrack(newTrack);
            audioTrackRef.current = newTrack;
            console.log('[VoiceChat] Micrófono cambiado a:', deviceId);
        }
        catch(e) { console.error('[VoiceChat] Error cambiando mic:', e); }
    }, [ micActive ]);

    // ── Volumen ──────────────────────────────────────────
    useEffect(() =>
    {
        volumeRef.current = volume;
        if(audioContainRef.current)
            audioContainRef.current.querySelectorAll('audio').forEach(el =>
            {
                (el as HTMLAudioElement).volume = volume / 100;
            });
    }, [ volume ]);

    // ── Auto-destruir sala si no hay participantes ───────
    useEffect(() =>
    {
        if(status !== 'connected') return;
        if(participants.length === 0 && roomRef.current)
        {
            // Sala vacía (solo nosotros) — desconectar tras 30s sin nadie
            const timer = setTimeout(() =>
            {
                if(participants.length === 0) disconnect();
            }, 30000);
            return () => clearTimeout(timer);
        }
    }, [ participants, status, disconnect ]);

    // ── Detectar entrada a sala nueva via packet ────────
    const prevRoomIdRef = useRef<string | null>(null);

    useMessageEvent<GetGuestRoomResultEvent>(GetGuestRoomResultEvent, event =>
    {
        const parser = event.getParser();
        if(!parser.roomEnter) return;

        const currentRoomId = (parser.data?.roomId ?? habboRoomId).toString();
        if(prevRoomIdRef.current === currentRoomId) return;

        console.log('[VoiceChat] Sala:', prevRoomIdRef.current, '→', currentRoomId);
        prevRoomIdRef.current = currentRoomId;

        // Desconectar sala anterior si había una activa
        if(roomRef.current)
        {
            const oldRoom = roomRef.current;
            roomRef.current = null;

            if(audioTrackRef.current)
            {
                oldRoom.localParticipant?.unpublishTrack(audioTrackRef.current).catch(() => {});
                audioTrackRef.current.stop();
                audioTrackRef.current = null;
            }
            oldRoom.disconnect();

            if(audioContainRef.current) audioContainRef.current.innerHTML = '';
            setParticipants([]);
            setMicActive(false);
            setVoiceEnabled(false);
            setStatus('idle');
        }

        // Conectar a la nueva sala con el ID correcto
        setTimeout(() => connect(currentRoomId), 300);
    });

    // ── Cleanup ──────────────────────────────────────────
    useEffect(() => () => { roomRef.current?.disconnect(); }, []);


    return (
        <div className="nitro-voice-chat-widget">
            {/* Contenedor oculto para audios remotos */}
            <div ref={ audioContainRef } style={{ display: 'none' }} />
            <audio id="voice-self-hear" style={{ display: 'none' }} />

            {/* Banner de audio bloqueado */}
            { audioBlocked &&
                <div className="voice-audio-blocked" onClick={ startAudio }>
                    🔊 Toca aquí para activar el audio
                </div>
            }

            {/* Header */}
            <div className="voice-header">
                <span className="voice-title">Comunicación por Voz</span>
                <div className="voice-header-right">
                    { status === 'connecting' &&
                        <span className="voice-status" style={{ color: '#f0ad4e' }}>Conectando...</span>
                    }
                    { status === 'connected' &&
                        <>
                            <span className="voice-status" style={{ color: micActive ? '#4caf50' : '#aaa' }}>
                                { micActive ? 'Activado' : 'Desactivado' }
                            </span>
                            <span className="voice-online-count" title="Usuarios en la sala de voz">
                                👥 { participants.length + 1 }
                            </span>
                        </>
                    }
                    { (status === 'idle' || status === 'error') &&
                        <span className="voice-status" style={{ color: '#aaa' }}>Desactivado</span>
                    }
                </div>
            </div>

            {/* Error */}
            { errorMsg &&
                <div className="voice-error">⚠️ { errorMsg }</div>
            }

            {/* Distância da voz */}
            <div className="voice-slider-group">
                <div className="voice-slider-label">
                    <span>Distancia de voz</span>
                    <span className="voice-slider-value">{ voiceDistance }</span>
                </div>
                <input type="range" min={ 1 } max={ 20 } value={ voiceDistance }
                    onChange={ e => setVoiceDistance(Number(e.target.value)) }
                    className="voice-slider" />
            </div>

            {/* Volume */}
            <div className="voice-slider-group">
                <div className="voice-slider-label">
                    <span>Volumen (general)</span>
                    <span className="voice-slider-value">{ volume }%</span>
                </div>
                <input type="range" min={ 0 } max={ 100 } value={ volume }
                    onChange={ e => setVolume(Number(e.target.value)) }
                    className="voice-slider" />
            </div>

            {/* Selector de micrófono */}
            <div className="voice-mic-selector">
                <select
                    value={ selectedMicId }
                    onChange={ e => changeMic(e.target.value) }
                    className="voice-mic-select"
                    disabled={ micDevices.length === 0 }
                >
                    { micDevices.length === 0 &&
                        <option>Sin micrófonos</option>
                    }
                    { micDevices.map(device => (
                        <option key={ device.deviceId } value={ device.deviceId }>
                            { device.label || `Micrófono ${ device.deviceId.slice(0, 8) }` }
                        </option>
                    )) }
                </select>
            </div>

            {/* Se ouvir / Mutar tudo */}
            <div className="voice-actions-row">
                <button className={ `voice-action-btn ${ selfHear ? 'active' : '' }` } onClick={ toggleSelfHear }>
                    🎧 Si escuchas
                </button>
                <button className={ `voice-action-btn ${ muteAll ? 'active' : '' }` } onClick={ toggleMuteAll }>
                    🔇 Silenciar todo
                </button>
            </div>

            {/* Botón principal */}
            { status === 'connecting' &&
                <button className="voice-mic-btn" disabled>Conectando...</button>
            }
            { status === 'connected' && !micActive &&
                <button className="voice-mic-btn" onClick={ toggleMic }>
                    Encender micrófono
                </button>
            }
            { status === 'connected' && micActive &&
                <div className="voice-connected-actions">
                    <button className="voice-mic-btn mic-on" onClick={ toggleMic }>
                        🎙️ Apagar micrófono
                    </button>
                </div>
            }
            { (status === 'idle' || status === 'error') &&
                <button className="voice-mic-btn" disabled style={{ opacity: 0.5 }}>
                    Conectando a sala...
                </button>
            }
        </div>
    );
};
