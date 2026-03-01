import { createSlice, nanoid } from '@reduxjs/toolkit';
import itemsData from './data';

const initialState = {
  records: itemsData,
};

const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    addItem: {
      reducer: (state, action) => {
        state.records.unshift(action.payload);
      },
      prepare: (item) => ({
        payload: {
          id: nanoid(10),
          ...item,
        },
      }),
    },
    updateItem: (state, action) => {
      const { id, item } = action.payload;
      const targetIndex = state.records.findIndex((record) => record.id === id);

      if (targetIndex === -1) {
        return;
      }

      state.records[targetIndex] = {
        ...state.records[targetIndex],
        ...item,
      };
    },
    deleteItem: (state, action) => {
      const targetId = action.payload;
      state.records = state.records.filter((record) => record.id !== targetId);
    },
  },
});

export const { addItem, updateItem, deleteItem } = itemsSlice.actions;

export default itemsSlice.reducer;
