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
import InventoryPlaceholderPage from '../modules/inventory/InventoryPlaceholderPage';
import PurchaseListPage from '../modules/purchase/PurchaseListPage';
import PurchaseFormPage from '../modules/purchase/PurchaseFormPage';
import PurchaseOrderListPage from '../modules/purchase/PurchaseOrderListPage';
import PurchaseOrderFormPage from '../modules/purchase/PurchaseOrderFormPage';
import PurchaseReturnPage from '../modules/purchase/PurchaseReturnPage';
import PurchasePlaceholderPage from '../modules/purchase/PurchasePlaceholderPage';
import SalesListPage from '../modules/sales/SalesListPage';
import BillingPage from '../modules/sales/BillingPage';
import SalesReturnPage from '../modules/sales/SalesReturnPage';
import BillingPlaceholderPage from '../modules/sales/BillingPlaceholderPage';
import PayrollSetupsPlaceholderPage from '../modules/payroll/PayrollSetupsPlaceholderPage';
import ProductionPlaceholderPage from '../modules/production/ProductionPlaceholderPage';
import PayrollEntryPlaceholderPage from '../modules/payroll/PayrollEntryPlaceholderPage';
import PayrollReportsPlaceholderPage from '../modules/payroll/PayrollReportsPlaceholderPage';
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
import ReportsQueriesPlaceholderPage from '../modules/reports/ReportsQueriesPlaceholderPage';
import UtilitiesPlaceholderPage from '../modules/utilities/UtilitiesPlaceholderPage';
import UserAccessPlaceholderPage from '../modules/userAccess/UserAccessPlaceholderPage';
import TaxRatesPage from '../modules/gst/TaxRatesPage';
import TaxGroupPage from '../modules/gst/TaxGroupPage';
import InvoiceTaxReportPage from '../modules/gst/InvoiceTaxReportPage';
import GSTRSummaryPage from '../modules/gst/GSTRSummaryPage';
import AccountsDashboard from '../modules/accounts/AccountsDashboard';
import BankPaymentPage from '../modules/accounts/BankPaymentPage';
import BankReceiptPage from '../modules/accounts/BankReceiptPage';
import ContinuousPrintingPage from '../modules/accounts/ContinuousPrintingPage';
import AccountsUtilitiesPage from '../modules/accounts/AccountsUtilitiesPage';
import SaleOrderListPage from '../modules/orders/SaleOrderListPage';
import SaleOrderFormPage from '../modules/orders/SaleOrderFormPage';
import PackingSlipPage from '../modules/orders/PackingSlipPage';
import DeliveryOrderPage from '../modules/orders/DeliveryOrderPage';
import OrderProcessingPlaceholderPage from '../modules/orders/OrderProcessingPlaceholderPage';
import OrdersContinuousPrintingPage from '../modules/orders/OrdersContinuousPrintingPage';
import DeliveryChallanPage from '../modules/dispatch/DeliveryChallanPage';
import DeliveryChallanForm from '../modules/dispatch/DeliveryChallanForm';
import DataImportExportPage from '../modules/data/DataImportExportPage';
import PurchaseReturnPageStaff from '../modules/store/PurchaseReturnPage';
import HSNCodePage from '../modules/setup/HSNCodePage';
import AccountMasterPage from '../modules/setup/AccountMasterPage';
import SetupAccountsPlaceholderPage from '../modules/setup/SetupAccountsPlaceholderPage';
import BarcodePrintingPage from '../modules/setup/BarcodePrintingPage';
import StoreMasterPage from '../modules/setup/StoreMasterPage';
import DiscountSetupPage from '../modules/setup/DiscountSetupPage';
import CounterMasterPage from '../modules/setup/CounterMasterPage';
import SetupLandingPage from '../modules/setup/SetupLandingPage';
import ProfilePage from '../modules/profile/ProfilePage';
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
      <Route path="inventory" element={<Navigate to="stock-receipt-production" replace />} />
      <Route
        path="inventory/stock-receipt-production"
        element={(
          <StockInPage
            pageTitle="Stock Receipt - Production"
            pageDescription="Record production-side stock receipts and inward quantities into the selected warehouse."
            submitLabel="Record Stock Receipt"
            defaultNotes="Production stock receipt"
            successMessage="Production stock receipt saved successfully."
          />
        )}
      />
      <Route path="inventory/create-cartons" element={<InventoryPlaceholderPage pageKey="create-cartons" />} />
      <Route path="inventory/delete-cartons" element={<InventoryPlaceholderPage pageKey="delete-cartons" />} />
      <Route path="inventory/generate-box-wise-receiving" element={<InventoryPlaceholderPage pageKey="generate-box-wise-receiving" />} />
      <Route
        path="inventory/physical-stock-verification"
        element={(
          <StockAuditPage
            pageTitle="Physical Stock Verification Of PUV"
            pageDescription="Verify physical quantity against system stock and review mismatch documents before posting."
          />
        )}
      />
      <Route
        path="inventory/physical-vs-actual-doc"
        element={(
          <StockAuditPage
            pageTitle="Physical Vs Actual Stock Doc Wise Entry"
            pageDescription="Compare physical and actual stock doc-wise, then review discrepancies before confirming updates."
          />
        )}
      />
      <Route path="inventory/physical-vs-actual-consignment" element={<InventoryPlaceholderPage pageKey="physical-vs-actual-consignment" />} />
      <Route
        path="inventory/issue-receipt-physical-vs-actual"
        element={(
          <StockAdjustmentPage
            pageTitle="Issue/Receipt against Physical Vs Actual Stock Doc Wise"
            pageDescription="Apply issue or receipt adjustments after reviewing physical versus actual stock differences."
          />
        )}
      />
      <Route path="inventory/generate-stock-receipt-purchase-physical" element={<InventoryPlaceholderPage pageKey="generate-stock-receipt-purchase-physical" />} />
      <Route path="inventory/convert-goods-transit-received" element={<InventoryPlaceholderPage pageKey="convert-goods-transit-received" />} />
      <Route
        path="inventory/enter-opening-stock"
        element={(
          <StockInPage
            pageTitle="Enter Opening Stock"
            pageDescription="Load opening stock quantities into the selected warehouse by scanning or selecting variants."
            submitLabel="Save Opening Stock"
            defaultNotes="Opening stock entry"
            successMessage="Opening stock saved successfully."
          />
        )}
      />
      <Route path="inventory/overwrite-lot-rates" element={<InventoryPlaceholderPage pageKey="overwrite-lot-rates" />} />
      <Route path="inventory/edit-item-lot-rates-barcodes" element={<InventoryPlaceholderPage pageKey="edit-item-lot-rates-barcodes" />} />
      <Route path="inventory/stock-overview" element={<StockOverviewPage />} />
      <Route path="inventory/stock-in" element={<StockInPage />} />
      <Route path="inventory/transfer" element={<StockTransferPage />} />
      <Route path="inventory/transfer-receive" element={<StockTransferPage />} />
      <Route path="inventory/audit" element={<StockAuditPage />} />
      <Route path="inventory/adjustment" element={<StockAdjustmentPage />} />
      <Route path="inventory/movements" element={<MovementHistoryPage />} />
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
      <Route path="purchase/orders/:id" element={<PurchaseOrderFormPage />} />
      <Route path="purchase/new" element={<PurchaseFormPage />} />
      <Route path="purchase/:id" element={<PurchaseFormPage />} />
      <Route path="purchase/:id/return" element={<PurchaseReturnPage />} />
      <Route path="purchase/return" element={<Navigate to="purchase-return" replace />} />
      <Route path="orders" element={<Navigate to="sale-order" replace />} />
      <Route path="orders/sale-order" element={<SaleOrderListPage />} />
      <Route path="orders/sale-order/new" element={<SaleOrderFormPage />} />
      <Route path="orders/sale-order/:id/edit" element={<SaleOrderFormPage />} />
      <Route path="orders/cancel-sale-order-items" element={<OrderProcessingPlaceholderPage pageKey="cancel-sale-order-items" />} />
      <Route path="orders/adjust-sale-orders-against-sale" element={<OrderProcessingPlaceholderPage pageKey="adjust-sale-orders-against-sale" />} />
      <Route path="orders/stock-requisition" element={<OrderProcessingPlaceholderPage pageKey="stock-requisition" />} />
      <Route path="orders/generate-sale-orders" element={<OrderProcessingPlaceholderPage pageKey="generate-sale-orders" />} />
      <Route path="orders/preset-items-retrieval" element={<OrderProcessingPlaceholderPage pageKey="preset-items-retrieval" />} />
      <Route path="orders/purchase-order" element={<PurchaseOrderListPage />} />
      <Route path="orders/purchase-order/new" element={<PurchaseOrderFormPage />} />
      <Route path="orders/purchase-order/:id" element={<PurchaseOrderFormPage />} />
      <Route path="orders/purchase-order-stock-levels" element={<OrderProcessingPlaceholderPage pageKey="purchase-order-stock-levels" />} />
      <Route path="orders/short-items-purchase-order" element={<OrderProcessingPlaceholderPage pageKey="short-items-purchase-order" />} />
      <Route path="orders/delete-pending-po-so" element={<OrderProcessingPlaceholderPage pageKey="delete-pending-po-so" />} />
      <Route path="orders/adjust-purchase-orders" element={<OrderProcessingPlaceholderPage pageKey="adjust-purchase-orders" />} />
      <Route path="orders/cancel-purchase-order-items" element={<OrderProcessingPlaceholderPage pageKey="cancel-purchase-order-items" />} />
      <Route path="orders/continuous-printing-orders" element={<OrdersContinuousPrintingPage />} />
      <Route path="orders/delivery" element={<DeliveryOrderPage />} />
      <Route path="orders/delivery-challan" element={<DeliveryChallanPage />} />
      <Route path="orders/delivery-challan/new" element={<DeliveryChallanForm />} />
      <Route path="sales" element={<Navigate to="sale-bill" replace />} />
      <Route
        path="sales/sale-bill"
        element={(
          <SalesListPage
            pageTitle="Sale Bill"
            pageDescription="Review sale bills, payment status, and customer return access from the Billing flow."
            primaryActionLabel="New Sale Bill"
            primaryActionPath="/sales/sale-bill/new"
            returnPathBuilder={(saleId) => `/sales/sales-return/${saleId}`}
            emptyStateActionLabel="New Sale Bill"
            emptyStateActionPath="/sales/sale-bill/new"
          />
        )}
      />
      <Route
        path="sales/sale-bill/new"
        element={(
          <BillingPage
            listPath="/sales/sale-bill"
            pageTitle="Sale Bill"
            pageDescription="Create and review retail sale bills from the Billing side flow."
            listLabel="Back to Sale Bill"
            backButtonLabel="Back to Sale Bill"
            returnPathBuilder={(saleId) => `/sales/sales-return/${saleId}`}
          />
        )}
      />
      <Route
        path="sales/sale-bill/:id"
        element={(
          <BillingPage
            listPath="/sales/sale-bill"
            pageTitle="Sale Bill"
            pageDescription="Create and review retail sale bills from the Billing side flow."
            listLabel="Back to Sale Bill"
            backButtonLabel="Back to Sale Bill"
            returnPathBuilder={(saleId) => `/sales/sales-return/${saleId}`}
          />
        )}
      />
      <Route path="sales/sale-period-sale" element={<BillingPlaceholderPage pageKey="sale-period-sale" />} />
      <Route path="sales/sale-on-sale-period-sale" element={<BillingPlaceholderPage pageKey="sale-on-sale-period-sale" />} />
      <Route
        path="sales/sale-challan"
        element={(
          <DeliveryChallanPage
            pageTitle="Sale Challan"
            pageDescription="Manage sale challans, dispatch movement, and receipt confirmation from the Billing flow."
            createPath="/sales/sale-challan/new"
            createLabel="New Sale Challan"
          />
        )}
      />
      <Route
        path="sales/sale-challan/new"
        element={(
          <DeliveryChallanForm
            listPath="/sales/sale-challan"
            pageTitle="Sale Challan"
            saveLabel="Save Sale Challan"
          />
        )}
      />
      <Route
        path="sales/sales-return"
        element={(
          <SalesListPage
            pageTitle="Sales Return"
            pageDescription="Choose a sale bill and open customer return processing from the Billing flow."
            showPrimaryAction={false}
            returnPathBuilder={(saleId) => `/sales/sales-return/${saleId}`}
            emptyStateTitle="No sale bills available for return."
            emptyStateDescription="Create or load a sale bill first, then start the return flow from here."
            emptyStateActionLabel="Open Sale Bill"
            emptyStateActionPath="/sales/sale-bill"
          />
        )}
      />
      <Route
        path="sales/sales-return/:id"
        element={(
          <SalesReturnPage
            listPath="/sales/sales-return"
            pageTitle="Sales Return"
            pageDescription="Process customer returns, refunds, or credit notes against the selected sale bill."
            listLabel="Back to Sales Return"
          />
        )}
      />
      <Route path="sales/sale-challan-return" element={<BillingPlaceholderPage pageKey="sale-challan-return" />} />
      <Route
        path="sales/stock-transfer-out"
        element={(
          <StockTransferPage
            pageTitle="Stock Transfer - Out"
            pageDescription="Move stock out for billing-linked transfer and dispatch scenarios."
          />
        )}
      />
      <Route path="sales/sales-return-f-b" element={<BillingPlaceholderPage pageKey="sales-return-f-b" />} />
      <Route
        path="sales/sale-bill-touch-screen"
        element={(
          <BillingPage
            listPath="/sales/sale-bill"
            pageTitle="Sale Bill - Touch Screen"
            pageDescription="Touch-friendly billing entry for faster counter sales."
            listLabel="Back to Sale Bill"
            backButtonLabel="Back to Sale Bill"
            returnPathBuilder={(saleId) => `/sales/sales-return/${saleId}`}
          />
        )}
      />
      <Route
        path="sales/sale-challan-touch-screen"
        element={(
          <DeliveryChallanForm
            listPath="/sales/sale-challan"
            pageTitle="Sale Challan - Touch Screen"
            saveLabel="Save Sale Challan"
          />
        )}
      />
      <Route path="sales/packing-slip-delivery-order" element={<BillingPlaceholderPage pageKey="packing-slip-delivery-order" />} />
      <Route path="sales/cancel-sale-bills" element={<BillingPlaceholderPage pageKey="cancel-sale-bills" />} />
      <Route
        path="sales/sale-challan-status"
        element={(
          <DeliveryChallanPage
            pageTitle="Sale Challan Status"
            pageDescription="Track challan movement and delivery status from the Billing flow."
            createPath="/sales/sale-challan/new"
            createLabel="New Sale Challan"
          />
        )}
      />
      <Route path="sales/generate-credit-note-schemes" element={<BillingPlaceholderPage pageKey="generate-credit-note-schemes" />} />
      <Route path="sales/issue-gift-vouchers" element={<BillingPlaceholderPage pageKey="issue-gift-vouchers" />} />
      <Route path="sales/convert-credit-bills-cash" element={<BillingPlaceholderPage pageKey="convert-credit-bills-cash" />} />
      <Route
        path="sales/returns"
        element={(
          <Navigate to="/ho/sales/sales-return" replace />
        )}
      />
      <Route
        path="sales/new"
        element={(
          <BillingPage
            listPath="/sales/sale-bill"
            pageTitle="Sale Bill"
            pageDescription="Create and review retail sale bills from the Billing side flow."
            listLabel="Back to Sale Bill"
            backButtonLabel="Back to Sale Bill"
            returnPathBuilder={(saleId) => `/sales/sales-return/${saleId}`}
          />
        )}
      />
      <Route
        path="sales/:id"
        element={(
          <BillingPage
            listPath="/sales/sale-bill"
            pageTitle="Sale Bill"
            pageDescription="Create and review retail sale bills from the Billing side flow."
            listLabel="Back to Sale Bill"
            backButtonLabel="Back to Sale Bill"
            returnPathBuilder={(saleId) => `/sales/sales-return/${saleId}`}
          />
        )}
      />
      <Route
        path="sales/:id/return"
        element={(
          <SalesReturnPage
            listPath="/sales/sales-return"
            pageTitle="Sales Return"
            pageDescription="Process customer returns, refunds, or credit notes against the selected sale bill."
            listLabel="Back to Sales Return"
          />
        )}
      />
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
      <Route path="setup" element={<SetupLandingPage />} />
      <Route path="setup/accounts" element={<Navigate to="custom-fields" replace />} />
      <Route path="setup/accounts/custom-fields" element={<SetupAccountsPlaceholderPage pageKey="custom-fields" />} />
      <Route path="setup/accounts/country" element={<SetupAccountsPlaceholderPage pageKey="country" />} />
      <Route path="setup/accounts/states" element={<SetupAccountsPlaceholderPage pageKey="states" />} />
      <Route path="setup/accounts/city" element={<SetupAccountsPlaceholderPage pageKey="city" />} />
      <Route path="setup/accounts/new-account" element={<AccountMasterPage />} />
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
      <Route path="setup/accounts/customer-database" element={<CustomersListPage />} />
      <Route path="setup/accounts/account-groups" element={<AccountGroupsListPage />} />
      <Route path="setup/accounts/balance-sheet-groups" element={<SetupAccountsPlaceholderPage pageKey="balance-sheet-groups" />} />
      <Route path="setup/accounts/allocate-balance-sheet-groups" element={<SetupAccountsPlaceholderPage pageKey="allocate-balance-sheet-groups" />} />
      <Route path="setup/accounts/branch-setup" element={<StoreMasterPage />} />
      <Route path="setup/accounts/agents" element={<SalesmenListPage />} />
      <Route path="setup/stores" element={<StoreMasterPage />} />
      <Route path="setup/hsn-codes" element={<HSNCodePage />} />
      <Route path="setup/barcode-print" element={<BarcodePrintingPage />} />
      <Route path="setup/discounts" element={<DiscountSetupPage />} />
      <Route path="setup/counters" element={<CounterMasterPage />} />
      <Route path="data-import" element={<DataImportExportPage />} />
      <Route path="reports" element={<Navigate to="financial-reports" replace />} />
      <Route path="reports/dashboard" element={<ReportsDashboard />} />
      <Route path="reports/financial-reports" element={<ReportsQueriesPlaceholderPage pageKey="financial-reports" />} />
      <Route path="reports/balance-sheet" element={<ReportsQueriesPlaceholderPage pageKey="balance-sheet" />} />
      <Route path="reports/financial-analysis" element={<ReportsQueriesPlaceholderPage pageKey="financial-analysis" />} />
      <Route path="reports/sale-registers" element={<ReportsQueriesPlaceholderPage pageKey="sale-registers" />} />
      <Route path="reports/sale-challan-reports" element={<ReportsQueriesPlaceholderPage pageKey="sale-challan-reports" />} />
      <Route path="reports/scheme-reports" element={<ReportsQueriesPlaceholderPage pageKey="scheme-reports" />} />
      <Route path="reports/customer-item-sale-analysis" element={<ReportsQueriesPlaceholderPage pageKey="customer-item-sale-analysis" />} />
      <Route path="reports/order-reports" element={<ReportsQueriesPlaceholderPage pageKey="order-reports" />} />
      <Route path="reports/agent-wise-reports" element={<ReportsQueriesPlaceholderPage pageKey="agent-wise-reports" />} />
      <Route path="reports/purchase-reports" element={<ReportsQueriesPlaceholderPage pageKey="purchase-reports" />} />
      <Route path="reports/item-reports" element={<ReportsQueriesPlaceholderPage pageKey="item-reports" />} />
      <Route path="reports/stock-reports" element={<ReportsQueriesPlaceholderPage pageKey="stock-reports" />} />
      <Route path="reports/excise-reports" element={<ReportsQueriesPlaceholderPage pageKey="excise-reports" />} />
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
      <Route path="accounts" element={<Navigate to="a-c-vouchers" replace />} />
      <Route path="accounts/a-c-vouchers" element={<AccountsDashboard />} />
      <Route path="accounts/bank-payment" element={<BankPaymentPage />} />
      <Route path="accounts/bank-receipt" element={<BankReceiptPage />} />
      <Route path="accounts/continuous-printing" element={<ContinuousPrintingPage />} />
      <Route path="accounts/utilities" element={<AccountsUtilitiesPage />} />
      <Route path="utilities" element={<Navigate to="merge-accounts" replace />} />
      <Route path="utilities/merge-accounts" element={<UtilitiesPlaceholderPage pageKey="merge-accounts" />} />
      <Route path="utilities/close-books" element={<UtilitiesPlaceholderPage pageKey="close-books" />} />
      <Route path="utilities/transfer-branch-stock-next-year" element={<UtilitiesPlaceholderPage pageKey="transfer-branch-stock-next-year" />} />
      <Route path="utilities/transfer-account-balances-next-year" element={<UtilitiesPlaceholderPage pageKey="transfer-account-balances-next-year" />} />
      <Route path="utilities/export-import-branch-wise-data" element={<UtilitiesPlaceholderPage pageKey="export-import-branch-wise-data" />} />
      <Route path="utilities/import-masters-transactions-external" element={<UtilitiesPlaceholderPage pageKey="import-masters-transactions-external" />} />
      <Route path="utilities/shop-in-shop" element={<UtilitiesPlaceholderPage pageKey="shop-in-shop" />} />
      <Route path="utilities/document-manager" element={<UtilitiesPlaceholderPage pageKey="document-manager" />} />
      <Route path="utilities/billing-utilities" element={<UtilitiesPlaceholderPage pageKey="billing-utilities" />} />
      <Route path="utilities/export-utilities-third-parties" element={<UtilitiesPlaceholderPage pageKey="export-utilities-third-parties" />} />
      <Route path="utilities/b2b-cloud" element={<UtilitiesPlaceholderPage pageKey="b2b-cloud" />} />
      <Route path="user-access" element={<Navigate to="allow-disallow-menu-template" replace />} />
      <Route path="user-access/allow-disallow-menu-template" element={<UserAccessPlaceholderPage pageKey="allow-disallow-menu-template" />} />
      <Route path="user-access/allow-disallow-menu-options" element={<UserAccessPlaceholderPage pageKey="allow-disallow-menu-options" />} />
      <Route path="user-access/branch-wise-back-date-locking" element={<UserAccessPlaceholderPage pageKey="branch-wise-back-date-locking" />} />
      <Route path="user-access/user-wise-back-date-locking" element={<UserAccessPlaceholderPage pageKey="user-wise-back-date-locking" />} />
      <Route path="user-access/manage-user-accounts" element={<UsersPage />} />
      <Route path="user-access/approval-system" element={<UserAccessPlaceholderPage pageKey="approval-system" />} />
      <Route path="user-access/audit-system" element={<AuditLogPage />} />
      <Route path="user-access/setup-api-templates" element={<UserAccessPlaceholderPage pageKey="setup-api-templates" />} />
      <Route path="user-access/api-log-viewer" element={<UserAccessPlaceholderPage pageKey="api-log-viewer" />} />
      <Route path="user-access/user-access-reports" element={<UserAccessPlaceholderPage pageKey="user-access-reports" />} />
      <Route path="production" element={<Navigate to="production-setups" replace />} />
      <Route path="production/production-setups" element={<ProductionPlaceholderPage pageKey="production-setups" />} />
      <Route path="production/production-vouchers" element={<ProductionPlaceholderPage pageKey="production-vouchers" />} />
      <Route path="production/raw-material-processing" element={<ProductionPlaceholderPage pageKey="raw-material-processing" />} />
      <Route path="production/production-reports-queries" element={<ProductionPlaceholderPage pageKey="production-reports-queries" />} />
      <Route path="production/production-utilities" element={<ProductionPlaceholderPage pageKey="production-utilities" />} />
      <Route path="payroll-setups" element={<Navigate to="setup-allowance-deduction" replace />} />
      <Route path="payroll-entry" element={<Navigate to="opening-balance-leaves" replace />} />
      <Route path="payroll-entry/opening-balance-leaves" element={<PayrollEntryPlaceholderPage pageKey="opening-balance-leaves" />} />
      <Route path="payroll-entry/attendance-register" element={<PayrollEntryPlaceholderPage pageKey="attendance-register" />} />
      <Route path="payroll-entry/attendance-register-month-wise" element={<PayrollEntryPlaceholderPage pageKey="attendance-register-month-wise" />} />
      <Route path="payroll-entry/worker-wise-loan-entry" element={<PayrollEntryPlaceholderPage pageKey="worker-wise-loan-entry" />} />
      <Route path="payroll-entry/worker-wise-payment-advance-entry" element={<PayrollEntryPlaceholderPage pageKey="worker-wise-payment-advance-entry" />} />
      <Route path="payroll-entry/worker-wise-loan-installment-receipt" element={<PayrollEntryPlaceholderPage pageKey="worker-wise-loan-installment-receipt" />} />
      <Route path="payroll-entry/multiple-payment-entry-worker-wise" element={<PayrollEntryPlaceholderPage pageKey="multiple-payment-entry-worker-wise" />} />
      <Route path="payroll-entry/multiple-advance-entry-worker-wise" element={<PayrollEntryPlaceholderPage pageKey="multiple-advance-entry-worker-wise" />} />
      <Route path="payroll-entry/multiple-salary-due-entry-worker-wise" element={<PayrollEntryPlaceholderPage pageKey="multiple-salary-due-entry-worker-wise" />} />
      <Route path="payroll-entry/custom-calculation-recalculation" element={<PayrollEntryPlaceholderPage pageKey="custom-calculation-recalculation" />} />
      <Route path="payroll-entry/custom-calculation-posting-payroll" element={<PayrollEntryPlaceholderPage pageKey="custom-calculation-posting-payroll" />} />
      <Route path="payroll-entry/update-employee-holidays-weekly-offs" element={<PayrollEntryPlaceholderPage pageKey="update-employee-holidays-weekly-offs" />} />
      <Route path="payroll-reports" element={<Navigate to="attendance-status-report" replace />} />
      <Route path="payroll-reports/attendance-status-report" element={<PayrollReportsPlaceholderPage pageKey="attendance-status-report" />} />
      <Route path="payroll-reports/attendance-summary-report" element={<PayrollReportsPlaceholderPage pageKey="attendance-summary-report" />} />
      <Route path="payroll-reports/attendance-gate-status-report" element={<PayrollReportsPlaceholderPage pageKey="attendance-gate-status-report" />} />
      <Route path="payroll-reports/payroll-summary-report" element={<PayrollReportsPlaceholderPage pageKey="payroll-summary-report" />} />
      <Route path="payroll-reports/register-of-leaves-with-wages" element={<PayrollReportsPlaceholderPage pageKey="register-of-leaves-with-wages" />} />
      <Route path="payroll-reports/employee-register" element={<PayrollReportsPlaceholderPage pageKey="employee-register" />} />
      <Route path="payroll-reports/employee-allow-ded-month-wise-payroll-report" element={<PayrollReportsPlaceholderPage pageKey="employee-allow-ded-month-wise-payroll-report" />} />
      <Route path="payroll-reports/employee-month-wise-payroll-report" element={<PayrollReportsPlaceholderPage pageKey="employee-month-wise-payroll-report" />} />
      <Route path="payroll-reports/employee-loan-report" element={<PayrollReportsPlaceholderPage pageKey="employee-loan-report" />} />
      <Route path="payroll-reports/employee-salary-range-wise-report" element={<PayrollReportsPlaceholderPage pageKey="employee-salary-range-wise-report" />} />
      <Route path="payroll-reports/payroll-custom-calc-types-report" element={<PayrollReportsPlaceholderPage pageKey="payroll-custom-calc-types-report" />} />
      <Route path="payroll-reports/employee-wise-gratuity-report" element={<PayrollReportsPlaceholderPage pageKey="employee-wise-gratuity-report" />} />
      <Route path="payroll-reports/employee-leave-ledger" element={<PayrollReportsPlaceholderPage pageKey="employee-leave-ledger" />} />
      <Route path="payroll-setups/setup-allowance-deduction" element={<PayrollSetupsPlaceholderPage pageKey="setup-allowance-deduction" />} />
      <Route path="payroll-setups/setup-grades" element={<PayrollSetupsPlaceholderPage pageKey="setup-grades" />} />
      <Route path="payroll-setups/setup-leave-types" element={<PayrollSetupsPlaceholderPage pageKey="setup-leave-types" />} />
      <Route path="payroll-setups/setup-grade-leave-types" element={<PayrollSetupsPlaceholderPage pageKey="setup-grade-leave-types" />} />
      <Route path="payroll-setups/setup-payroll-custom-calculation-types" element={<PayrollSetupsPlaceholderPage pageKey="setup-payroll-custom-calculation-types" />} />
      <Route path="payroll-setups/setup-grade-allowances-deduction" element={<PayrollSetupsPlaceholderPage pageKey="setup-grade-allowances-deduction" />} />
      <Route path="payroll-setups/setup-holidays" element={<PayrollSetupsPlaceholderPage pageKey="setup-holidays" />} />
      <Route path="payroll-setups/setup-employee-wise-holidays" element={<PayrollSetupsPlaceholderPage pageKey="setup-employee-wise-holidays" />} />
      <Route path="payroll-setups/setup-compulsory-attendance-dates" element={<PayrollSetupsPlaceholderPage pageKey="setup-compulsory-attendance-dates" />} />
      <Route path="payroll-setups/setup-employee-wise-compulsory-attendance-dates" element={<PayrollSetupsPlaceholderPage pageKey="setup-employee-wise-compulsory-attendance-dates" />} />
      <Route path="payroll-setups/setup-payroll-time-period" element={<PayrollSetupsPlaceholderPage pageKey="setup-payroll-time-period" />} />
      <Route path="payroll-setups/setup-absent-days-slabs-weekly-offs" element={<PayrollSetupsPlaceholderPage pageKey="setup-absent-days-slabs-weekly-offs" />} />
      <Route path="payroll-setups/setup-late-days-rules-salary" element={<PayrollSetupsPlaceholderPage pageKey="setup-late-days-rules-salary" />} />
      <Route path="payroll-setups/setup-employee-wise-savings-tax" element={<PayrollSetupsPlaceholderPage pageKey="setup-employee-wise-savings-tax" />} />
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
      <Route path="profile" element={<ProfilePage />} />
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
      <Route path="profile" element={<ProfilePage />} />
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
