# Cloth ERP Frontend – Beginner User Manual (Outline)

Structured outline extracted from the **cloth-erp-frontend** codebase. Use this for documentation or onboarding.

---

## 1. Roles & Access

**Source:** `src/common/roleConfig.js`, `src/common/navigation.js`, `src/routes/AppRoutes.jsx`

### Roles
- **Admin** – Full access; base path `/admin`
- **Manager** – Same as Admin except **no Settings** menu; base path `/manager`
- **Staff** – Limited to Dashboard, Items, Inventory (Stock Overview only), Sales; base path `/staff`

### Admin – Menu & Pages
| Menu | Route path | Sub-pages / Notes |
|------|------------|-------------------|
| Dashboard | `/admin` or `/admin/` | Dashboard home |
| Masters | `/admin/masters` | Redirects to `/admin/masters/suppliers` |
| | `/admin/masters/suppliers` | Suppliers |
| | `/admin/masters/customers` | Customers (master) |
| | `/admin/masters/account-groups` | Account Groups |
| | `/admin/masters/warehouses` | Warehouses |
| | `/admin/masters/brands` | Brands |
| | `/admin/masters/item-groups` | Item Groups |
| | `/admin/masters/salesmen` | Salesmen |
| | `/admin/masters/banks` | Bank Accounts |
| Items | `/admin/items` | Item list |
| | `/admin/items/new` | New item |
| | `/admin/items/:id/edit` | Edit item |
| Inventory | `/admin/inventory` | Redirects to stock-overview |
| | `/admin/inventory/stock-overview` | Stock Overview |
| | `/admin/inventory/transfer` | Transfer |
| | `/admin/inventory/audit` | Audit |
| | `/admin/inventory/adjustment` | Adjustment |
| | `/admin/inventory/movements` | Movements |
| Purchase | `/admin/purchase` | Purchase Bills list |
| | `/admin/purchase/new` | New Purchase |
| | `/admin/purchase/:id` | Edit Purchase |
| | `/admin/purchase/:id/return` | Purchase Return |
| Orders | `/admin/orders` | Sale Orders |
| | `/admin/orders/new` | New Sale Order |
| | `/admin/orders/:id/edit` | Edit Sale Order |
| | `/admin/orders/packing` | Packing Slips |
| | `/admin/orders/delivery` | Delivery Orders |
| Sales | `/admin/sales` | Sales Invoices list |
| | `/admin/sales/new` | New Sale |
| | `/admin/sales/:id` | View/Edit Sale |
| | `/admin/sales/:id/return` | Sales Return |
| Pricing | `/admin/pricing` | Redirects to price-lists |
| | `/admin/pricing/price-lists` | Price Lists |
| | `/admin/pricing/price-lists/new` | New Price List |
| | `/admin/pricing/price-lists/:id/edit` | Edit Price List |
| | `/admin/pricing/schemes` | Schemes |
| | `/admin/pricing/schemes/new` | New Scheme |
| | `/admin/pricing/schemes/:id/edit` | Edit Scheme |
| | `/admin/pricing/coupons` | Coupons |
| Customer Rewards | `/admin/customers` | Redirects to rewards |
| | `/admin/customers/rewards` | Rewards |
| | `/admin/customers/loyalty-config` | Loyalty Config |
| | `/admin/customers/vouchers` | Vouchers |
| | `/admin/customers/vouchers/new` | New Voucher |
| | `/admin/customers/credit-notes` | Credit Notes |
| Accounts | `/admin/accounts` | Overview (cards to Bank Payment/Receipt) |
| | `/admin/accounts/bank-payment` | Bank Payment |
| | `/admin/accounts/bank-receipt` | Bank Receipt |
| Reports | `/admin/reports` | Reports dashboard (Overview) |
| | `/admin/reports/sales` | Sales report |
| | … (all 11 report types; see §13) | |
| GST | `/admin/gst` | Redirects to tax-rates |
| | `/admin/gst/tax-rates` | Tax Rates |
| | `/admin/gst/tax-groups` | Tax Groups |
| | `/admin/gst/invoice-report` | Invoice Tax Report |
| | `/admin/gst/gstr-summary` | GSTR Summary |
| Settings | `/admin/settings` | Redirects to company |
| | `/admin/settings/company` | Company Profile |
| | `/admin/settings/users` | Users |
| | `/admin/settings/roles` | Roles |
| | `/admin/settings/number-series` | Number Series |
| | `/admin/settings/preferences` | Preferences |
| | `/admin/settings/purchase-config` | Purchase Config |
| | `/admin/settings/print-templates` | Print Templates |
| | `/admin/settings/audit-log` | Audit Log |

