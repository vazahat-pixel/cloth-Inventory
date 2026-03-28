# ERP Full Backend Alignment Plan

## Goal
Achieve 100% frontend → backend alignment: every button clickable, every field stored, no hardcoded data, no broken flows.

---

## STEP 1: Full System Architecture Overview

```
Frontend (React + Redux Toolkit + MUI)
│
├── services/api.js         ← Axios client | BaseURL: VITE_API_URL | Token via interceptor
├── services/normalization.js ← _id→id bridge, field aliasing per entity
│
├── Redux Slices (14 total)
│   auth · masters · items · purchase · sales · inventory
│   pricing · gst · settings · accounts · orders · customerRewards · dispatch
│
├── 11 Business Modules
│   Masters | Items/Products | Purchase | Inventory | Dispatch
│   Sales/POS | Orders | Pricing | CRM | Accounts | Reports
│
└── Routes → Protected by role: /ho (Admin), /store (Staff)

Backend (Express + Mongoose)
│
├── src/routes.js            ← Central route loader
├── src/modules/ (42 modules)
└── src/middlewares/         ← auth.middleware.js, role.middleware.js
```

---

## STEP 2: Complete Frontend API Call Inventory (All 14 Slices)

| Slice | HTTP Method | Endpoint Called |
|:---|:---|:---|
| auth | GET | `/auth/me` |
| auth | POST | `/auth/login` |
| auth | POST | `/auth/register` |
| masters.suppliers | GET/POST/PATCH/DELETE | `/suppliers` · `/suppliers/:id` |
| masters.customers | GET/POST/PATCH/DELETE | `/customers` · `/customers/:id` |
| masters.warehouses | GET/POST/PATCH/DELETE | `/warehouses` · `/warehouses/:id` |
| masters.stores | GET/POST/PATCH/DELETE | `/stores` · `/stores/:id` |
| masters.itemGroups | GET/POST/PATCH/DELETE | `/categories` · `/categories/:id` |
| masters.salesmen | GET/POST/PATCH | `/auth/users` · `/auth/users/:id` |
| masters.brands | GET/POST/PATCH/DELETE | `/brands` · `/brands/:id` |
| masters.accountGroups | GET/POST/PATCH/DELETE | `/account-groups` · `/account-groups/:id` |
| masters.banks | GET/POST/PATCH/DELETE | `/banks` · `/banks/:id` |
| items | GET | `/products` |
| items | POST | `/products/bulk-import` |
| items | PATCH | `/products/:id` |
| items | DELETE | `/products/:id` |
| purchase | GET | `/purchase` |
| purchase | POST | `/purchase` |
| purchase | PATCH | `/purchase/:id` |
| purchase | GET | `/purchase-orders` |
| purchase | GET | `/purchase-orders/:id` |
| purchase | POST | `/purchase-orders` |
| purchase | PATCH | `/purchase-orders/:id` |
| purchase | GET | `/returns?type=STORE_TO_FACTORY` |
| purchase | POST | `/returns` |
| sales | GET | `/sales` |
| sales | POST | `/sales` |
| sales | GET | `/returns?type=CUSTOMER_RETURN` |
| sales | POST | `/returns` |
| inventory | GET | `/store-inventory` |
| inventory | POST | `/store-inventory/adjust` |
| inventory | POST | `/store-inventory/audit` |
| inventory | POST | `/dispatch` |
| inventory | PATCH | `/dispatch/:id/status` |
| inventory | GET | `/reports/movement` |
| dispatch | GET | `/dispatch` |
| dispatch | POST | `/dispatch` |
| dispatch | PATCH | `/dispatch/:id/status` |
| gst | GET | `/gst` |
| gst | POST | `/gst` |
| gst | PATCH/DELETE | `/gst/:id` |
| gst | GET/POST | `/gst/groups` ⚠️ **MISSING** |
| gst | PATCH | `/gst/groups/:id` ⚠️ **MISSING** |
| gst | GET | `/reports/gst-summary` |
| pricing | GET/POST/PATCH | `/pricing` · `/pricing/:id` |
| pricing | GET/POST/PATCH | `/schemes` · `/schemes/:id` |
| pricing | GET/POST/PATCH | `/coupons` · `/coupons/:id` |
| orders | GET | `/orders/sales` ⚠️ **MISSING** |
| orders | POST | `/orders/sales` ⚠️ **MISSING** |
| orders | PATCH | `/orders/sales/:id` ⚠️ **MISSING** |
| orders | POST | `/orders/packing-slips` ⚠️ **MISSING** |
| orders | POST | `/orders/delivery` ⚠️ **MISSING** |
| customerRewards | GET/PATCH | `/customers/loyalty` ⚠️ **MISSING** |
| customerRewards | GET | `/customers/loyalty/history/:id` ⚠️ **MISSING** |
| customerRewards | GET/POST | `/credit-notes` ⚠️ **MISSING** |
| customerRewards | PATCH | `/vouchers/:id` |
| customerRewards | POST | `/vouchers` |
| accounts | GET/POST | `/accounts/bank-payment` · `/accounts/bank-receipt` |
| settings | GET/PATCH | `/settings/company` |
| settings | GET/POST/PATCH | `/settings/roles` · `/settings/roles/:id` |
| settings | GET/POST/PATCH | `/settings/number-series` · `/settings/number-series/:id` |
| settings | GET/PATCH | `/settings/preferences` |
| settings | GET/PATCH | `/settings/purchase-voucher-config` |
| settings | GET/POST/PATCH | `/settings/print-templates` · `/settings/print-templates/:id` |
| settings | GET | `/reports/audit-logs` |
| reports | GET | `/reports/sales` · `/reports/stock` · `/reports/movement` |
| reports | GET | `/reports/daily-sales` · `/reports/monthly-sales` |
| reports | GET | `/reports/low-stock` · `/reports/returns` |
| reports | GET | `/reports/ledger/:accountId` |
| reports | GET | `/reports/purchase-register` |
| reports | GET | `/reports/profit-loss` · `/reports/trial-balance` · `/reports/balance-sheet` |
| reports | GET | `/reports/stock-aging` |

