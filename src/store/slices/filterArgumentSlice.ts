
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk } from '../index'; 
import { GpacMessage } from '../../services/communication/types/IgpacCommunication'; // Assurez-vous d'avoir ce type défini
import { gpacService } from '../../services/gpacService';


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
    name: string,
    value: any
): AppThunk => async (dispatch: any) => {
    try {
        const pendingUpdate: ArgumentUpdate = {
            filterId,
            name,
            value,
            status: 'pending'
        };
        dispatch(setArgumentUpdateStatus(pendingUpdate));

        // Service call
        const message: GpacMessage = {
            type: 'update_arg',
            idx: parseInt(filterId),
            name: filterId,
            argName: name,
            newValue: value
        };
        await gpacService.sendMessage(message);

  
        const successUpdate: ArgumentUpdate = {
            filterId,
            name,
            value,
            status: 'success'
        };
        dispatch(setArgumentUpdateStatus(successUpdate));
    } catch (error) {
        // Gestion des erreurs
        const errorUpdate: ArgumentUpdate = {
            filterId,
            name,
            value,
            status: 'error',
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
        dispatch(setArgumentUpdateStatus(errorUpdate));
    }
};

// Selectors
export const selectArgumentUpdate = (state: { filterArgument: FilterArgumentState }, filterId: string, name: string) => {
    const key = `${filterId}_${name}`;
    return state.filterArgument.updates[key];
};


export default filterArgumentSlice.reducer;