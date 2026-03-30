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
import GroupsPage from '../modules/setup/GroupsPage';
import SizesPage from '../modules/setup/SizesPage';

import StockOverviewPage from '../modules/inventory/StockOverviewPage';
import StockInPage from '../modules/inventory/StockInPage';
import StockTransferPage from '../modules/inventory/StockTransferPage';
import StockTransferFormPage from '../modules/inventory/StockTransferFormPage';
import StockAuditPage from '../modules/inventory/StockAuditPage';
import StockAdjustmentPage from '../modules/inventory/StockAdjustmentPage';
import MovementHistoryPage from '../modules/inventory/MovementHistoryPage';
import AuditDashboard from '../modules/inventory/AuditDashboard';
import ItemJourneyPage from '../modules/inventory/ItemJourneyPage';
import StockAuditView from '../modules/inventory/StockAuditView';
import ValidationDashboard from '../modules/inventory/ValidationDashboard';
import AuditLogViewer from '../modules/inventory/AuditLogViewer';
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
import DataImportPlaceholderPage from '../modules/data/DataImportPlaceholderPage';
import PurchaseReturnPageStaff from '../modules/store/PurchaseReturnPage';
import HSNCodePage from '../modules/setup/HSNCodePage';
import FormulaPage from '../modules/setup/FormulaPage';
import AccountMasterPage from '../modules/setup/AccountMasterPage';
import SetupAccountsPlaceholderPage from '../modules/setup/SetupAccountsPlaceholderPage';
import BarcodePrintingPage from '../modules/setup/BarcodePrintingPage';
import StoreMasterPage from '../modules/setup/StoreMasterPage';
import DiscountSetupPage from '../modules/setup/DiscountSetupPage';
import SetupGenericTablePage from '../modules/setup/SetupGenericTablePage';
import CounterMasterPage from '../modules/setup/CounterMasterPage';
import GRNListPage from '../modules/grn/GRNListPage';
import GRNPage from '../modules/grn/GRNPage';
import GRNFormPage from '../modules/grn/GRNFormPage';
import SetupCountryPage from '../modules/setup/SetupCountryPage';
import SetupLandingPage from '../modules/setup/SetupLandingPage';
import ProfilePage from '../modules/profile/ProfilePage';
import SetupCustomFieldsAccountsPage from '../modules/setup/SetupCustomFieldsAccountsPage';
import NotFoundPage from '../pages/NotFoundPage';
import LogicERPManager from '../modules/erp/LogicERPManager';
import CashReceiptVoucher from '../modules/accounts/CashReceiptVoucher';
import GenericVoucherForm from '../modules/accounts/GenericVoucherForm';
import { Box, Paper, Button, TextField, MenuItem, Typography } from '@mui/material';
import LocalPrintshopOutlinedIcon from '@mui/icons-material/LocalPrintshopOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';

const PrintingPlaceholderPage = ({ title }) => (
  <Box sx={{ p: 2, bgcolor: '#0f172a', minHeight: '100vh' }}>
    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800 }}>{title}</Typography>
    </Box>
    <Paper sx={{ p: 2, bgcolor: '#111827', border: '1px solid #1e293b', borderRadius: 3 }}>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Configuration</Typography>
        <TextField select size="small" value="CASH RECIPET" sx={{ width: 300, '& .MuiOutlinedInput-root': { color: '#e2e8f0', bgcolor: '#1e293b' } }}>
          <MenuItem value="CASH RECIPET">CASH RECIPET</MenuItem>
        </TextField>
      </Box>
      <SetupGenericTablePage title="" description="" columns={[{ key: 'select', label: 'Select Vouchers', width: 150 }, { key: 'date', label: 'Voucher Date', width: 120 }, { key: 'vNo', label: 'Voucher Number', width: 150 }]} />
    </Paper>
  </Box>
);

