
import { useToasts } from '@/contexts/ToastContext';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationConfig {
  title?: string ;
  description: string;
  type?: NotificationType;
  duration?: number;
}

export const useNotificationService = () => {
  const { addToast } = useToasts();

  const notify = ({
    title,
    description,
    type = 'info',
    duration = 5000,
  }: NotificationConfig) => {
    addToast({
      
      title,
      description,
      type,
      duration,
    });
  };

  return {
    success: (config: Omit<NotificationConfig, 'type'>) =>
      notify({ ...config, type: 'success' }),
    error: (config: Omit<NotificationConfig, 'type'>) =>
      notify({ ...config, type: 'error' }),
    warning: (config: Omit<NotificationConfig, 'type'>) =>
      notify({ ...config, type: 'warning' }),
    info: (config: Omit<NotificationConfig, 'type'>) =>
      notify({ ...config, type: 'info' }),
  };
};