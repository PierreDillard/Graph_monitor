import { useState, useCallback } from 'react';

interface UseWidgetStackProps {
  initialZ?: number;
  stackSize?: number;
}

export const useWidgetStack = ({
  initialZ = 10,
  stackSize = 1000,
}: UseWidgetStackProps = {}) => {
  const [zIndex, setZIndex] = useState(initialZ);

  const bringToFront = useCallback(() => {
    setZIndex(stackSize);
  }, [stackSize]);

  const resetZIndex = useCallback(() => {
    setZIndex(initialZ);
  }, [initialZ]);

  return {
    zIndex,
    bringToFront,
    resetZIndex,
    style: { zIndex },
  };
};
