import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RoleDashboardLayout from '../layouts/RoleDashboardLayout';
import LoadingOverlay from '../components/LoadingOverlay';
import RoleProtectedRoute from './RoleProtectedRoute';
import PublicRoute from './PublicRoute';

// Auth
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));

// Common
const DashboardHomePage = lazy(() => import('../pages/dashboard/DashboardHome'));

// Items & Catalog
const ItemListPage = lazy(() => import('../modules/items/ItemListPage'));
const ItemFormPage = lazy(() => import('../modules/items/ItemFormPage'));
const OpeningStockPage = lazy(() => import('../modules/items/components/OpeningStockPage'));

const BrandListPage = lazy(() => import('../modules/masters/brands/ListPage'));
const ItemGroupsListPage = lazy(() => import('../modules/masters/itemGroups/ListPage'));

// Pricing
const PriceListPage = lazy(() => import('../modules/pricing/PriceListPage'));
const PriceListFormPage = lazy(() => import('../modules/pricing/PriceListFormPage'));
const SchemeListPage = lazy(() => import('../modules/pricing/SchemeListPage'));
const SchemeFormPage = lazy(() => import('../modules/pricing/SchemeFormPage'));
const PromotionTypesMaster = lazy(() => import('../modules/pricing/PromotionTypesMaster.jsx'));
const PromotionGroupPage = lazy(() => import('../modules/pricing/PromotionGroupPage.jsx'));

// Setup
const SalesmanListPage = lazy(() => import('../modules/setup/SalesmanListPage'));
const GroupsPage = lazy(() => import('../modules/setup/GroupsPage'));
const HSNCodePage = lazy(() => import('../modules/setup/HSNCodePage'));
const SizesPage = lazy(() => import('../modules/setup/SizesPage'));
const BarcodePrintingPage = lazy(() => import('../modules/setup/BarcodePrintingPage'));

const SuppliersListPage = lazy(() => import('../modules/masters/suppliers/ListPage'));
const MaterialLedgerPage = lazy(() => import('../modules/suppliers/MaterialLedgerPage'));
const CustomersListPage = lazy(() => import('../modules/masters/customers/ListPage'));
const StoresListPage = lazy(() => import('../modules/masters/stores/ListPage'));
const WarehousesListPage = lazy(() => import('../modules/masters/warehouses/ListPage'));

// Inventory
const StockOverviewPage = lazy(() => import('../modules/inventory/StockOverviewPage'));
const StockAdjustmentPage = lazy(() => import('../modules/inventory/StockAdjustmentPage'));
const MovementHistoryPage = lazy(() => import('../modules/inventory/MovementHistoryPage'));
const StockAuditView = lazy(() => import('../modules/inventory/StockAuditView'));
const StoreOpeningStockImport = lazy(() => import('../modules/inventory/StoreOpeningStockImport'));

// GRN
const GRNListPage = lazy(() => import('../modules/grn/GRNListPage'));
const GRNFormPage = lazy(() => import('../modules/grn/GRNFormPage'));

// Reports
const ReportsDashboard = lazy(() => import('../modules/reports/ReportsDashboard'));
const SalesReportPage = lazy(() => import('../modules/reports/SalesReportPage'));
const PurchaseReportPage = lazy(() => import('../modules/reports/PurchaseReportPage'));
const StockReportPage = lazy(() => import('../modules/reports/StockReportPage'));
const ProfitReportPage = lazy(() => import('../modules/reports/ProfitReportPage'));
const CollectionReportPage = lazy(() => import('../modules/reports/CollectionReportPage'));
const ConsolidatedStockPage = lazy(() => import('../modules/reports/ConsolidatedStockPage'));
const DayEndClosurePage = lazy(() => import('../modules/reports/DayEndClosurePage'));
const ReportsQueriesLayout = lazy(() => import('../modules/reports/ReportsQueriesLayout'));
const DynamicReportPage = lazy(() => import('../modules/reports/DynamicReportPage'));
const GstSummaryReportPage = lazy(() => import('../modules/reports/GstSummaryReportPage'));
const Gstr1DetailedReportPage = lazy(() => import('../modules/reports/Gstr1DetailedReportPage'));
const StoreClosureAuditPage = lazy(() => import('../modules/reports/StoreClosureAuditPage'));
const OrderReportPage = lazy(() => import('../modules/reports/OrderReportPage'));
const HoMasterDashboard = lazy(() => import('../modules/reports/HoMasterDashboard'));
const InTransitMonitorPage = lazy(() => import('../modules/reports/InTransitMonitorPage'));

