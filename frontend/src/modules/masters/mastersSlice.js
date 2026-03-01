import { createSlice, nanoid } from '@reduxjs/toolkit';
import suppliersData from './suppliers/data';
import customersData from './customers/data';
import warehousesData from './warehouses/data';
import brandsData from './brands/data';
import itemGroupsData from './itemGroups/data';
import salesmenData from './salesmen/data';
import banksData from './banks/data';
import accountGroupsData from './accountGroups/data';
import MASTER_ENTITY_KEYS from './data/entityKeys';

const initialState = {
  [MASTER_ENTITY_KEYS.suppliers]: suppliersData,
  [MASTER_ENTITY_KEYS.customers]: customersData,
  [MASTER_ENTITY_KEYS.accountGroups]: accountGroupsData,
  [MASTER_ENTITY_KEYS.warehouses]: warehousesData,
  [MASTER_ENTITY_KEYS.brands]: brandsData,
  [MASTER_ENTITY_KEYS.itemGroups]: itemGroupsData,
  [MASTER_ENTITY_KEYS.salesmen]: salesmenData,
  [MASTER_ENTITY_KEYS.banks]: banksData,
};

const mastersSlice = createSlice({
  name: 'masters',
  initialState,
  reducers: {
    addMasterRecord: {
      reducer: (state, action) => {
        const { entityKey, record } = action.payload;
        if (!state[entityKey]) {
          return;
        }

        state[entityKey].unshift(record);
      },
      prepare: (entityKey, record) => ({
        payload: {
          entityKey,
          record: {
            id: nanoid(8),
            ...record,
          },
        },
      }),
    },
    updateMasterRecord: (state, action) => {
      const { entityKey, id, updates } = action.payload;
      if (!state[entityKey]) {
        return;
      }

      const targetIndex = state[entityKey].findIndex((item) => item.id === id);
      if (targetIndex === -1) {
        return;
      }

      state[entityKey][targetIndex] = {
        ...state[entityKey][targetIndex],
        ...updates,
      };
    },
    deleteMasterRecord: (state, action) => {
      const { entityKey, id } = action.payload;
      if (!state[entityKey]) {
        return;
      }

      state[entityKey] = state[entityKey].filter((item) => item.id !== id);
    },
  },
});

export const { addMasterRecord, updateMasterRecord, deleteMasterRecord } = mastersSlice.actions;

export default mastersSlice.reducer;
