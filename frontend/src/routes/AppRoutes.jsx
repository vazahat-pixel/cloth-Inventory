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

const GroupsPage = lazy(() => import('../modules/setup/GroupsPage'));
const HSNCodePage = lazy(() => import('../modules/setup/HSNCodePage'));
const SizesPage = lazy(() => import('../modules/setup/SizesPage'));
const BarcodePrintingPage = lazy(() => import('../modules/setup/BarcodePrintingPage'));
const BrandListPage = lazy(() => import('../modules/masters/brands/ListPage'));

// Masters
const SuppliersListPage = lazy(() => import('../modules/masters/suppliers/ListPage'));
const CustomersListPage = lazy(() => import('../modules/masters/customers/ListPage'));
const StoresListPage = lazy(() => import('../modules/masters/stores/ListPage'));
const WarehousesListPage = lazy(() => import('../modules/masters/warehouses/ListPage'));

// Inventory
const StockOverviewPage = lazy(() => import('../modules/inventory/StockOverviewPage'));
const StockAdjustmentPage = lazy(() => import('../modules/inventory/StockAdjustmentPage'));
const MovementHistoryPage = lazy(() => import('../modules/inventory/MovementHistoryPage'));
const StockAuditView = lazy(() => import('../modules/inventory/StockAuditView'));

// Purchase
const PurchaseListPage = lazy(() => import('../modules/purchase/PurchaseListPage'));
const PurchaseFormPage = lazy(() => import('../modules/purchase/PurchaseFormPage'));

// Sales & Orders
const SalesBillListPage = lazy(() => import('../modules/sales/SalesListPage')); 
const SalesBillFormPage = lazy(() => import('../modules/sales/BillingPage')); 
const SalesReturnPage = lazy(() => import('../modules/sales/SalesReturnPage'));

// Reports
const ReportsDashboard = lazy(() => import('../modules/reports/ReportsDashboard'));
const SalesReportPage = lazy(() => import('../modules/reports/SalesReportPage'));
const PurchaseReportPage = lazy(() => import('../modules/reports/PurchaseReportPage'));
const StockReportPage = lazy(() => import('../modules/reports/StockReportPage'));
const ProfitReportPage = lazy(() => import('../modules/reports/ProfitReportPage'));
const CollectionReportPage = lazy(() => import('../modules/reports/CollectionReportPage'));
const ConsolidatedStockPage = lazy(() => import('../modules/reports/ConsolidatedStockPage'));
const DayEndClosurePage = lazy(() => import('../modules/reports/DayEndClosurePage'));

// Dynamic Reports
const ReportsQueriesLayout = lazy(() => import('../modules/reports/ReportsQueriesLayout'));
const DynamicReportPage = lazy(() => import('../modules/reports/DynamicReportPage'));
const GstSummaryReportPage = lazy(() => import('../modules/reports/GstSummaryReportPage'));
const StoreClosureAuditPage = lazy(() => import('../modules/reports/StoreClosureAuditPage'));
const InTransitMonitorPage = lazy(() => import('../modules/reports/InTransitMonitorPage'));
const OrderReportPage = lazy(() => import('../modules/reports/OrderReportPage'));

