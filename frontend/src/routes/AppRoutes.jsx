import { Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import RoleDashboardLayout from '../layouts/RoleDashboardLayout';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DashboardHome from '../pages/dashboard/DashboardHome';
import SettingsLayout from '../modules/settings/SettingsLayout';
import CompanyProfilePage from '../modules/settings/CompanyProfilePage';
import UsersPage from '../modules/settings/UsersPage';
import RolesPage from '../modules/settings/RolesPage';
import NumberSeriesPage from '../modules/settings/NumberSeriesPage';
import PreferencesPage from '../modules/settings/PreferencesPage';
import PurchaseVoucherConfigPage from '../modules/settings/PurchaseVoucherConfigPage';
import PrintTemplatesPage from '../modules/settings/PrintTemplatesPage';
import AuditLogPage from '../modules/settings/AuditLogPage';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import RoleProtectedRoute from './RoleProtectedRoute';
import RoleRedirect from './RoleRedirect';
import MastersLayout from '../modules/masters/MastersLayout';
import SuppliersListPage from '../modules/masters/suppliers/ListPage';
import CustomersListPage from '../modules/masters/customers/ListPage';
import AccountGroupsListPage from '../modules/masters/accountGroups/ListPage';
import WarehousesListPage from '../modules/masters/warehouses/ListPage';
import StoresListPage from '../modules/masters/stores/ListPage';
import BrandsListPage from '../modules/masters/brands/ListPage';
import ItemGroupsListPage from '../modules/masters/itemGroups/ListPage';
import SalesmenListPage from '../modules/masters/salesmen/ListPage';
import BanksListPage from '../modules/masters/banks/ListPage';
import ItemListPage from '../modules/items/ItemListPage';
import ItemFormPage from '../modules/items/ItemFormPage';
import StockOverviewPage from '../modules/inventory/StockOverviewPage';
import StockInPage from '../modules/inventory/StockInPage';
import StockTransferPage from '../modules/inventory/StockTransferPage';
import StockAuditPage from '../modules/inventory/StockAuditPage';
import StockAdjustmentPage from '../modules/inventory/StockAdjustmentPage';
import MovementHistoryPage from '../modules/inventory/MovementHistoryPage';
import PurchaseListPage from '../modules/purchase/PurchaseListPage';
import PurchaseFormPage from '../modules/purchase/PurchaseFormPage';
import PurchaseOrderListPage from '../modules/purchase/PurchaseOrderListPage';
import PurchaseOrderFormPage from '../modules/purchase/PurchaseOrderFormPage';
import PurchaseReturnPage from '../modules/purchase/PurchaseReturnPage';
import SalesListPage from '../modules/sales/SalesListPage';
import BillingPage from '../modules/sales/BillingPage';
import SalesReturnPage from '../modules/sales/SalesReturnPage';
import PriceListPage from '../modules/pricing/PriceListPage';
import PriceListFormPage from '../modules/pricing/PriceListFormPage';
import SchemeListPage from '../modules/pricing/SchemeListPage';
import SchemeFormPage from '../modules/pricing/SchemeFormPage';
import CouponPage from '../modules/pricing/CouponPage';
import LoyaltyConfigPage from '../modules/customers/LoyaltyConfigPage';
import VoucherListPage from '../modules/customers/VoucherListPage';
import VoucherFormPage from '../modules/customers/VoucherFormPage';
import CreditNotesPage from '../modules/customers/CreditNotesPage';
import CustomerRewardsPage from '../modules/customers/CustomerRewardsPage';
import ReportsDashboard from '../modules/reports/ReportsDashboard';
import SalesReportPage from '../modules/reports/SalesReportPage';
import PurchaseReportPage from '../modules/reports/PurchaseReportPage';
import StockReportPage from '../modules/reports/StockReportPage';
import ProfitReportPage from '../modules/reports/ProfitReportPage';
import CustomerReportPage from '../modules/reports/CustomerReportPage';
import VendorReportPage from '../modules/reports/VendorReportPage';
import MovementReportPage from '../modules/reports/MovementReportPage';
import AgeAnalysisPage from '../modules/reports/AgeAnalysisPage';
import LedgerReportPage from '../modules/reports/LedgerReportPage';
import BankBookPage from '../modules/reports/BankBookPage';
import CollectionReportPage from '../modules/reports/CollectionReportPage';
import TaxRatesPage from '../modules/gst/TaxRatesPage';
import TaxGroupPage from '../modules/gst/TaxGroupPage';
import InvoiceTaxReportPage from '../modules/gst/InvoiceTaxReportPage';
import GSTRSummaryPage from '../modules/gst/GSTRSummaryPage';
import AccountsDashboard from '../modules/accounts/AccountsDashboard';
import BankPaymentPage from '../modules/accounts/BankPaymentPage';
import BankReceiptPage from '../modules/accounts/BankReceiptPage';
import SaleOrderListPage from '../modules/orders/SaleOrderListPage';
import SaleOrderFormPage from '../modules/orders/SaleOrderFormPage';
import PackingSlipPage from '../modules/orders/PackingSlipPage';
import DeliveryOrderPage from '../modules/orders/DeliveryOrderPage';
import DeliveryChallanPage from '../modules/dispatch/DeliveryChallanPage';
import DeliveryChallanForm from '../modules/dispatch/DeliveryChallanForm';
import DataImportExportPage from '../modules/data/DataImportExportPage';
import PurchaseReturnPageStaff from '../modules/store/PurchaseReturnPage';
import HSNCodePage from '../modules/setup/HSNCodePage';
import AccountMasterPage from '../modules/setup/AccountMasterPage';
import BarcodePrintingPage from '../modules/setup/BarcodePrintingPage';
import StoreMasterPage from '../modules/setup/StoreMasterPage';
import DiscountSetupPage from '../modules/setup/DiscountSetupPage';
import CounterMasterPage from '../modules/setup/CounterMasterPage';
import NotFoundPage from '../pages/NotFoundPage';





function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/:role" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/:role" element={<RegisterPage />} />
        </Route>
      </Route>

      <Route path="/" element={<RoleRedirect />} />

      <Route element={<RoleProtectedRoute allowedRoles={['admin', 'Admin']} />}>
        <Route path="/ho" element={<RoleDashboardLayout />}>
          <Route index element={<DashboardHome />} />
      <Route path="masters" element={<MastersLayout />}>
        <Route index element={<Navigate to="suppliers" replace />} />
        <Route path="suppliers" element={<SuppliersListPage />} />
        <Route path="customers" element={<CustomersListPage />} />
        <Route path="account-groups" element={<AccountGroupsListPage />} />
        <Route path="warehouses" element={<WarehousesListPage />} />
        <Route path="stores" element={<StoresListPage />} />
        <Route path="brands" element={<BrandsListPage />} />
        <Route path="item-groups" element={<ItemGroupsListPage />} />
        <Route path="salesmen" element={<SalesmenListPage />} />
        <Route path="banks" element={<BanksListPage />} />
      </Route>
      <Route path="items" element={<ItemListPage />} />
      <Route path="items/new" element={<ItemFormPage />} />
      <Route path="items/:id/edit" element={<ItemFormPage />} />
      <Route path="inventory" element={<Navigate to="stock-overview" replace />} />
      <Route path="inventory/stock-overview" element={<StockOverviewPage />} />
      <Route path="inventory/stock-in" element={<StockInPage />} />
      <Route path="inventory/transfer" element={<StockTransferPage />} />
      <Route path="inventory/transfer-receive" element={<StockTransferPage />} />
      <Route path="inventory/audit" element={<StockAuditPage />} />
      <Route path="inventory/adjustment" element={<StockAdjustmentPage />} />
      <Route path="inventory/movements" element={<MovementHistoryPage />} />
      <Route path="purchase" element={<PurchaseListPage />} />
      <Route path="purchase/orders" element={<PurchaseOrderListPage />} />
      <Route path="purchase/orders/new" element={<PurchaseOrderFormPage />} />
      <Route path="purchase/orders/:id" element={<PurchaseOrderFormPage />} />
      <Route path="purchase/new" element={<PurchaseFormPage />} />
      <Route path="purchase/:id" element={<PurchaseFormPage />} />
      <Route path="purchase/:id/return" element={<PurchaseReturnPage />} />
      <Route path="purchase/return" element={<PurchaseReturnPageStaff />} />
      <Route path="orders" element={<SaleOrderListPage />} />
      <Route path="orders/delivery" element={<DeliveryOrderPage />} />
      <Route path="orders/delivery-challan" element={<DeliveryChallanPage />} />
      <Route path="orders/delivery-challan/new" element={<DeliveryChallanForm />} />
      <Route path="sales" element={<SalesListPage />} />
      <Route path="sales/returns" element={<SalesListPage />} />
      <Route path="sales/new" element={<BillingPage />} />
      <Route path="sales/:id" element={<BillingPage />} />
      <Route path="sales/:id/return" element={<SalesReturnPage />} />
      <Route path="pricing" element={<Navigate to="price-lists" replace />} />
      <Route path="pricing/price-lists" element={<PriceListPage />} />
      <Route path="pricing/price-lists/new" element={<PriceListFormPage />} />
      <Route path="pricing/price-lists/:id/edit" element={<PriceListFormPage />} />
      <Route path="pricing/schemes" element={<SchemeListPage />} />
      <Route path="pricing/schemes/new" element={<SchemeFormPage />} />
      <Route path="pricing/schemes/:id/edit" element={<SchemeFormPage />} />
      <Route path="pricing/coupons" element={<CouponPage />} />
      <Route path="customers" element={<Navigate to="rewards" replace />} />
      <Route path="customers/rewards" element={<CustomerRewardsPage />} />
      <Route path="customers/loyalty-config" element={<LoyaltyConfigPage />} />
      <Route path="customers/vouchers" element={<VoucherListPage />} />
      <Route path="customers/vouchers/new" element={<VoucherFormPage />} />
      <Route path="customers/credit-notes" element={<CreditNotesPage />} />
      <Route path="setup" element={<Navigate to="accounts" replace />} />
      <Route path="setup/stores" element={<StoreMasterPage />} />
      <Route path="setup/hsn-codes" element={<HSNCodePage />} />
      <Route path="setup/accounts" element={<AccountMasterPage />} />
      <Route path="setup/barcode-print" element={<BarcodePrintingPage />} />
      <Route path="setup/discounts" element={<DiscountSetupPage />} />
      <Route path="setup/counters" element={<CounterMasterPage />} />
      <Route path="data-import" element={<DataImportExportPage />} />
      <Route path="reports" element={<ReportsDashboard />} />
      <Route path="reports/sales" element={<SalesReportPage />} />
      <Route path="reports/purchase" element={<PurchaseReportPage />} />
      <Route path="reports/ledger" element={<LedgerReportPage />} />
      <Route path="reports/stock" element={<StockReportPage />} />
      <Route path="reports/profit" element={<ProfitReportPage />} />
      <Route path="reports/collection" element={<CollectionReportPage />} />
      <Route path="gst" element={<Navigate to="tax-rates" replace />} />
      <Route path="gst/tax-rates" element={<TaxRatesPage />} />
      <Route path="gst/tax-groups" element={<TaxGroupPage />} />
      <Route path="gst/invoice-report" element={<InvoiceTaxReportPage />} />
      <Route path="gst/gstr-summary" element={<GSTRSummaryPage />} />
      <Route path="accounts" element={<AccountsDashboard />} />
      <Route path="accounts/bank-payment" element={<BankPaymentPage />} />
      <Route path="accounts/bank-receipt" element={<BankReceiptPage />} />
      <Route path="settings" element={<SettingsLayout />}>
        <Route index element={<Navigate to="company" replace />} />
        <Route path="company" element={<CompanyProfilePage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="number-series" element={<NumberSeriesPage />} />
        <Route path="preferences" element={<PreferencesPage />} />
        <Route path="purchase-voucher" element={<PurchaseVoucherConfigPage />} />
        <Route path="print-templates" element={<PrintTemplatesPage />} />
        <Route path="audit-logs" element={<AuditLogPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      <Route element={<RoleProtectedRoute allowedRoles={['store_staff', 'Staff', 'Manager', 'admin', 'Admin']} />}>
        <Route path="/store" element={<RoleDashboardLayout />}>
          <Route index element={<DashboardHome />} />
      <Route path="items" element={<ItemListPage />} />
      <Route path="inventory" element={<Navigate to="stock-overview" replace />} />
      <Route path="inventory/stock-overview" element={<StockOverviewPage />} />
      <Route path="inventory/stock-in" element={<StockInPage />} />
      <Route path="inventory/transfer" element={<StockTransferPage />} />
      <Route path="inventory/transfer-receive" element={<StockTransferPage />} />
      <Route path="purchase" element={<PurchaseListPage />} />
      <Route path="purchase/new" element={<PurchaseFormPage />} />
      <Route path="purchase/:id" element={<PurchaseFormPage />} />
      <Route path="purchase/return" element={<PurchaseReturnPageStaff />} />
      <Route path="purchase-return" element={<PurchaseReturnPageStaff />} />
      <Route path="sales" element={<SalesListPage />} />
      <Route path="sales/new" element={<BillingPage />} />
      <Route path="sales/returns" element={<SalesListPage />} />
      <Route path="sales/:id" element={<BillingPage />} />
      <Route path="sales/:id/return" element={<SalesReturnPage />} />
      <Route path="reports" element={<ReportsDashboard />} />
      <Route path="reports/sales" element={<SalesReportPage />} />
      <Route path="reports/purchase" element={<PurchaseReportPage />} />
      <Route path="reports/stock" element={<StockReportPage />} />
      <Route path="reports/profit" element={<ProfitReportPage />} />
      <Route path="reports/ledger" element={<LedgerReportPage />} />
      <Route path="reports/collection" element={<CollectionReportPage />} />
      <Route path="data-import" element={<DataImportExportPage />} />
      <Route path="*" element={<Navigate to="" replace />} />
        </Route>
      </Route>

      {/* Redirect legacy manager/staff/admin paths to consolidated paths */}
      <Route path="/admin/*" element={<Navigate to="/ho" replace />} />
      <Route path="/staff/*" element={<Navigate to="/store" replace />} />
      <Route path="/manager/*" element={<Navigate to="/store" replace />} />

      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  );
}

export default AppRoutes;