### Manager
- Same routes as Admin **except** no **Settings** in main nav (`navigationItems` filtered: `path !== '/settings'`). All other sections (Masters, Items, Inventory, Purchase, Orders, Sales, Pricing, Customer Rewards, Accounts, Reports, GST) are available under `/manager/...`.

### Staff
- **Main nav only:** Dashboard (`/`), Items (`/items`), Inventory (`/inventory`), Sales (`/sales`).
- **Inventory children:** Stock Overview only (`/inventory/stock-overview`).
- **Sales children:** Sales Invoices (`/sales`), New Sale (`/sales/new`).
- No Masters, Purchase, Orders, Pricing, Customer Rewards, Accounts, Reports, GST, or Settings.

---

## 2. Login

**Source:** `src/pages/auth/LoginPage.jsx`, `src/services/authService.js`

### Steps
1. Open app; unauthenticated users are sent to login.
2. Optional: go to `/login` or `/login/:role` (e.g. `/login/admin`, `/login/manager`, `/login/staff`) to see role chip.
3. Enter **Email** and **Password**.
4. Click **Login** (button shows "Signing In..." while loading).
5. On success: redirect to role base path (`/admin`, `/manager`, or `/staff`) or to the previously intended path if it was stored (e.g. after session expiry).
6. On failure: error alert "Invalid credentials. Use one of the mock users." (and any message from authService).

### Mock users (authService)
| Name         | Email                 | Password    | Role    |
|-------------|------------------------|-------------|---------|
| ERP Admin   | admin@clotherp.com     | password123 | Admin   |
| Store Manager | manager@clotherp.com | password123 | Manager |
| Store Staff | staff@clotherp.com     | password123 | Staff   |

- Login is **client-side mock**: same password for all; role is determined by email; token is a mock JWT.

---

## 3. Dashboard

**Source:** `src/pages/dashboard/DashboardHome.jsx`, `QuickActions.jsx`

### KPIs (top row)
- **Total Sales** – Sum of sales records (net payable / gross) for "this period" (all loaded data).
- **Total Purchase** – Sum of purchase records (net/gross amount).
- **Stock Items** – Count of stock rows (SKU variants).
- **Low Stock** – Count of stock rows where quantity ≤ low-stock threshold (from **Settings → Preferences**, default 10).

### Widgets
- **Sales Chart** – Last 7 days, day-wise sales total; labels = weekday short (e.g. Mon, Tue).
- **Low Stock Alert** – List of items (id, itemName, sku, quantity) at or below threshold; links to Stock Overview.
- **Quick Actions** – Buttons that link to:
  - **New Sale** → `/sales/new`
  - **New Purchase** → `/purchase/new`
  - **Stock Overview** → `/inventory/stock-overview`
  - **Reports** → `/reports`
- **Staff** sees only **New Sale** and **Stock Overview** in Quick Actions.
- **Recent Sales Table** – Recent sales records (from Redux).

---

## 4. Masters

**Source:** `src/modules/masters/*` (ListPage + FormDialog per entity), `MasterListPage.jsx`, `masterNavigation.js`

All master list pages use: **Search** (by configured keys), **Add** button to open form dialog, table with **Edit** (pencil) and **Delete** (trash) icons. Delete uses a confirmation dialog ("Delete [Entity]?"). Routes under `/masters/...` (e.g. `/admin/masters/suppliers`).

### 4.1 Suppliers
- **Route:** `/masters/suppliers`
- **Purpose:** Manage vendors for procurement.
- **Add:** Button **Add Supplier**; dialog **Add Supplier** / **Edit Supplier**; submit **Create Supplier** / **Update Supplier**.
- **Form fields:** Supplier Name*, Supplier Code*, GST Number*, Phone*, Email*, Address* (multiline), Group (Area/Week) [select, optional], Bank Details*, Status* (Active/Inactive).

