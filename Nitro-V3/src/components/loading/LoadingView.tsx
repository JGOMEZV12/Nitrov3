import { FC, useEffect, useState } from 'react';
import { Base, Column, Text } from '../../common';

interface LoadingViewProps {
  isError?: boolean;
  message?: string;
  homeUrl?: string;
}

const getLoadingMessage = (progress: number): string => {
  if (progress >= 100) return '¡Ciudad cargada! Cuídate la espalda';
  if (progress >= 80) return 'Verificando stock de las tiendas...';
  if (progress >= 60) return 'Cargando el mapa y los carros del concesionario...';
  if (progress >= 40) return 'Escondiendo el botín de los policías...';
  if (progress >= 10) return 'Buscando chamba en el diario... Aguanta un chance.';
  return 'Iniciando la ciudad...';
};

export const LoadingView: FC<LoadingViewProps> = props => {
  const { isError = false, message = '', homeUrl = '' } = props;

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 8;
      });
    }, 600);
    return () => clearInterval(interval);
  }, []);

    return (
        <Column fullHeight position="relative" className="relative z-[100] bg-[radial-gradient(#1d1a24,#003a6b)]">
            <Base fullHeight className="container h-100">
                <Column fullHeight alignItems="center" justifyContent="center">
                    { !isError &&
                        <Base className="absolute inset-0 m-auto w-[84px] h-[84px] [zoom:1.5] [image-rendering:pixelated] bg-no-repeat bg-left-top" /> }
                    <Base className="absolute top-[20px] left-[20px] z-[2] w-[150px] h-[100px] bg-no-repeat bg-left-top" />
                    { isError && (message && message.length) ?
                        <Column alignItems="center" className="absolute bottom-[20px] left-1/2 z-[3] -translate-x-1/2 max-w-[80%]" gap={ 2 }>
                            <Text fontSizeCustom={ 20 } variant="white" className="text-center [text-shadow:0px_4px_4px_rgba(0,0,0,0.25)]">
                                { message }
                            </Text>
                            { homeUrl &&
                                <a
                                    href={ homeUrl }
                                    className="mt-3 px-6 py-3 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white text-base font-semibold no-underline cursor-pointer transition-colors duration-200 [text-shadow:none]"
                                >
                                    Regresar
                                </a>
                            }
                        </Column>
                        :
             <Column alignItems="center" className="absolute bottom-[20px] left-1/2 z-[3] -translate-x-1/2 max-w-[80%]" gap={ 2 }>
              <Text fontSizeCustom={ 32 } variant="white" className="text-center [text-shadow:0px_4px_4px_rgba(0,0,0,0.25)]">
                { getLoadingMessage(Math.min(progress, 100)) }
              </Text>
              <div className="w-[300px] h-[4px] rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white/70 transition-all duration-500"
                  style={{ width: `${ Math.min(progress, 100) }%` }}
                />
              </div>
            </Column>
          }
        </Column>
      </Base>
    </Column>
  );
};