export const navigationItems = [
  { label: "Dashboard", path: "/" },
  { label: "Masters", path: "/masters" },
  { label: "Items", path: "/items" },
  { label: "Inventory", path: "/inventory" },
  { label: "Purchase", path: "/purchase" },
  { label: "Sales", path: "/sales" },
  { label: "Pricing", path: "/pricing" },
  { label: "Customer Rewards", path: "/customers" },
  { label: "Reports", path: "/reports" },
  { label: "GST", path: "/gst" },
  { label: "Settings", path: "/settings" },
];

export const accountsNavigationItems = [
  { label: "Overview", path: "/accounts" },
  { label: "Bank Payment", path: "/accounts/bank-payment" },
  { label: "Bank Receipt", path: "/accounts/bank-receipt" },
];

export const settingsNavigationItems = [
  { label: "Company Profile", path: "/settings/company" },
  { label: "Users", path: "/settings/users" },
  { label: "Roles", path: "/settings/roles" },
  { label: "Number Series", path: "/settings/number-series" },
  { label: "Preferences", path: "/settings/preferences" },
];

export const gstNavigationItems = [
  { label: "Tax Rates", path: "/gst/tax-rates" },
  { label: "Invoice Tax Report", path: "/gst/invoice-report" },
  { label: "GSTR Summary", path: "/gst/gstr-summary" },
];

export const reportsNavigationItems = [
  { label: "Sales", path: "/reports/sales" },
  { label: "Purchase", path: "/reports/purchase" },
  { label: "Ledger", path: "/reports/ledger" },
  { label: "Stock", path: "/reports/stock" },
  { label: "Overview", path: "/reports" },
  { label: "Profit Analysis", path: "/reports/profit" },
  { label: "Collection Report", path: "/reports/collection" },
];

export const customersNavigationItems = [
  { label: "Rewards", path: "/customers/rewards" },
  { label: "Loyalty Config", path: "/customers/loyalty-config" },
  { label: "Gift Vouchers", path: "/customers/vouchers" },
];

export const pricingNavigationItems = [
  { label: "Price Lists", path: "/pricing/price-lists" },
  { label: "Schemes", path: "/pricing/schemes" },
];

export const mastersNavigationItems = [
  { label: "Suppliers", path: "/masters/suppliers" },
  { label: "Customers", path: "/masters/customers" },
  { label: "Stores", path: "/masters/warehouses" },
  { label: "Categories", path: "/masters/item-groups" },
  { label: "Brands", path: "/masters/brands" },
  { label: "Salesmen", path: "/masters/salesmen" },
  { label: "Banks", path: "/masters/banks" },
];

export const inventoryNavigationItems = [
  { label: "Stock Overview", path: "/inventory/stock-overview" },
  { label: "Transfer", path: "/inventory/transfer" },
];

export const purchaseNavigationItems = [
  { label: "Purchase Bills", path: "/purchase" },
  { label: "New Purchase", path: "/purchase/new" },
];

export const salesNavigationItems = [
  { label: "Sales Invoices", path: "/sales" },
  { label: "New Sale", path: "/sales/new" },
];

export const ordersNavigationItems = [];