### 4.2 Customers (Master)
- **Route:** `/masters/customers`
- **Purpose:** Customer master for sales and rewards.
- **Form fields:** Customer Name*, Mobile Number*, Email*, Address*, GST Number, Group (Area/Week), Sale Nature (Retail/Wholesale/Export), Loyalty Points* (number, default 0), Credit Limit* (number, default 0), Status* (Active/Inactive).

### 4.3 Account Groups
- **Route:** `/masters/account-groups`
- **Form fields:** Group Name*, Group Type* (Area / Week / Custom), Status* (Active/Inactive).

### 4.4 Warehouses
- **Route:** `/masters/warehouses`
- **Form fields:** Warehouse Name*, Code*, Location*, Manager Name*, Contact Number*, Status* (Active/Inactive).

### 4.5 Brands
- **Route:** `/masters/brands`
- **Form fields:** Brand Name*, Short Name*, Description* (multiline), Status* (Active/Inactive).

### 4.6 Item Groups
- **Route:** `/masters/item-groups`
- **Form fields:** Group Name*, Type* (Category, Gender, Season, Fabric, Collection), Parent Group, Description* (multiline), Status* (Active/Inactive).

### 4.7 Salesmen
- **Route:** `/masters/salesmen`
- **Form fields:** Name*, Code*, Phone*, Email*, Commission Rate (%)* (number, default 0), Status* (Active/Inactive).

### 4.8 Bank Accounts (Banks)
- **Route:** `/masters/banks`
- **Form fields:** Bank Name*, Account Number*, Branch*, IFSC Code* (no Status in form).

---

## 5. Items

**Source:** `src/modules/items/ItemListPage.jsx`, `ItemFormPage.jsx`, `VariantTable.jsx`

### List (ItemListPage)
- **Route:** `/items` (e.g. `/admin/items`).
- **Purpose:** Manage parent styles and variant-level pricing/stock.
- **Actions:** **Add Item** → `/items/new`; search by name/code; filters: Brand, Category (item group); table: Item Name, Style Code, Brand, Category, Variants count, Total Stock, Status; **View** (eye), **Edit** (pencil), **Delete** (trash with confirmation). Pagination (5, 8, 10, 20).

### Add/Edit (ItemFormPage)
- **Routes:** `/items/new`, `/items/:id/edit`.
- **Buttons:** **Back**, **Save Item**; **Cancel** at bottom.
- **Sections & key fields:**
  - **Basic:** Item Name*, Style Code*, Brand* (select), Category/Item Group* (select), Description, Status (Active/Inactive).
  - **Apparel attributes:** Gender, Season, Fabric, Fabric Type.
  - **Media:** Upload Image, Remove; optional image preview.
  - **Variants:** VariantTable – add/edit/delete variants; at least one variant required to save.

### Variants (VariantTable)
- **Variant fields:** Size (e.g. XS–XXL), Color, SKU (auto from style code + size + color if enabled), Cost Price, Selling Price, MRP, Stock, Status (Active/Inactive).
- **Actions:** Add variant (dialog), Edit, Delete; optional bulk "Generate variants" from selected sizes/colors.

---

## 6. Inventory

**Source:** `src/modules/inventory/*`

### 6.1 Stock Overview
- **Route:** `/inventory/stock-overview`
- **Purpose:** View current stock by warehouse, brand, category; low-stock highlight.
- **Filters:** Search (item name, SKU, style code, lot), Warehouse, Brand, Category. Pagination. Columns typically include item/SKU, warehouse, quantity, reserved, brand, category, etc.

### 6.2 Transfer
- **Route:** `/inventory/transfer`
- **Purpose:** Move stock between warehouses.
- **Main fields:** From Warehouse*, To Warehouse*, Transfer Date, Remarks. Add lines (variant picker from source warehouse available stock); quantity per line. **Send** to execute. Optional Excel import for transfer lines.

