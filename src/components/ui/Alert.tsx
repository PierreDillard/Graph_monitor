import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ 
  type = 'info', 
  title, 
  message,
  className = '' 
}) => {
  const styles = {
    success: {
      containerClass: 'bg-green-500/10 border border-green-500/50 text-green-700',
      iconColor: 'text-green-500',
      icon: CheckCircle2
    },
    error: {
      containerClass: 'bg-red-500/10 border border-red-500/50 text-red-700',
      iconColor: 'text-red-500',
      icon: AlertCircle
    },
    warning: {
      containerClass: 'bg-yellow-500/10 border border-yellow-500/50 text-yellow-700',
      iconColor: 'text-yellow-500',
      icon: AlertTriangle
    },
    info: {
      containerClass: 'bg-blue-500/10 border border-blue-500/50 text-blue-700',
      iconColor: 'text-blue-500',
      icon: Info
    }
  };

  const { containerClass, iconColor, icon: Icon } = styles[type];

  return (
    <div className={`flex items-start gap-3 rounded-lg p-4 ${containerClass} ${className}`}>
      <Icon className={`w-5 h-5 ${iconColor} mt-0.5`} />
      <div>
        {title && <h5 className="font-medium mb-1">{title}</h5>}
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
};

export default Alert;