export const getPageTitle = (pathname) => {
  const p = pathname.replace(/^\/(admin|manager|staff)/, "") || "/";
  if (p === "/pricing/price-lists") return "Price Lists";
  if (pathname === "/pricing/price-lists/new") return "New Price List";
  if (/^\/pricing\/price-lists\/[^/]+\/edit$/.test(p)) return "Edit Price List";
  if (p === "/pricing/schemes") return "Schemes";
  if (p === "/pricing/schemes/new") return "New Scheme";
  if (/^\/pricing\/schemes\/[^/]+\/edit$/.test(p)) return "Edit Scheme";
  if (p === "/pricing/coupons") return "Coupons";

  if (p === "/customers/rewards") return "Customer Rewards";
  if (p === "/customers/loyalty-config") return "Loyalty Configuration";
  if (p === "/customers/vouchers") return "Gift Vouchers";
  if (p === "/customers/vouchers/new") return "Issue Voucher";
  if (p === "/customers/credit-notes") return "Credit Notes";

  if (p === "/accounts") return "Accounts";
  if (p === "/accounts/bank-payment") return "Bank Payment";
  if (p === "/accounts/bank-receipt") return "Bank Receipt";

  if (p === "/reports") return "Reports & Analytics";
  if (p === "/reports/sales") return "Sales Report";
  if (p === "/reports/purchase") return "Purchase Report";
  if (p === "/reports/ledger") return "Ledger Report";
  if (p === "/reports/bank-book") return "Bank Book";
  if (p === "/reports/collection") return "Collection Report";
  if (p === "/reports/stock") return "Stock Report";
  if (p === "/reports/profit") return "Profit Analysis";
  if (p === "/reports/customers") return "Customer Report";
  if (p === "/reports/vendors") return "Vendor Report";
  if (p === "/reports/movement") return "Movement & Alerts";
  if (p === "/reports/age-analysis") return "Age Analysis";

  if (p === "/settings/company") return "Company Profile";
  if (p === "/settings/users") return "Users";
  if (p === "/settings/roles") return "Roles";
  if (p === "/settings/number-series") return "Number Series";
  if (p === "/settings/preferences") return "Preferences";
  if (p === "/settings/purchase-config") return "Purchase Voucher Config";
  if (p === "/settings/print-templates") return "Print Templates";
  if (p === "/settings/audit-log") return "Audit Log";

  if (p === "/gst/tax-rates") return "Tax Rates";
  if (p === "/gst/tax-groups") return "Tax Groups";
  if (p === "/gst/invoice-report") return "Invoice Tax Report";
  if (p === "/gst/gstr-summary") return "GSTR Summary";

  if (p === "/items/new") {
    return "New Item";
  }

  if (/^\/items\/[^/]+\/edit$/.test(p)) {
    return "Edit Item";
  }

  if (p === "/purchase/new") {
    return "New Purchase";
  }

  if (/^\/purchase\/[^/]+\/return$/.test(p)) {
    return "Purchase Return";
  }

  if (/^\/purchase\/[^/]+$/.test(p)) {
    return "Edit Purchase";
  }

  if (p === "/orders") return "Sale Orders";
  if (p === "/orders/new") return "New Sale Order";
  if (p === "/orders/packing") return "Packing Slips";
  if (p === "/orders/delivery") return "Delivery Orders";
  if (/^\/orders\/[^/]+\/edit$/.test(p)) return "Edit Sale Order";

  if (p === "/sales/new") {
    return "New Sale";
  }

  if (/^\/sales\/[^/]+\/return$/.test(p)) {
    return "Sales Return";
  }

  if (/^\/sales\/[^/]+$/.test(p)) {
    return "Sales Invoice";
  }

  const matched = navigationItems.find((item) => item.path === p);
  if (matched) {
    return matched.label;
  }

  const matchedMasterPage = mastersNavigationItems.find((item) =>
    p.startsWith(item.path),
  );
  if (matchedMasterPage) {
    return matchedMasterPage.label;
  }

  const matchedInventoryPage = inventoryNavigationItems.find((item) =>
    p.startsWith(item.path),
  );
  if (matchedInventoryPage) {
    return matchedInventoryPage.label;
  }

  const matchedPurchasePage = purchaseNavigationItems.find((item) =>
    p.startsWith(item.path),
  );
  if (matchedPurchasePage) {
    return matchedPurchasePage.label;
  }

  const matchedSalesPage = salesNavigationItems.find((item) =>
    p.startsWith(item.path),
  );
  if (matchedSalesPage) {
    return matchedSalesPage.label;
  }

  const matchedOrdersPage = ordersNavigationItems?.find((item) =>
    p.startsWith(item.path),
  );
  if (matchedOrdersPage) {
    return matchedOrdersPage.label;
  }

  const matchedPricingPage = pricingNavigationItems?.find((item) =>
    p.startsWith(item.path),
  );
  if (matchedPricingPage) {
    return matchedPricingPage.label;
  }

  const matchedCustomersPage = customersNavigationItems?.find((item) =>
    p.startsWith(item.path),
  );
  if (matchedCustomersPage) {
    return matchedCustomersPage.label;
  }

  const matchedReportsPage = reportsNavigationItems?.find((item) =>
    p.startsWith(item.path),
  );
  if (matchedReportsPage) {
    return matchedReportsPage.label;
  }

  const matchedSettingsPage = settingsNavigationItems?.find((item) =>
    p.startsWith(item.path),
  );
  if (matchedSettingsPage) {
    return matchedSettingsPage.label;
  }

  const matchedGstPage = gstNavigationItems?.find((item) =>
    p.startsWith(item.path),
  );
  if (matchedGstPage) {
    return matchedGstPage.label;
  }

  if (p.startsWith("/customers")) {
    return "Customer Rewards";
  }

  if (p.startsWith("/pricing")) {
    return "Pricing";
  }

  if (p.startsWith("/masters")) {
    return "Masters";
  }

  if (p.startsWith("/items")) {
    return "Items";
  }

  if (p.startsWith("/purchase")) {
    return "Purchase";
  }

  if (p.startsWith("/sales")) {
    return "Sales";
  }

  if (p.startsWith("/orders")) {
    return "Orders";
  }

  const matchedAccountsPage = accountsNavigationItems?.find((item) =>
    p.startsWith(item.path),
  );
  if (matchedAccountsPage) {
    return matchedAccountsPage.label;
  }

  if (p.startsWith("/accounts")) {
    return "Accounts";
  }

  if (p.startsWith("/reports")) {
    return "Reports";
  }

  if (p.startsWith("/gst")) {
    return "GST";
  }

  if (p.startsWith("/settings")) {
    return "Settings";
  }

  return "Cloth ERP";
};
