# Cloth ERP — Complete Manual QA Testing Guide

This guide walks you through **end-to-end manual testing** of the ERP: UI actions, expected results, and optional database checks. No business logic or APIs are changed; you only verify behavior.

---

## Prerequisites

### 1. Environment

- **Backend** running (e.g. `npm run dev` in `backend/`) — typically `http://localhost:5000` or port in `.env`.
- **Frontend** running (e.g. `npm run dev` in `frontend/`) — typically `http://localhost:5173`.
- **MongoDB** running and reachable (connection string in `backend/.env`).

### 2. Seed default users (if not already done)

From project root:

```bash
cd backend && node scripts/seed.js
```

This creates:

| Role        | Email                     | Password   | Use for              |
|------------|---------------------------|------------|-----------------------|
| Admin (HO) | admin@clothinventory.com  | Admin@1234 | Head Office testing  |
| Store staff| store@clothinventory.com  | Store@1234 | Store panel testing   |

**Important:** Store staff must have `shopId` set to a store for POS/inventory to work. After creating a store in Step 4, either run a one-time DB update to set `user.shopId` to that store’s `_id`, or use your Users screen (if it supports assigning store) to link the store user to a store.

### 3. Tools (optional)

- **Browser:** Chrome/Edge (DevTools → Network tab to confirm API calls).
- **MongoDB client:** Compass or `mongosh` to verify collections (e.g. `stores`, `warehouseinventories`, `storeinventories`, `sales`).

---

## Part A — Head Office (Admin) Flow

Use **Admin** login. Base URL for HO: **`/ho`**.

---

### Step 1 — Login (Admin)

1. Open: `http://localhost:5173/login` (or your frontend URL).
2. Enter:
   - **Email:** `admin@clothinventory.com`
   - **Password:** `Admin@1234`
3. Click **Login**.

**Expected:**

- Redirect to `/ho` (dashboard).
- Sidebar shows: Dashboard, Masters, Items, Inventory, Purchase, Orders, Sales, Reports, Setup, Data Import, Settings.

**Optional DB:** `users` collection has one document with `role: 'admin'`.

---

### Step 2 — Setup: Users, Roles, GST, HSN

**2.1 Users & Roles**

1. Go to **Settings** → **Users** (`/ho/settings/users`).
2. Confirm list loads (may be empty or show seeded users).
3. If your app allows, add a user with role **Store Staff** and assign a **Store** (you can do this after Step 4 when store exists).

**Expected:** Users list loads without errors.

**2.2 GST**

1. Go to **GST** → **Tax Rates** (`/ho/gst/tax-rates`).
2. Confirm page loads; add or edit a tax rate if the UI allows.

**Expected:** No console/network errors.

**2.3 HSN**

1. Go to **Setup** → **HSN Codes** (`/ho/setup/hsn-codes`).
2. Confirm list loads; add an HSN code (e.g. 6109, description “T-shirts”).

**Expected:** HSN list loads; new code appears after save.

**Optional DB:** `gstslabs`, `hsncodes` (or similar) collections have documents.

---

### Step 3 — Store creation (Master → Store)

1. Go to **Masters** → **Stores** (`/ho/masters/stores`).
2. Click **Add Store** (or equivalent).
3. Fill: **Name** (e.g. “Store Indore”), **Code** (e.g. “STR001”), **Phone**, **Address** (optional).
4. Save.

**Expected:** Store appears in the list; success message.

**Optional DB:** `stores` collection has a new document; note its `_id` for linking store staff later.

**Repeat** to create a second store (e.g. “Store Bhopal”) if you want multi-store tests.

---

### Step 4 — Warehouse (for purchase & dispatch)

1. Go to **Masters** → **Warehouses** (`/ho/masters/warehouses`).
2. Add a warehouse (e.g. “Central WH”, code “WH01”).
3. Save.

**Expected:** Warehouse appears in list.

**Optional DB:** `warehouses` collection has the new document. Many flows use “store” as warehouse destination; if your app uses a single warehouse, ensure it’s the one selected in purchase/dispatch.

---

### Step 5 — Supplier creation

