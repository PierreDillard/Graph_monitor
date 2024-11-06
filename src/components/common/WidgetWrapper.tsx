
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, RotateCcw } from 'lucide-react';
import { 
  removeWidget, 
  minimizeWidget, 
  maximizeWidget, 
  restoreWidget,
} from '../../store/slices/widgetsSlice';

import type { RootState } from '../../store';


interface WidgetWrapperProps {
  id: string;
  title: string;
  
  children: React.ReactNode;
  className?: string;
}

// Memoized styles
const headerStyles = {
  base: "flex items-center justify-between px-4 py-2 bg-gray-700 border-b border-gray-600",
  title: "flex items-center gap-2",
  actions: "flex items-center gap-2"
};

const buttonStyles = {
  base: "p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white cursor-pointer no-drag z-50",
};

const WidgetWrapper = ({ id, title, children, className = '' }: WidgetWrapperProps) => {
  const dispatch = useDispatch();
  
  // Memoized widget config
  const config = useSelector((state: RootState) => 
    state.widgets.configs[id] ?? {
      isMaximized: false,
      isMinimized: false,
      settings: {}
    }
  );

  const { isMaximized, isMinimized } = config;

  // Memoized callbacks
  const handleMinimize = useCallback(() => {
    dispatch(minimizeWidget(id));
  }, [dispatch, id]);

  const handleMaximize = useCallback(() => {
    dispatch(maximizeWidget(id));
  }, [dispatch, id]);

  const handleRestore = useCallback(() => {
    dispatch(restoreWidget(id));
  }, [dispatch, id]);

  const handleClose = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    dispatch(removeWidget(id));
  }, [dispatch, id]);

  //Memoized container classes
  const containerClasses = React.useMemo(() => {
    return [
      'flex flex-col bg-gray-800 overflow-hidden rounded-lg',
      isMaximized ? 'fixed inset-0 z-50' : '',
      isMinimized ? 'h-12' : 'h-full',
      className
    ].filter(Boolean).join(' ');
  }, [isMaximized, isMinimized, className]);

  return (
    <div className={containerClasses}>
      <div className={headerStyles.base}>
        <div className={headerStyles.title}>
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        
        <div className={headerStyles.actions}>
          {!isMaximized && !isMinimized && (
            <button 
              onClick={handleMinimize}
              className={buttonStyles.base}
              title="Minimize"
              type="button"
            >
              {/* Icon minimisé */}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4"/>
              </svg>
            </button>
          )}
          
          {!isMaximized && (
            <button 
              onClick={handleMaximize}
              className={buttonStyles.base}
              title="Maximize"
              type="button"
            >
              {/* Icon maximisé */}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
            </button>
          )}
          
          {isMaximized && (
            <button 
              onClick={handleRestore}
              className={buttonStyles.base}
              title="Restore"
              type="button"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          
          <button 
            onClick={handleClose}
            className={buttonStyles.base}
            title="Close widget"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      )}
    </div>
  );
};

// Ajout du displayName pour faciliter le debugging
WidgetWrapper.displayName = 'WidgetWrapper';

export default React.memo(WidgetWrapper);