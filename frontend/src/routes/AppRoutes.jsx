import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// Core Layouts & Pages (Static imports for reliability and speed)
// Layouts & Page Utilities (Static imports for reliability)
import AuthLayout from '../layouts/AuthLayout';
import RoleDashboardLayout from '../layouts/RoleDashboardLayout';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DashboardHome from '../pages/dashboard/DashboardHome';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import RoleProtectedRoute from './RoleProtectedRoute';
import RoleRedirect from './RoleRedirect';

// Loading Placeholder
const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
    <CircularProgress size={40} sx={{ color: '#10b981' }} />
  </Box>
);

// --- Modules (Lazy loaded by feature set to reduce network flood) ---

// Masters
const MastersLayout = lazy(() => import('../modules/masters/MastersLayout'));
const SuppliersListPage = lazy(() => import('../modules/masters/suppliers/ListPage'));
const CustomersListPage = lazy(() => import('../modules/masters/customers/ListPage'));
const AccountGroupsListPage = lazy(() => import('../modules/masters/accountGroups/ListPage'));
const WarehousesListPage = lazy(() => import('../modules/masters/warehouses/ListPage'));
const StoresListPage = lazy(() => import('../modules/masters/stores/ListPage'));
const BrandsListPage = lazy(() => import('../modules/masters/brands/ListPage'));
const ItemGroupsListPage = lazy(() => import('../modules/masters/itemGroups/ListPage'));
const SalesmenListPage = lazy(() => import('../modules/masters/salesmen/ListPage'));
const BanksListPage = lazy(() => import('../modules/masters/banks/ListPage'));
const SeasonsListPage = lazy(() => import('../modules/masters/seasons/ListPage'));

// Placeholders for incomplete modules
const PurchasePlaceholderPage = lazy(() => import('../modules/purchase/PurchasePlaceholderPage'));
const InventoryPlaceholderPage = lazy(() => import('../modules/inventory/InventoryPlaceholderPage'));
const BillingPlaceholderPage = lazy(() => import('../modules/sales/BillingPlaceholderPage'));
const SetupAccountsPlaceholderPage = lazy(() => import('../modules/setup/SetupAccountsPlaceholderPage'));
const OrdersContinuousPrintingPage = lazy(() => import('../modules/orders/OrdersContinuousPrintingPage'));

// Items & Setup
const ItemListPage = lazy(() => import('../modules/items/ItemListPage'));
const ItemFormPage = lazy(() => import('../modules/items/ItemFormPage'));
const GroupsPage = lazy(() => import('../modules/setup/GroupsPage'));
const SizesPage = lazy(() => import('../modules/setup/SizesPage'));

// Inventory
const StockOverviewPage = lazy(() => import('../modules/inventory/StockOverviewPage'));
const StockInPage = lazy(() => import('../modules/inventory/StockInPage'));
const StockTransferPage = lazy(() => import('../modules/inventory/StockTransferPage'));
const StockTransferFormPage = lazy(() => import('../modules/inventory/StockTransferFormPage'));
const StockAuditPage = lazy(() => import('../modules/inventory/StockAuditPage'));
const StockAdjustmentPage = lazy(() => import('../modules/inventory/StockAdjustmentPage'));
const MovementHistoryPage = lazy(() => import('../modules/inventory/MovementHistoryPage'));
const AuditDashboard = lazy(() => import('../modules/inventory/AuditDashboard'));
const ItemJourneyPage = lazy(() => import('../modules/inventory/ItemJourneyPage'));
const StockAuditView = lazy(() => import('../modules/inventory/StockAuditView'));
const ValidationDashboard = lazy(() => import('../modules/inventory/ValidationDashboard'));
const AuditLogViewer = lazy(() => import('../modules/inventory/AuditLogViewer'));