1. Go to **Masters** → **Suppliers** (`/ho/masters/suppliers`).
2. Click **Add Supplier**.
3. Fill: **Name** (e.g. “Arrow”), **Phone**, **Address**, **GST Number**, **Email** (optional).
4. Save.

**Expected:** Supplier appears in list.

**Optional DB:** `suppliers` has the new document.

---

### Step 6 — Product creation (manual)

1. Go to **Items** (`/ho/items`).
2. Click **Add** / **New Item** (`/ho/items/new`).
3. Fill: **Name**, **Category**, **Brand**, **Cost Price**, **Sale Price**, **Size**, **Color**; leave **Barcode** empty if auto-generation is supported.
4. Save.

**Expected:**

- Product is created.
- If barcode is auto-generated, it follows pattern (e.g. DA0780, DA0781). Note the barcode for POS.

**Optional DB:** `products` has new document with `barcode` set.

---

### Step 7 — Bulk product import (Excel)

1. Go to **Data Import** (`/ho/data-import`).
2. Use the **Data Import Engine** (or equivalent) that supports Excel upload.
3. Upload an Excel with columns: **Name**, **Category**, **Brand**, **Cost Price**, **Sale Price**, **Size**, **Color**, **Stock** (optional). Leave Barcode/SKU blank for auto-generation.
4. Select **Target Warehouse** if the UI asks (e.g. Central WH).
5. Click **Start Import**.

**Expected:**

- Success message; products created; barcodes auto-generated (e.g. DA…).
- If warehouse was selected and Stock column used, warehouse stock should increase.

**Optional DB:** `products` count increases; `warehouseinventories` (or equivalent) has new/updated rows if stock was imported.

---

### Step 8 — Purchase Order

1. Go to **Purchase** → **Orders** (`/ho/purchase/orders`).
2. Click **New Purchase Order** (`/ho/purchase/orders/new`).
3. Select **Supplier** (e.g. Arrow), **Warehouse/Destination**.
4. Add line items: **Product**, **Quantity**, **Rate**.
5. Save.

**Expected:** PO is created; PO number generated (e.g. PO-2025-000001). List shows the new PO.

**Optional DB:** `purchaseorders` has new document.

---

### Step 9 — Purchase Invoice (Warehouse stock increase)

1. Go to **Purchase** → **New** (`/ho/purchase/new`) or Purchase list and open create.
2. Select **Supplier**, **Warehouse** (same as used for stock), **Invoice Number**, **Date**.
3. Add items: **Product**, **Quantity**, **Rate** (match or align with PO if linked).
4. Save.

**Expected:**

- Purchase record is created.
- **Warehouse stock increases** for each product/quantity.

**Verify:**

- Go to **Inventory** → **Stock Overview** (or equivalent). Filter by that warehouse — quantities for purchased products should reflect the invoice.
- **Optional DB:** `purchases` has new doc; `warehouseinventories` quantities increased for that warehouse.

---

### Step 10 — Dispatch (Warehouse → Store)

1. Go to **Orders** → **Delivery Challan** (`/ho/orders/delivery-challan`).
2. Click **New** (`/ho/orders/delivery-challan/new`).
3. Select **Source Warehouse** (e.g. Central WH), **Destination Store** (e.g. Store Indore).
4. Add items: **Product**, **Quantity** (do not exceed warehouse stock).
5. Save.

**Expected:**

- Dispatch is created (e.g. DSP-2025-00001).
- **Warehouse stock decreases** for dispatched quantities.

**Verify:**

- Stock Overview: warehouse quantities decreased.
- **Do not** mark as “Received” yet if you want to test receive in next step.

---

### Step 11 — Mark dispatch as received (Store stock increase)

1. Open the same dispatch from the list (or Dispatch list if separate).
2. Change status to **Received** (or “Mark as Received”).

**Expected:**

- **Store stock increases** for the destination store for each product/quantity.

**Verify:**

- **Inventory** → **Stock Overview** (or Store Inventory): filter by **Store Indore**; quantities should show the received items.
- **Optional DB:** `storeinventories` has rows for that store with increased `quantity` / `quantityAvailable`.

