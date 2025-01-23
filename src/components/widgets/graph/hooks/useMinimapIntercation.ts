import { ReactFlowInstance } from "@xyflow/react";
import { useCallback, useEffect, useState } from "react";

interface MiniMapInteractionProps {
    reactFlowInstance: ReactFlowInstance | null;
    zoom: number;
  }
  
  export const useMiniMapInteraction = ({ reactFlowInstance, zoom }: MiniMapInteractionProps) => {
    const [isDragging, setIsDragging] = useState(false);
  
    const handleMouseDown = useCallback(() => {
      setIsDragging(true);
    }, []);
  
    const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || !reactFlowInstance) return;
  
      const element = event.currentTarget;
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / zoom;
      const y = (event.clientY - rect.top) / zoom;
  
      reactFlowInstance.setViewport({ x: -x, y: -y, zoom }, { duration: 0 });
    }, [isDragging, reactFlowInstance, zoom]);
  
    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
    }, []);
  
    useEffect(() => {
      if (isDragging) {
        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
      }
    }, [isDragging, handleMouseUp]);
  
    return { handleMouseDown, handleMouseMove };
  };