import { useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectPID,
  addDataPoint,
  updateBufferMetrics,
  addLog,
  selectPIDMetrics,
  selectTimeSeriesData,
  selectPIDLogs,
} from '../store/slices/pidSlice';
import { PIDType } from '../types/pidMonitor';
import { RootState } from '../store';

export const useFilterMonitor = () => {
  const dispatch = useDispatch();
  const selectedNode = useSelector(
    (state: RootState) => state.widgets.selectedNode,
  );
  const { selectedPID, selectedPIDType } = useSelector(selectPIDMetrics);
  const timeSeriesData = useSelector(selectTimeSeriesData);
  const logs = useSelector(selectPIDLogs);
  const bufferMetrics = useSelector(
    (state: RootState) => state.pid.bufferMetrics,
  );

  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);


  const calculateBufferMetrics = useCallback(
    (buffer: number, total: number) => {
      const percentage = total ? (buffer / total) * 100 : 0;
      return {
        currentBuffer: buffer,
        bufferTotal: total,
        bufferPercentage: percentage,
        isLow: percentage < 20,
        isHigh: percentage > 80,
      };
    },
    [],

  const updatePIDData = useCallback(() => {
    if (!selectedNode || !selectedPID) return;

    const pidData =
      selectedPIDType === 'input'
        ? selectedNode.ipid[selectedPID]
        : selectedNode.opid[selectedPID];

    if (!pidData) return;

    const newMetrics = calculateBufferMetrics(
      pidData.buffer,
      pidData.buffer_total,
    );

    dispatch(updateBufferMetrics(newMetrics));

    dispatch(
      addDataPoint({
        timestamp: Date.now(),
        buffer: newMetrics.bufferPercentage,
        rawBuffer: pidData.buffer,
        bufferTotal: pidData.buffer_total,
      }),
    );

    if (newMetrics.isLow) {
      dispatch(
        addLog({
          id: Date.now().toString(),
          level: 'warning',
          message: `Buffer running low (${newMetrics.bufferPercentage.toFixed(1)}%)`,
        }),
      );
    }
  }, [
    selectedNode,
    selectedPID,
    selectedPIDType,
    dispatch,
    calculateBufferMetrics,
  ]);

  const handlePIDSelect = useCallback(
    (pidName: string, type: PIDType) => {
      console.log('je suis clicqué!!!');
      dispatch(selectPID({ pidName, type }));
  
    },
    [dispatch],
  );

  useEffect(() => {
  
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    if (selectedPID && selectedNode) {

      updateIntervalRef.current = setInterval(updatePIDData, 500);
  
    }

  
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [selectedPID, selectedNode, updatePIDData]);

  return {
    selectedNode,
    selectedPID,
    selectedPIDType,
    timeSeriesData,
    logs,
    bufferMetrics,
    handlePIDSelect,
  };
};
