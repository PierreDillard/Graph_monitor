import React, { createContext, useContext, useState, useCallback } from 'react';

interface UseWidgetStackContextType {
  getNewZIndex: () => number;
  resetStack: () => void;
}

const WidgetstackContext = createContext<UseWidgetStackContextType | null>(
  null,
);
export const WidgetStackProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentMax, setCurrentMax] = useState(10);

  const getNewZIndex = useCallback(() => {
    setCurrentMax((prev) => prev + 1);
    return currentMax + 1;
  }, [currentMax]);

  const resetStack = useCallback(() => {
    setCurrentMax(10);
  }, []);

  return (
    <WidgetstackContext.Provider value={{ getNewZIndex, resetStack }}>
      {children}
    </WidgetstackContext.Provider>
  );
};

export const useWidgetStack = () => {
  const context = useContext(WidgetstackContext);
  if (!context) {
    throw new Error('useWidgetStack must be used within a WidgetStackProvider');
  }
  return context;
};
