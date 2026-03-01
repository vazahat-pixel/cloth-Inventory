import { createSlice, nanoid } from '@reduxjs/toolkit';
import { movementData, stockData, warehousesData } from './data';

const buildReference = (prefix) => `${prefix}-${Date.now().toString().slice(-6)}`;

const createMovement = ({
  date,
  stockRecord,
  warehouseId,
  type,
  quantityChange,
  reference,
  user,
}) => ({
  id: nanoid(10),
  date,
  variantId: stockRecord.variantId,
  sku: stockRecord.sku,
  itemName: stockRecord.itemName,
  styleCode: stockRecord.styleCode,
  size: stockRecord.size,
  color: stockRecord.color,
  warehouseId,
  type,
  quantityChange,
  reference,
  user,
});

const normalizeLot = (lot) => (lot != null && String(lot).trim() !== '' ? String(lot).trim() : '');

const findStockRow = (state, variantId, warehouseId, lotNumber = '') => {
  const lot = normalizeLot(lotNumber);
  return state.stock.find(
    (stock) =>
      stock.variantId === variantId &&
      stock.warehouseId === warehouseId &&
      normalizeLot(stock.lotNumber) === lot,
  );
};

const findFirstStockRow = (state, variantId, warehouseId) =>
  state.stock.find(
    (stock) =>
      stock.variantId === variantId &&
      stock.warehouseId === warehouseId &&
      Number(stock.quantity) - Number(stock.reserved || 0) > 0,
  );

const upsertStockRow = (state, line, warehouseId) => {
  const lot = normalizeLot(line.lotNumber);
  const existing = findStockRow(state, line.variantId, warehouseId, lot);
  if (existing) {
    return existing;
  }

  const created = {
    id: nanoid(10),
    variantId: line.variantId,
    lotNumber: lot,
    itemName: line.itemName,
    styleCode: line.styleCode,
    brand: line.brand || '',
    category: line.category || '',
    size: line.size,
    color: line.color,
    sku: line.sku,
    warehouseId,
    quantity: 0,
    reserved: 0,
    status: line.status || 'Active',
  };

  state.stock.push(created);
  return created;
};