// Purchase & Orders
const PurchaseListPage = lazy(() => import('../modules/purchase/PurchaseListPage'));
const PurchaseFormPage = lazy(() => import('../modules/purchase/PurchaseFormPage'));
const PurchaseOrderListPage = lazy(() => import('../modules/purchase/PurchaseOrderListPage'));
const PurchaseOrderFormPage = lazy(() => import('../modules/purchase/PurchaseOrderFormPage'));
const PurchaseReturnPage = lazy(() => import('../modules/purchase/PurchaseReturnPage'));
const SaleOrderListPage = lazy(() => import('../modules/orders/SaleOrderListPage'));
const SaleOrderFormPage = lazy(() => import('../modules/orders/SaleOrderFormPage'));
const DeliveryOrderPage = lazy(() => import('../modules/orders/DeliveryOrderPage'));
const DeliveryChallanPage = lazy(() => import('../modules/dispatch/DeliveryChallanPage'));
const DeliveryChallanForm = lazy(() => import('../modules/dispatch/DeliveryChallanForm'));

// Sales & Billing
const SalesListPage = lazy(() => import('../modules/sales/SalesListPage'));
const BillingPage = lazy(() => import('../modules/sales/BillingPage'));
const SalesReturnPage = lazy(() => import('../modules/sales/SalesReturnPage'));

// Pricing
const PriceListPage = lazy(() => import('../modules/pricing/PriceListPage'));
const PriceListFormPage = lazy(() => import('../modules/pricing/PriceListFormPage'));
const SchemeListPage = lazy(() => import('../modules/pricing/SchemeListPage'));
const SchemeFormPage = lazy(() => import('../modules/pricing/SchemeFormPage'));
const CouponPage = lazy(() => import('../modules/pricing/CouponPage'));

// Customers
const LoyaltyConfigPage = lazy(() => import('../modules/customers/LoyaltyConfigPage'));
const VoucherListPage = lazy(() => import('../modules/customers/VoucherListPage'));
const VoucherFormPage = lazy(() => import('../modules/customers/VoucherFormPage'));
const CreditNotesPage = lazy(() => import('../modules/customers/CreditNotesPage'));
const CustomerRewardsPage = lazy(() => import('../modules/customers/CustomerRewardsPage'));

// Setup & GST
const SetupLandingPage = lazy(() => import('../modules/setup/SetupLandingPage'));
const SetupCustomFieldsAccountsPage = lazy(() => import('../modules/setup/SetupCustomFieldsAccountsPage'));
const SetupCountryPage = lazy(() => import('../modules/setup/SetupCountryPage'));
const SetupGenericTablePage = lazy(() => import('../modules/setup/SetupGenericTablePage'));
const AccountMasterPage = lazy(() => import('../modules/setup/AccountMasterPage'));
const StoreMasterPage = lazy(() => import('../modules/setup/StoreMasterPage'));
const HSNCodePage = lazy(() => import('../modules/setup/HSNCodePage'));
const FormulaPage = lazy(() => import('../modules/setup/FormulaPage'));
const BarcodePrintingPage = lazy(() => import('../modules/setup/BarcodePrintingPage'));
const DiscountSetupPage = lazy(() => import('../modules/setup/DiscountSetupPage'));
const CounterMasterPage = lazy(() => import('../modules/setup/CounterMasterPage'));


// Tax & GST Reports
const TaxRatesPage = lazy(() => import('../modules/gst/TaxRatesPage'));
const TaxGroupPage = lazy(() => import('../modules/gst/TaxGroupPage'));
const InvoiceTaxReportPage = lazy(() => import('../modules/gst/InvoiceTaxReportPage'));
const GSTRSummaryPage = lazy(() => import('../modules/gst/GSTRSummaryPage'));

// Accounts
const AccountsDashboard = lazy(() => import('../modules/accounts/AccountsDashboard'));
const BankPaymentPage = lazy(() => import('../modules/accounts/BankPaymentPage'));
const BankReceiptPage = lazy(() => import('../modules/accounts/BankReceiptPage'));
const ContinuousPrintingPage = lazy(() => import('../modules/accounts/ContinuousPrintingPage'));
const AccountsUtilitiesPage = lazy(() => import('../modules/accounts/AccountsUtilitiesPage'));