// Missing Report Pages
const LedgerReportPage = lazy(() => import('../modules/reports/LedgerReportPage'));
const BankBookPage = lazy(() => import('../modules/reports/BankBookPage'));
const CustomerReportPage = lazy(() => import('../modules/reports/CustomerReportPage'));
const VendorReportPage = lazy(() => import('../modules/reports/VendorReportPage'));
const MovementReportPage = lazy(() => import('../modules/reports/MovementReportPage'));
const DailyInwardReportPage = lazy(() => import('../modules/reports/DailyInwardReportPage'));
const AgeAnalysisPage = lazy(() => import('../modules/reports/AgeAnalysisPage'));
const YieldAnalysisPage = lazy(() => import('../modules/reports/YieldAnalysisPage'));

// Sales
const SalesBillListPage = lazy(() => import('../modules/sales/SalesListPage'));
const SalesBillFormPage = lazy(() => import('../modules/sales/BillingPage'));
const SalesReturnPage = lazy(() => import('../modules/sales/SalesReturnPage'));
import DeliveryChallanPage from '../modules/dispatch/DeliveryChallanPage';
import DeliveryChallanForm from '../modules/dispatch/DeliveryChallanForm';
import DispatchQueuePage from '../modules/dispatch/DispatchQueuePage';

// Purchase
const PurchaseListPage = lazy(() => import('../modules/purchase/PurchaseListPage'));
const PurchaseFormPage = lazy(() => import('../modules/purchase/PurchaseFormPage'));
const PurchaseOrderListPage = lazy(() => import('../modules/purchase/PurchaseOrderListPage'));
const PurchaseOrderFormPage = lazy(() => import('../modules/purchase/PurchaseOrderFormPage'));

// Production
const SupplierOutwardListPage = lazy(() => import('../modules/production/SupplierOutwardListPage'));
const SupplierOutwardFormPage = lazy(() => import('../modules/production/SupplierOutwardFormPage'));