### 6.3 Audit
- **Route:** `/inventory/audit`
- **Purpose:** Record physical count and reconcile with system quantity.
- **Main fields:** Warehouse*, Brand/Category filters, Audit Date. Table shows system qty vs physical qty (editable); difference calculated. **Save / Apply** to post audit and adjust stock.

### 6.4 Adjustment
- **Route:** `/inventory/adjustment`
- **Purpose:** Increase or decrease stock for a warehouse (write-off, found, correction).
- **Main fields:** Warehouse*, Adjustment Type (Increase/Decrease), Reason, Date. Lines: variant picker, adjustment quantity. **Save** to apply.

### 6.5 Movements
- **Route:** `/inventory/movements`
- **Purpose:** View history of stock movements.
- **Filters:** Search (item/SKU/style), Warehouse, Movement Type (Purchase, Sale, Sale Return, Transfer, Adjustment, Audit), Date From/To. Table shows type, date, item, SKU, warehouse, quantity change, reference.

---

## 7. Purchase

**Source:** `src/modules/purchase/PurchaseListPage.jsx`, `PurchaseFormPage.jsx`, `PurchaseReturnPage.jsx`, `BarcodePrintDialog.jsx`

### List
- **Route:** `/purchase` (Purchase Bills).
- **Purpose:** Manage supplier purchase entries and stock inward.
- **Actions:** **Add Purchase** → `/purchase/new`; search; filters: Warehouse, Date From/To. Table: Bill #, Supplier, Warehouse, Date, Totals, etc.; **View** (detail dialog), **Edit**, **Return** (→ Purchase Return), **Barcode Print** (opens Barcode Print dialog).

### New / Edit (PurchaseFormPage)
- **Routes:** `/purchase/new`, `/purchase/:id`
- **Header form:** Supplier*, Bill Number*, Bill Date*, Warehouse*, Purchase Type, Remarks, Other Charges.
- **Line items:** Add by variant (from items); each line: quantity, rate, discount %, tax %, lot (optional), computed amount. Totals: gross, discount, tax, other charges, net. **Save** (create/update); optional Excel import for lines.

### Purchase Return
- **Route:** `/purchase/:id/return`
- **Purpose:** Return quantities against a purchase bill.
- **Form:** Return Date, Remarks. Table from original bill with purchased qty, remaining qty (after prior returns), return qty to enter. **Save** to post return and update stock.

### Barcode Print
- **Trigger:** From purchase list/detail – **Barcode Print** (or print icon).
- **Purpose:** Print barcode labels for purchase lines; each line with quantity N can generate N labels.
- **Dialog:** Select lines (checkboxes), then **Print**; opens new window with printable labels (SKU, item name, size, color).

---

## 8. Orders

**Source:** `src/modules/orders/SaleOrderListPage.jsx`, `SaleOrderFormPage.jsx`, `PackingSlipPage.jsx`, `DeliveryOrderPage.jsx`

### Sale Orders list
- **Route:** `/orders` (Sale Orders).
- **Purpose:** Manage wholesale sale orders from confirmation to delivery.
- **Actions:** **New Sale Order** → `/orders/new`; search; filters: Status, Date From/To. Table: Order #, Customer, Date, Status, Net Amount, etc.; **Edit** → `/orders/:id/edit`.

### New / Edit Sale Order
- **Routes:** `/orders/new`, `/orders/:id/edit`
- **Main fields:** Date, Customer*, Price List (optional), Salesman (optional). Line items: variant picker; quantity, rate, discount %, tax % (default from GST slab/config). Totals calculated. **Save** to create/update. Rates can come from price lists by customer/group and item category.

### Packing Slips
- **Route:** `/orders/packing`
- **Purpose:** Create packing slip from a pending/confirmed sale order; allocate stock from a warehouse (box prefix, allocations per order line). Saves packing slip and can update order status.

### Delivery Orders
- **Route:** `/orders/delivery`
- **Purpose:** Create delivery order from a **packed** sale order (select packing slip). DO Date, Remarks. **Save** to create delivery order; order status progresses (e.g. to "Dispatched" or "Delivered" as per app logic).

---

## 9. Sales

