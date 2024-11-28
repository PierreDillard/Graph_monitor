import { GraphState } from '../store/slices/graphSlice';
import { WidgetsState } from '../store/slices/widgetsSlice';
import { FilterMonitoringState } from '../store/slices/filter-monitoringSlice';
import { MultifilterState } from '../store/slices/multiFilterSlice';

export interface RootState {
  graph: GraphState;
  widgets: WidgetsState;
  filterMonitoring: FilterMonitoringState;
  multiFilter: MultifilterState;
}