---

## STEP 3: Gap Analysis — CRITICAL MISSING APIS

### 🔴 Priority 1: COMPLETELY MISSING (Broken Functionality)

| # | Missing API | Frontend Calls From | Impact |
|:---|:---|:---|:---|
| 1 | `GET /api/orders/sales` | `ordersSlice.fetchSaleOrders` | Sale Order list broken |
| 2 | `POST /api/orders/sales` | `ordersSlice.addSaleOrder` | Cannot create Sale Orders |
| 3 | `PATCH /api/orders/sales/:id` | `ordersSlice.updateSaleOrder` | Cannot update Sale Orders |
| 4 | `POST /api/orders/packing-slips` | `ordersSlice.addPackingSlip` | Packing slip broken |
| 5 | `POST /api/orders/delivery` | `ordersSlice.addDeliveryOrder` | Delivery order broken |
| 6 | `GET /api/customers/loyalty` | `customersSlice.fetchLoyaltyConfig` | Loyalty config broken |
| 7 | `PATCH /api/customers/loyalty` | `customersSlice.updateLoyaltyConfig` | Cannot save loyalty rules |
| 8 | `GET /api/customers/loyalty/history/:id` | `customersSlice.fetchLoyaltyTransactions` | Loyalty history broken |
| 9 | `GET /api/credit-notes` | `customersSlice.fetchCreditNotes` | Credit notes list broken |
| 10 | `POST /api/credit-notes` | `customersSlice.addCreditNote` | Cannot create credit notes |
| 11 | `GET /api/gst/groups` | `gstSlice.addTaxGroup` | Tax groups broken |
| 12 | `POST /api/gst/groups` | `gstSlice.addTaxGroup` | Cannot add tax groups |
| 13 | `PATCH /api/gst/groups/:id` | `gstSlice.updateTaxGroup` | Cannot edit tax groups |

### 🟡 Priority 2: PARTIAL / MISMATCH (Works but with data loss)