**Source:** `src/modules/sales/SalesListPage.jsx`, `BillingPage.jsx`, `SalesReturnPage.jsx`, `PaymentDialog.jsx`, `LoyaltyRedeemDialog.jsx`

### Sales list
- **Route:** `/sales` (Sales Invoices).
- **Purpose:** Review retail invoices, payment status, and returns.
- **Actions:** **New Sale** → `/sales/new`; search; filters: Payment Status (Paid/Partial), Date. Table: Invoice #, Customer, Date, Warehouse, Payment Status, Total, etc.; **View** (detail dialog), **Return** → Sales Return.

### Billing (New / Edit)
- **Routes:** `/sales/new`, `/sales/:id`
- **Header:** Bill Date, Warehouse, Salesman, Customer (search by mobile or select); optional Billing mode: Manual entry or "From Delivery Order" (then select DO to load lines). Bill discount; Loyalty redeemed (opens Loyalty Redeem dialog); Coupon code (apply); optional Credit Note to apply.
- **Line items:** Add by variant (or barcode) or load from DO; quantity, rate, discount %, tax %. Schemes can auto-apply (discount/flat/buy-x-get-y). Totals: gross, line discount, bill discount, coupon, scheme discount, tax, loyalty redeemed, **net payable**.
- **Payment:** **Pay** opens **PaymentDialog** – Payment Mode (Cash, Card, UPI, Gift Voucher, Split); amount; for Split: cash/card/UPI breakdown; optional Gift Voucher code. On confirm: payment saved, invoice marked Paid/Partial, loyalty points earned (if configured), voucher/coupon usage updated.

### Sales Return
- **Route:** `/sales/:id/return`
- **Purpose:** Return items against an invoice; refund or exchange.
- **Form:** Return type (refund/exchange). Table from original sale: variant, sold qty, already returned, return qty to enter. For exchange: add exchange lines (variant + qty). **Save** to post return, update stock, and optionally create credit note.

### Loyalty & Voucher (Billing)
- **Loyalty:** Loyalty Redeem dialog: redeem points against bill (within config limits).
- **Voucher:** In PaymentDialog – apply gift voucher by code; reduces amount to pay.

---

## 10. Pricing

**Source:** `src/modules/pricing/PriceListPage.jsx`, `PriceListFormPage.jsx`, `SchemeListPage.jsx`, `SchemeFormPage.jsx`, `CouponPage.jsx`

### Price Lists
- **Route:** `/pricing/price-lists`. **New:** `/pricing/price-lists/new`; **Edit:** `/pricing/price-lists/:id/edit`.
- **Purpose:** Define selling prices by variant (fixed, discount on MRP %, or markup on cost %). Applicability: All Customers / Selected Customers / Customer Group; All Items / Selected Items / Item Group. Valid From/To, Status. **Rules:** per-variant rows with pricing method and value (fixed price, discount %, or markup %).

### Schemes
- **Route:** `/pricing/schemes`. **New:** `/pricing/schemes/new`; **Edit:** `/pricing/schemes/:id/edit`.
- **Purpose:** Promotions: Percentage Discount, Flat Discount, Buy X Get Y, Free Gift. Applicability: Item, Item Group, Brand, or Company. Valid From/To, Status. Scheme type-specific fields (e.g. min qty, free qty, discount %).

### Coupons
- **Route:** `/pricing/coupons`
- **Purpose:** Coupon codes for percentage or flat discount on billing.
- **Create/Edit (dialog or inline):** Code* (optional random generator), Type (Percentage / Amount), Value, Valid From, Valid To, Status. Bulk create: by count or range, prefix, amount, issue/expiry. **Apply** at billing (BillingPage) by entering coupon code.

---

## 11. Customers (Rewards)

**Source:** `src/modules/customers/*`

### Loyalty Config
- **Route:** `/customers/loyalty-config`
- **Purpose:** Configure earn/redeem rules. **Fields:** Earn Rate (points per amount), Earn Per Amount (₹), Min Redeem Points, Point Value (₹ per point), Expiry Period (days), Status. **Save** to update config.

