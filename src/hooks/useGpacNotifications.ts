import { useCallback } from 'react';
import { useNotificationService } from '@/services/notificationService';
import { GpacNodeData } from '@/types/gpac';

export const useGpacNotifications = () => {
  const notifications = useNotificationService();

  const handleFilterUpdate = useCallback((filter: GpacNodeData) => {
    notifications.success({
      title: 'Filter Updated',
      description: `The Filter ${filter.name} updated successly!.`,
      duration: 3000,
    });
  }, []);

  const handleFilterError = useCallback((error: Error, filterName?: string) => {
    notifications.error({
      title: 'Filter Error',
      description: filterName 
        ? `Error on filter ${filterName}: ${error.message}`
        : error.message,
      duration: 5000,
    });
  }, []);

  const handleConnectionStatus = useCallback((connected: boolean) => {
    if (connected) {
      notifications.success({
        title: 'Connected to GPAC',
        description: 'Connection to GPAC has been etablished.',
        duration: 3000,
      });
    } else {
      notifications.error({
        title: 'Connection Lost',
        description: 'Connection to GPAC has been lost.',
        duration: 0, // 0 = persistant jusqu'à la reconnexion
      });
    }
  }, []);

  return {
    handleFilterUpdate,
    handleFilterError,
    handleConnectionStatus,
  };
};