const initialState = {
  warehouses: warehousesData,
  stock: stockData,
  movements: movementData,
  audits: [],
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    applyPurchaseReceipt: (state, action) => {
      const {
        warehouseId,
        date,
        items,
        reference = buildReference('PUR'),
        user = 'Admin',
      } = action.payload;

      const newMovements = [];

      items.forEach((line) => {
        const qty = Number(line.quantity || 0);
        if (qty <= 0) {
          return;
        }

        const stockRow = upsertStockRow(state, line, warehouseId);
        stockRow.quantity = Number(stockRow.quantity) + qty;

        newMovements.push(
          createMovement({
            date,
            stockRecord: stockRow,
            warehouseId,
            type: 'Purchase',
            quantityChange: qty,
            reference,
            user,
          }),
        );
      });

      state.movements.unshift(...newMovements);
    },

    reconcilePurchaseReceipt: (state, action) => {
      const {
        previousWarehouseId,
        newWarehouseId,
        previousItems,
        newItems,
        date,
        reference = buildReference('PED'),
        user = 'Admin',
      } = action.payload;

      const newMovements = [];

      previousItems.forEach((line) => {
        const qty = Number(line.quantity || 0);
        if (qty <= 0) {
          return;
        }

        const stockRow = findStockRow(
          state,
          line.variantId,
          previousWarehouseId,
          line.lotNumber,
        );
        if (!stockRow) {
          return;
        }

        const decrease = Math.min(Number(stockRow.quantity), qty);
        stockRow.quantity = Number(stockRow.quantity) - decrease;

        newMovements.push(
          createMovement({
            date,
            stockRecord: stockRow,
            warehouseId: previousWarehouseId,
            type: 'Adjustment',
            quantityChange: -decrease,
            reference,
            user,
          }),
        );
      });

      newItems.forEach((line) => {
        const qty = Number(line.quantity || 0);
        if (qty <= 0) {
          return;
        }

        const stockRow = upsertStockRow(state, line, newWarehouseId);
        stockRow.quantity = Number(stockRow.quantity) + qty;

        newMovements.push(
          createMovement({
            date,
            stockRecord: stockRow,
            warehouseId: newWarehouseId,
            type: 'Purchase',
            quantityChange: qty,
            reference,
            user,
          }),
        );
      });

      state.movements.unshift(...newMovements);
    },

    applyPurchaseReturn: (state, action) => {
      const {
        warehouseId,
        date,
        items,
        reference = buildReference('PRT'),
        user = 'Admin',
      } = action.payload;

      const newMovements = [];

      items.forEach((line) => {
        const qty = Number(line.returnQty || line.quantity || 0);
        if (qty <= 0) {
          return;
        }

        const stockRow = findStockRow(
          state,
          line.variantId,
          warehouseId,
          line.lotNumber,
        );
        if (!stockRow) {
          return;
        }

        const decrease = Math.min(Number(stockRow.quantity), qty);
        if (decrease <= 0) {
          return;
        }

        stockRow.quantity = Number(stockRow.quantity) - decrease;

        newMovements.push(
          createMovement({
            date,
            stockRecord: stockRow,
            warehouseId,
            type: 'Adjustment',
            quantityChange: -decrease,
            reference,
            user,
          }),
        );
      });

      state.movements.unshift(...newMovements);
    },

    applySaleDispatch: (state, action) => {
      const {
        warehouseId,
        date,
        items,
        reference = buildReference('SAL'),
        user = 'Admin',
      } = action.payload;

      const newMovements = [];

      items.forEach((line) => {
        let remaining = Number(line.quantity || 0);
        if (remaining <= 0) return;

        const stockRows = state.stock.filter(
          (s) =>
            s.variantId === line.variantId &&
            s.warehouseId === warehouseId &&
            Number(s.quantity) - Number(s.reserved || 0) > 0,
        );

        stockRows.forEach((stockRow) => {
          if (remaining <= 0) return;
          const available = Number(stockRow.quantity) - Number(stockRow.reserved || 0);
          const decrease = Math.min(remaining, available);
          if (decrease <= 0) return;

          stockRow.quantity = Number(stockRow.quantity) - decrease;
          remaining -= decrease;

          newMovements.push(
            createMovement({
              date,
              stockRecord: stockRow,
              warehouseId,
              type: 'Sale',
              quantityChange: -decrease,
              reference,
              user,
            }),
          );
        });
      });

      state.movements.unshift(...newMovements);
    },

    applySalesReturnReceipt: (state, action) => {
      const {
        warehouseId,
        date,
        items,
        reference = buildReference('SRT'),
        user = 'Admin',
      } = action.payload;

      const newMovements = [];

      items.forEach((line) => {
        const qty = Number(line.returnQty || line.quantity || 0);
        if (qty <= 0) {
          return;
        }

        const lineWithLot = { ...line, lotNumber: line.lotNumber || '' };
        const stockRow = upsertStockRow(state, lineWithLot, warehouseId);
        stockRow.quantity = Number(stockRow.quantity) + qty;

        newMovements.push(
          createMovement({
            date,
            stockRecord: stockRow,
            warehouseId,
            type: 'Sale Return',
            quantityChange: qty,
            reference,
            user,
          }),
        );
      });

      state.movements.unshift(...newMovements);
    },

    transferStock: (state, action) => {
      const { fromWarehouseId, toWarehouseId, date, lines, user = 'Admin' } = action.payload;

      const reference = buildReference('TRN');
      const newMovements = [];

      lines.forEach((line) => {
        const fromStock = state.stock.find((stock) => stock.id === line.stockId);
        if (!fromStock) {
          return;
        }

        const transferQty = Number(line.transferQty || 0);
        const availableQty = Number(fromStock.quantity) - Number(fromStock.reserved || 0);
        if (transferQty <= 0 || transferQty > availableQty) {
          return;
        }

        fromStock.quantity = Number(fromStock.quantity) - transferQty;

        const lot = normalizeLot(fromStock.lotNumber);
        let toStock = findStockRow(
          state,
          fromStock.variantId,
          toWarehouseId,
          lot,
        );

        if (!toStock) {
          toStock = {
            ...fromStock,
            id: nanoid(10),
            warehouseId: toWarehouseId,
            quantity: 0,
            reserved: 0,
          };
          state.stock.push(toStock);
        }

        toStock.quantity = Number(toStock.quantity) + transferQty;

        newMovements.push(
          createMovement({
            date,
            stockRecord: fromStock,
            warehouseId: fromWarehouseId,
            type: 'Transfer',
            quantityChange: -transferQty,
            reference,
            user,
          }),
        );

        newMovements.push(
          createMovement({
            date,
            stockRecord: toStock,
            warehouseId: toWarehouseId,
            type: 'Transfer',
            quantityChange: transferQty,
            reference,
            user,
          }),
        );
      });

      state.movements.unshift(...newMovements);
    },

    applyStockAdjustment: (state, action) => {
      const { warehouseId, adjustmentType, date, lines, user = 'Admin' } = action.payload;

      const reference = buildReference('ADJ');
      const newMovements = [];

      lines.forEach((line) => {
        const stockRow = state.stock.find((stock) => stock.id === line.stockId);
        if (!stockRow || stockRow.warehouseId !== warehouseId) {
          return;
        }

        const adjustmentQty = Number(line.adjustmentQty || 0);
        if (adjustmentQty <= 0) {
          return;
        }

        const previousQuantity = Number(stockRow.quantity);
        const signedChange = adjustmentType === 'Increase' ? adjustmentQty : -adjustmentQty;
        const nextQuantity = previousQuantity + signedChange;

        stockRow.quantity = nextQuantity < 0 ? 0 : nextQuantity;
        const effectiveChange = stockRow.quantity - previousQuantity;

        newMovements.push(
          createMovement({
            date,
            stockRecord: stockRow,
            warehouseId,
            type: 'Adjustment',
            quantityChange: effectiveChange,
            reference,
            user,
          }),
        );
      });

      state.movements.unshift(...newMovements);
    },

    applyStockAudit: (state, action) => {
      const { warehouseId, date, entries, user = 'Admin' } = action.payload;
      const reference = buildReference('AUD');
      const newMovements = [];

      const auditSnapshot = {
        id: nanoid(10),
        warehouseId,
        date,
        reference,
        entries: [],
      };

      entries.forEach((entry) => {
        const stockRow = state.stock.find((stock) => stock.id === entry.stockId);
        if (!stockRow || stockRow.warehouseId !== warehouseId) {
          return;
        }

        const systemQty = Number(stockRow.quantity);
        const physicalQty = Number(entry.physicalQty);
        const difference = physicalQty - systemQty;

        auditSnapshot.entries.push({
          stockId: stockRow.id,
          systemQty,
          physicalQty,
          difference,
        });

        if (difference === 0) {
          return;
        }

        stockRow.quantity = physicalQty < 0 ? 0 : physicalQty;
        const docType = difference > 0 ? 'Receive' : 'Issue';

        newMovements.push(
          createMovement({
            date,
            stockRecord: stockRow,
            warehouseId,
            type: docType,
            quantityChange: difference,
            reference,
            user,
          }),
        );
      });

      state.audits.unshift(auditSnapshot);
      state.movements.unshift(...newMovements);
    },
  },
});

export const {
  applyPurchaseReceipt,
  reconcilePurchaseReceipt,
  applyPurchaseReturn,
  applySaleDispatch,
  applySalesReturnReceipt,
  transferStock,
  applyStockAdjustment,
  applyStockAudit,
} = inventorySlice.actions;

export default inventorySlice.reducer;