### Vouchers
- **List:** `/customers/vouchers` – View/search vouchers; filter by status (Active, Redeemed, Expired); **Redeem** for Active. **New:** `/customers/vouchers/new` (Issue Voucher).
- **Form (single):** Code (optional generate), Amount, Issue Date, Expiry Date, Status, Customer (optional). Bulk: count or range, prefix, amount, issue/expiry dates.

### Credit Notes
- **Route:** `/customers/credit-notes`
- **Purpose:** Track customer credit (e.g. from returns). List/summary by customer (credit balance, total available, used). Add credit note (customer, amount, reason); use against future sales (select in BillingPage).

### Rewards (overview)
- **Route:** `/customers/rewards`
- **Purpose:** View loyalty summary per customer: total earned, redeemed, available points, last activity. Transaction history (earned/redeemed/adjusted) per customer.

---

## 12. Accounts

**Source:** `src/modules/accounts/AccountsDashboard.jsx`, `BankPaymentPage.jsx`, `BankReceiptPage.jsx`

### Overview
- **Route:** `/accounts`
- **Purpose:** Landing with two cards: **Bank Payment**, **Bank Receipt**.

### Bank Payment
- **Route:** `/accounts/bank-payment`
- **Purpose:** Record supplier cheque payment; allocate against pending purchase bills.
- **Form:** Bank Account*, Supplier*, Date, Cheque No, Amount, Narration. Table of pending purchase bills for selected supplier: select bills and allocation amount per bill (cannot exceed payment amount). **Back**, **Save**.

### Bank Receipt
- **Route:** `/accounts/bank-receipt`
- **Purpose:** Record customer cheque receipt; allocate against pending sale bills.
- **Form:** Bank Account*, Customer*, Date, Cheque No, Amount, Narration. Table of pending sale bills for selected customer: select bills and allocation amount. **Back**, **Save**.

---

## 13. Reports

**Source:** `src/modules/reports/ReportsDashboard.jsx`, `*ReportPage.jsx`, `ReportFilterPanel.jsx`, `ReportExportButton.jsx`

**Route:** `/reports` = Overview (grid of 11 report cards). Each report has its own route (e.g. `/reports/sales`).

| # | Report | Route | What it shows | Main filters | Export |
|---|--------|--------|----------------|--------------|--------|
| 1 | Overview | `/reports` | Cards linking to all reports | — | — |
| 2 | Sales | `/reports/sales` | Sales invoices, revenue, payment; view modes: summary/detail/account-wise/size-wise/group-wise | Date From/To, Warehouse, Customer, Payment Status, Salesman, Category | Export (CSV), Copy |
| 3 | Purchase | `/reports/purchase` | Purchase bills, costs, supplier transactions | Date, Warehouse, Supplier, etc. | Export, Copy |
| 4 | Ledger | `/reports/ledger` | Account-wise ledger: debit, credit, running balance | Date, Account | Export, Copy |
| 5 | Bank Book | `/reports/bank-book` | Bank-wise receipts and payments, running balance | Date, Bank | Export, Copy |
| 6 | Collection | `/reports/collection` | Cash and cheque collections (sales + bank receipts) | Date range | Export, Copy |
| 7 | Stock | `/reports/stock` | Current inventory, movements, stock value | Date, Warehouse, Brand, Category | Export, Copy |
| 8 | Profit | `/reports/profit` | Margin analysis, cost vs revenue, profit % | Date, Warehouse, etc. | Export, Copy |
| 9 | Customers | `/reports/customers` | Customer activity, purchase history, loyalty | Date, Customer | Export, Copy |
| 10 | Vendors | `/reports/vendors` | Supplier purchases, amounts, outstanding | Date, Supplier | Export, Copy |
| 11 | Movement & Alerts | `/reports/movement` | Fast-moving and slow-moving items | Date, Warehouse, etc. | Export, Copy |
| 12 | Age Analysis | `/reports/age-analysis` | Stock age distribution (0–10, 10–30, 30–60, 60–90, 90+ days) | Warehouse, etc. | Export, Copy |

**Common filters (ReportFilterPanel):** Date From/To, Warehouse, Brand, Category, Customer, Supplier, Salesman, Payment Status (where applicable). **Export:** CSV download and/or Copy to clipboard (ReportExportButton).