---

### Step 12 — Reports (HO view)

1. Go to **Reports** (`/ho/reports`).
2. Open **Sales Report**, **Stock Report**, **Purchase Report**, **Store-wise** (if available).
3. Apply filters (date, store) and confirm data appears where expected.

**Expected:** Reports load; numbers align with POs, purchases, dispatches, and stock.

---

### Step 13 — Data Management: Export

1. Go to **Data Import** / **Data Management** (`/ho/data-import`).
2. Click **Export Products (Excel)**.
3. Click **Export Inventory (Excel)** (if available).

**Expected:** File downloads (e.g. `products_export_*.xlsx`, `inventory_export_*.xlsx`); open and confirm columns and data.

---

## Part B — Store Panel & POS

Use **Store staff** login. Base URL: **`/store`**.

**Prerequisite:** Store user must have `shopId` set to the store you use (e.g. Store Indore). Otherwise POS/inventory may show “User is not linked to any store” or empty data. Set via your **Users** screen (if supported) or a one-time DB update:  
`db.users.updateOne({ email: 'store@clothinventory.com' }, { $set: { shopId: ObjectId('<store_id>') } })`.

---

### Step 14 — Login (Store staff)

1. Open: `http://localhost:5173/login/store_staff`.
2. Enter:
   - **Email:** `store@clothinventory.com`
   - **Password:** `Store@1234`
3. Click **Login**.

**Expected:** Redirect to `/store`; sidebar shows limited menu (e.g. Dashboard, Inventory, Purchase Return, Sales, Data Import, Reports).

---

### Step 15 — Store inventory visibility

1. Go to **Inventory** → **Stock Overview** (`/store/inventory/stock-overview`).
2. Confirm only **your store’s** stock is shown (no other stores).

**Expected:** List shows only the store linked to `shopId`; no 403 or “not linked” error.

---

### Step 16 — POS Billing (Retail sale)

1. Go to **Sales** → **New** (`/store/sales/new`).
2. Select **Store** (may be pre-filled or single option for store user).
3. **Customer:** Leave as Walk-in or select a customer if you have one.
4. **Item entry:**
   - Use **Barcode** field: scan or type a product barcode (e.g. from Step 6 or 7) and press Enter, or
   - Use **Search item or SKU**: select a product and click **Add**.
5. Set **Quantity** (within available stock).
6. Optionally set **Bill Discount**, **Coupon**, **Loyalty Redeem**.
7. Click **Proceed to Payment**.
8. In payment dialog, choose **Cash** (or other), confirm amount, submit.

**Expected:**

- Sale completes; success message; invoice/print view may open.
- **Store stock decreases** for the sold product/quantity.

**Verify:**

- **Sales** list shows the new sale.
- **Inventory** → Stock Overview: that product’s quantity at the store decreased by the sold quantity.
- **Optional DB:** `sales` has new document; `storeinventories` quantity (and `quantityAvailable`) decreased for that store/product.

---

### Step 17 — Exchange billing (optional)

1. Go to **Sales** → **New** again.
2. Set **Sale Type** to **Exchange**.
3. Add a line with **negative quantity** (returned item) and a line with **positive quantity** (new item). Ensure net payable is correct.
4. Complete payment.

**Expected:** Sale saved as exchange; store stock increases for returned qty, decreases for new item qty.

---

### Step 18 — Sales return (against an invoice)

1. Go to **Sales** (`/store/sales`).
2. Open an existing **completed** sale (invoice).
3. Click **Create Return** (or go to `/store/sales/:id/return`).
4. Select items and **Quantity to return** (not more than sold).
5. Choose **Refund** or **Credit Note**; submit.

**Expected:**

- Return is recorded.
- **Store stock increases** for returned quantity.

**Verify:** Stock Overview and, if available, Returns report; **Optional DB:** `returns` has new doc; `storeinventories` quantity increased.

---

### Step 19 — Store reports

1. Under **Reports**, open **Daily Sales**, **Stock Report** (or equivalent).
2. Confirm data is only for **your store**.

