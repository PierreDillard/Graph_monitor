
import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../../store';

interface WidgetLayerProps {
  children: React.ReactNode;
}

export const WidgetLayer: React.FC<WidgetLayerProps> = ({ children }) => {
  const dispatch = useDispatch();
  const widgets = useSelector((state: RootState) => state.widgets.activeWidgets);
  
  const handleDragEnd = useCallback((widgetId: string, position: { x: number; y: number }) => {
    dispatch(updateWidgetPosition({ id: widgetId, ...position }));
  }, [dispatch]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <AnimatePresence>
        {widgets.map((widget) => (
          <motion.div
            key={widget.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="pointer-events-auto"
            style={{
              position: 'absolute',
              zIndex: widget.z,
              width: widget.size.width,
              height: widget.size.height,
            }}
            drag={widget.isDraggable}
            dragMomentum={false}
            onDragEnd={(_, info) => handleDragEnd(widget.id, {
              x: info.point.x,
              y: info.point.y
            })}
          >
            {children}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};