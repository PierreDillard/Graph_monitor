import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { gpacWebSocket } from '../services/gpacWebSocket';
import { 
  selectFilter, 
  updateBufferMetrics, 
  addDataPoint, 
  addLog 
} from '../store/slices/filterSlice';
import { 
  selectFilterDetails, 
  selectTimeSeriesData, 
  selectFilterLogs, 
  selectSelectedFilter 
} from '../store/selectors/filterSelector';
import type { FilterType } from '../types/filter';

export const useFilterMonitor = () => {
  const dispatch = useDispatch();

  const filterDetails = useSelector(selectFilterDetails);
  const selectedNode = useSelector(
    (state: RootState) => state.widgets.selectedNode,
  );
  const timeSeriesData = useSelector(selectTimeSeriesData);
  const logs = useSelector(selectFilterLogs);
  const { selectedFilter, selectedFilterType } = useSelector(
    (state: RootState) => state.filter,
  );
  const bufferMetrics = useSelector((state: RootState) => state.filter.bufferMetrics);

  const updateIntervalRef = useRef<number>();
  const isComponentMounted = useRef(true);

  // Calcul des métriques du buffer
  const calculateBufferMetrics = useCallback(
    (buffer: number, total: number) => {
      const percentage = (buffer / total) * 100;
      return {
        currentBuffer: buffer,
        bufferTotal: total,
        bufferPercentage: percentage,
        isLow: percentage < 20,
        isHigh: percentage > 80,
      };
    },
    [],
  );

  // Mise à jour des données du filtre
  const updateFilterData = useCallback(() => {
    if (!selectedNode || !selectedFilter || !isComponentMounted.current) return;

   

    const filterData =
      selectedFilterType === 'input'
        ? selectedNode.ipid[selectedFilter]
        : selectedNode.opid[selectedFilter];

    if (!filterData) return;

    // Calcul et dispatch des nouvelles métriques
    const newMetrics = calculateBufferMetrics(
      filterData.buffer,
      filterData.buffer_total,
    );

    dispatch(updateBufferMetrics(newMetrics));

    // Ajout d'un point de données pour le graphique
    dispatch(
      addDataPoint({
        timestamp: Date.now(),
        buffer: newMetrics.bufferPercentage,
        rawBuffer: filterData.buffer,
        bufferTotal: filterData.buffer_total,
      }),
    );

    // Génération de logs si nécessaire
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
    selectedFilter,
    selectedFilterType,
    dispatch,
    calculateBufferMetrics,
  ]);

  // Gestion de la sélection d'un filtre
  const handleFilterSelect = useCallback(
    (filterName: string, type: FilterType) => {
      console.log('Selecting filter:', filterName, type);

      dispatch(selectFilter({ name: filterName, type }));
      if (selectedNode?.idx) {
        gpacWebSocket.getFilterDetails(selectedNode.idx);
      }

      // Nettoyage et configuration du nouvel intervalle
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }

      updateIntervalRef.current = window.setInterval(updateFilterData, 500);
      updateFilterData();
    },
    [dispatch, updateFilterData],
  );

  // Gestion du cycle de vie du composant
  useEffect(() => {
    isComponentMounted.current = true;

    if (!gpacWebSocket.isConnected()) {
      gpacWebSocket.connect();
    }

    return () => {
      isComponentMounted.current = false;
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      // Arrêter la réception des détails du filtre
      if (selectedNode) {
        gpacWebSocket.stopFilterDetails(selectedNode.idx);
      }
    };
  }, [selectedNode]);

  // Configuration de la mise à jour des données
  useEffect(() => {
    if (selectedFilter && selectedNode) {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }

      gpacWebSocket.getFilterDetails(selectedNode.idx);

      updateIntervalRef.current = window.setInterval(updateFilterData, 500);
      updateFilterData();
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      if (selectedNode) {
        gpacWebSocket.stopFilterDetails(selectedNode.idx);
      }
    };
  }, [selectedFilter, selectedNode, updateFilterData]);

  return {
    selectedNode,
    selectedFilter,
    selectedFilterType,
    bufferMetrics,
    timeSeriesData,     
    logs,              
    filterDetails,      
    handleFilterSelect
  };
};