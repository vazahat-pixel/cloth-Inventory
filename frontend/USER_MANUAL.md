# Cloth ERP – User Manual (Beginners)

A step-by-step guide to operating the Cloth ERP system. This manual is written for new users and covers every main screen and workflow.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Dashboard](#3-dashboard)
4. [Masters](#4-masters)
5. [Items](#5-items)
6. [Inventory](#6-inventory)
7. [Purchase](#7-purchase)
8. [Orders](#8-orders)
9. [Sales](#9-sales)
10. [Pricing](#10-pricing)
11. [Customer Rewards](#11-customer-rewards)
12. [Accounts](#12-accounts)
13. [Reports](#13-reports)
14. [GST](#14-gst)
15. [Settings](#15-settings-admin-only)
16. [Quick Reference](#16-quick-reference)
17. [Glossary](#17-glossary)

---

## 1. Introduction

**Cloth ERP** is a web-based system for managing:

- **Masters** – Suppliers, customers, warehouses, brands, and other base data  
- **Items** – Products (styles) and their variants (size/color) with prices and stock  
- **Inventory** – Stock levels, transfers, audits, and adjustments  
- **Purchase** – Buying from suppliers and recording stock inward  
- **Orders** – Sale orders, packing slips, and delivery orders  
- **Sales** – Invoicing customers, payments, returns, and loyalty  
- **Pricing** – Price lists, schemes, and coupons  
- **Customer Rewards** – Loyalty points, vouchers, and credit notes  
- **Accounts** – Bank payments and receipts  
- **Reports** – Sales, purchase, stock, profit, and other reports  
- **GST** – Tax rates, groups, and tax reports  
- **Settings** – Company profile, users, preferences (Admin only)

**How to use this manual**

- **Roles:** You log in as **Admin**, **Manager**, or **Staff**. Your role decides which menus and pages you see. The manual notes when a feature is for specific roles.
- **Paths:** Screens are under `/admin`, `/manager`, or `/staff` (e.g. Admin: **Masters → Suppliers** opens `/admin/masters/suppliers`). Manager uses `/manager/...`, Staff uses `/staff/...`.
- **Step-by-step:** For each screen we describe what it does, how to open it, and how to perform the main actions.

---

## 2. Getting Started

### 2.1 Logging In

1. Open the application in your browser.
2. If you are not logged in, you will be taken to the **Login** page.
3. Enter your **Email** and **Password**.
4. Click **Login**. The button will show **Signing In...** while the system checks your details.
5. After a successful login you are taken to your **Dashboard** (Admin to `/admin`, Manager to `/manager`, Staff to `/staff`).
6. If login fails, an error message appears (e.g. “Invalid credentials. Use one of the mock users.”). You can dismiss it with the ✕ on the alert.

**Test (demo) users**

| Role     | Email                 | Password    |
|----------|----------------------|-------------|
| Admin    | admin@clotherp.com    | password123 |
| Manager  | manager@clotherp.com  | password123 |
| Staff    | staff@clotherp.com   | password123 |

**Tip:** You can open role-specific login URLs: `/login/admin`, `/login/manager`, `/login/staff` to see the role label on the login box.

---

### 2.2 Understanding Your Role

- **Admin** – Full access: Dashboard, Masters, Items, Inventory, Purchase, Orders, Sales, Pricing, Customer Rewards, Accounts, Reports, GST, and **Settings**.
- **Manager** – Same as Admin **except** no **Settings** menu. All other sections are available under `/manager/...`.
- **Staff** – Limited access:
  - **Dashboard**
  - **Items** (list, add, edit)
  - **Inventory** → **Stock Overview** only
  - **Sales** → Sales list, **New Sale**, and view/edit a sale

Staff cannot open Masters, Purchase, Orders, Pricing, Customer Rewards, Accounts, Reports, GST, or Settings.

---

### 2.3 Interface Overview

After login you see:

- **Left sidebar** – Main menu (Dashboard, Masters, Items, etc.). Click a menu to expand it and see sub-menus (e.g. Masters → Suppliers, Customers).
- **Top bar** – Page title and any top-level actions (e.g. logout).
- **Main area** – The current page (lists, forms, reports).

Use the sidebar to move between sections. The current page is highlighted in the menu.

---

## 3. Dashboard

**Path:** Dashboard (first item in sidebar) → opens `/admin`, `/manager`, or `/staff` (home).

**Purpose:** A quick overview of sales, purchases, stock, and low stock.

### What You See

1. **Four KPI cards (top row)**
   - **Total Sales** – Sum of all sales (net/gross) in the system for the current data.
   - **Total Purchase** – Sum of all purchase amounts.
   - **Stock Items** – Number of SKU variants in stock.
   - **Low Stock** – Number of items at or below the low-stock threshold (set in **Settings → Preferences**; default 10).

2. **Sales Chart** – Bar chart of sales for the last 7 days (by weekday).

3. **Low Stock Alert** – List of items that are low on stock (name, SKU, quantity). You can use this to open **Stock Overview** and refill or reorder.

4. **Quick Actions** – Shortcut buttons:
   - **New Sale** – Open the billing screen to create an invoice.
   - **New Purchase** – Create a new purchase bill.
   - **Stock Overview** – View current stock.
   - **Reports** – Open the reports hub.  
   *Staff* sees only **New Sale** and **Stock Overview**.

5. **Recent Sales Table** – List of recent sales (invoice number, customer, date, amount, etc.).

**Tip:** Use Quick Actions to jump straight to common tasks without using the sidebar.

---

## 4. Masters

Masters are the base data used across the system: suppliers, customers, warehouses, brands, etc. All master list pages work in a similar way:

- **Search** – Type in the search box to filter the list (by name, code, phone, etc. depending on the master).
- **Add** – Click the main **Add…** button to open a form and create a new record.
- **Edit** – Click the pencil (edit) icon on a row to open the same form and update that record.
- **Delete** – Click the trash icon; a confirmation dialog appears. Confirm to delete.

**Path:** Sidebar → **Masters** → then choose the sub-menu (Suppliers, Customers, etc.).  
Example: **Masters → Suppliers** = `/admin/masters/suppliers` (or `/manager/masters/suppliers` for Manager).

---

### 4.1 Suppliers

**Path:** Masters → **Suppliers**.

**Purpose:** Manage vendor/supplier details used when creating purchase bills.

**How to add a supplier**

1. Click **Add Supplier**.
2. Fill in the form (fields marked * are typically required):
   - **Supplier Name***, **Supplier Code***, **GST Number***, **Phone***, **Email***, **Address*** (multiline).
   - **Group** – Optional (Area/Week from Account Groups).
   - **Bank Details***, **Status*** (Active/Inactive).
3. Click **Create Supplier** (or **Update Supplier** if editing).

**How to edit or delete**

- **Edit:** Click the pencil icon on the row → change fields → **Update Supplier**.
- **Delete:** Click the trash icon → confirm in the dialog.

---

### 4.2 Customers (Master)

**Path:** Masters → **Customers**.

**Purpose:** Customer master data used in sales, rewards, and reports. This is different from “Customer Rewards” (loyalty/vouchers).

**Main fields**

- **Customer Name***, **Mobile Number***, **Email***, **Address***, **GST Number** (optional).
- **Group** (Area/Week), **Sale Nature** (Retail/Wholesale/Export).
- **Loyalty Points*** (default 0), **Credit Limit*** (default 0), **Status*** (Active/Inactive).

Use **Add Customer** / **Edit** (pencil) / **Delete** (trash) as in other masters.

---

### 4.3 Account Groups

**Path:** Masters → **Account Groups**.

**Purpose:** Group suppliers or customers (e.g. by area or week) for reporting and filters.

**Fields:** **Group Name***, **Group Type*** (Area / Week / Custom), **Status*** (Active/Inactive).

---

### 4.4 Warehouses

**Path:** Masters → **Warehouses**.

**Purpose:** Define storage locations. Used in purchase, sales, stock overview, transfers, and reports.

**Fields:** **Warehouse Name***, **Code***, **Location***, **Manager Name***, **Contact Number***, **Status*** (Active/Inactive).

---

### 4.5 Brands

**Path:** Masters → **Brands**.

**Purpose:** Brand names attached to items; used in item form and filters (e.g. Items, Stock Overview, Reports).

**Fields:** **Brand Name***, **Short Name***, **Description*** (multiline), **Status*** (Active/Inactive).

---

### 4.6 Item Groups

**Path:** Masters → **Item Groups**.

**Purpose:** Categories for items (e.g. Category, Gender, Season, Fabric, Collection). Used in items and pricing.

**Fields:** **Group Name***, **Type*** (Category, Gender, Season, Fabric, Collection), **Parent Group**, **Description*** (multiline), **Status*** (Active/Inactive).

---

### 4.7 Salesmen

**Path:** Masters → **Salesmen**.

**Purpose:** Salesperson names used on sale orders and sales invoices.

**Fields:** **Name***, **Code***, **Phone***, **Email***, **Commission Rate (%)*** (number, default 0), **Status*** (Active/Inactive).

---

### 4.8 Bank Accounts (Banks)

**Path:** Masters → **Bank Accounts** (under Masters).

**Purpose:** Bank accounts used in Bank Payment and Bank Receipt.

**Fields:** **Bank Name***, **Account Number***, **Branch***, **IFSC Code***.

---

## 5. Items

**Path:** Sidebar → **Items**.  
**List:** `/admin/items` (or `/manager/items`, `/staff/items`).  
**New item:** **Add Item** → `/admin/items/new`.  
**Edit:** Click **Edit** (pencil) on a row → `/admin/items/:id/edit`.

**Purpose:** Manage products (parent “styles”) and their **variants** (e.g. size + color). Each variant has its own SKU, cost, selling price, MRP, and stock.

---

### 5.1 Items List

- **Search** – By item name or style code.
- **Filters** – **Brand**, **Category** (Item Group).
- **Table columns** – Item Name, Style Code, Brand, Category, number of Variants, Total Stock, Status.
- **Actions:** **View** (eye), **Edit** (pencil), **Delete** (trash with confirmation).
- **Pagination** – Choose rows per page (e.g. 5, 8, 10, 20) and move between pages.

**Add Item** opens the New Item form.

---

### 5.2 Add or Edit Item (Item Form)

**Sections:**

1. **Basic**
   - **Item Name***, **Style Code***, **Brand*** (dropdown), **Category / Item Group*** (dropdown), **Description**, **Status** (Active/Inactive).

2. **Apparel attributes** (optional)  
   - Gender, Season, Fabric, Fabric Type.

3. **Media**  
   - **Upload Image** / **Remove** – Optional product image.

4. **Variants**
   - Table of variants. Each variant has: **Size**, **Color**, **SKU** (often auto from style + size + color), **Cost Price**, **Selling Price**, **MRP**, **Stock**, **Status** (Active/Inactive).
   - **Add variant** – Add one or more rows (dialog or inline).
   - **Edit** / **Delete** – Per variant.
   - Some screens support **Generate variants** from a set of sizes and colors (bulk creation).

**Rules**

- You must have **at least one variant** to save the item.
- Saving the item saves the variants and their prices/stock.

**Buttons:** **Back** (return to list), **Save Item** (top/bottom), **Cancel** (bottom).

---

## 6. Inventory

**Path:** Sidebar → **Inventory** → then choose a sub-menu.  
Base path: `/admin/inventory` (or `/manager/inventory`, `/staff/inventory`). Staff sees only **Stock Overview**.

---

### 6.1 Stock Overview

**Path:** Inventory → **Stock Overview** (`/inventory/stock-overview`).

**Purpose:** See current stock by warehouse, brand, and category. Identify low stock.

**How to use**

1. Use **Search** (item name, SKU, style code, lot) and filters: **Warehouse**, **Brand**, **Category**.
2. Table shows: Item, SKU, Warehouse, Quantity, Reserved, Brand, Category, etc. Rows at or below low-stock threshold may be highlighted.
3. Use **Pagination** to move through pages.

---

### 6.2 Transfer

**Path:** Inventory → **Transfer** (`/inventory/transfer`).  
*Not available to Staff.*

**Purpose:** Move stock from one warehouse to another.

**Steps**

1. Select **From Warehouse*** and **To Warehouse***.
2. Enter **Transfer Date** and **Remarks** (optional).
3. **Add lines** – Choose variant (from source warehouse stock) and enter quantity for each line.
4. Optionally **import lines** from Excel if the feature is available.
5. Click **Send** to post the transfer. Stock is reduced in “From” and increased in “To”.

---

### 6.3 Audit

**Path:** Inventory → **Audit** (`/inventory/audit`).  
*Not available to Staff.*

**Purpose:** Reconcile system stock with physical count.

**Steps**

1. Select **Warehouse*** and optional **Brand** / **Category** filters. Set **Audit Date**.
2. Table shows each variant with **System Qty** and **Physical Qty** (editable). Difference is calculated.
3. Enter the actual counted **Physical Qty** for each line.
4. Click **Save** or **Apply** to post the audit. Stock is adjusted to match physical quantity.

---

### 6.4 Adjustment

**Path:** Inventory → **Adjustment** (`/inventory/adjustment`).  
*Not available to Staff.*

**Purpose:** Manually increase or decrease stock (e.g. write-off, found stock, correction).

**Steps**

1. Select **Warehouse***, **Adjustment Type** (Increase / Decrease), **Reason**, **Date**.
2. Add lines: select variant and enter **Adjustment Quantity**.
3. Click **Save** to apply. Stock is updated accordingly.

---

### 6.5 Movements

**Path:** Inventory → **Movements** (`/inventory/movements`).  
*Not available to Staff.*

**Purpose:** View history of stock movements (purchase, sale, return, transfer, adjustment, audit).

**How to use**

- **Filters:** Search (item/SKU/style), **Warehouse**, **Movement Type**, **Date From** / **Date To**.
- Table shows: Type, Date, Item, SKU, Warehouse, Quantity change, Reference.

---

## 7. Purchase

**Path:** Sidebar → **Purchase**.  
*Not available to Staff.*

- **Purchase Bills list:** `/admin/purchase`.
- **New:** **Add Purchase** → `/admin/purchase/new`.
- **Edit:** Open a bill → `/admin/purchase/:id`.
- **Return:** **Return** on a bill → `/admin/purchase/:id/return`.

**Purpose:** Record purchases from suppliers and increase stock. Print barcode labels for received lines.

---

### 7.1 Purchase Bills List

- **Search** – By bill number or supplier name.
- **Filters** – **Warehouse**, **Date From**, **Date To**.
- **Table** – Bill #, Supplier, Warehouse, Date, Totals, etc.
- **Actions per row:**
  - **View** (eye) – Open detail dialog.
  - **Edit** (pencil) – Edit the bill.
  - **Return** – Open Purchase Return for this bill.
  - **Barcode Print** (print icon) – Open barcode label print dialog.

Click **Add Purchase** to create a new bill.

---

### 7.2 New or Edit Purchase (Purchase Form)

**Header**

- **Supplier***, **Bill Number***, **Bill Date***, **Warehouse***, **Purchase Type**, **Remarks**, **Other Charges** (optional).

**Line items**

- **Add lines** – Select variant (from items); enter **Quantity**, **Rate**, **Discount %**, **Tax %**, **Lot** (optional). Amount is calculated per line.
- **Totals** – Gross, discount, tax, other charges, **Net** are calculated.
- Optionally **import lines** from Excel if supported.

Click **Save** to create or update the bill. Stock is increased for the selected warehouse.

---

### 7.3 Purchase Return

**Path:** From Purchase list → **Return** on a bill → `/purchase/:id/return`.

**Purpose:** Return items to the supplier against an existing purchase bill; reduces stock.

**Steps**

1. **Return Date** and **Remarks** (optional).
2. Table shows original lines with **Purchased Qty** and **Remaining Qty** (after earlier returns). Enter **Return Qty** for each line you are returning.
3. Click **Save**. Return is posted and stock is reduced.

---

### 7.4 Print Barcode Labels

**Path:** From Purchase list → **Barcode Print** (print icon) on a bill.

**Purpose:** Print labels for purchase lines (e.g. for shelf/bin labeling). Each line can generate as many labels as its quantity.

**Steps**

1. Dialog shows bill info and list of lines with checkboxes.
2. **Select lines** to include (default: all selected).
3. Optionally change quantity per line by (de)selecting.
4. Click **Print Labels**. A new window opens with a printable page of labels (SKU, item name, size, color as text). Use the browser **Print** to send to the printer.

**Note:** Labels show text only (no barcode image). Use your printer’s settings for label size (e.g. 2" × 1" as in the template).

---

## 8. Orders

**Path:** Sidebar → **Orders**.  
*Not available to Staff.*

- **Sale Orders list:** `/admin/orders`.
- **New:** **New Sale Order** → `/admin/orders/new`.
- **Edit:** **Edit** on an order → `/admin/orders/:id/edit`.
- **Packing:** **Packing Slips** → `/admin/orders/packing`.
- **Delivery:** **Delivery Orders** → `/admin/orders/delivery`.

**Purpose:** Manage wholesale sale orders from confirmation → packing → delivery. Then use **Sales** to invoice (e.g. from a delivery order).

---

### 8.1 Sale Orders List

- **Search** and **Filters** (e.g. Status, Date From/To).
- **Table:** Order #, Customer, Date, Status, Net Amount, etc.
- **Edit** (pencil) – Open order for edit.

Click **New Sale Order** to create an order.

---

### 8.2 New or Edit Sale Order

**Header**

- **Date**, **Customer***, **Price List** (optional – for default rates), **Salesman** (optional).

**Lines**

- Add lines by selecting **variant**; enter **Quantity**, **Rate**, **Discount %**, **Tax %** (default may come from GST config). Totals are calculated.
- Rates can be filled from the selected Price List by customer/item group/category if configured.

Click **Save** to create or update the order.

---

### 8.3 Packing Slips

**Path:** Orders → **Packing Slips** (`/orders/packing`).

**Purpose:** Create a packing slip from a confirmed sale order; allocate stock from a warehouse (e.g. box/batch per line).

**Steps**

1. Select the **sale order** to pack.
2. Select **Warehouse** and optionally **Box prefix** or similar.
3. Allocate quantities per order line from available stock.
4. Save the packing slip. Order status may move to “Packed” or similar.

---

### 8.4 Delivery Orders

**Path:** Orders → **Delivery Orders** (`/orders/delivery`).

**Purpose:** Create a delivery order from a **packed** sale order (select the packing slip). Represents dispatch/delivery.

**Steps**

1. Select the **packing slip** / packed order.
2. Enter **Delivery Order Date**, **Remarks** (optional).
3. Click **Save**. Delivery order is created; order status may move to “Dispatched” or “Delivered”.

Later, in **Sales → New Sale**, you can choose “From Delivery Order” and load lines from this DO to create an invoice quickly.

---

## 9. Sales

**Path:** Sidebar → **Sales**.

- **Sales Invoices list:** `/admin/sales` (or `/staff/sales`).
- **New Sale:** **New Sale** button or **Quick Action** → `/admin/sales/new`.
- **View/Edit sale:** Click a row or **View** → `/admin/sales/:id`.
- **Sales Return:** **Return** on a sale → `/admin/sales/:id/return`.

**Purpose:** Create and manage retail (or wholesale) invoices, collect payment, apply loyalty/vouchers/coupons, and process returns.

---

### 9.1 Sales Invoices List

- **Search** – Invoice number, customer name, or mobile.
- **Filters** – **Payment Status** (Paid / Partial / all), **Date**.
- **Table** – Invoice #, Customer, Date, Warehouse, Payment Status, Total, etc.
- **Actions:** **View** (eye) – open detail dialog; **Return** – open Sales Return for that invoice.

Click **New Sale** to open the Billing page.

---

### 9.2 Billing (New or Edit Sale)

**Path:** `/sales/new` or `/sales/:id`.

**Header**

- **Bill Date**, **Warehouse***, **Salesman** (optional), **Customer** (search by mobile or select from list). “Walk-in Customer” is used if no customer is selected.
- **Billing mode** – Manual entry or **From Delivery Order** (then select a DO to load lines).
- **Bill Discount** (optional amount).
- **Loyalty** – **Redeem** opens **Loyalty Redeem** dialog to redeem points against the bill (within limits set in Customer Rewards → Loyalty Config).
- **Coupon** – Enter coupon code and **Apply** to get discount (from Pricing → Coupons).
- **Credit Note** (optional) – Apply a customer credit note to reduce amount.

**Line items**

- **Add items** – Search by variant or enter **Barcode / SKU** and press Enter or click **Add** to add the line. Enter **Quantity**, **Rate**, **Discount %**, **Tax %** (default from GST). Schemes (from Pricing → Schemes) may auto-apply (e.g. percentage off, buy X get Y).
- **Totals** – Gross, line discount, bill discount, coupon discount, scheme discount, tax, loyalty redeemed → **Net Payable**.

**Payment**

- Click **Pay** to open **Payment** dialog:
  - **Payment Mode:** Cash, Card, UPI, Gift Voucher, or **Split** (combination).
  - **Amount** – Enter amount paid. For **Split**, enter Cash / Card / UPI breakdown.
  - **Gift Voucher** – Enter voucher code and **Apply** to use a voucher against the amount; remaining amount can be paid by other modes.
- After **Confirm**, payment is saved and the invoice is marked **Paid** or **Partial**. Loyalty points may be earned (if configured); voucher and coupon usage are updated.

**Saving without payment**

- You can **Save** the bill without paying. It stays as draft or unpaid; you can open it later and click **Pay** to record payment.

---

### 9.3 Sales Return

**Path:** From Sales list → **Return** on an invoice → `/sales/:id/return`.

**Purpose:** Return items against an invoice; refund or exchange; optionally create a credit note.

**Steps**

1. Choose **Return type** – Refund or Exchange.
2. Table shows original lines: variant, **Sold Qty**, **Already Returned**, **Return Qty** (you enter).
3. For **Exchange**, add **Exchange lines** (variant + quantity) for items given to the customer.
4. Click **Save**. Return is posted; stock is updated; optionally a **Credit Note** is created for the customer (usable in future sales).

---

## 10. Pricing

**Path:** Sidebar → **Pricing**.  
*Not available to Staff.*

- **Price Lists:** `/admin/pricing/price-lists` (New: `/pricing/price-lists/new`, Edit: `/pricing/price-lists/:id/edit`).
- **Schemes:** `/admin/pricing/schemes` (New/Edit similarly).
- **Coupons:** `/admin/pricing/coupons`.

**Purpose:** Control selling prices (price lists), run promotions (schemes), and offer discount codes (coupons) applied at billing.

---

### 10.1 Price Lists

**Purpose:** Define selling prices by variant: fixed price, discount % on MRP, or markup % on cost. Apply to selected customers/groups and/or items/groups.

**Create/Edit**

- **Name**, **Applicability** – All Customers / Selected Customers / Customer Group; All Items / Selected Items / Item Group. **Valid From**, **Valid To**, **Status**.
- **Rules** – Add rows per variant (or selection): **Pricing method** (Fixed / Discount on MRP % / Markup on cost %) and **Value**.
- Save. When a customer and price list are selected on a Sale Order or Sale, rates can be filled from this list.

---

### 10.2 Schemes

**Purpose:** Promotions: **Percentage Discount**, **Flat Discount**, **Buy X Get Y**, **Free Gift**. Apply by Item, Item Group, Brand, or Company. Valid From/To, Status.

**Create/Edit**

- **Scheme type** – Choose type; fill type-specific fields (e.g. min qty, free qty, discount %).
- **Applicability** – Item / Item Group / Brand / Company.
- **Valid From**, **Valid To**, **Status**.
- Save. Schemes can auto-apply on the Billing page when matching items are added.

---

### 10.3 Coupons

**Purpose:** Coupon codes for percentage or flat discount on the entire bill. Applied on the Billing page by entering the code and clicking **Apply**.

**Create**

- **Code*** (or use **Generate** for a random code), **Type** (Percentage / Amount), **Value**, **Valid From**, **Valid To**, **Status**.
- **Bulk create** – By count or range, prefix, amount, issue/expiry dates.

**Use:** In **Sales → New Sale** (or edit sale), enter the coupon code in the Coupon field and click **Apply**. The discount is reflected in the totals.

---

## 11. Customer Rewards

**Path:** Sidebar → **Customer Rewards**.  
*Not available to Staff.*

- **Rewards overview:** `/admin/customers/rewards` (default when you open Customer Rewards).
- **Loyalty Config:** `/admin/customers/loyalty-config`.
- **Vouchers:** `/admin/customers/vouchers`; **New:** `/admin/customers/vouchers/new`.
- **Credit Notes:** `/admin/customers/credit-notes`.

**Purpose:** Configure loyalty (earn/redeem), issue and manage gift vouchers, and manage customer credit notes used in sales.

---

### 11.1 Loyalty Configuration

**Path:** Customer Rewards → **Loyalty Config**.

**Purpose:** Set how customers earn and redeem points.

**Fields (typical):** **Earn Rate** (e.g. points per ₹100), **Earn Per Amount** (₹), **Min Redeem Points**, **Point Value** (₹ per point), **Expiry Period** (days), **Status**.

**Save** to apply. These rules are used when earning points on sales and when redeeming points on the Billing page (Loyalty Redeem dialog).

---

### 11.2 Vouchers

**List** – Customer Rewards → **Vouchers**.  
View/search vouchers; filter by **Status** (Active, Redeemed, Expired). **Redeem** (for active vouchers) or **Issue** new.

**Issue new** – Customer Rewards → **New Voucher** (or **Vouchers → New**).

- **Single:** Code (or generate), **Amount**, **Issue Date**, **Expiry Date**, **Status**, **Customer** (optional).
- **Bulk:** Count or range, prefix, amount, issue/expiry dates.

**Use:** On the Billing page, in the **Payment** dialog, enter the voucher code and **Apply** to reduce the amount to pay (or pay fully with voucher if amount covers net payable).

---

### 11.3 Credit Notes

**Path:** Customer Rewards → **Credit Notes**.

**Purpose:** Track customer credit (e.g. from returns). View balance per customer; **Add** credit note (customer, amount, reason). Credit can be **used** when creating a sale (Billing page – apply credit note to reduce net payable).

---

### 11.4 Rewards (Overview)

**Path:** Customer Rewards → **Rewards** (or open Customer Rewards and land here).

**Purpose:** See loyalty summary per customer: total earned, redeemed, available points, last activity. View **transaction history** (earned/redeemed/adjusted) per customer.

---

## 12. Accounts

**Path:** Sidebar → **Accounts**.  
*Not available to Staff.*

- **Overview:** `/admin/accounts`.
- **Bank Payment:** `/admin/accounts/bank-payment`.
- **Bank Receipt:** `/admin/accounts/bank-receipt`.

**Purpose:** Record bank payments to suppliers (against purchase bills) and bank receipts from customers (against sale invoices).

---

### 12.1 Accounts Overview

Two cards: **Bank Payment** and **Bank Receipt**. Click one to open the corresponding form.

---

### 12.2 Bank Payment

**Path:** Accounts → **Bank Payment**.

**Purpose:** Record a cheque (or bank) payment to a supplier and allocate it against one or more purchase bills.

**Steps**

1. Select **Bank Account*** (from Masters → Bank Accounts), **Supplier***, **Date**, **Cheque No**, **Amount**, **Narration** (optional).
2. A table shows **pending purchase bills** for that supplier. For each bill you want to clear (fully or partly), enter **Allocation Amount** (total allocations should not exceed the payment amount).
3. Click **Save**. Payment is recorded and bill balances are updated.

---

### 12.3 Bank Receipt

**Path:** Accounts → **Bank Receipt**.

**Purpose:** Record a cheque (or bank) receipt from a customer and allocate it against one or more sale invoices.

**Steps**

1. Select **Bank Account***, **Customer***, **Date**, **Cheque No**, **Amount**, **Narration** (optional).
2. Table shows **pending sale bills** for that customer. Enter **Allocation Amount** per bill (total ≤ receipt amount).
3. Click **Save**. Receipt is recorded and invoice balances are updated.

---

## 13. Reports

**Path:** Sidebar → **Reports** → **Overview** (`/admin/reports`) or any report from the list.  
*Not available to Staff.*

**Overview** shows a grid of report cards. Each card opens a report page with filters and a table (or chart). Most reports support **Export** (e.g. CSV) and **Copy** to clipboard.

| Report            | Path                    | What it shows |
|-------------------|-------------------------|----------------|
| Sales             | `/reports/sales`        | Sales invoices, revenue, payment; view modes: summary/detail/account-wise/size-wise/group-wise |
| Purchase          | `/reports/purchase`     | Purchase bills, costs, supplier transactions |
| Ledger            | `/reports/ledger`       | Account-wise ledger: debit, credit, running balance |
| Bank Book         | `/reports/bank-book`    | Bank-wise receipts and payments, running balance |
| Collection        | `/reports/collection`   | Cash and cheque collections (sales + bank receipts) |
| Stock             | `/reports/stock`        | Current inventory, movements, stock value |
| Profit            | `/reports/profit`       | Margin analysis, cost vs revenue, profit % |
| Customers         | `/reports/customers`    | Customer activity, purchase history, loyalty |
| Vendors           | `/reports/vendors`      | Supplier purchases, amounts, outstanding |
| Movement & Alerts | `/reports/movement`     | Fast-moving and slow-moving items |
| Age Analysis      | `/reports/age-analysis` | Stock age bands (e.g. 0–10, 10–30, 30–60, 60–90, 90+ days) |

**How to use a report**

1. Open **Reports** from the sidebar, then click the report name (or open the report from its path).
2. Set **filters** (e.g. Date From/To, Warehouse, Customer, Supplier, Payment Status) and **Search** if available.
3. View the table or chart. Change **view mode** if the report has multiple (e.g. Sales: summary/detail/account-wise).
4. Use **Export** to download CSV or **Copy** to copy data to clipboard.

---

## 14. GST

**Path:** Sidebar → **GST**.  
*Not available to Staff.*

- **Tax Rates:** `/admin/gst/tax-rates`.
- **Tax Groups:** `/admin/gst/tax-groups`.
- **Invoice Tax Report:** `/admin/gst/invoice-report`.
- **GSTR Summary:** `/admin/gst/gstr-summary`.

**Purpose:** Define tax rates and map them to item groups; run invoice-level tax report and GSTR-style summary for compliance.

---

### 14.1 Tax Rates

**Path:** GST → **Tax Rates**.

**Purpose:** Define GST rates (CGST, SGST, IGST).

**Fields:** **Name***, **CGST %**, **SGST %**, **IGST %**, **Effective From**, **Status** (Active/Inactive). Add/Edit via dialog; toggle status as needed.

---

### 14.2 Tax Groups

**Path:** GST → **Tax Groups**.

**Purpose:** Link item groups/categories to a tax rate so sales and purchase lines get the correct tax.

**Fields:** **Name***, **Tax Rate** (select from Tax Rates), Category/description, **Status**. Add/Edit; toggle Active/Inactive.

---

### 14.3 Invoice Tax Report

**Path:** GST → **Invoice Tax Report**.

**Purpose:** Invoice-wise tax summary: Invoice #, Date, Customer, Taxable Value, CGST, SGST, IGST, Total Tax, Net Amount.

**Use:** Set **Date From/To**, **Customer** (optional), **Search**. Export or Copy for your records.

---

### 14.4 GSTR Summary

**Path:** GST → **GSTR Summary**.

**Purpose:** Outward supplies (sales) and inward supplies (purchases) for a date range; HSN-wise aggregation. **Export** for GSTR-1 / GSTR-3B style JSON. Some screens support GSTR-2A upload/reconcile.

**Use:** Set **Date From/To**, then **Export** to download JSON (or use on-screen summary).

---

## 15. Settings (Admin Only)

**Path:** Sidebar → **Settings**.  
Only **Admin** sees this menu. Routes: `/admin/settings/...`.

---

### 15.1 Company Profile

**Path:** Settings → **Company Profile**.

**Purpose:** Business and tax details used on invoices and reports.

**Fields:** Business Name, Legal Name, GSTIN, PAN, Address (Line1, City, State, Pincode), Phone, Email, Financial Year Start. **Save** to update.

---

### 15.2 Users

**Path:** Settings → **Users**.

**Purpose:** Manage system users and their roles.

**Actions:** **Add User** / Edit. **Fields:** Name, Email, Mobile, **Role** (Admin/Manager/Staff), Status. Table: Name, Email, Mobile, Role, Status, Actions (Edit/Delete if available).

---

### 15.3 Roles

**Path:** Settings → **Roles**.

**Purpose:** Define roles and permissions (e.g. Admin, Manager, Staff).

**Actions:** **Add Role** / Edit. **Fields:** Role Name, Description, Status. Table: Role Name, Description, Status, Actions.

---

### 15.4 Number Series

**Path:** Settings → **Number Series**.

**Purpose:** Control document numbering (e.g. invoice number, bill number).

**Fields per series:** **Document Type**, **Prefix**, **Next Number**, **Reset Period**, **Status**. Add/Edit; table lists all series.

---

### 15.5 Preferences

**Path:** Settings → **Preferences**.

**Purpose:** Application-wide defaults.

**Fields (typical):** Currency, Date Format, Time Format (12h/24h), **Low Stock Threshold** (used in Dashboard and Stock Overview), Qty Decimals, Amount Decimals, **Show GST on Invoice** (yes/no), **Auto Apply Loyalty** (yes/no). **Save** to apply.

---

### 15.6 Purchase Config

**Path:** Settings → **Purchase Config** (Purchase Voucher Config).

**Purpose:** Defaults for purchase (and possibly sales) vouchers: tax and GST slab.

**Fields (typical):** Carry Forward Pack Size, **Default Tax %**, **GST Slab Enabled**, **GST Slab Threshold** (₹), **Below Threshold Tax %**, **Above Threshold Tax %**. **Save**. These affect default tax on purchase/sale lines when slab is enabled.

---

### 15.7 Print Templates

**Path:** Settings → **Print Templates**.

**Purpose:** Configure print layouts for invoices and other documents.

**Actions:** **Add Template** / Edit. **Fields:** Name, Document Type, Layout, Status. Table: Name, Document Type, Layout, Status, Actions.

---

### 15.8 Audit Log

**Path:** Settings → **Audit Log**.

**Purpose:** View activity history: who did what, when, in which module.

**Table:** Date & Time, User, Action, Module, Reference, Details. **Search** by user, action, module, reference, or details. Use **Pagination** to browse.

---

## 16. Quick Reference

### 16.1 Role vs Menu

| Section           | Admin | Manager | Staff |
|-------------------|-------|---------|-------|
| Dashboard         | ✅    | ✅      | ✅    |
| Masters           | ✅    | ✅      | ❌    |
| Items             | ✅    | ✅      | ✅    |
| Inventory         | All   | All     | Stock Overview only |
| Purchase          | ✅    | ✅      | ❌    |
| Orders            | ✅    | ✅      | ❌    |
| Sales             | ✅    | ✅      | ✅    |
| Pricing           | ✅    | ✅      | ❌    |
| Customer Rewards  | ✅    | ✅      | ❌    |
| Accounts          | ✅    | ✅      | ❌    |
| Reports           | ✅    | ✅      | ❌    |
| GST               | ✅    | ✅      | ❌    |
| Settings          | ✅    | ❌      | ❌    |

### 16.2 Base Paths

- **Admin:** All routes under `/admin/` (e.g. `/admin/sales/new`).
- **Manager:** All routes under `/manager/` (no `/manager/settings`).
- **Staff:** Only `/staff`, `/staff/items`, `/staff/items/new`, `/staff/items/:id/edit`, `/staff/inventory`, `/staff/inventory/stock-overview`, `/staff/sales`, `/staff/sales/new`, `/staff/sales/:id`.

### 16.3 Login Credentials (Demo)

| Role    | Email                | Password    |
|---------|----------------------|-------------|
| Admin   | admin@clotherp.com   | password123 |
| Manager | manager@clotherp.com| password123 |
| Staff   | staff@clotherp.com   | password123 |

---

## 17. Glossary

- **Variant** – A specific combination of an item (e.g. size + color) with its own SKU, prices, and stock.
- **SKU** – Stock Keeping Unit; unique code for a variant (e.g. style-size-color).
- **Price List** – Set of selling prices (fixed, discount %, or markup %) applied to selected customers/items.
- **Scheme** – Promotion (e.g. % off, buy X get Y) applied to items at billing.
- **Coupon** – Code that gives a discount on the bill when applied at billing.
- **Loyalty points** – Earned on sales and redeemable against future bills (config in Customer Rewards).
- **Credit Note** – Customer credit (e.g. from return) that can be applied to future sales.
- **GST** – Goods and Services Tax (CGST, SGST, IGST). Configured in GST → Tax Rates and Tax Groups.
- **Low Stock Threshold** – Quantity below which an item is treated as “low stock” (Dashboard, Stock Overview). Set in Settings → Preferences.
- **Delivery Order (DO)** – Document for dispatch/delivery from a packed sale order; lines can be loaded into a new sale invoice.
- **Barcode labels** – Printable labels for purchase lines (SKU, name, size, color). Generated from Purchase → Barcode Print (text only; no barcode image).

---

*End of User Manual. For technical details and route definitions, refer to the codebase and USER_MANUAL_OUTLINE.md.*