// Settings & Tools
const CompanyProfilePage = lazy(() => import('../modules/settings/CompanyProfilePage'));
const ProfilePage = lazy(() => import('../modules/profile/ProfilePage'));
const DataImportExportPage = lazy(() => import('../modules/data/DataImportExportPage'));
const GRNListPage = lazy(() => import('../modules/grn/GRNListPage'));
const GRNFormPage = lazy(() => import('../modules/grn/GRNFormPage'));
const HoMasterDashboard = lazy(() => import('../modules/reports/HoMasterDashboard'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

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

        {/* Head Office Admin Portal */}
        <Route path="/ho" element={<RoleProtectedRoute allowedRoles={['Admin']}><RoleDashboardLayout /></RoleProtectedRoute>}>
          <Route index element={<DashboardHomePage />} />

          {/* Catalog & Masters */}
          <Route path="items" element={<ItemListPage />} />
          <Route path="items/new" element={<ItemFormPage />} />
          <Route path="items/edit/:id" element={<ItemFormPage />} />
          <Route path="items/view/:id" element={<ItemFormPage mode="view" />} />

          <Route path="masters/suppliers" element={<SuppliersListPage />} />
          <Route path="masters/customers" element={<CustomersListPage />} />
          <Route path="masters/stores" element={<StoresListPage />} />
          <Route path="masters/warehouses" element={<WarehousesListPage />} />
          <Route path="masters/brands" element={<BrandListPage />} />

          {/* Setup Links (Moved from Setup Module to Main) */}
          <Route path="setup/groups" element={<GroupsPage />} />
          <Route path="setup/hsn-codes" element={<HSNCodePage />} />
          <Route path="setup/sizes" element={<SizesPage />} />
          <Route path="setup/barcode-print" element={<BarcodePrintingPage />} />

          {/* Inventory Controls */}
          <Route path="inventory/stock-overview" element={<StockOverviewPage />} />
          <Route path="inventory/adjustment" element={<StockAdjustmentPage />} />
          <Route path="inventory/movements" element={<MovementHistoryPage />} />
          <Route path="inventory/audit-view" element={<StockAuditView />} />

          {/* Finance & Sales */}
          <Route path="sales" element={<Navigate to="sale-bill" replace />} />
          <Route path="sales/sale-bill" element={<SalesBillListPage />} />
          <Route path="sales/sale-bill/new" element={<SalesBillFormPage />} />
          <Route path="sales/sale-bill/edit/:id" element={<SalesBillFormPage />} />
          <Route path="sales/sales-return" element={<SalesReturnPage />} />

          {/* Purchase Operations */}
          <Route path="purchase" element={<PurchaseListPage />} />
          <Route path="purchase/new" element={<PurchaseFormPage />} />
          <Route path="purchase/edit/:id" element={<PurchaseFormPage />} />
          <Route path="purchase/view/:id" element={<PurchaseFormPage mode="view" />} />

          {/* Reports & BI */}
          <Route path="reports" element={<ReportsQueriesLayout />}>
            <Route index element={<HoMasterDashboard />} />
            <Route path="analytics" element={<ReportsDashboard />} />

            {/* Specialized Reports */}
            <Route path="sales" element={<SalesReportPage />} />
            <Route path="purchase" element={<PurchaseReportPage />} />
            <Route path="stock" element={<StockReportPage />} />
            <Route path="profit" element={<ProfitReportPage />} />
            <Route path="collection" element={<CollectionReportPage />} />
            <Route path="consolidated" element={<ConsolidatedStockPage />} />
            <Route path="closure-history" element={<StoreClosureAuditPage />} />
            <Route path="closure" element={<DayEndClosurePage />} />

            {/* Dynamic Engine Reports */}
            <Route path="sale-challan-reports" element={<DynamicReportPage config={CHALLAN_REPORT_CONFIG} />} />
            <Route path="scheme-reports" element={<DynamicReportPage config={SCHEME_REPORT_CONFIG} />} />
            <Route path="agent-wise-reports" element={<DynamicReportPage config={AGENT_WISE_REPORT_CONFIG} />} />
            <Route path="order-reports" element={<OrderReportPage />} />
            <Route path="item-reports" element={<DynamicReportPage config={STOCK_AGING_CONFIG} />} />
            <Route path="stock-reports" element={<StockReportPage />} />

            {/* Financial Analysis / Master Reports */}
            <Route path="financial-analysis" element={<GstSummaryReportPage />} />
            <Route path="sale-registers" element={<SalesReportPage />} />
          </Route>

          <Route path="settings/company" element={<CompanyProfilePage />} />
          <Route path="data-import" element={<DataImportExportPage />} />

          {/* GRN Unified Flow (Inventory & Purchase) */}
          <Route path="inventory/grn" element={<GRNListPage />} />
          <Route path="inventory/grn/new" element={<GRNFormPage />} />
          <Route path="inventory/grn/edit/:id" element={<GRNFormPage />} />
          <Route path="inventory/grn/view/:id" element={<GRNFormPage mode="view" />} />

          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Store/Branch Portal */}
        <Route path="/store" element={<RoleProtectedRoute allowedRoles={['Staff']}><RoleDashboardLayout /></RoleProtectedRoute>}>
          <Route index element={<DashboardHomePage />} />
          <Route path="inventory/stock-overview" element={<StockOverviewPage />} />
          <Route path="inventory/receipt" element={<MovementHistoryPage />} />
          <Route path="inventory/audit-view" element={<StockAuditView />} />

          <Route path="sales/sale-bill/new" element={<SalesBillFormPage />} />
          <Route path="sales/sale-bill" element={<SalesBillListPage />} />
          <Route path="sales/sales-return" element={<SalesReturnPage />} />

          <Route path="reports" element={<ReportsDashboard />} />
          <Route path="reports/sales" element={<SalesReportPage />} />
          <Route path="reports/purchase" element={<PurchaseReportPage />} />
          <Route path="reports/stock" element={<StockReportPage />} />
          <Route path="reports/collection" element={<CollectionReportPage />} />
          <Route path="reports/closure" element={<DayEndClosurePage />} />

          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
