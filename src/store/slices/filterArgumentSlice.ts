
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk, RootState } from '../index'; 
import { GpacMessage } from '../../services/communication/types/IgpacCommunication'; // Assurez-vous d'avoir ce type défini
import { gpacService } from '../../services/gpacService';
import { selectFilterNameById } from './graphSlice';


interface ArgumentUpdate {
    filterId: string;
    name: string;
    value: any;
    status: 'idle' | 'pending' | 'success' | 'error';
    error?: string;
}

interface FilterArgumentState {
    updates: Record<string, ArgumentUpdate>;
}


const initialState: FilterArgumentState = {
    updates: {},
};

// Slice
export const filterArgumentSlice = createSlice({
    name: 'filterArgument',
    initialState,
    reducers: {
        setArgumentUpdateStatus: (state, action: PayloadAction<ArgumentUpdate>) => {
 
            const key = `${action.payload.filterId}_${action.payload.name}`;
            state.updates[key] = action.payload;
        },
        clearArgumentUpdate: (state, action: PayloadAction<{
            filterId: string;
            name: string;
        }>) => {
            const key = `${action.payload.filterId}_${action.payload.name}`;
            delete state.updates[key];
        }
    }
});

// Actions
export const {
    setArgumentUpdateStatus,
    clearArgumentUpdate
} = filterArgumentSlice.actions;

// Thunk
interface UpdateFilterArgumentParams {
    filterId: string;
    name: string;
    value: any;
    
}

export const updateFilterArgument = (
    filterId: string,
    argName: string,
    argValue: any
  ): AppThunk => async (dispatch, getState) => {
    try {
      // Get filter name from state using the selector
      const filterName = selectFilterNameById(getState(), filterId);
      
      if (!filterName) {
        throw new Error(`Filter with ID ${filterId} not found`);
      }
      
      // Set pending status
      const pendingUpdate: ArgumentUpdate = {
        filterId,
        name: argName,
        value: argValue,
        status: 'pending'
      };
      dispatch(setArgumentUpdateStatus(pendingUpdate));
  
      // Send WebSocket message with correct filter name
      const message: GpacMessage = {
        type: 'update_arg',
        idx: parseInt(filterId),
        name: filterName,  // Use the retrieved filter name
        argName: argName,
        newValue: argValue
      };
      await gpacService.sendMessage(message);
  
      // Set success status
      const successUpdate: ArgumentUpdate = {
        filterId,
        name: argName,
        value: argValue,
        status: 'success'
      };
      dispatch(setArgumentUpdateStatus(successUpdate));
    } catch (error) {
      console.error('Failed to update filter argument:', error);
      
      // Set error status
      const errorUpdate: ArgumentUpdate = {
        filterId,
        name: argName,
        value: argValue,
        status: 'error',
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
      dispatch(setArgumentUpdateStatus(errorUpdate));
    }
  };

// Selectors
export const selectArgumentUpdate = (state:  RootState , filterId: string, name: string) => {
    const key = `${filterId}_${name}`;
    return state.filterArgument.updates[key];
};


export default filterArgumentSlice.reducer;