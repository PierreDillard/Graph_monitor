import { useEffect } from 'react';
import { IGpacMessageHandler } from '@/types/communication';
import { useGpacService } from '@/hooks/useGpacService';



interface ConnectionParams {

  setConnectionError: React.Dispatch<React.SetStateAction<string | null>>;
  messageHandler: IGpacMessageHandler;
}

export function useGraphMonitorConnection({
  setConnectionError,
  messageHandler,
}: ConnectionParams) {
  const service = useGpacService();
  useEffect(() => {
    const cleanup = service
      .connect()
      .then(() => console.log('[useGraphMonitor] Connected to GPAC'))
      .catch((error) => {
        console.error('[useGraphMonitor] Connection error:', error);
        setConnectionError(error.message);
      });

    return () => {
      cleanup
        .then(() => console.log('[useGraphMonitor] Disconnected from GPAC'))
        .catch((err) =>
          console.error('[useGraphMonitor] Disconnection error:', err),
        );
    };
  }, [service, setConnectionError, messageHandler]);
}

interface ErrorEffectParams {
  error: string | null;
  setConnectionError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useGraphMonitorErrorEffect({
  error,
  setConnectionError,
}: ErrorEffectParams) {
  useEffect(() => {
    if (error) {
      console.error('[GraphMonitor] Error:', error);
      setConnectionError(error);
    }
  }, [error, setConnectionError]);
}
