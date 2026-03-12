export const navigationItems = [
  { label: "Dashboard", path: "/" },
  // Plural to match breadcrumbs/title used in master screens
  { label: "Masters", path: "/masters" },
  { label: "Inventory (INV)", path: "/inventory" },
  { label: "Purchase", path: "/purchase" },
  { label: "Sales", path: "/sales" },
  { label: "Reports", path: "/reports" },
  { label: "Setup", path: "/setup" },
  { label: "Settings", path: "/settings" },
  { label: "Data Import", path: "/data-import" },
];

export const mastersNavigationItems = [
  { label: "Suppliers", path: "/masters/suppliers" },
  { label: "Customers", path: "/masters/customers" },
  { label: "Warehouses", path: "/masters/warehouses" },
  { label: "Stores", path: "/masters/stores" },
  // Match screen title "Item Groups"
  { label: "Item Groups", path: "/masters/item-groups" },
  { label: "Brands", path: "/masters/brands" },
  { label: "Salesmen", path: "/masters/salesmen" },
  { label: "Banks", path: "/masters/banks" },
  { label: "Items", path: "/items" },
];

export const inventoryNavigationItems = [
  { label: "Stock Overview", path: "/inventory/stock-overview" },
  { label: "New Stock IN", path: "/inventory/stock-in" },
  { label: "Transfer", path: "/inventory/transfer" },
  { label: "Transfer IN", path: "/inventory/transfer-receive" },
  { label: "Audit", path: "/inventory/audit" },
  { label: "Adjustment", path: "/inventory/adjustment" },
];

export const purchaseNavigationItems = [
  { label: "Purchase Orders", path: "/purchase/orders" },
  { label: "Purchase Bills", path: "/purchase" },
  { label: "Purchase Return", path: "/purchase/return" },
];

export const salesNavigationItems = [
  { label: "Delivery Challans", path: "/orders/delivery-challan" },
  { label: "Sale Invoices", path: "/sales" },
  { label: "New Sale (POS)", path: "/sales/new" },
  { label: "Sales Return", path: "/sales/returns" },
];

export const reportsNavigationItems = [
  { label: "Sales Report", path: "/reports/sales" },
  { label: "Purchase Report", path: "/reports/purchase" },
  { label: "Stock Report", path: "/reports/stock" },
  { label: "Ledger Report", path: "/reports/ledger" },
  { label: "Profit Analysis", path: "/reports/profit" },
  { label: "Collection Report", path: "/reports/collection" },
];

export const setupNavigationItems = [
  { label: "Account Master", path: "/setup/accounts" },
  { label: "Promotion", path: "/pricing/schemes" },
  { label: "Offer", path: "/pricing/coupons" },
  { label: "Tax GST", path: "/gst/tax-rates" },
  { label: "HSN Code", path: "/setup/hsn-codes" },
  // Expose existing barcode printing screen in Setup menu
  { label: "Barcode Print", path: "/setup/barcode-print" },
];

export const settingsNavigationItems = [
  { label: "Company Profile", path: "/settings/company" },
  { label: "Users", path: "/settings/users" },
  { label: "Roles", path: "/settings/roles" },
  { label: "Number Series", path: "/settings/number-series" },
  { label: "Data Import", path: "/data-import" },
];

// Helper to get page title from path
export const getPageTitle = (pathname) => {
  // Basic logic to return label based on path matching
  const allItems = [
    ...navigationItems,
    ...mastersNavigationItems,
    ...inventoryNavigationItems,
    ...purchaseNavigationItems,
    ...salesNavigationItems,
    ...reportsNavigationItems,
    ...setupNavigationItems,
    ...settingsNavigationItems
  ];

  const cleanPath = pathname.replace(/^\/(ho|store)/, "") || "/";
  const match = allItems.find(i => i.path === cleanPath);
  return match ? match.label : "Cloth ERP";
};
