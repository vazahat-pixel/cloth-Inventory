# Database Inventory & Sales Dashboard (Reconciled & Live Status)

This dashboard report represents the live operational data fetched directly from the MongoDB database after completing the duplicate stock corrections.

* **Report Generation Time:** 19 June 2026, 02:20:00 PM IST
* **Data State:** Fully Reconciled (Excludes deleted invoices, cancelled/refunded tickets)

---

## 📊 High-Level Metrics Summary

> [!NOTE]
> All figures are calculated in real-time. Showroom stock closing levels now reflect the exact corrected stock counts (duplicate dispatches reversed).

| Metric | Value | Details |
| :--- | :---: | :--- |
| **💰 Global Total Sales (All Retail Stores)** | **INR 11,59,544.70** | Cumulated retail showroom sales revenue (568 Invoices) |
| **📦 Global Stock Pool** | **1,19,451.20 Units** | Total items in circulation (Warehouse + Showrooms) |
| **🏭 Warehouse Stock** | **96,107.20 Units** | Bulk stock at head office / primary warehouse |
| **🏪 Retail Showroom Stock** | **23,344.00 Units** | Live sellable closing stock across all stores |
| **🚚 Stock In-Transit (Stores)** | **30.00 Units** | Pitampura store in-transit pool |
| **🚚 Stock In-Transit (Warehouse)** | **63.00 Units** | Primary warehouse in-transit pool |
| **⚠️ Damaged Stock** | **0.00 Units** | Total marked as damaged |

---

## 📈 Store-Wise Sales Report

The table below lists all retail stores sorted by total generated sales revenue (excluding internal warehouse-to-store sales).

| Store Name | Total Revenue (INR) | Total Bills Count | Average Bill Value (INR) |
| :--- | :---: | :---: | :---: |
| **REBEL MASS EXPORT PVT. LTD. (SONIPAT)** | 2,82,401.50 | 112 | 2,521.44 |
| **REBEL MASS EXPORT PVT. LTD. (GTB NAGAR)** | 2,53,731.90 | 121 | 2,096.96 |
| **REBEL MASS EXPORT PVT. LTD. (MUKTSAR SAHIB)** | 1,98,893.50 | 111 | 1,791.83 |
| **REBEL MASS EXPORT PVT. LTD (SAHIBABAD)** | 1,14,951.20 | 60 | 1,915.85 |
| **REBEL MASS EXPORT PVT. LTD (PITAMPURA)** | 1,05,727.10 | 58 | 1,822.88 |
| **SHRI KRISHNA ASSOCIATES (BHOPAL)** | 98,015.00 | 36 | 2,722.64 |
| **REBEL MASS EXPORT PVT. LTD. (SHAHJAHANPUR)** | 88,127.70 | 56 | 1,573.71 |
| **REBEL MASS EXPORT PVT. LTD. (HANUMANGARH)** | 14,501.60 | 11 | 1,318.33 |
| **Testing Data** | 3,195.20 | 3 | 1,065.07 |
| **TOTAL RETAIL STORES** | **INR 11,59,544.70** | **568** | **2,041.45** |

*Note: Head office internal sales total INR 4,84,298.98 (16 invoices, 993 qty), making the grand total sales INR 16,43,843.68.*

---

## 🏬 Warehouse & Store Closing Stock Status

This report shows current closing stock quantities at each location after duplicate receipts were cleaned up.

### 🏢 Warehouse Stock Status
| Warehouse Name | Available Quantity | Damaged Quantity | In-Transit Quantity |
| :--- | :---: | :---: | :---: |
| **REBEL MASS EXPORT PVT LTD** | 96,107.20 | 0.00 | 63.00 |

### 🏪 Showrooms Stock Status (Closing Stock)
| Showroom / Store Name | Closing Stock Qty | Damaged Quantity | In-Transit Quantity |
| :--- | :---: | :---: | :---: |
| **REBEL MASS EXPORT PVT. LTD (SAHIBABAD)** | 3,542.00 | 0 | 0 |
| **REBEL MASS EXPORT PVT. LTD. (MUKTSAR SAHIB)** | 3,507.00 | 0 | 0 |
| **REBEL MASS EXPORT PVT. LTD (PITAMPURA)** | 3,257.00 | 0 | 30 |
| **REBEL MASS EXPORT PVT. LTD. (GTB NAGAR)** | 3,048.00 | 0 | 0 |
| **REBEL MASS EXPORT PVT. LTD. (SONIPAT)** | 2,972.00 | 0 | 0 |
| **REBEL MASS EXPORT PVT. LTD. (SHAHJAHANPUR)** | 2,969.00 | 0 | 0 |
| **REBEL MASS EXPORT PVT. LTD. (HANUMANGARH)** | 2,387.00 | 0 | 0 |
| **SHRI KRISHNA ASSOCIATES (BHOPAL)** | 1,655.00 | 0 | 0 |
| **Testing Data** | 7.00 | 0 | 0 |
| **TOTAL SHOWROOM STOCK** | **23,344.00** | **0** | **30** |