const ProductionSetupPlaceholder = ({ title }) => (
  <SetupGenericTablePage title={title} description={`Configure masters and rules for ${title}.`} columns={[{ key: 'code', label: 'CODE', width: 120 }, { key: 'name', label: 'NAME', width: 250 }, { key: 'description', label: 'DESCRIPTION', width: 350 }, { key: 'status', label: 'STATUS', width: 120 }]} />
);

const FinancialReportPlaceholder = ({ title }) => (
  <Box sx={{ p: 3 }}>
    <Paper sx={{ p: 4, borderRadius: 3, bgcolor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(37, 99, 235, 0.1)', color: '#60a5fa' }}><AccountBalanceOutlinedIcon /></Box>
        <Box><Typography variant="h5" sx={{ color: '#f8fafc', fontWeight: 700 }}>{title}</Typography><Typography variant="body2" sx={{ color: '#94a3b8' }}>Advanced financial reporting & analysis for {title.toLowerCase()}.</Typography></Box>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}><Button variant="contained" startIcon={<SettingsOutlinedIcon />}>Configure Report</Button><Button variant="outlined">Download PDF</Button><Button variant="outlined">Export Excel</Button></Box>
      <SetupGenericTablePage title="" description="" columns={[{ key: 'date', label: 'DATE', width: 120 }, { key: 'particulars', label: 'PARTICULARS', width: 300 }, { key: 'vType', label: 'VCH TYPE', width: 120 }, { key: 'vNo', label: 'VCH NO', width: 120 }, { key: 'debit', label: 'DEBIT', width: 150 }, { key: 'credit', label: 'CREDIT', width: 150 }, { key: 'balance', label: 'BALANCE', width: 150 }]} />
    </Paper>
  </Box>
);

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
          <Route path="clothing-erp" element={<LogicERPManager />} />
          <Route path="grn" element={<GRNPage />} />
          <Route path="items" element={<ItemListPage />} />
          <Route path="items/new" element={<ItemFormPage />} />
          <Route path="items/:id/view" element={<ItemFormPage mode="view" />} />
          <Route path="items/:id/edit" element={<ItemFormPage mode="edit" />} />
          <Route path="inventory" element={<Navigate to="stock-receipt-production" replace />} />
          <Route path="inventory/stock-receipt-production" element={<StockInPage pageTitle="Stock Receipt - Production" pageDescription="Record production-side stock receipts and inward quantities into the selected warehouse." submitLabel="Record Stock Receipt" defaultNotes="Production stock receipt" successMessage="Production stock receipt saved successfully." />} />
          <Route path="inventory/create-cartons" element={<InventoryPlaceholderPage pageKey="create-cartons" />} />
          <Route path="inventory/delete-cartons" element={<InventoryPlaceholderPage pageKey="delete-cartons" />} />
          <Route path="inventory/generate-box-wise-receiving" element={<InventoryPlaceholderPage pageKey="generate-box-wise-receiving" />} />
          <Route path="inventory/physical-stock-verification" element={<StockAuditPage pageTitle="Physical Stock Verification Of PUV" pageDescription="Verify physical quantity against system stock and review mismatch documents before posting." />} />
          <Route path="inventory/physical-vs-actual-doc" element={<StockAuditPage pageTitle="Physical Vs Actual Stock Doc Wise Entry" pageDescription="Compare physical and actual stock doc-wise, then review discrepancies before confirming updates." />} />
          <Route path="inventory/physical-vs-actual-consignment" element={<InventoryPlaceholderPage pageKey="physical-vs-actual-consignment" />} />
          <Route path="inventory/issue-receipt-physical-vs-actual" element={<StockAdjustmentPage pageTitle="Issue/Receipt against Physical Vs Actual Stock Doc Wise" pageDescription="Apply issue or receipt adjustments after reviewing physical versus actual stock differences." />} />
          <Route path="inventory/generate-stock-receipt-purchase-physical" element={<InventoryPlaceholderPage pageKey="generate-stock-receipt-purchase-physical" />} />
          <Route path="inventory/convert-goods-transit-received" element={<InventoryPlaceholderPage pageKey="convert-goods-transit-received" />} />
          <Route path="inventory/enter-opening-stock" element={<StockInPage pageTitle="Enter Opening Stock" pageDescription="Load opening stock quantities into the selected warehouse by scanning or selecting variants." submitLabel="Save Opening Stock" defaultNotes="Opening stock entry" successMessage="Opening stock saved successfully." />} />
          <Route path="inventory/overwrite-lot-rates" element={<InventoryPlaceholderPage pageKey="overwrite-lot-rates" />} />
          <Route path="inventory/edit-item-lot-rates-barcodes" element={<InventoryPlaceholderPage pageKey="edit-item-lot-rates-barcodes" />} />
          <Route path="inventory/stock-overview" element={<StockOverviewPage />} />
          <Route path="inventory/stock-in" element={<StockInPage />} />
          <Route path="inventory/transfer" element={<StockTransferPage />} />
          <Route path="inventory/transfer/new" element={<StockTransferFormPage />} />
          <Route path="inventory/transfer/:id/view" element={<StockTransferFormPage mode="view" />} />
          <Route path="inventory/transfer/:id/edit" element={<StockTransferFormPage mode="edit" />} />
          <Route path="inventory/transfer-receive" element={<StockTransferPage />} />
          <Route path="inventory/audit" element={<StockAuditPage />} />
          <Route path="inventory/adjustment" element={<StockAdjustmentPage />} />
          <Route path="inventory/movements" element={<MovementHistoryPage />} />
          
          {/* New Visibility & Monitoring Module */}
          <Route path="inventory/demo-dashboard" element={<AuditDashboard />} />
          <Route path="inventory/item-journey" element={<ItemJourneyPage />} />
          <Route path="inventory/audit-view" element={<StockAuditView />} />
          <Route path="inventory/batch-breakdown" element={<StockAuditView defaultTab={1} />} />
          <Route path="inventory/validation" element={<ValidationDashboard />} />
          <Route path="inventory/system-logs" element={<AuditLogViewer type="system" />} />
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
          <Route path="accounts" element={<Navigate to="a-c-vouchers" replace />} />
          <Route path="accounts/a-c-vouchers" element={<AccountsDashboard />} />
          <Route path="accounts/bank-payment" element={<BankPaymentPage />} />
          <Route path="accounts/bank-receipt" element={<BankReceiptPage />} />
          <Route path="accounts/continuous-printing" element={<ContinuousPrintingPage />} />
          <Route path="accounts/utilities" element={<AccountsUtilitiesPage />} />
          <Route path="data-import" element={<DataImportExportPage />} />
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
          {/* Store User restricted viewing */}
          <Route path="inventory" element={<Navigate to="stock-overview" replace />} />
          <Route path="inventory/stock-overview" element={<StockOverviewPage />} />
          <Route path="inventory/audit-view" element={<StockAuditView />} />
          
          <Route path="sales" element={<Navigate to="sale-bill" replace />} />
          <Route path="sales/sale-bill" element={<SalesListPage pageTitle="Sale Bill" pageDescription="Create or review store bills." primaryActionLabel="New POS Bill" primaryActionPath="/sales/sale-bill/new" />} />
          <Route path="sales/sale-bill/new" element={<BillingPage listPath="/sales/sale-bill" />} />
          <Route path="sales/sales-return" element={<SalesListPage pageTitle="Sales Return" showPrimaryAction={false} />} />
          <Route path="sales/sales-return/:id" element={<SalesReturnPage listPath="/sales/sales-return" />} />
          
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="/admin/*" element={<Navigate to="/ho" replace />} />
      <Route path="/staff/*" element={<Navigate to="/store" replace />} />
      <Route path="/manager/*" element={<Navigate to="/store" replace />} />
      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  );
}

export default AppRoutes;