| # | Issue | Location | Fix |
|:---|:---|:---|:---|
| 1 | Customer `PATCH /:id` & `DELETE /:id` missing | [customer.routes.js](file:///c:/Users/hp/Desktop/cloth-Inventory/backend/src/modules/customers/customer.routes.js) | Add PATCH+DELETE handlers |
| 2 | [purchase.routes.js](file:///c:/Users/hp/Desktop/cloth-Inventory/backend/src/modules/purchase/purchase.routes.js) also exists inside `/purchase/` folder (duplicate) | `backend/src/modules/purchase/` | Consolidate, remove duplicate |
| 3 | `dispatch` registered twice in `routes.js` (line 16 and 45) | `routes.js` | Remove duplicate line 45 |
| 4 | `returns` registered twice in `routes.js` (line 19 and 46) | `routes.js` | Remove duplicate line 46 |
| 5 | `/api/products/bulk-import` — itemsSlice sends `warehouseId: null` | `itemsSlice.addItem` | Backend must handle null gracefully |
| 6 | GST fields `cgst/sgst/igst` sent to BillingPage but backend stores only `percentage+type` | `gstSlice.js` normalization | Already handled in frontend — confirm backend GstSlab model |
| 7 | `salesmen` fetched from `/auth/users` — returns all users, not just sales role | `mastersSlice` | Backend must support `?role=staff` filter |
| 8 | `addItem` sends `sku: null, barcode: null` — backend must auto-generate | `itemsSlice.addItem` | Confirm backend auto-generates SKU+barcode |
| 9 | `paymentMode` in addSale sent as `.toUpperCase()` — backend must accept `CASH`,`CARD`,`UPI`,`WALLET` | `salesSlice.addSale` | No risk if enum matches |
| 10 | `StockInPage` calls `POST /store-inventory` (no adjust path), but slice calls `/store-inventory/adjust` | `inventorySlice` | Verify which path backend serves |

### 🟢 Priority 3: HARDCODED DATA TO REPLACE

| Location | Hardcoded Item | Replace With |
|:---|:---|:---|
| `AppRoutes.jsx` | Maharashtra/India data in States/City setup tables | `GET /api/setup/states` & `GET /api/setup/cities` |
| `PrintingPlaceholderPage` | `CASH RECIPET` static dropdown | Dynamic from `GET /api/settings/print-templates` |
| `PurchaseFormPage.jsx` | No barcode scan — uses Autocomplete | Add barcode scanner integration endpoint |

---

## STEP 4: Module-Wise Backend Requirements

### 4.1 — Masters

**All master endpoints require PATCH + DELETE:**

```
# Customer — MISSING PATCH/DELETE
PATCH  /api/customers/:id      ← updateMasterRecord
DELETE /api/customers/:id      ← deleteMasterRecord

# Salesmen — uses /auth/users, needs role filter
GET    /api/auth/users?role=staff   ← fetchMasters('salesmen')
```

**Required Mongoose Schema Extensions:**
- Customer: add `isActive` field, `loyaltyPoints`, `loyaltyTier`
- Warehouse: ensure `location.address`, `location.city`, `location.state`, `location.pincode` exist

### 4.2 — Products (Items)

**Required endpoints:**
```
GET    /api/products           ← fetchItems
POST   /api/products/bulk-import   ← addItem (multi-variant creation)
PATCH  /api/products/:id       ← updateItem
DELETE /api/products/:id       ← deleteItem
```

**Required Schema fields (per Product document):**
- `name`, `category` (ref→Category), `brand` (ref→Brand)
- `size`, `color`, `sku` (auto-generated), `barcode` (auto-generated)
- `salePrice`, `costPrice`, `factoryStock`
- `isActive` (Boolean, default: true)
- `gstSlabId` (optional ref→GstSlab)

**Auto-generation Rule:** Backend MUST auto-generate `sku` and `barcode` if not provided.

### 4.3 — Purchase

**Required endpoints (all exist ✅):**
```
GET    /api/purchase
POST   /api/purchase
PATCH  /api/purchase/:id
GET/POST/PATCH  /api/purchase-orders, /api/purchase-orders/:id
POST   /api/returns   (type: PURCHASE_RETURN)
```

**Payload Contract:**
```json
{
  "supplierId": "ObjectId",
  "warehouseId": "ObjectId",     ← maps to storeId in backend
  "invoiceNumber": "INV-001",
  "invoiceDate": "2026-03-28",
  "notes": "string",
  "otherCharges": 0,
  "products": [
    { "productId": "ObjectId", "quantity": 10, "rate": 100,
      "discountPercentage": 0, "taxPercentage": 18 }
  ]
}
```

> [!WARNING]
> Frontend sends `warehouseId` but backend schema may expect `storeId`. The `normalization.js` maps `storeId↔warehouseId` on read but the POST payload uses `warehouseId`. Backend `purchase.controller.js` must accept BOTH field names OR normalization must rewrite before POST.

### 4.4 — GRN (Goods Receipt Note)

**Required endpoints:**
```
GET  /api/grn            ← list GRNs
POST /api/grn            ← record receipt against PO
GET  /api/grn/:id        ← view specific GRN
```

**Frontend:** `GRN` is currently a placeholder in the Purchase module — no dedicated slice yet.
**Action Required:** Frontend GRN page needs slice + these endpoints.

### 4.5 — QC Module

**Required endpoints:**
```
GET  /api/qc             ← list QC documents
POST /api/qc             ← create QC check
PATCH /api/qc/:id        ← approve/reject QC
```

**Frontend:** QC pages are placeholders. Slice needs to be created.

### 4.6 — Inventory

**Required endpoints (mostly exist ✅):**
```
GET   /api/store-inventory           ← fetchStockOverview
POST  /api/store-inventory/adjust    ← applyStockAdjustment
POST  /api/store-inventory/audit     ← applyStockAudit
GET   /api/reports/movement          ← fetchMovements
```

> [!IMPORTANT]
> **StockInPage** dispatches a custom thunk that directly calls `POST /api/store-inventory` (without `/adjust` path). Verify the backend actually serves that path OR fix the frontend to use `/adjust`.

### 4.7 — Dispatch

**Required endpoints (all exist ✅):**
```
GET   /api/dispatch
POST  /api/dispatch
PATCH /api/dispatch/:id/status
GET   /api/delivery-challans
POST  /api/delivery-challans
```

**Status Flow:** `PENDING → DISPATCHED → RECEIVED`
Each status change must trigger atomic stock deduction from source + credit to destination.

### 4.8 — Sales / POS (BillingPage)

**Required endpoints (all exist ✅):**
```
GET  /api/sales
POST /api/sales
GET  /api/sales/:id
GET  /api/sales/barcode/:barcode    ← Product search by barcode scan
POST /api/returns   (type: CUSTOMER_RETURN)
GET  /api/customers/phone/:phone    ← Customer lookup at POS
```

**Payload Contract:**
```json
{
  "customerId": "ObjectId | null",
  "storeId": "ObjectId",
  "cashierId": "ObjectId",
  "paymentMode": "CASH|CARD|UPI|WALLET",
  "products": [
    { "productId": "ObjectId", "quantity": 2, "price": 499,
      "appliedPrice": 499, "discount": 0, "total": 998 }
  ],
  "subTotal": 998,
  "totalTax": 0,
  "discount": 0,
  "grandTotal": 998,
  "loyaltyRedeemed": 0,
  "saleType": "RETAIL"
}
```

### 4.9 — Orders (Sale Orders, Packing Slip, Delivery Order)

**ALL MISSING — Must be created:**

```javascript
// New Router: /api/orders
GET    /api/orders/sales                ← fetchSaleOrders
POST   /api/orders/sales                ← addSaleOrder
PATCH  /api/orders/sales/:id            ← updateSaleOrder
POST   /api/orders/packing-slips        ← addPackingSlip
POST   /api/orders/delivery             ← addDeliveryOrder
```

**Mongoose Schema — SaleOrder:**
```javascript
{
  orderNumber: String,       // Auto-generated
  customerId: ObjectId,      // ref: Customer
  storeId: ObjectId,         // ref: Store
  items: [{
    productId: ObjectId,
    quantity: Number,
    rate: Number,
    discount: Number
  }],
  status: { type: String, enum: ['PENDING','CONFIRMED','DISPATCHED','DELIVERED','CANCELLED'] },
  expectedDelivery: Date,
  notes: String
}
```

> [!CAUTION]
> The backend has `backend/src/modules/workflow` but NO `orders` module. This entire module must be scaffolded. Check if `/api/delivery-challans` covers some of this, but Sale Order is a standalone requirement.

### 4.10 — CRM (Loyalty, Credit Notes)

**Critical Missing Endpoints:**

```javascript
// Loyalty Config
GET   /api/customers/loyalty           ← fetchLoyaltyConfig
PATCH /api/customers/loyalty           ← updateLoyaltyConfig

// Loyalty History
GET   /api/customers/loyalty/history/:id  ← fetchLoyaltyTransactions

// Credit Notes (NOT REGISTERED IN routes.js!)
GET   /api/credit-notes                ← fetchCreditNotes
POST  /api/credit-notes                ← addCreditNote
```

> [!WARNING]
> `/api/credit-notes` is not in `routes.js` at all even though the frontend calls it. A module (`creditNotes`) must be created and registered.

**Customer model must gain fields:** `loyaltyPoints`, `loyaltyTier`, `loyaltyTransactions[]`

**LoyaltyConfig Schema:**
```javascript
{
  pointsPerRupee: Number,       // e.g., 1 point per ₹10
  redeemValue: Number,          // e.g., 1 point = ₹0.25
  minRedeemPoints: Number,
  expiryDays: Number,
  isEnabled: Boolean
}
```

### 4.11 — Accounts

**Existing endpoints (✅):**
```
GET/POST  /api/accounts/bank-payment
GET/POST  /api/accounts/bank-receipt
```

**Missing for Cash Voucher + Generic Voucher (used in `CashReceiptVoucher.jsx`, `GenericVoucherForm.jsx`):**
```
POST /api/accounts/cash-receipt
POST /api/accounts/cash-payment
POST /api/accounts/journal
GET  /api/accounts/vouchers
```

### 4.12 — GST Module

**Existing (✅):** `/api/gst` GET/POST/PATCH/DELETE

**Missing — Tax Groups:**
```
GET   /api/gst/groups         ← TaxGroupPage
POST  /api/gst/groups
PATCH /api/gst/groups/:id
```

**GSTRSummary & InvoiceTaxReport** rely on `GET /api/reports/gst-summary` ✅ (exists).

### 4.13 — Reports Module

**Existing endpoints (✅):**
- `/reports/sales`, `/reports/stock`, `/reports/movement`
- `/reports/daily-sales`, `/reports/monthly-sales`
- `/reports/low-stock`, `/reports/returns`, `/reports/audit-logs`
- `/reports/ledger/:accountId`, `/reports/gst-summary`
- `/reports/purchase-register`, `/reports/trial-balance`
- `/reports/profit-loss`, `/reports/balance-sheet`, `/reports/stock-aging`

**Missing:**
```
GET /reports/customer       ← CustomerReportPage
GET /reports/vendor         ← VendorReportPage
GET /reports/age-analysis   ← AgeAnalysisPage
GET /reports/bank-book      ← BankBookPage
GET /reports/collection     ← CollectionReportPage
GET /reports/profit         ← ProfitReportPage (exists ✅)
```

---

## STEP 5: ERP Flow Validation

```
Purchase Order → Purchase (GRN) → QC → Warehouse Stock → Dispatch → Store → Sale → Accounting
```

| Step | Frontend Page | Backend API | Status |
|:---|:---|:---|:---|
| 1. Create PO | PurchaseOrderFormPage | POST /purchase-orders | ✅ |
| 2. Convert PO → Purchase Voucher | PurchaseFormPage (?orderId=) | POST /purchase + GET /purchase-orders/:id | ✅ |
| 3. GRN Creation | (Placeholder) | POST /grn | ⚠️ Placeholder |
| 4. QC Approval | (Placeholder) | PATCH /qc/:id | ⚠️ Placeholder |
| 5. Stock in Warehouse | StockOverviewPage | GET /store-inventory | ✅ |
| 6. Stock Transfer/Dispatch | DeliveryChallanForm | POST /dispatch | ✅ |
| 7. Status → DISPATCHED | DeliveryChallanPage | PATCH /dispatch/:id/status | ✅ |
| 8. Store Receives Stock | StockTransferPage (receive) | GET /store-inventory | ✅ |
| 9. POS Sale | BillingPage | POST /sales | ✅ |
| 10. Accounting Entry | BankPaymentPage/CashReceipt | POST /accounts/* | ⚠️ Partial |

> [!IMPORTANT]
> Steps 3 and 4 (GRN + QC) are currently placeholder pages. Until real slices are created the flow is broken at the factory-to-warehouse gate. Stock jumps directly from Purchase to Warehouse which bypasses quality control.

---

## STEP 6: Data Consistency Rules

1. **Backend is source of truth** — Frontend only stores fetched data in Redux. No local mutations without API confirmation.
2. **No direct stock manipulation** — All stock changes must go through: Purchase → GRN → Dispatch → Sale → Return.
3. **Document linking**: Every Sale must reference a `storeId`. Every PO must reference a `supplierId`. Every Dispatch must link back to a `purchaseId` or `dispatchId`.
4. **Normalization layer** must be updated for every new entity added.

---

## STEP 7: Hardcoded Data Needing API Replacement

| Component | Hardcoded Data | Required API |
|:---|:---|:---|
| `AppRoutes.jsx` SetupStatesPage | `[{ stateName: 'Maharashtra', stateCode: '27' }]` | `GET /api/setup/states` |
| `AppRoutes.jsx` SetupCityPage | `[{ cityName: 'Mumbai' }]` | `GET /api/setup/cities` |
| `PrintingPlaceholderPage` | `CASH RECIPET` dropdown | `GET /api/settings/print-templates` |
| `SetupGenericTablePage` | Empty table, no data fetching | Each should call entity-specific API |

---

## STEP 8: Error Handling Requirements Per Module

| Module | Required Error Messages |
|:---|:---|
| Purchase | "Supplier not found", "Invalid warehouse", "Duplicate invoice number", "Qty must be > 0" |
| Inventory/Dispatch | "Insufficient stock at source", "Cannot dispatch to same location", "GRN not approved" |
| Sales/POS | "Barcode not found", "Insufficient stock", "Payment amount mismatch", "Invalid coupon code" |
| CRM | "Customer not found", "Insufficient loyalty points", "Credit note already redeemed" |
| Accounts | "Debit/credit mismatch", "Account closed", "Insufficient balance in bank" |
| GRN/QC | "PO reference invalid", "QC already completed", "Cannot re-approve" |

---

## STEP 9: Priority Execution Plan

### Phase 1 — Critical Fixes (Broken Features) [HIGH PRIORITY]

| # | Task | Files to Change | Complexity |
|:---|:---|:---|:---|
| 1 | Fix duplicate route registrations in `routes.js` | `backend/src/routes.js` | 🟢 Low |
| 2 | Add `PATCH /:id` and `DELETE /:id` to customer routes | `customer.routes.js`, `customer.controller.js` | 🟢 Low |
| 3 | Create `/api/orders` module (SaleOrder, PackingSlip, DeliveryOrder) | New module: `orders/` | 🔴 High |
| 4 | Add loyalty endpoints to customer router (`/loyalty`, `/loyalty/history/:id`) | `customer.routes.js`, `customer.controller.js` | 🟡 Medium |
| 5 | Create `/api/credit-notes` module + register in routes.js | New module: `creditNotes/` | 🟡 Medium |
| 6 | Add `/api/gst/groups` sub-routes to GST router | `gst.routes.js`, `gst.controller.js` | 🟡 Medium |

### Phase 2 — Integration Completeness [MEDIUM PRIORITY]

| # | Task | Files to Change | Complexity |
|:---|:---|:---|:---|
| 7 | Scaffold GRN module with real CRUD (remove placeholder) | New module: `grn/` review + `GRNListPage.jsx` (to create) | 🔴 High |
| 8 | Scaffold QC module with approve/reject | `qc/` review + `QCPage.jsx` (to create) | 🔴 High |
| 9 | Add Cash Receipt/Payment + Journal voucher endpoints | `accounts.routes.js`, `accounts.controller.js` | 🟡 Medium |
| 10 | Add missing report endpoints (customer, vendor, bank-book, collection, age-analysis) | `report.routes.js`, `report.controller.js` | 🟡 Medium |
| 11 | Add `/auth/users?role=filter` support | `auth.routes.js`, `auth.controller.js` | 🟢 Low |
| 12 | Add barcode field auto-generation in `products.controller.js` bulk-import | `product.controller.js` | 🟢 Low |

### Phase 3 — Setup & Config Hardcode Removal [LOW PRIORITY]

| # | Task | Files to Change | Complexity |
|:---|:---|:---|:---|
| 13 | Add `/api/setup/states` and `/api/setup/cities` | New setup routes | 🟢 Low |
| 14 | Wire PrintingPlaceholderPage to real print-templates API | `AppRoutes.jsx` | 🟢 Low |

---

## STEP 10: Final Output — System Completeness

### Completeness by Module

| Module | Backend Exists | Frontend Connected | % Complete |
|:---|:---|:---|:---|
| Auth / Users | ✅ | ✅ | **90%** — missing DELETE user |
| Masters (Suppliers, Brands, Banks) | ✅ | ✅ | **95%** |
| Masters (Customers) | ⚠️ Partial | ✅ | **70%** — missing PATCH/DELETE |
| Products / Items | ✅ | ✅ | **85%** — barcode auto-gen unconfirmed |
| Purchase | ✅ | ✅ | **90%** — warehouseId/storeId mismatch risk |
| Purchase Orders | ✅ | ✅ | **90%** |
| GRN | ⚠️ Partial | ❌ Placeholder | **20%** |
| QC | ⚠️ Partial | ❌ Placeholder | **20%** |
| Inventory / Stock | ✅ | ✅ | **85%** — StockInPage path needs verify |
| Dispatch | ✅ | ✅ | **90%** |
| Sales / POS | ✅ | ✅ | **85%** — barcode scan flow unverified |
| Sale Orders | ❌ Missing | ✅ | **5%** |
| Packing Slip / Delivery Order | ❌ Missing | ✅ | **5%** |
| Pricing (Price Lists, Schemes, Coupons) | ✅ | ✅ | **90%** |
| GST Rates | ✅ | ✅ | **90%** |
| GST Groups | ❌ Missing | ✅ | **0%** |
| CRM / Loyalty | ❌ Missing | ✅ | **0%** |
| Credit Notes | ❌ Missing | ✅ | **0%** |
| Vouchers | ✅ | ✅ | **90%** |
| Accounts (Bank) | ✅ | ✅ | **80%** — JOURNAL missing |
| Accounts (Cash/Generic) | ❌ Missing | ✅ | **10%** |
| Reports (Core) | ✅ | ✅ | **85%** |
| Reports (Customer/Vendor/BankBook) | ❌ Partial | ✅ | **30%** |
| Settings (Company/Roles/NS/Prefs) | ✅ | ✅ | **95%** |

### Overall System Completeness

| Area | Score |
|:---|:---|
| Frontend Architecture | **95%** |
| Backend Coverage | **65%** |
| End-to-End Integration | **72%** |
| **Overall ERP Readiness** | **~74%** |

---

## Verification Plan

### Automated Verification
- All backend route files can be syntax-checked by running the server: `cd backend && npm run dev` and watching for startup errors.
- Each missing module endpoint should return a meaningful response (not 404): test with `curl http://localhost:5001/api/orders/sales -H "Authorization: Bearer <token>"` after implementation.

### Manual Verification (Browser)
1. **Masters** — Navigate to `/ho/masters/customers`. Verify Add/Edit/Delete buttons work.
2. **Purchase** — Navigate to `/ho/purchase/purchase-voucher/new`. Fill supplier, warehouse, add item, click Save. Verify toast + redirect.
3. **Sale Order** — Navigate to `/ho/orders/sale-order`. Verify list loads (currently broken — should show a proper loading/error state, not blank).
4. **Loyalty** — Navigate to `/ho/customers/loyalty-config`. Verify form loads (currently broken — check browser Network tab).
5. **Credit Notes** — Navigate to `/ho/customers/credit-notes`. Verify list loads.
6. **GST Groups** — Navigate to `/ho/gst/tax-group`. Verify the Add button works.
7. **Accounts Vouchers** — Navigate to `/ho/accounts`. Verify Cash Receipt Voucher form loads and submits.
8. **Reports** — Navigate to `/ho/reports`. Verify Sales Report, Stock Report, and Movement History load with real data.

> [!NOTE]
> Browser DevTools → Network tab should show **no 404 errors** on any page after fixing Phase 1 and Phase 2 issues.