---

## 14. GST

**Source:** `src/modules/gst/*`

### Tax Rates
- **Route:** `/gst/tax-rates`
- **Purpose:** Define GST rates (CGST + SGST + IGST). **Fields:** Name*, CGST %, SGST %, IGST %, Effective From, Status. Add/Edit dialog; toggle Active/Inactive.

### Tax Groups
- **Route:** `/gst/tax-groups`
- **Purpose:** Map item groups/categories to a tax rate. **Fields:** Name*, Tax Rate (select), Category/description, Status. Add/Edit; toggle Active/Inactive.

### Invoice Tax Report
- **Route:** `/gst/invoice-report`
- **Purpose:** Invoice-wise tax summary: Invoice #, Date, Customer, Taxable Value, CGST, SGST, IGST, Total Tax, Net Amount. Filters: Date From/To, Customer. Search. Export/Copy.

### GSTR Summary
- **Route:** `/gst/gstr-summary`
- **Purpose:** Outward supplies (sales) and inward supplies (purchases) summary for a date range; HSN-wise aggregation; export GSTR-1 / GSTR-3B JSON; optional GSTR-2A upload/reconcile. Date From/To; **Export** dialog for JSON download.

---

## 15. Settings

**Source:** `src/modules/settings/*`, routes under `/settings/...`

### Company Profile
- **Route:** `/settings/company`
- **Fields:** Business Name, Legal Name, GSTIN, PAN, Address (Line1, City, State, Pincode), Phone, Email, Financial Year Start. **Save**.

### Users
- **Route:** `/settings/users`
- **Purpose:** Manage system users and roles. **Add User** / Edit: Name, Email, Mobile, Role (select), Status. Table: Name, Email, Mobile, Role, Status, Actions.

### Roles
- **Route:** `/settings/roles`
- **Purpose:** Define roles and permissions. **Add Role** / Edit: Role Name, Description, Status. Table: Role Name, Description, Status, Actions.

### Number Series
- **Route:** `/settings/number-series`
- **Purpose:** Document numbering for invoices, bills, etc. **Add Series** / Edit: Document Type, Prefix, Next Number, Reset Period, Status. Table: Document Type, Prefix, Next Number, Reset Period, Status, Actions.

### Preferences
- **Route:** `/settings/preferences`
- **Fields:** Currency, Date Format, Time Format (12h/24h), Low Stock Threshold, Qty Decimals, Amount Decimals, Show GST on Invoice (switch), Auto Apply Loyalty (switch). **Save**. Low stock threshold drives Dashboard and Stock Overview alerts.

### Purchase Config
- **Route:** `/settings/purchase-config`
- **Purpose:** Purchase voucher behavior. **Fields:** Carry Forward Pack Size (switch), Default Tax %, GST Slab Enabled (switch), GST Slab Threshold (₹), Below Threshold Tax %, Above Threshold Tax %. **Save**. Used in purchase/sales for default tax and slab-based rate.

### Print Templates
- **Route:** `/settings/print-templates`
- **Purpose:** Configure invoice and document print layouts. **Add Template** / Edit: Name, Document Type, Layout, Status. Table: Name, Document Type, Layout, Status, Actions.

### Audit Log
- **Route:** `/settings/audit-log`
- **Purpose:** Activity history across modules. Table: Date & Time, User, Action, Module, Reference, Details. Search by user, action, module, reference, details. Pagination.

---

## Route path summary (role-prefixed)

- **Admin:** All paths under `/admin/...` (e.g. `/admin/masters/suppliers`, `/admin/sales/new`).
- **Manager:** Same under `/manager/...` (no `/manager/settings`).
- **Staff:** Only `/staff`, `/staff/items`, `/staff/items/new`, `/staff/items/:id/edit`, `/staff/inventory`, `/staff/inventory/stock-overview`, `/staff/sales`, `/staff/sales/new`, `/staff/sales/:id`.

Button labels and dialog titles in this outline match the code (e.g. "Add Supplier", "Create Supplier", "Edit Sale Order"). For exact UI strings, refer to the components listed in each section.