// Reports
const ReportsDashboard = lazy(() => import('../modules/reports/ReportsDashboard'));
const SalesReportPage = lazy(() => import('../modules/reports/SalesReportPage'));
const PurchaseReportPage = lazy(() => import('../modules/reports/PurchaseReportPage'));
const StockReportPage = lazy(() => import('../modules/reports/StockReportPage'));
const ProfitReportPage = lazy(() => import('../modules/reports/ProfitReportPage'));
const CustomerReportPage = lazy(() => import('../modules/reports/CustomerReportPage'));
const VendorReportPage = lazy(() => import('../modules/reports/VendorReportPage'));
const MovementReportPage = lazy(() => import('../modules/reports/MovementReportPage'));
const AgeAnalysisPage = lazy(() => import('../modules/reports/AgeAnalysisPage'));
const LedgerReportPage = lazy(() => import('../modules/reports/LedgerReportPage'));
const BankBookPage = lazy(() => import('../modules/reports/BankBookPage'));
const CollectionReportPage = lazy(() => import('../modules/reports/CollectionReportPage'));

// Misc
const SettingsLayout = lazy(() => import('../modules/settings/SettingsLayout'));
const CompanyProfilePage = lazy(() => import('../modules/settings/CompanyProfilePage'));
const UsersPage = lazy(() => import('../modules/settings/UsersPage'));
const RolesPage = lazy(() => import('../modules/settings/RolesPage'));
const NumberSeriesPage = lazy(() => import('../modules/settings/NumberSeriesPage'));
const PreferencesPage = lazy(() => import('../modules/settings/PreferencesPage'));
const PurchaseVoucherConfigPage = lazy(() => import('../modules/settings/PurchaseVoucherConfigPage'));
const PrintTemplatesPage = lazy(() => import('../modules/settings/PrintTemplatesPage'));
const AuditLogPage = lazy(() => import('../modules/settings/AuditLogPage'));
const ProfilePage = lazy(() => import('../modules/profile/ProfilePage'));
const DataImportExportPage = lazy(() => import('../modules/data/DataImportExportPage'));
const GRNListPage = lazy(() => import('../modules/grn/GRNListPage'));
const GRNFormPage = lazy(() => import('../modules/grn/GRNFormPage'));
const LogicERPManager = lazy(() => import('../modules/erp/LogicERPManager'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
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

        {/* Head Office Panel */}
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
              <Route path="seasons" element={<SeasonsListPage />} />
            </Route>

            <Route path="items" element={<ItemListPage />} />
            <Route path="items/new" element={<ItemFormPage />} />
            <Route path="items/:id/view" element={<ItemFormPage mode="view" />} />
            <Route path="items/:id/edit" element={<ItemFormPage mode="edit" />} />

            <Route path="inventory" element={<Navigate to="stock-overview" replace />} />
            <Route path="inventory/stock-overview" element={<StockOverviewPage />} />
            <Route path="inventory/stock-in" element={<StockInPage />} />
            <Route path="inventory/transfer" element={<StockTransferPage />} />
            <Route path="inventory/transfer/new" element={<StockTransferFormPage />} />
            <Route path="inventory/transfer/:id/view" element={<StockTransferFormPage mode="view" />} />
            <Route path="inventory/transfer/:id/edit" element={<StockTransferFormPage mode="edit" />} />
            <Route path="inventory/audit" element={<StockAuditPage />} />
            <Route path="inventory/adjustment" element={<StockAdjustmentPage />} />
            <Route path="inventory/movements" element={<MovementHistoryPage />} />
            <Route path="inventory/demo-dashboard" element={<AuditDashboard />} />
            <Route path="inventory/item-journey" element={<ItemJourneyPage />} />
            <Route path="inventory/audit-view" element={<StockAuditView />} />
            <Route path="inventory/validation" element={<ValidationDashboard />} />
            <Route path="inventory/logs" element={<AuditLogViewer type="system" />} />
            <Route path="inventory/errors" element={<AuditLogViewer type="error" />} />

            <Route path="purchase" element={<Navigate to="purchase-voucher" replace />} />
            <Route path="purchase/purchase-voucher" element={<PurchaseListPage />} />
            <Route path="purchase/purchase-voucher/new" element={<PurchaseFormPage />} />
            <Route path="purchase/purchase-voucher/:id" element={<PurchaseFormPage />} />
            <Route path="purchase/purchase-challan" element={<PurchasePlaceholderPage pageKey="purchase-challan" />} />
            <Route path="purchase/rejection-replacements" element={<PurchasePlaceholderPage pageKey="rejection-replacements" />} />
            <Route path="purchase/qc-document" element={<PurchasePlaceholderPage pageKey="qc-document" />} />
            <Route path="purchase/purchase-return" element={<PurchasePlaceholderPage pageKey="purchase-return" />} />
            <Route path="purchase/purchase-return/:id" element={<PurchaseReturnPage />} />
            <Route path="purchase/purchase-return-challan" element={<PurchasePlaceholderPage pageKey="purchase-return-challan" />} />
            <Route path="purchase/purchase-return-replacements" element={<PurchasePlaceholderPage pageKey="purchase-return-replacements" />} />
            <Route path="purchase/purchase-return-rate-difference" element={<PurchasePlaceholderPage pageKey="purchase-return-rate-difference" />} />
            <Route path="purchase/stock-receipt-consignment" element={<PurchasePlaceholderPage pageKey="stock-receipt-consignment" />} />
            <Route path="purchase/purchase-return-consignment" element={<PurchasePlaceholderPage pageKey="purchase-return-consignment" />} />
            <Route path="purchase/stock-transfer-in" element={<PurchasePlaceholderPage pageKey="stock-transfer-in" />} />
            <Route path="purchase/assign-sim-mobile" element={<PurchasePlaceholderPage pageKey="assign-sim-mobile" />} />
            <Route path="purchase/stock-adjustment" element={<PurchasePlaceholderPage pageKey="stock-adjustment" />} />
            <Route path="purchase/generate-debit-notes" element={<PurchasePlaceholderPage pageKey="generate-debit-notes" />} />
            <Route path="purchase/orders" element={<PurchaseOrderListPage />} />
            <Route path="purchase/orders/new" element={<PurchaseOrderFormPage />} />
            <Route path="purchase/orders/:id" element={<PurchaseOrderFormPage mode="edit" />} />
            <Route path="purchase/orders/:id/view" element={<PurchaseOrderFormPage mode="view" />} />
            <Route path="purchase/orders/:id/edit" element={<PurchaseOrderFormPage mode="edit" />} />
            <Route path="orders" element={<Navigate to="sale-order" replace />} />
            <Route path="orders/sale-order" element={<SaleOrderListPage />} />
            <Route path="orders/sale-order/new" element={<SaleOrderFormPage />} />
            <Route path="orders/sale-order/:id/edit" element={<SaleOrderFormPage />} />
            <Route path="orders/purchase-order" element={<PurchaseOrderListPage />} />
            <Route path="orders/purchase-order/new" element={<PurchaseOrderFormPage />} />
            <Route path="orders/purchase-order/:id" element={<PurchaseOrderFormPage mode="edit" />} />
            <Route path="orders/purchase-order/:id/view" element={<PurchaseOrderFormPage mode="view" />} />
            <Route path="orders/purchase-order/:id/edit" element={<PurchaseOrderFormPage mode="edit" />} />
            <Route path="orders/continuous-printing-orders" element={<OrdersContinuousPrintingPage />} />
            <Route path="orders/delivery" element={<DeliveryOrderPage />} />
            <Route path="orders/delivery-challan" element={<DeliveryChallanPage />} />
            <Route path="orders/delivery-challan/new" element={<DeliveryChallanForm />} />
            <Route path="sales" element={<Navigate to="sale-bill" replace />} />
            <Route path="sales/sale-bill" element={<SalesListPage pageTitle="Sale Bill" pageDescription="Review sale bills, payment status, and customer return access..." primaryActionLabel="New Sale Bill" primaryActionPath="/sales/sale-bill/new" returnPathBuilder={(saleId) => `/sales/sales-return/${saleId}`} />} />
            <Route path="sales/sale-bill/new" element={<BillingPage listPath="/sales/sale-bill" pageTitle="Sale Bill" pageDescription="..." listLabel="..." backButtonLabel="..." returnPathBuilder={(saleId) => `/sales/sales-return/${saleId}`} />} />
            <Route path="sales/sales-return" element={<SalesListPage pageTitle="Sales Return" pageDescription="..." showPrimaryAction={false} returnPathBuilder={(saleId) => `/sales/sales-return/${saleId}`} />} />
            <Route path="sales/sales-return/:id" element={<SalesReturnPage listPath="/sales/sales-return" pageTitle="Sales Return" pageDescription="..." listLabel="..." />} />
            <Route path="pricing" element={<Navigate to="price-lists" replace />} />
            <Route path="pricing/price-lists" element={<PriceListPage />} />
            <Route path="pricing/price-lists/new" element={<PriceListFormPage />} />
            <Route path="pricing/schemes" element={<SchemeListPage />} />
            <Route path="pricing/schemes/new" element={<SchemeFormPage />} />
            <Route path="pricing/coupons" element={<CouponPage />} />
            <Route path="customers" element={<Navigate to="rewards" replace />} />
            <Route path="customers/rewards" element={<CustomerRewardsPage />} />
            <Route path="customers/loyalty-config" element={<LoyaltyConfigPage />} />
            <Route path="customers/vouchers" element={<VoucherListPage />} />
            <Route path="customers/vouchers/new" element={<VoucherFormPage />} />
            <Route path="customers/credit-notes" element={<CreditNotesPage />} />
            <Route path="setup" element={<SetupLandingPage />} />
            <Route path="setup/accounts" element={<Navigate to="custom-fields" replace />} />
            <Route path="setup/accounts/custom-fields" element={<SetupCustomFieldsAccountsPage />} />
            <Route path="setup/accounts/country" element={<SetupCountryPage />} />
            <Route path="setup/accounts/states" element={<SetupAccountsPlaceholderPage pageKey="states" />} />
            <Route path="setup/accounts/city" element={<SetupAccountsPlaceholderPage pageKey="city" />} />
            <Route path="setup/accounts/opening-trial" element={<SetupAccountsPlaceholderPage pageKey="opening-trial" />} />
            <Route path="setup/accounts/predefined-narrations" element={<SetupAccountsPlaceholderPage pageKey="predefined-narrations" />} />
            <Route path="setup/accounts/profit-centers" element={<SetupAccountsPlaceholderPage pageKey="profit-centers" />} />
            <Route path="setup/accounts/cost-centers" element={<SetupAccountsPlaceholderPage pageKey="cost-centers" />} />
            <Route path="setup/accounts/cost-center-groups" element={<SetupAccountsPlaceholderPage pageKey="cost-center-groups" />} />
            <Route path="setup/accounts/allocate-cost-centers" element={<SetupAccountsPlaceholderPage pageKey="allocate-cost-centers" />} />
            <Route path="setup/accounts/cost-element-budgets" element={<SetupAccountsPlaceholderPage pageKey="cost-element-budgets" />} />
            <Route path="setup/accounts/transporters" element={<SetupAccountsPlaceholderPage pageKey="transporters" />} />
            <Route path="setup/accounts/transport-destinations" element={<SetupAccountsPlaceholderPage pageKey="transport-destinations" />} />
            <Route path="setup/accounts/tax-forms" element={<SetupAccountsPlaceholderPage pageKey="tax-forms" />} />
            <Route path="setup/accounts/allocate-tax-forms" element={<SetupAccountsPlaceholderPage pageKey="allocate-tax-forms" />} />
            <Route path="setup/accounts/tds-types" element={<SetupAccountsPlaceholderPage pageKey="tds-types" />} />
            <Route path="setup/accounts/allocate-tds-types" element={<SetupAccountsPlaceholderPage pageKey="allocate-tds-types" />} />
            <Route path="setup/accounts/fbt-types" element={<SetupAccountsPlaceholderPage pageKey="fbt-types" />} />
            <Route path="setup/accounts/allocate-fbt-types" element={<SetupAccountsPlaceholderPage pageKey="allocate-fbt-types" />} />
            <Route path="setup/accounts/customer-database" element={<SetupAccountsPlaceholderPage pageKey="customer-database" />} />
            <Route path="setup/accounts/account-groups" element={<SetupAccountsPlaceholderPage pageKey="account-groups" />} />
            <Route path="setup/accounts/balance-sheet-groups" element={<SetupAccountsPlaceholderPage pageKey="balance-sheet-groups" />} />
            <Route path="setup/accounts/allocate-balance-sheet-groups" element={<SetupAccountsPlaceholderPage pageKey="allocate-balance-sheet-groups" />} />
            <Route path="setup/accounts/branch-setup" element={<SetupAccountsPlaceholderPage pageKey="branch-setup" />} />
            <Route path="setup/accounts/agents" element={<SetupAccountsPlaceholderPage pageKey="agents" />} />

            <Route path="setup/accounts/new-account" element={<AccountMasterPage />} />
            <Route path="setup/stores" element={<StoreMasterPage />} />
            <Route path="setup/groups" element={<GroupsPage />} />
            <Route path="setup/hsn-codes" element={<HSNCodePage />} />
            <Route path="setup/sizes" element={<SizesPage />} />
            <Route path="setup/formulas" element={<FormulaPage />} />
            <Route path="setup/barcode-print" element={<BarcodePrintingPage />} />
            <Route path="setup/discounts" element={<DiscountSetupPage />} />
            <Route path="setup/counters" element={<CounterMasterPage />} />
            <Route path="reports" element={<Navigate to="dashboard" replace />} />
            <Route path="reports/dashboard" element={<ReportsDashboard />} />
            <Route path="reports/sales" element={<SalesReportPage />} />
            <Route path="reports/purchase" element={<PurchaseReportPage />} />
            <Route path="reports/ledger" element={<LedgerReportPage />} />
            <Route path="reports/bank-book" element={<BankBookPage />} />
            <Route path="reports/stock" element={<StockReportPage />} />
            <Route path="reports/profit" element={<ProfitReportPage />} />
            <Route path="reports/collection" element={<CollectionReportPage />} />
            <Route path="reports/customers" element={<CustomerReportPage />} />
            <Route path="reports/vendors" element={<VendorReportPage />} />
            <Route path="reports/movement" element={<MovementReportPage />} />
            <Route path="reports/age-analysis" element={<AgeAnalysisPage />} />
            <Route path="gst" element={<Navigate to="tax-rates" replace />} />
            <Route path="gst/tax-rates" element={<TaxRatesPage />} />
            <Route path="gst/tax-groups" element={<TaxGroupPage />} />
            <Route path="gst/invoice-report" element={<InvoiceTaxReportPage />} />
            <Route path="gst/gstr-summary" element={<GSTRSummaryPage />} />
            <Route path="setup/taxes" element={<Navigate to="/ho/gst/tax-rates" replace />} />
            <Route path="setup/party-wise" element={<SetupGenericTablePage title="Party Wise Rules" description="Configure default parameters, price lists, and calculation rules for parties." />} />
            <Route path="setup/other-account-details" element={<SetupGenericTablePage title="Other Account Details" description="Configure budgets, limits, and advanced account-level flags." />} />
            <Route path="setup/configurations" element={<SetupGenericTablePage title="System Configurations" description="Refine system behaviors, voucher parameters, and POS rules." />} />

            <Route path="accounts" element={<Navigate to="a-c-vouchers" replace />} />
            <Route path="accounts/a-c-vouchers" element={<AccountsDashboard />} />
            <Route path="accounts/bank-payment" element={<BankPaymentPage />} />
            <Route path="accounts/bank-receipt" element={<BankReceiptPage />} />
            <Route path="accounts/continuous-printing" element={<ContinuousPrintingPage />} />
            <Route path="accounts/utilities" element={<AccountsUtilitiesPage />} />

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

            <Route path="clothing-erp" element={<LogicERPManager />} />
            <Route path="data-import" element={<DataImportExportPage />} />
            <Route path="grn" element={<GRNListPage />} />
            <Route path="grn/new" element={<GRNFormPage />} />
            <Route path="grn/:id" element={<GRNFormPage mode="view" />} />
            <Route path="grn/:id/edit" element={<GRNFormPage mode="edit" />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>

        {/* Store Panel */}
        <Route element={<RoleProtectedRoute allowedRoles={['store_staff', 'Staff', 'Manager', 'admin', 'Admin']} />}>
          <Route path="/store" element={<RoleDashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="inventory/stock-overview" element={<StockOverviewPage />} />
            <Route path="inventory/audit-view" element={<StockAuditView />} />
            <Route path="sales/sale-bill" element={<SalesListPage pageTitle="Sale Bill" primaryActionPath="/sales/sale-bill/new" />} />
            <Route path="sales/sale-bill/new" element={<BillingPage listPath="/sales/sale-bill" />} />
            <Route path="sales/sales-return" element={<SalesListPage pageTitle="Sales Return" showPrimaryAction={false} />} />
            <Route path="sales/sales-return/:id" element={<SalesReturnPage listPath="/sales/sales-return" />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
