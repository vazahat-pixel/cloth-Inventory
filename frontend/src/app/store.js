import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import mastersReducer from '../modules/masters/mastersSlice';
import itemsReducer from '../modules/items/itemsSlice';
import inventoryReducer from '../modules/inventory/inventorySlice';
import purchaseReducer from '../modules/purchase/purchaseSlice';
import salesReducer from '../modules/sales/salesSlice';
import pricingReducer from '../modules/pricing/pricingSlice';
import gstReducer from '../modules/gst/gstSlice';
import settingsReducer from '../modules/settings/settingsSlice';
import accountsReducer from '../modules/accounts/accountsSlice';
import ordersReducer from '../modules/orders/ordersSlice';
import customerRewardsReducer from '../modules/customers/customersSlice';
import grnReducer from '../modules/grn/grnSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    masters: mastersReducer,
    items: itemsReducer,
    inventory: inventoryReducer,
    purchase: purchaseReducer,
    sales: salesReducer,
    pricing: pricingReducer,
    customerRewards: customerRewardsReducer,
    gst: gstReducer,
    settings: settingsReducer,
    accounts: accountsReducer,
    orders: ordersReducer,
    grn: grnReducer,
  },
});