// Settings & Tools
const CompanyProfilePage = lazy(() => import('../modules/settings/CompanyProfilePage'));
const ProfilePage = lazy(() => import('../modules/profile/ProfilePage'));
const DataImportExportPage = lazy(() => import('../modules/data/DataImportExportPage'));
const DataHubSubPage = lazy(() => import('../modules/data/DataHubSubPage'));
const SalesHubSubPage = lazy(() => import('../modules/sales/SalesHubSubPage'));
const VoucherListPage = lazy(() => import('../modules/accounts/VoucherListPage'));
const AccountMasterPage = lazy(() => import('../modules/accounts/AccountMasterPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// Placeholder for pages that are scaffolded but not yet built
const PlaceholderPage = ({ title = 'Coming Soon' }) => (
  <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
    <h2 style={{ fontWeight: 700 }}>{title}</h2>
    <p>This module is under construction.</p>
  </div>
);

// --- CONFIGURATIONS FOR DYNAMIC REPORTS ---
const CHALLAN_REPORT_CONFIG = {
  title: 'Sale Challan Report',
  description: 'List of all delivery challans issued to customers/stores.',
  endpoint: '/delivery-challans',
  dataKey: 'challans',
  columns: [
    { field: 'challanNo', headerName: 'Challan #' },
    { field: 'date', headerName: 'Date', transform: v => new Date(v).toLocaleDateString() },
    { field: 'partyName', headerName: 'Customer/Branch', transform: (v, row) => row.customerId?.name || row.storeId?.name || 'N/A' },
    { field: 'totalItems', headerName: 'Total Qty' },
    { field: 'grandTotal', headerName: 'Amount', transform: v => Number(v || 0).toLocaleString() }
  ],
  filterConfig: { showDateRange: true }
};

const SCHEME_REPORT_CONFIG = {
  title: 'Promotion Eligibility Report',
  description: 'Analysis of scheme performance and usage.',
  endpoint: '/pricing/schemes',
  dataKey: 'schemes',
  columns: [
    { field: 'name', headerName: 'Scheme Name' },
    { field: 'type', headerName: 'Type' },
    { field: 'status', headerName: 'Status' }
  ]
};

const AGENT_WISE_REPORT_CONFIG = {
  title: 'Agent Sales Analysis',
  description: 'Sales performance segmented by sales agents.',
  endpoint: '/sales/agent-report',
  dataKey: 'report',
  columns: [
    { field: 'agentName', headerName: 'Agent' },
    { field: 'billCount', headerName: 'Bills' },
    { field: 'totalSales', headerName: 'Total Sales', transform: v => Number(v || 0).toLocaleString() }
  ]
};

const STOCK_AGING_CONFIG = {
  title: 'Item Master Registry',
  description: 'Comprehensive list of all items in the master catalog.',
  endpoint: '/items',
  dataKey: 'items',
  columns: [
    { field: 'sku', headerName: 'SKU' },
    { field: 'itemName', headerName: 'Name' },
    { field: 'category', headerName: 'Category' },
    { field: 'mrp', headerName: 'MRP', transform: v => Number(v || 0).toLocaleString() }
  ]
};

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <Routes>
        <Route path="/" element={<Navigate to="/ho" replace />} />

        {/* Auth Routes */}
        <Route path="/login/:role" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/login" element={<Navigate to="/login/ho" replace />} />
        <Route path="/register/:role" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/register" element={<Navigate to="/register/ho" replace />} />

        {/* Head Office Panel */}
        <Route element={<RoleProtectedRoute allowedRoles={['admin', 'Admin', 'superadmin']} />}>
          <Route path="/ho" element={<RoleDashboardLayout />}>
            <Route index element={<DashboardHomePage />} />
            <Route path="master-dashboard" element={<HoMasterDashboard />} />

            {/* Masters */}
            <Route path="masters/suppliers" element={<SuppliersListPage />} />
            <Route path="suppliers/material-ledger" element={<MaterialLedgerPage />} />
            <Route path="masters/customers" element={<CustomersListPage />} />
            <Route path="masters/warehouses" element={<WarehousesListPage />} />

            {/* Accounting */}
            <Route path="accounts/vouchers" element={<VoucherListPage />} />

            {/* Inventory */}
            <Route path="masters/stores" element={<StoresListPage />} />
            <Route path="masters/brands" element={<BrandListPage />} />
            <Route path="masters/item-groups" element={<ItemGroupsListPage />} />
            <Route path="masters" element={<Navigate to="masters/suppliers" replace />} />

            {/* Unified Item Master */}
            <Route path="items" element={<ItemListPage />} />
            <Route path="items/new" element={<ItemFormPage />} />
            <Route path="items/view/:id" element={<ItemFormPage mode="view" />} />
            <Route path="items/edit/:id" element={<ItemFormPage mode="edit" />} />
            {/* Legacy param-first routes */}
            <Route path="items/:id/view" element={<ItemFormPage mode="view" />} />
            <Route path="items/:id/edit" element={<ItemFormPage mode="edit" />} />

            {/* Inventory */}
            <Route path="inventory" element={<Navigate to="inventory/stock-overview" replace />} />
            <Route path="inventory/stock-overview" element={<StockOverviewPage />} />
            <Route path="inventory/adjustment" element={<StockAdjustmentPage />} />
            <Route path="inventory/movements" element={<MovementHistoryPage />} />
            <Route path="inventory/audit-view" element={<StockAuditView />} />
            <Route path="inventory/opening-stock" element={<OpeningStockPage />} />
            <Route path="inventory/bulk-import-store-stock" element={<StoreOpeningStockImport />} />

            {/* GRN */}
            <Route path="inventory/grn" element={<GRNListPage />} />
            <Route path="inventory/grn/new" element={<GRNFormPage />} />
            <Route path="inventory/grn/edit/:id" element={<GRNFormPage />} />
            <Route path="inventory/grn/view/:id" element={<GRNFormPage mode="view" />} />

            {/* Transfer (placeholder until built) */}
            <Route path="inventory/transfer" element={<PlaceholderPage title="Stock Transfer" />} />
            <Route path="inventory/transfer/new" element={<PlaceholderPage title="New Transfer" />} />
            <Route path="inventory/transfer/:id/view" element={<PlaceholderPage title="View Transfer" />} />
            <Route path="inventory/transfer/:id/edit" element={<PlaceholderPage title="Edit Transfer" />} />
            <Route path="inventory/audit" element={<PlaceholderPage title="Stock Audit" />} />
            <Route path="inventory/supplier-outward" element={<PlaceholderPage title="Supplier Outward" />} />
            <Route path="inventory/supplier-outward/new" element={<PlaceholderPage title="New Supplier Outward" />} />
            <Route path="inventory/supplier-outward/:id" element={<PlaceholderPage title="Supplier Outward Detail" />} />
            <Route path="inventory/material-ledger" element={<MaterialLedgerPage />} />
            <Route path="inventory/consumption" element={<PlaceholderPage title="Material Consumption" />} />
            <Route path="inventory/consumption/new" element={<PlaceholderPage title="New Consumption" />} />
            <Route path="inventory/raw-materials" element={<PlaceholderPage title="Raw Materials" />} />
            <Route path="inventory/raw-materials/new" element={<PlaceholderPage title="Add Raw Material" />} />
            <Route path="inventory/raw-materials/edit/:id" element={<PlaceholderPage title="Edit Raw Material" />} />
            <Route path="inventory/accessory-entry" element={<PlaceholderPage title="Accessory Entry" />} />

            {/* Sales */}
            <Route path="sales">
              <Route index element={<Navigate to="sale-bill" replace />} />
              <Route path="sale-bill" element={<SalesBillListPage />} />
              <Route path="sale-bill/new" element={<SalesBillFormPage />} />
              <Route path="sales-return" element={<SalesReturnPage />} />
              <Route path="sales-return/:id" element={<SalesReturnPage />} />
              <Route path=":key" element={<SalesHubSubPage />} />
            </Route>
            
            <Route path="sales/sale-challan" element={<PlaceholderPage title="Sale Challan" />} />
            <Route path="sales/sale-challan/new" element={<PlaceholderPage title="New Sale Challan" />} />
            <Route path="sales/sale-challan/:id" element={<PlaceholderPage title="Sale Challan Detail" />} />
            <Route path="sales/sale-challan/:id/edit" element={<PlaceholderPage title="Edit Sale Challan" />} />
             <Route path="orders">
               <Route index element={<Navigate to="delivery-challan" replace />} />
               <Route path="delivery-challan" element={<DeliveryChallanPage />} />
               <Route path="dispatch-queue" element={<DispatchQueuePage />} />
               <Route path="delivery-challan/new" element={<DeliveryChallanForm />} />
               <Route path="delivery-challan/:id" element={<DeliveryChallanForm mode="view" />} />
               <Route path="delivery-challan/:id/edit" element={<DeliveryChallanForm mode="edit" />} />
               <Route path="delivery-challan/:id/receive" element={<DeliveryChallanForm mode="receive" />} />
               <Route path="delivery-challan/:id/billing" element={<DeliveryChallanForm mode="billing" />} />
             </Route>
            <Route path="sale-challan" element={<Navigate to="sales/sale-challan" replace />} />
            <Route path="sale-challans" element={<Navigate to="sales/sale-challan" replace />} />

            {/* Purchase */}
            <Route path="purchase" element={<PurchaseListPage />} />
            <Route path="purchase/new" element={<PurchaseFormPage />} />
            <Route path="purchase/purchase-order" element={<PurchaseOrderListPage />} />
            <Route path="purchase/purchase-order/new" element={<PurchaseOrderFormPage />} />
            <Route path="purchase/purchase-order/edit/:id" element={<PurchaseOrderFormPage />} />
            <Route path="purchase/purchase-voucher" element={<Navigate to="/ho/purchase" replace />} />

            {/* Pricing */}
            <Route path="pricing" element={<Navigate to="pricing/price-lists" replace />} />
            <Route path="pricing/price-lists" element={<PriceListPage />} />
            <Route path="pricing/price-lists/new" element={<PriceListFormPage />} />
            <Route path="pricing/schemes" element={<SchemeListPage />} />
            <Route path="pricing/schemes/new" element={<SchemeFormPage />} />
            <Route path="pricing/schemes/:id/edit" element={<SchemeFormPage mode="edit" />} />
            <Route path="pricing/groups" element={<PromotionGroupPage />} />
            <Route path="pricing/types" element={<PromotionTypesMaster />} />

            {/* Production / Job Work */}
            <Route path="production/outwards" element={<SupplierOutwardListPage />} />
            <Route path="production/outwards/new" element={<SupplierOutwardFormPage />} />
            <Route path="production/outwards/view/:id" element={<SupplierOutwardFormPage mode="view" />} />

            {/* Customers */}
            <Route path="customers" element={<Navigate to="customers/rewards" replace />} />
            <Route path="customers/regions" element={<PlaceholderPage title="Customer Regions" />} />
            
            {/* Setup */}
            <Route path="setup" element={<PlaceholderPage title="Setup" />} />
            <Route path="setup/groups" element={<GroupsPage />} />
            <Route path="setup/hsn-codes" element={<HSNCodePage />} />
            <Route path="setup/sizes" element={<SizesPage />} />
            <Route path="setup/barcode-print" element={<BarcodePrintingPage />} />
            <Route path="setup/salesmen" element={<SalesmanListPage />} />
            <Route path="setup/stores" element={<PlaceholderPage title="Store Setup" />} />
            <Route path="setup/counters" element={<PlaceholderPage title="Counter Master" />} />
            <Route path="setup/taxes" element={<Navigate to="/ho/gst/tax-rates" replace />} />
            <Route path="setup/accounts" element={<Navigate to="setup/accounts/custom-fields" replace />} />
            <Route path="setup/accounts/custom-fields" element={<PlaceholderPage title="Custom Fields" />} />
            <Route path="setup/accounts/country" element={<PlaceholderPage title="Country Setup" />} />
            <Route path="setup/accounts/states" element={<PlaceholderPage title="States" />} />
            <Route path="setup/accounts/city" element={<PlaceholderPage title="City" />} />
            <Route path="setup/accounts/new-account" element={<AccountMasterPage />} />
            <Route path="setup/configurations" element={<PlaceholderPage title="Configurations" />} />
            <Route path="setup/party-wise" element={<PlaceholderPage title="Party Wise Rules" />} />
            <Route path="setup/other-account-details" element={<PlaceholderPage title="Other Account Details" />} />

            {/* Reports */}
            <Route path="reports" element={<ReportsQueriesLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ReportsDashboard />} />
              
              {/* Core Financial Reports */}
              <Route path="sales" element={<SalesReportPage />} />
              <Route path="purchase" element={<PurchaseReportPage />} />
              <Route path="stock" element={<StockReportPage />} />
              <Route path="ledger" element={<LedgerReportPage />} />
              <Route path="bank-book" element={<BankBookPage />} />
              <Route path="collection" element={<CollectionReportPage />} />
              
              {/* Analysis & Audit */}
              <Route path="profit" element={<ProfitReportPage />} />
              <Route path="consolidated" element={<ConsolidatedStockPage />} />
              <Route path="closure-history" element={<StoreClosureAuditPage />} />
              <Route path="closure" element={<DayEndClosurePage />} />
              <Route path="movement" element={<MovementReportPage />} />
              <Route path="inward" element={<DailyInwardReportPage />} />
              <Route path="age-analysis" element={<AgeAnalysisPage />} />
              <Route path="production/yield" element={<YieldAnalysisPage />} />
              <Route path="gst/summary" element={<GstSummaryReportPage />} />
              <Route path="gstr1" element={<Gstr1DetailedReportPage />} />
              
              {/* Dynamic & Other Reports */}
              <Route path="sale-challan-reports" element={<DynamicReportPage config={CHALLAN_REPORT_CONFIG} />} />
              <Route path="scheme-reports" element={<DynamicReportPage config={SCHEME_REPORT_CONFIG} />} />
              <Route path="agent-wise-reports" element={<DynamicReportPage config={AGENT_WISE_REPORT_CONFIG} />} />
              <Route path="order-reports" element={<OrderReportPage />} />
              <Route path="item-reports" element={<DynamicReportPage config={STOCK_AGING_CONFIG} />} />
              <Route path="customers" element={<CustomerReportPage />} />
              <Route path="vendors" element={<VendorReportPage />} />
              <Route path="in-transit" element={<InTransitMonitorPage />} />

              {/* Duplicate/Alias Routes for consistency */}
              <Route path="stock-reports" element={<StockReportPage />} />
              <Route path="sale-registers" element={<SalesReportPage />} />
              <Route path="financial-analysis" element={<GstSummaryReportPage />} />
              <Route path="purchase-reports" element={<PurchaseReportPage />} />
            </Route>

            {/* Settings */}
            <Route path="settings/company" element={<CompanyProfilePage />} />
            <Route path="data-import">
              <Route index element={<DataImportExportPage />} />
              <Route path=":key" element={<DataHubSubPage />} />
            </Route>
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Store/Branch Portal */}
        <Route path="/store" element={<RoleProtectedRoute allowedRoles={['Staff', 'store_staff', 'store_manager', 'accountant', 'Manager', 'Accountant', 'store_manager_admin']}><RoleDashboardLayout /></RoleProtectedRoute>}>
          <Route index element={<DashboardHomePage />} />
          <Route path="inventory/stock-overview" element={<StockOverviewPage />} />
          <Route path="inventory/bulk-import-store-stock" element={<StoreOpeningStockImport />} />
          <Route path="inventory/receipt" element={<DeliveryChallanPage />} />
          <Route path="inventory/audit-view" element={<StockAuditView />} />
          <Route path="sales/sale-bill/new" element={<SalesBillFormPage />} />
          <Route path="sales/sale-bill" element={<SalesBillListPage returnPathBuilder={(saleId) => `/sales/sales-return/${saleId}`} />} />
          <Route path="sales/sales-return" element={<SalesReturnPage listPath="/store/sales/sale-bill" />} />
          <Route path="sales/sales-return/:id" element={<SalesReturnPage listPath="/store/sales/sale-bill" />} />
          <Route path="reports" element={<ReportsDashboard />} />
          <Route path="reports/sales" element={<SalesReportPage />} />
          <Route path="reports/inward" element={<DailyInwardReportPage />} />
          <Route path="reports/stock" element={<StockReportPage />} />
          <Route path="reports/collection" element={<CollectionReportPage />} />
          <Route path="reports/closure" element={<DayEndClosurePage />} />
          <Route path="profile" element={<ProfilePage />} />
          
          {/* Delivery Challan / Receipt Routes for Store */}
          <Route path="orders/delivery-challan" element={<DeliveryChallanPage />} />
          <Route path="orders/delivery-challan/:id/receive" element={<DeliveryChallanForm mode="receive" />} />
          <Route path="orders/delivery-challan/:id" element={<DeliveryChallanForm mode="view" />} />
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
