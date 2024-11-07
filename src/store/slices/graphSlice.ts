import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GraphState {
    selectNode: string | null;
    pidData: Record<string, any> | null;
}

const initialState: GraphState = {
    selectNode: null,
    pidData: null
};

const graphSlice = createSlice ({
    name: 'graph',
    initialState,
    reducers: {
        setSelectNode: (state, action: PayloadAction<string | null>) => {
            state.selectNode = action.payload;
        },
        setPidData: (state, action: PayloadAction<Record<string, any>>) => {
            state.pidData = action.payload;
        }
    }
});

export const { setSelectNode, setPidData } = graphSlice.actions;
export default graphSlice.reducer;
