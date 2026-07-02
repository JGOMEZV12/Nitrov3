import { GetSessionDataManager, HabboClubLevelEnum, RoomControllerLevel } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MdOutlineMic } from 'react-icons/md';
import { ChatMessageTypeEnum, GetClubMemberLevel, GetConfigurationValue, LocalizeText, RoomWidgetUpdateChatInputContentEvent } from '../../../../api';
import { Text } from '../../../../common';
import { useChatCommandSelector, useChatInputWidget, useRoom, useSessionInfo, useUiEvent } from '../../../../hooks';
import { ChatInputCommandSelectorView } from './ChatInputCommandSelectorView';
import { ChatInputEmojiSelectorView } from './ChatInputEmojiSelectorView';
import { ChatInputStyleSelectorView } from './ChatInputStyleSelectorView';
import { VoiceChatWidget } from './VoiceChatWidget';

export const ChatInputView: FC<{}> = props => {
    const [chatValue, setChatValue] = useState<string>('');
    const [showVoiceChat, setShowVoiceChat] = useState<boolean>(false);
    const [audioBlocked, setAudioBlocked] = useState<boolean>(false);
    const [isMicActive, setIsMicActive] = useState<boolean>(false);
    const voiceRef = useRef<HTMLDivElement>(null);
    const startAudioRef = useRef<(() => void) | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const isCancelledRef = useRef<boolean>(false);

    const { chatStyleId = 0, updateChatStyleId = null } = useSessionInfo();
    const { selectedUsername = '', floodBlocked = false, floodBlockedSeconds = 0, setIsTyping = null, setIsIdle = null, sendChat = null } = useChatInputWidget();
    const { roomSession = null } = useRoom();
    const inputRef = useRef<HTMLInputElement>(null);
    const { isVisible: commandSelectorVisible, filteredCommands, selectedIndex, setSelectedIndex, moveUp, moveDown, selectCurrent, close: closeCommandSelector } = useChatCommandSelector(chatValue);

    const chatModeIdWhisper = useMemo(() => LocalizeText('widgets.chatinput.mode.whisper'), []);
    const chatModeIdShout = useMemo(() => LocalizeText('widgets.chatinput.mode.shout'), []);
    const chatModeIdSpeak = useMemo(() => LocalizeText('widgets.chatinput.mode.speak'), []);
    const maxChatLength = useMemo(() => GetConfigurationValue<number>('chat.input.maxlength', 100), []);

    // ──────────────────────────────────────────────────────────────
    //  Funciones de VoiceChat
    // ──────────────────────────────────────────────────────────────
    const startRecording = useCallback(() => {
        const micOn = document.getElementById("microphoneOn");
        const micOff = document.getElementById("microphoneOff");
        const deleteAudio = document.getElementById("deleteAudio");

        if (micOn) micOn.style.display = "none";
        if (micOff) micOff.style.display = "inline-block";
        if (deleteAudio) deleteAudio.style.display = "inline-block";

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorderRef.current = new MediaRecorder(stream);
                mediaRecorderRef.current.start();
                sendChat("Grabando un audio..", ChatMessageTypeEnum.CHAT_DEFAULT, "", chatStyleId);

                mediaRecorderRef.current.addEventListener("dataavailable", event => {
                    audioChunksRef.current.push(event.data);
                });

                mediaRecorderRef.current.addEventListener("stop", () => {
                    if (micOn) micOn.style.display = "inline-block";
                    if (micOff) micOff.style.display = "none";
                    if (deleteAudio) deleteAudio.style.display = "none";

                    if (!isCancelledRef.current) {
                        const audioBlob = new Blob(audioChunksRef.current);
                        if (audioBlob.size < 378461) {
                            const formData = new FormData();
                            formData.append('audio', audioBlob);
                            const uploadUrl = GetConfigurationValue<string>('web.url') + "/engine/note2.php?4";
                            fetch(uploadUrl, { method: "POST", body: formData })
                                .then(response => response.text())
                                .then(filename => {
                                    const audioUrl = `${GetConfigurationValue<string>('web.url')}/engine/uploads/${filename}`;
                                    sendChat(`[AUDIO]${audioUrl}[/AUDIO]`, ChatMessageTypeEnum.CHAT_DEFAULT, "", chatStyleId);
                                });
                        } else {
                            alert("El audio es demasiado largo, el máximo permitido es de 30 segundos.");
                        }
                    }

                    isCancelledRef.current = false;
                    audioChunksRef.current = [];
                    if (stream) stream.getTracks().forEach(track => track.stop());
                });
            });
    }, [sendChat, chatStyleId]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    }, []);

    const cancelRecording = useCallback(() => {
        isCancelledRef.current = true;
        stopRecording();
    }, [stopRecording]);

    // ──────────────────────────────────────────────────────────────
    //  Lógica original (comandos, envío de mensajes, etc.)
    // ──────────────────────────────────────────────────────────────
    const anotherInputHasFocus = useCallback(() => {
        const activeElement = document.activeElement;
        if (!activeElement) return false;
        if (inputRef && (inputRef.current === activeElement)) return false;
        if (!(activeElement instanceof HTMLInputElement) && !(activeElement instanceof HTMLTextAreaElement)) return false;
        return true;
    }, [inputRef]);

    const setInputFocus = useCallback(() => {
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(inputRef.current.value.length * 2, inputRef.current.value.length * 2);
    }, [inputRef]);

    const checkSpecialKeywordForInput = useCallback(() => {
        setChatValue(prevValue => {
            if ((prevValue !== chatModeIdWhisper) || !selectedUsername.length) return prevValue;
            return `${prevValue} ${selectedUsername}`;
        });
    }, [selectedUsername, chatModeIdWhisper]);

    const sendChatValue = useCallback((value: string, shiftKey: boolean = false) => {
        if (!value || value === '') return;

        let chatType = shiftKey ? ChatMessageTypeEnum.CHAT_SHOUT : ChatMessageTypeEnum.CHAT_DEFAULT;
        let text = value;
        const parts = text.split(' ');
        let recipientName = '';
        let append = '';

        switch (parts[0]) {
            case chatModeIdWhisper:
                chatType = ChatMessageTypeEnum.CHAT_WHISPER;
                recipientName = parts[1];
                append = `${chatModeIdWhisper} ${recipientName} `;
                parts.shift();
                parts.shift();
                break;
            case chatModeIdShout:
                chatType = ChatMessageTypeEnum.CHAT_SHOUT;
                parts.shift();
                break;
            case chatModeIdSpeak:
                chatType = ChatMessageTypeEnum.CHAT_DEFAULT;
                parts.shift();
                break;
        }

        text = parts.join(' ');
        setIsTyping(false);
        setIsIdle(false);

        if (text.length <= maxChatLength) {
            if (/%CC%/g.test(encodeURIComponent(text))) {
                setChatValue('');
            } else {
                setChatValue('');
                sendChat(text, chatType, recipientName, chatStyleId);
            }
        }

        setChatValue(append);
    }, [chatModeIdWhisper, chatModeIdShout, chatModeIdSpeak, maxChatLength, chatStyleId, setIsTyping, setIsIdle, sendChat]);

    const updateChatInput = useCallback((value: string) => {
        if (!value || !value.length) {
            setIsTyping(false);
        } else {
            setIsTyping(true);
            setIsIdle(true);
        }
        setChatValue(value);
    }, [setIsTyping, setIsIdle]);

    const addChatEmoji = useCallback((emoji: string) => {
        setChatValue(prev => prev + emoji);
        setIsTyping(true);
        inputRef.current?.focus();
    }, [setIsTyping]);

    const onKeyDownEvent = useCallback((event: KeyboardEvent) => {
        if (floodBlocked || !inputRef.current || anotherInputHasFocus()) return;
        if (document.activeElement !== inputRef.current) setInputFocus();

        if (commandSelectorVisible) {
            switch (event.key) {
                case 'ArrowUp':
                    event.preventDefault();
                    moveUp();
                    return;
                case 'ArrowDown':
                    event.preventDefault();
                    moveDown();
                    return;
                case 'Tab':
                    event.preventDefault();
                case 'NumpadEnter':
                case 'Enter': {
                    const selected = selectCurrent();
                    if (selected) {
                        event.preventDefault();
                        setChatValue(':' + selected.key + ' ');
                        return;
                    }
                    break;
                }
                case 'Escape':
                    event.preventDefault();
                    closeCommandSelector();
                    return;
            }
        }

        const value = (event.target as HTMLInputElement).value;

        switch (event.key) {
            case ' ':
            case 'Space':
                checkSpecialKeywordForInput();
                return;
            case 'NumpadEnter':
            case 'Enter':
                sendChatValue(value, event.shiftKey);
                return;
            case 'Backspace':
                if (value) {
                    const parts = value.split(' ');
                    if ((parts[0] === chatModeIdWhisper) && (parts.length === 3) && (parts[2] === '')) {
                        setChatValue('');
                    }
                }
                return;
        }
    }, [floodBlocked, inputRef, chatModeIdWhisper, anotherInputHasFocus, setInputFocus, checkSpecialKeywordForInput, sendChatValue, commandSelectorVisible, moveUp, moveDown, selectCurrent, closeCommandSelector]);

    useUiEvent<RoomWidgetUpdateChatInputContentEvent>(RoomWidgetUpdateChatInputContentEvent.CHAT_INPUT_CONTENT, event => {
        switch (event.chatMode) {
            case RoomWidgetUpdateChatInputContentEvent.WHISPER:
                setChatValue(`${chatModeIdWhisper} ${event.userName} `);
                return;
            case RoomWidgetUpdateChatInputContentEvent.SHOUT:
                return;
        }
    });

    const chatStyleIds = useMemo(() => {
        let styleIds: number[] = [];
        const styles = GetConfigurationValue<{ styleId: number; minRank: number; isSystemStyle: boolean; isHcOnly: boolean; isAmbassadorOnly: boolean }[]>('chat.styles');

        for (const style of styles) {
            if (!style) continue;
            if (style.minRank > 0) {
                if (GetSessionDataManager().hasSecurity(style.minRank)) styleIds.push(style.styleId);
                continue;
            }
            if (style.isSystemStyle) {
                if (GetSessionDataManager().hasSecurity(RoomControllerLevel.MODERATOR)) {
                    styleIds.push(style.styleId);
                    continue;
                }
            }
            if (GetConfigurationValue<number[]>('chat.styles.disabled').indexOf(style.styleId) >= 0) continue;
            if (style.isHcOnly && GetClubMemberLevel() >= HabboClubLevelEnum.CLUB) {
                styleIds.push(style.styleId);
                continue;
            }
            if (style.isAmbassadorOnly && GetSessionDataManager().isAmbassador) {
                styleIds.push(style.styleId);
                continue;
            }
            if (!style.isHcOnly && !style.isAmbassadorOnly) styleIds.push(style.styleId);
        }
        return styleIds;
    }, []);

    useEffect(() => {
        document.body.addEventListener('keydown', onKeyDownEvent);
        return () => document.body.removeEventListener('keydown', onKeyDownEvent);
    }, [onKeyDownEvent]);

    useEffect(() => {
        if (!inputRef.current) return;
        inputRef.current.parentElement.dataset.value = chatValue;
    }, [chatValue]);

    if (!roomSession || roomSession.isSpectator) return null;

    // ──────────────────────────────────────────────────────────────
    //  Renderizado
    // ──────────────────────────────────────────────────────────────
    return (
        <>
            {createPortal(
                <div className="nitro-chat-input-container flex justify-between items-center h-10 border-2 border-black bg-gray-200 pr-2.5 overflow-visible rounded-lg lg:relative lg:w-full max-lg:fixed max-lg:bottom-[70px] max-lg:left-1/2 max-lg:-translate-x-1/2 max-lg:z-50 max-lg:w-[80vw] max-lg:max-w-[500px] max-lg:shadow-lg">
                    {commandSelectorVisible && (
                        <ChatInputCommandSelectorView
                            commands={filteredCommands}
                            selectedIndex={selectedIndex}
                            onSelect={(cmd) => {
                                setChatValue(':' + cmd.key + ' ');
                                inputRef.current?.focus();
                            }}
                            onHover={setSelectedIndex}
                        />
                    )}
                    <div className="flex-1 items-center input-sizer">
                        {!floodBlocked ? (
                            <input
                                ref={inputRef}
                                className="w-full border-none bg-transparent px-[10px] text-[0.86rem] text-white placeholder:text-[#6c757d] focus:border-current focus:shadow-none focus:ring-0"
                                maxLength={maxChatLength}
                                placeholder={LocalizeText('widgets.chatinput.default')}
                                type="text"
                                value={chatValue}
                                onChange={event => updateChatInput(event.target.value)}
                                onMouseDown={() => setInputFocus()}
                            />
                        ) : (
                            <Text variant="danger">
                                {LocalizeText('chat.input.alert.flood', ['time'], [floodBlockedSeconds.toString()])}
                            </Text>
                        )}
                    </div>
                    <ChatInputEmojiSelectorView addChatEmoji={addChatEmoji} />
                    <ChatInputStyleSelectorView chatStyleId={chatStyleId} chatStyleIds={chatStyleIds} selectChatStyleId={updateChatStyleId} />

                    {/* Botón de voz */}
                    <button
                        ref={voiceRef}
                        className={`nitro-button-chat ${isMicActive ? 'active' : ''} ${audioBlocked ? 'audio-blocked' : ''}`}
                        onClick={() => {
                            if (audioBlocked && startAudioRef.current) startAudioRef.current();
                            else setShowVoiceChat(prev => !prev);
                        }}
                        title={audioBlocked ? '🔊 Toca para activar el audio de voz' : (isMicActive ? 'Micrófono activo' : 'Comunicación por voz')}
                    >
                        <MdOutlineMic />
                    </button>
                </div>,
                document.getElementById('toolbar-chat-input-container')
            )}

            {createPortal(
                <div className={`nitro-chat-input-voice-box${showVoiceChat ? ' visible' : ''}`}>
                    <VoiceChatWidget
                        onAudioBlocked={setAudioBlocked}
                        onStartAudio={fn => { startAudioRef.current = fn; }}
                        onMicActiveChange={setIsMicActive}
                    />
                </div>,
                document.body
            )}
        </>
    );
};