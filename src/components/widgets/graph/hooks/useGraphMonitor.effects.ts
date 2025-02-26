import { useEffect } from 'react';
import { IGpacMessageHandler } from '../../../../types/communication/index';
import { gpacService } from '../../../../services/gpacService';

type GpacService = typeof gpacService;

interface ConnectionParams {
  service: GpacService;
  setConnectionError: React.Dispatch<React.SetStateAction<string | null>>;
  messageHandler: IGpacMessageHandler;
}

export function useGraphMonitorConnection({
  service,
  setConnectionError,
  messageHandler,
}: ConnectionParams) {
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
