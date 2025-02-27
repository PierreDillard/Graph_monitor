import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { gpacService } from '../../../../../services/gpacService';
import { removeSelectedFilter } from '../../../../../store/slices/multiFilterSlice';
import { setFilterDetails } from '../../../../../store/slices/graphSlice';
import { RootState } from '../../../../../store';

export const useMultiFilterMonitor = () => {
  const dispatch = useAppDispatch();

  const selectedFilters = useAppSelector(
    (state: RootState) => state.multiFilter.selectedFilters,
  );
  const isLoading = useAppSelector((state ) => state.graph.isLoading);

  const handleCloseMonitor = useCallback(
    (filterId: string) => {
      gpacService.unsubscribeFromFilter(filterId);
      dispatch(removeSelectedFilter(filterId));

      if (gpacService.getCurrentFilterId()?.toString() === filterId) {
        dispatch(setFilterDetails(null));
        gpacService.setCurrentFilterId(null);
      }
    },
    [dispatch],
  );

  return {
    selectedFilters,
    isLoading,
    handleCloseMonitor,
  };
};