**Expected:** No other stores’ data visible; numbers consistent with your POS and returns.

---

### Step 20 — Multi-store safety (negative test)

1. While logged in as **Store staff**, try to open a direct URL that is HO-only, e.g.  
   `http://localhost:5173/ho/masters/suppliers`.  
   **Expected:** Redirect or access denied; store user cannot access HO masters.
2. If you have a second store, confirm that in **Sales** or **Inventory** you **cannot** see or select the other store (only your `shopId` store).

---

## Part C — Database spot checks (optional)

Use MongoDB Compass or `mongosh` connected to your app’s database.

| Step / Flow           | Collection(s)              | What to check                                      |
|-----------------------|----------------------------|----------------------------------------------------|
| Users                 | `users`                    | `role`, `shopId` for store user                    |
| Stores                | `stores`                   | New stores exist                                   |
| Suppliers             | `suppliers`                | New supplier exists                                |
| Products              | `products`                 | `barcode` pattern (e.g. DA0780, DA0781)            |
| Purchase              | `purchases`                | New purchase; `products` array                    |
| Warehouse stock       | `warehouseinventories`     | `quantity` increased after purchase                |
| Dispatch              | `dispatches` (or similar)  | Status; `products` array                          |
| Store stock           | `storeinventories`         | `quantity` / `quantityAvailable` after receive/sale/return |
| Sales                 | `sales`                    | New sale; `storeId`; `products`                    |
| Returns               | `returns`                  | New return; `referenceSaleId`                      |

---

## Quick reference — URLs (HO)

| Screen           | URL                                      |
|------------------|------------------------------------------|
| Login (Admin)    | `/login`                                 |
| Dashboard        | `/ho`                                   |
| Users            | `/ho/settings/users`                     |
| Roles            | `/ho/settings/roles`                     |
| GST Tax Rates    | `/ho/gst/tax-rates`                      |
| HSN Codes        | `/ho/setup/hsn-codes`                    |
| Stores           | `/ho/masters/stores`                     |
| Warehouses       | `/ho/masters/warehouses`                 |
| Suppliers        | `/ho/masters/suppliers`                  |
| Items (Products) | `/ho/items`                              |
| New Item         | `/ho/items/new`                          |
| Data Import      | `/ho/data-import`                        |
| Purchase Orders  | `/ho/purchase/orders`                    |
| New PO           | `/ho/purchase/orders/new`                |
| New Purchase     | `/ho/purchase/new`                       |
| Delivery Challan | `/ho/orders/delivery-challan`            |
| New Challan      | `/ho/orders/delivery-challan/new`        |
| Sales list       | `/ho/sales`                              |
| Reports          | `/ho/reports`                            |

---

## Quick reference — URLs (Store)

| Screen        | URL                        |
|---------------|----------------------------|
| Login (Store) | `/login/store_staff`       |
| Dashboard     | `/store`                   |
| Stock Overview| `/store/inventory/stock-overview` |
| POS Billing   | `/store/sales/new`         |
| Sales list    | `/store/sales`             |
| Sales return  | `/store/sales/:id/return`  |
| Reports       | `/store/reports`           |

---

## Checklist summary

- [ ] Admin login → `/ho` dashboard
- [ ] Setup: Users, GST, HSN
- [ ] Create at least one Store and one Warehouse
- [ ] Create Supplier
- [ ] Create Product (manual); note barcode
- [ ] Bulk import products (Excel); barcodes auto-generated
- [ ] Create Purchase Order
- [ ] Create Purchase Invoice → warehouse stock ↑
- [ ] Create Dispatch → warehouse stock ↓
- [ ] Mark Dispatch Received → store stock ↑
- [ ] HO Reports and Data Export (Products, Inventory)
- [ ] Store staff login → `/store` (with `shopId` set)
- [ ] Store sees only own inventory
- [ ] POS: add items (barcode/search), complete payment → store stock ↓
- [ ] (Optional) Exchange sale
- [ ] Sales return → store stock ↑
- [ ] Store reports show only own store
- [ ] Store user cannot access HO URLs

When all items pass, the end-to-end business workflow is verified for manual QA.
