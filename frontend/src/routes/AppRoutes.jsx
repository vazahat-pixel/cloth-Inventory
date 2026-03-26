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
import DataImportPlaceholderPage from '../modules/data/DataImportPlaceholderPage';
import PurchaseReturnPageStaff from '../modules/store/PurchaseReturnPage';
import HSNCodePage from '../modules/setup/HSNCodePage';
import AccountMasterPage from '../modules/setup/AccountMasterPage';
import SetupAccountsPlaceholderPage from '../modules/setup/SetupAccountsPlaceholderPage';
import BarcodePrintingPage from '../modules/setup/BarcodePrintingPage';
import StoreMasterPage from '../modules/setup/StoreMasterPage';
import DiscountSetupPage from '../modules/setup/DiscountSetupPage';
import SetupGenericTablePage from '../modules/setup/SetupGenericTablePage';
import CounterMasterPage from '../modules/setup/CounterMasterPage';

import SetupCountryPage from '../modules/setup/SetupCountryPage';
import SetupLandingPage from '../modules/setup/SetupLandingPage';

import ProfilePage from '../modules/profile/ProfilePage';
import SetupCustomFieldsAccountsPage from '../modules/setup/SetupCustomFieldsAccountsPage';
import NotFoundPage from '../pages/NotFoundPage';






import CashReceiptVoucher from '../modules/accounts/CashReceiptVoucher';
import GenericVoucherForm from '../modules/accounts/GenericVoucherForm';

import { Box, Paper, Button, TextField, MenuItem, Typography } from '@mui/material';
import LocalPrintshopOutlinedIcon from '@mui/icons-material/LocalPrintshopOutlined';

const PrintingPlaceholderPage = ({ title }) => (
  <Box sx={{ p: 2, bgcolor: '#0f172a', minHeight: '100vh' }}>
    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800 }}>{title}</Typography>
    </Box>
    
    <Paper sx={{ p: 2, bgcolor: '#111827', border: '1px solid #1e293b', borderRadius: 3 }}>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Configuration</Typography>
        <TextField 
          select 
          size="small" 
          value="CASH RECIPET" 
          sx={{ 
            width: 300,
            '& .MuiOutlinedInput-root': { color: '#e2e8f0', bgcolor: '#1e293b' } 
          }}
        >
          <MenuItem value="CASH RECIPET">CASH RECIPET</MenuItem>
        </TextField>
      </Box>

      <SetupGenericTablePage 
        title="" 
        description="" 
        columns={[
          { key: 'select', label: 'Select Vouchers', width: 150 },
          { key: 'date', label: 'Voucher Date', width: 120 },
          { key: 'vNo', label: 'Voucher Number', width: 150 },
          { key: 'amount', label: 'Voucher Amount', width: 150 },
          { key: 'account', label: 'Account Name', width: 250 },
          { key: 'remarks1', label: 'Remarks 1', width: 200 },
          { key: 'remarks2', label: 'Remarks 2', width: 200 },
          { key: 'branch', label: 'Branch Name', width: 150 },
        ]} 
      />

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button variant="contained" sx={{ bgcolor: '#2563eb', textTransform: 'none' }}>Start Printing</Button>
        <Button variant="outlined" sx={{ color: '#94a3b8', borderColor: '#1e293b', textTransform: 'none' }}>Close</Button>
      </Box>
    </Paper>
  </Box>
);

import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

const ProductionSetupPlaceholder = ({ title }) => (
  <SetupGenericTablePage 
    title={title} 
    description={`Configure masters and rules for ${title}.`} 
    columns={[
      { key: 'code', label: 'CODE', width: 120 },
      { key: 'name', label: 'NAME', width: 250 },
      { key: 'description', label: 'DESCRIPTION', width: 350 },
      { key: 'status', label: 'STATUS', width: 120 }
    ]} 
  />
);

import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';

const FinancialReportPlaceholder = ({ title }) => (
  <Box sx={{ p: 3 }}>
    <Paper sx={{ p: 4, borderRadius: 3, bgcolor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(37, 99, 235, 0.1)', color: '#60a5fa' }}>
          <AccountBalanceOutlinedIcon />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ color: '#f8fafc', fontWeight: 700 }}>{title}</Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>Advanced financial reporting & analysis for {title.toLowerCase()}.</Typography>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Button variant="contained" startIcon={<SettingsOutlinedIcon />}>Configure Report</Button>
        <Button variant="outlined">Download PDF</Button>
        <Button variant="outlined">Export Excel</Button>
      </Box>

      <SetupGenericTablePage 
        title="" 
        description="" 
        columns={[
          { key: 'date', label: 'DATE', width: 120 },
          { key: 'particulars', label: 'PARTICULARS', width: 300 },
          { key: 'vType', label: 'VCH TYPE', width: 120 },
          { key: 'vNo', label: 'VCH NO', width: 120 },
          { key: 'debit', label: 'DEBIT', width: 150 },
          { key: 'credit', label: 'CREDIT', width: 150 },
          { key: 'balance', label: 'BALANCE', width: 150 },
        ]} 
      />
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
      <Route path="setup/accounts/custom-fields" element={<SetupCustomFieldsAccountsPage />} />
      <Route path="setup/accounts/country" element={<SetupCountryPage />} />
      <Route 
        path="setup/accounts/states" 
        element={<SetupGenericTablePage 
          title="Setup States" 
          description="Manage states and regional codes." 
          columns={[
            { key: 'stateName', label: 'STATE NAME', width: 200 },
            { key: 'stateCode', label: 'STATE CODE', width: 120 },
            { key: 'countryName', label: 'COUNTRY NAME', width: 200 }
          ]} 
          initialData={[{ id: 1, sno: 1, stateName: 'Maharashtra', stateCode: '27', countryName: 'India' }]}
        />} 
      />
      <Route 
        path="setup/accounts/city" 
        element={<SetupGenericTablePage 
          title="Setup City" 
          description="Manage cities and link them to states." 
          columns={[
            { key: 'cityName', label: 'CITY NAME', width: 200 },
            { key: 'stateName', label: 'STATE NAME', width: 200 }
          ]} 
          initialData={[{ id: 1, sno: 1, cityName: 'Mumbai', stateName: 'Maharashtra' }]}
        />} 
      />
      <Route path="setup/accounts/new-account" element={<AccountMasterPage />} />
      <Route 
        path="setup/accounts/opening-trial" 
        element={<SetupGenericTablePage 
          title="Enter Opening Trial" 
          description="Initialize account opening balances." 
          columns={[
            { key: 'accountName', label: 'ACCOUNT NAME', width: 250 },
            { key: 'debit', label: 'DEBIT AMOUNT', width: 150 },
            { key: 'credit', label: 'CREDIT AMOUNT', width: 150 }
          ]} 
        />} 
      />
      <Route 
        path="setup/accounts/predefined-narrations" 
        element={<SetupGenericTablePage 
          title="Setup Pre-Defined Narrations" 
          description="Standard narrations for faster transaction entry." 
          columns={[{ key: 'narration', label: 'NARRATION TEXT', width: 400 }]} 
        />} 
      />
      <Route 
        path="setup/accounts/profit-centers" 
        element={<SetupGenericTablePage 
          title="Setup Profit Centers" 
          description="Define profit centers for business units." 
          columns={[
            { key: 'name', label: 'PROFIT CENTER NAME', width: 250 },
            { key: 'code', label: 'CODE', width: 120 }
          ]} 
        />} 
      />
      <Route 
        path="setup/accounts/cost-centers" 
        element={<SetupGenericTablePage 
          title="Setup Cost Centers" 
          description="Track expenses with cost center classification." 
          columns={[
            { key: 'name', label: 'COST CENTER NAME', width: 250 },
            { key: 'code', label: 'CODE', width: 120 }
          ]} 
        />} 
      />
      <Route 
        path="setup/accounts/cost-center-groups" 
        element={<SetupGenericTablePage 
          title="Setup Cost Center Groups" 
          description="Group cost centers for hierarchical reporting." 
          columns={[
            { key: 'name', label: 'GROUP NAME', width: 250 },
            { key: 'parent', label: 'PARENT GROUP', width: 200 }
          ]} 
        />} 
      />
      <Route 
        path="setup/accounts/allocate-cost-centers" 
        element={<SetupGenericTablePage 
          title="Allocate Accounts to Cost Centers" 
          description="Map accounts to their respective cost centers." 
          columns={[
            { key: 'account', label: 'ACCOUNT NAME', width: 250 },
            { key: 'costCenter', label: 'COST CENTER', width: 200 }
          ]} 
        />} 
      />
      <Route 
        path="setup/accounts/cost-element-budgets" 
        element={<SetupGenericTablePage 
          title="Setup Cost Element Wise Budgets" 
          description="Detailed budget control at cost element level." 
          columns={[
            { key: 'element', label: 'COST ELEMENT', width: 200 },
            { key: 'budget', label: 'BUDGET AMOUNT', width: 150 },
            { key: 'period', label: 'PERIOD', width: 120 }
          ]} 
        />} 
      />
      <Route 
        path="setup/accounts/transporters" 
        element={<SetupGenericTablePage 
          title="Setup Transporters" 
          description="Manage shipping and transport partners." 
          columns={[
            { key: 'name', label: 'TRANSPORTER NAME', width: 250 },
            { key: 'contact', label: 'CONTACT NO', width: 150 },
            { key: 'address', label: 'ADDRESS', width: 300 }
          ]} 
        />} 
      />
      <Route 
        path="setup/accounts/transport-destinations" 
        element={<SetupGenericTablePage 
          title="Setup Transport Destinations" 
          description="Define standard transport locations and distances." 
          columns={[
            { key: 'destination', label: 'DESTINATION NAME', width: 250 },
            { key: 'distance', label: 'DISTANCE (KM)', width: 120 }
          ]} 
        />} 
      />
      <Route 
        path="setup/accounts/tax-forms" 
        element={<SetupGenericTablePage 
          title="Setup Tax Forms" 
          description="Taxation forms and statutory compliance documents." 
          columns={[
            { key: 'name', label: 'FORM NAME', width: 200 },
            { key: 'description', label: 'DESCRIPTION', width: 300 }
          ]} 
        />} 
      />
      <Route 
        path="setup/accounts/allocate-tax-forms" 
        element={<SetupGenericTablePage 
          title="Allocate Accounts to Tax Forms" 
          description="Link taxation forms to account records." 
          columns={[
            { key: 'account', label: 'ACCOUNT NAME', width: 250 },
            { key: 'form', label: 'TAX FORM', width: 200 }
          ]} 
        />} 
      />
      <Route 
        path="setup/accounts/tds-types" 
        element={<SetupGenericTablePage 
          title="Setup TDS Types" 
          description="Withholding tax types and rates." 
          columns={[
            { key: 'type', label: 'TDS TYPE', width: 200 },
            { key: 'rate', label: 'PERCENTAGE (%)', width: 120 }
          ]} 
        />} 
      />
      <Route 
        path="setup/accounts/allocate-tds-types" 
        element={<SetupGenericTablePage 
          title="Allocate Accounts to TDS Types" 
          description="Assign TDS rules to vendors and service accounts." 
          columns={[
            { key: 'account', label: 'ACCOUNT NAME', width: 250 },
            { key: 'tdsType', label: 'TDS TYPE', width: 200 }
          ]} 
        />} 
      />
      <Route 
        path="setup/accounts/fbt-types" 
        element={<SetupGenericTablePage 
          title="Setup FBT Types" 
          description="Fringe Benefit Tax classifications." 
          columns={[{ key: 'type', label: 'FBT TYPE', width: 300 }]} 
        />} 
      />
      <Route 
        path="setup/accounts/allocate-fbt-types" 
        element={<SetupGenericTablePage 
          title="Allocate Accounts to FBT Types" 
          description="Link FBT rules to expense accounts." 
          columns={[
            { key: 'account', label: 'ACCOUNT NAME', width: 250 },
            { key: 'fbtType', label: 'FBT TYPE', width: 200 }
          ]} 
        />} 
      />
      <Route path="setup/accounts/customer-database" element={<CustomersListPage />} />
      <Route path="setup/accounts/account-groups" element={<AccountGroupsListPage />} />
      <Route 
        path="setup/accounts/balance-sheet-groups" 
        element={<SetupGenericTablePage 
          title="Setup Balance Sheet Groups" 
          description="Grouping for balance sheet financial reporting." 
          columns={[
            { key: 'name', label: 'GROUP NAME', width: 250 },
            { key: 'schedule', label: 'SCHEDULE NO', width: 120 }
          ]} 
        />} 
      />
      <Route 
        path="setup/accounts/allocate-balance-sheet-groups" 
        element={<SetupGenericTablePage 
          title="Allocate Accounts to Balance Sheet Groups" 
          description="Mapping accounts to B/S reporting groups." 
          columns={[
            { key: 'account', label: 'ACCOUNT NAME', width: 250 },
            { key: 'group', label: 'B/S GROUP', width: 200 }
          ]} 
        />} 
      />
      <Route path="setup/accounts/branch-setup" element={<StoreMasterPage />} />
      <Route path="setup/accounts/agents" element={<SalesmenListPage />} />
      <Route path="setup/stores" element={<StoreMasterPage />} />
      <Route path="setup/hsn-codes" element={<HSNCodePage />} />
      <Route path="setup/barcode-print" element={<BarcodePrintingPage />} />
      <Route path="setup/discounts" element={<DiscountSetupPage />} />
      <Route path="setup/counters" element={<CounterMasterPage />} />
      <Route path="setup/taxes" element={<Navigate to="edit-regions" replace />} />
      <Route 
        path="setup/taxes/edit-regions" 
        element={<SetupGenericTablePage 
          title="Edit Tax Regions" 
          description="Manage geographical tax regions." 
          columns={[{ key: 'name', label: 'REGION NAME', width: 250 }, { key: 'code', label: 'CODE', width: 120 }]} 
        />} 
      />
      <Route 
        path="setup/taxes/tax-types-sale" 
        element={<SetupGenericTablePage 
          title="Setup Tax Types (Sale)" 
          description="Define tax types for sales transactions." 
          columns={[{ key: 'type', label: 'TAX TYPE', width: 250 }, { key: 'rate', label: 'DEFAULT RATE (%)', width: 150 }]} 
        />} 
      />
      <Route 
        path="setup/taxes/tax-types-purchase" 
        element={<SetupGenericTablePage 
          title="Setup Tax Types (Purchase)" 
          description="Define tax types for purchase transactions." 
          columns={[{ key: 'type', label: 'TAX TYPE', width: 250 }, { key: 'rate', label: 'DEFAULT RATE (%)', width: 150 }]} 
        />} 
      />
      <Route 
        path="setup/taxes/item-taxes-grid" 
        element={<SetupGenericTablePage 
          title="Set Item Taxes - Grid Mode" 
          description="Bulk update tax settings for items." 
          columns={[
            { key: 'itemName', label: 'ITEM NAME', width: 250 },
            { key: 'packSize', label: 'PACK/SIZE', width: 120 },
            { key: 'itemCode', label: 'ITEM CODE', width: 150 },
            { key: 'companyName', label: 'COMPANY NAME', width: 200 },
            { key: 'groupName', label: 'GROUP NAME', width: 200 },
            { key: 'binName', label: 'BIN NAME', width: 150 }
          ]} 
        />} 
      />
      <Route 
        path="setup/taxes/company-taxes-grid" 
        element={<SetupGenericTablePage 
          title="Set Company Taxes - Grid Mode" 
          description="Configure tax rates per company." 
          columns={[{ key: 'company', label: 'COMPANY NAME', width: 250 }, { key: 'rate', label: 'TAX RATE', width: 120 }]} 
        />} 
      />
      <Route 
        path="setup/taxes/company-group-taxes" 
        element={<SetupGenericTablePage 
          title="Set Company + Group Wise Taxes" 
          description="Hierarchical tax setting for company and item groups." 
          columns={[{ key: 'company', label: 'COMPANY NAME', width: 200 }, { key: 'group', label: 'GROUP NAME', width: 200 }, { key: 'rate', label: 'TAX RATE', width: 120 }]} 
        />} 
      />
      <Route 
        path="setup/taxes/group-wise-taxes" 
        element={<SetupGenericTablePage 
          title="Set Group Wise Taxes" 
          description="Apply tax rates to item groups." 
          columns={[{ key: 'group', label: 'GROUP NAME', width: 250 }, { key: 'rate', label: 'TAX RATE', width: 120 }]} 
        />} 
      />
      <Route 
        path="setup/taxes/lot-wise-taxes" 
        element={<SetupGenericTablePage 
          title="Set Lot Wise Taxes for Sale" 
          description="Define tax rates for specific item lots." 
          columns={[{ key: 'lotNo', label: 'LOT NO', width: 150 }, { key: 'itemName', label: 'ITEM NAME', width: 250 }, { key: 'rate', label: 'TAX RATE', width: 120 }]} 
        />} 
      />
      <Route 
        path="setup/taxes/rate-basis-sale" 
        element={<SetupGenericTablePage 
          title="Link Tax Types(Rate Basis) - Sale" 
          description="Configure rate calculation basis for sale taxes." 
          columns={[{ key: 'type', label: 'TAX TYPE', width: 250 }, { key: 'basis', label: 'RATE BASIS', width: 200 }]} 
        />} 
      />
      <Route 
        path="setup/taxes/rate-basis-purchase" 
        element={<SetupGenericTablePage 
          title="Link Tax Types(Rate Basis) - Purchase" 
          description="Configure rate calculation basis for purchase taxes." 
          columns={[{ key: 'type', label: 'TAX TYPE', width: 250 }, { key: 'basis', label: 'RATE BASIS', width: 200 }]} 
        />} 
      />
      <Route path="setup/taxes/vat-groups" element={<SetupGenericTablePage title="Setup VAT Groups" description="Define VAT groups and component tax types." columns={[{ key: 'group', label: 'VAT GROUP', width: 250 }, { key: 'components', label: 'COMPONENTS', width: 300 }]} />} />
      {/* Party Wise Settings Group */}
      <Route path="setup/party-wise">
        <Route index element={<Navigate to="supplier-companies" replace />} />
        <Route path="supplier-companies" element={<SetupGenericTablePage title="Supplier + Companies" description="Link suppliers to specific companies." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'supplier', label: 'SUPPLIER NAME', width: 250 }, { key: 'company', label: 'COMPANY NAME', width: 200 }, { key: 'status', label: 'STATUS', width: 100 }, { key: 'remarks', label: 'REMARKS', width: 200 }]} />} />
        <Route path="supplier-items" element={<SetupGenericTablePage title="Supplier + Items" description="Map items to their suppliers." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'supplier', label: 'SUPPLIER NAME', width: 200 }, { key: 'item', label: 'ITEM NAME', width: 200 }, { key: 'code', label: 'ITEM CODE', width: 120 }, { key: 'uom', label: 'UOM', width: 80 }, { key: 'moq', label: 'MOQ', width: 80 }]} />} />
        <Route path="branch-supplier-items" element={<SetupGenericTablePage title="Branch + Supplier + Items" description="Branch-specific supplier-item mapping." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'branch', label: 'BRANCH', width: 150 }, { key: 'supplier', label: 'SUPPLIER', width: 150 }, { key: 'item', label: 'ITEM', width: 150 }, { key: 'category', label: 'CATEGORY', width: 120 }]} />} />
        <Route path="supplier-defaults" element={<SetupGenericTablePage title="Set Supplier Wise Default TD/CD/Tax" description="Set default discounts and taxes for suppliers." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'supplier', label: 'SUPPLIER NAME', width: 200 }, { key: 'td', label: 'TD %', width: 100 }, { key: 'cd', label: 'CD %', width: 100 }, { key: 'tax', label: 'TAX %', width: 100 }, { key: 'freight', label: 'FREIGHT %', width: 100 }]} />} />
        <Route path="tax-regions-customers" element={<SetupGenericTablePage title="Set Tax Regions + Customers" description="Assign tax regions to customers." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'region', label: 'TAX REGION', width: 200 }, { key: 'customer', label: 'CUSTOMER NAME', width: 200 }, { key: 'gstin', label: 'GSTIN', width: 150 }]} />} />
        <Route path="branch-tax-customers" element={<SetupGenericTablePage title="Set Branch + Tax Region + Customers" description="Three-way mapping for branch, tax region, and customer." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'branch', label: 'BRANCH', width: 150 }, { key: 'region', label: 'TAX REGION', width: 150 }, { key: 'customer', label: 'CUSTOMER', width: 150 }]} />} />
        <Route path="party-taxes" element={<SetupGenericTablePage title="Set Party Wise Taxes" description="Configure taxes for specific parties." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'party', label: 'PARTY NAME', width: 200 }, { key: 'taxType', label: 'TAX TYPE', width: 150 }, { key: 'rate', label: 'RATE %', width: 100 }]} />} />
        <Route path="supplier-taxes" element={<SetupGenericTablePage title="Set Supplier Wise Taxes" description="Configure taxes for specific suppliers." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'supplier', label: 'SUPPLIER NAME', width: 200 }, { key: 'taxType', label: 'TAX TYPE', width: 150 }, { key: 'rate', label: 'RATE %', width: 100 }]} />} />
        <Route path="party-defaults" element={<SetupGenericTablePage title="Set Party Wise Defaults" description="Set global defaults for parties." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'party', label: 'PARTY NAME', width: 180 }, { key: 'category', label: 'CATEGORY', width: 150 }, { key: 'warehouse', label: 'WHOUSE', width: 120 }, { key: 'priceList', label: 'PR LIST', width: 120 }]} />} />
        <Route path="party-agent-defaults" element={<SetupGenericTablePage title="Set Party + Series/Agent Wise Defaults" description="Agent and series specific party settings." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'party', label: 'PARTY NAME', width: 180 }, { key: 'agent', label: 'AGENT', width: 150 }, { key: 'series', label: 'SERIES', width: 120 }]} />} />
        <Route path="party-price-list" element={<SetupGenericTablePage title="Set Party Wise Price List" description="Assign price categories to parties." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'party', label: 'PARTY NAME', width: 200 }, { key: 'priceList', label: 'PRICE LIST', width: 180 }, { key: 'effectiveFrom', label: 'EFF. FROM', width: 120 }]} />} />
        <Route path="party-company-defaults" element={<SetupGenericTablePage title="Party + Company Wise Defaults" description="Link parties to companies with default settings." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'party', label: 'PARTY NAME', width: 180 }, { key: 'company', label: 'COMPANY', width: 180 }, { key: 'branch', label: 'BRANCH', width: 150 }]} />} />
        <Route path="party-item-defaults" element={<SetupGenericTablePage title="Party + Item Wise Defaults" description="Special item settings for specific parties." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'party', label: 'PARTY NAME', width: 180 }, { key: 'item', label: 'ITEM NAME', width: 180 }, { key: 'rate', label: 'SPECIAL RATE', width: 120 }]} />} />
        <Route path="branch-party-item-defaults" element={<SetupGenericTablePage title="Branch + Party + Item Wise Defaults" description="Branch-specific party-item settings." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'branch', label: 'BRANCH', width: 130 }, { key: 'party', label: 'PARTY', width: 130 }, { key: 'item', label: 'ITEM', width: 130 }, { key: 'disc', label: 'DISC %', width: 80 }]} />} />
        <Route path="branch-supplier-group-defaults" element={<SetupGenericTablePage title="Branch + Supplier + Item Group Wise Defaults" description="Group-level supplier defaults per branch." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'branch', label: 'BRANCH', width: 130 }, { key: 'supplier', label: 'SUPPLIER', width: 130 }, { key: 'group', label: 'ITEM GROUP', width: 130 }, { key: 'leadTime', label: 'L. TIME (DAYS)', width: 120 }]} />} />
        <Route path="party-billing-locks" element={<SetupGenericTablePage title="Party Wise Billing Locks" description="Manage transaction locks for parties." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'party', label: 'PARTY NAME', width: 200 }, { key: 'lockType', label: 'LOCK TYPE', width: 150 }, { key: 'reason', label: 'REASON', width: 200 }]} />} />
        <Route path="party-discount-locks" element={<SetupGenericTablePage title="Party Wise Discount Locks" description="Control maximum discounts for parties." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'party', label: 'PARTY NAME', width: 200 }, { key: 'itemGroup', label: 'ITEM GROUP', width: 150 }, { key: 'maxDisc', label: 'MAX DISC %', width: 120 }]} />} />
        <Route path="multi-price-rates" element={<SetupGenericTablePage title="Enter Multiple Price List Wise Item Rates" description="Bulk entry for multi-level price lists." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'item', label: 'ITEM NAME', width: 180 }, { key: 'p1', label: 'PRICE 1', width: 100 }, { key: 'p2', label: 'PRICE 2', width: 100 }, { key: 'p3', label: 'PRICE 3', width: 100 }]} />} />
        <Route path="party-item-descriptions" element={<SetupGenericTablePage title="Party + Item Wise Descriptions" description="Party-specific item descriptions." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'party', label: 'PARTY NAME', width: 150 }, { key: 'item', label: 'ITEM NAME', width: 150 }, { key: 'description', label: 'CUSTOM DESCRIPTION', width: 300 }]} />} />
        <Route path="party-item-codes" element={<SetupGenericTablePage title="Party + Item Wise Item Codes" description="Party-specific item coding." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'party', label: 'PARTY NAME', width: 150 }, { key: 'item', label: 'ITEM NAME', width: 150 }, { key: 'customCode', label: 'CUSTOM CODE', width: 150 }]} />} />
        <Route path="po-markdowns" element={<SetupGenericTablePage title="Setup Supplier + Company + Group/Item Wise Markdowns for PO" description="Configure markdowns for purchase orders." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'supplier', label: 'SUPPLIER', width: 130 }, { key: 'company', label: 'COMPANY', width: 130 }, { key: 'group', label: 'GROUP', width: 130 }, { key: 'markdown', label: 'MARKDOWN %', width: 120 }]} />} />
        <Route path="party-item-filter" element={<SetupGenericTablePage title="Set Party Wise Item Group Filter for Sale" description="Restrict item groups for specific parties." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'party', label: 'PARTY NAME', width: 200 }, { key: 'filter', label: 'ALLOWED GROUPS', width: 250 }]} />} />
        <Route path="calc-configs-purchase" element={<SetupGenericTablePage title="Setup Calculation Configurations for Purchase" description="Define calculation logic for purchases." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'config', label: 'CONFIG NAME', width: 250 }, { key: 'formula', label: 'FORMULA', width: 300 }]} />} />
        <Route path="allocate-parties-calc" element={<SetupGenericTablePage title="Allocate Parties to Calculation Configuration" description="Assign calculation rules to parties." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'party', label: 'PARTY NAME', width: 200 }, { key: 'config', label: 'CALC CONFIG', width: 200 }]} />} />
      </Route>

      {/* Other Account Details Group */}
      <Route path="setup/other-account-details">
        <Route index element={<Navigate to="account-budget" replace />} />
        <Route path="account-budget" element={<SetupGenericTablePage title="Setup Account Wise Budget/Limit" description="Manage spending limits and credit boundaries." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'account', label: 'ACCOUNT NAME', width: 250 }, { key: 'limit', label: 'LIMIT', width: 120 }, { key: 'type', label: 'DEBIT/CREDIT', width: 100 }, { key: 'notify', label: 'NOTIFY %', width: 100 }]} />} />
        <Route path="customer-supplier-details" element={<SetupGenericTablePage title="Enter Customer/Supplier wise Other Details" description="Additional metadata for business partners." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'name', label: 'PARTNER NAME', width: 200 }, { key: 'gst', label: 'GST NO.', width: 150 }, { key: 'pan', label: 'PAN NO.', width: 150 }, { key: 'state', label: 'STATE', width: 120 }]} />} />
        <Route path="party-payment-terms" element={<SetupGenericTablePage title="Enter Party Wise Payment Terms" description="Define payment schedules and conditions." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'party', label: 'PARTY NAME', width: 200 }, { key: 'terms', label: 'TERMS', width: 250 }, { key: 'penalty', label: 'PENALTY %', width: 100 }]} />} />
        <Route path="party-payment-breakup" element={<SetupGenericTablePage title="Enter Party Wise Payment Breakup Days" description="Configure aging and payment credit days." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'party', label: 'PARTY NAME', width: 200 }, { key: 'days', label: 'CREDIT DAYS', width: 120 }, { key: 'graceDays', label: 'GRACE DAYS', width: 120 }]} />} />
        <Route path="allocate-sale-nature" element={<SetupGenericTablePage title="Allocate Accounts to Sale Nature" description="Map accounts to their statutory sale nature." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'account', label: 'ACCOUNT', width: 200 }, { key: 'nature', label: 'SALE NATURE', width: 180 }, { key: 'classification', label: 'CLASSIFICATION', width: 150 }]} />} />
        <Route path="stock-categories" element={<SetupGenericTablePage title="Setup Stock Categories" description="Define categories for stock classification." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'name', label: 'CATEGORY NAME', width: 250 }, { key: 'parent', label: 'PARENT CAT', width: 200 }]} />} />
        <Route path="customer-banks" element={<SetupGenericTablePage title="Setup Customer Banks" description="Manage bank details for customers." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'customer', label: 'CUSTOMER', width: 180 }, { key: 'bank', label: 'BANK', width: 180 }, { key: 'ifsc', label: 'IFSC', width: 120 }, { key: 'accNo', label: 'ACCOUNT NO', width: 150 }]} />} />
        <Route path="currency" element={<SetupGenericTablePage title="Setup Currency" description="Manage multi-currency support." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'name', label: 'CURRENCY', width: 120 }, { key: 'symbol', label: 'SYM', width: 60 }, { key: 'iso', label: 'ISO CODE', width: 100 }, { key: 'fraction', label: 'FRACTION NAME', width: 120 }]} />} />
        <Route path="currency-exchange" element={<SetupGenericTablePage title="Setup Date Wise Currency Exchange Rates" description="Track historical exchange rate fluctuations." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'date', label: 'DATE', width: 120 }, { key: 'currency', label: 'CURRENCY', width: 120 }, { key: 'rate', label: 'RATE (BASE)', width: 120 }]} />} />
      </Route>

      {/* Configurations Group */}
      <Route path="setup/configurations">
        <Route index element={<Navigate to="purchase-voucher" replace />} />
        <Route path="purchase-voucher" element={<SetupGenericTablePage title="Purchase Voucher Configuration" description="Global settings for purchase transactions." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'param', label: 'PARAMETER', width: 250 }, { key: 'value', label: 'SETTING VALUE', width: 200 }, { key: 'type', label: 'VAL TYPE', width: 120 }, { key: 'remarks', label: 'REMARKS', width: 200 }]} />} />
        <Route path="qc-parameters" element={<SetupGenericTablePage title="Setup Q.C. Parameters for Purchase" description="Define quality control criteria." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'paramName', label: 'PARAMETER', width: 200 }, { key: 'minVal', label: 'MIN VAL', width: 100 }, { key: 'maxVal', label: 'MAX VAL', width: 100 }, { key: 'unit', label: 'UNIT', width: 80 }]} />} />
        <Route path="schemes" element={<SetupGenericTablePage title="Setup Schemes" description="Manage promotional schemes." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'name', label: 'SCHEME NAME', width: 200 }, { key: 'type', label: 'TYPE', width: 120 }, { key: 'from', label: 'FROM DATE', width: 120 }, { key: 'to', label: 'TO DATE', width: 120 }]} />} />
        <Route path="item-schemes" element={<SetupGenericTablePage title="Setup Item Wise Schemes" description="Item-specific promotional rules." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'item', label: 'ITEM', width: 150 }, { key: 'scheme', label: 'SCHEME', width: 150 }, { key: 'disc1', label: 'DISC 1', width: 80 }, { key: 'disc2', label: 'DISC 2', width: 80 }]} />} />
        <Route path="item-group-schemes" element={<SetupGenericTablePage title="Setup Item Group Wise Schemes" description="Group-level promotional rules." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'group', label: 'GROUP', width: 150 }, { key: 'scheme', label: 'SCHEME', width: 150 }, { key: 'bonus', label: 'BONUS %', width: 100 }]} />} />
        <Route path="party-item-group-schemes" element={<SetupGenericTablePage title="Setup Party + Item Group Wise Schemes" description="Complex party-group promotional mapping." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'party', label: 'PARTY', width: 130 }, { key: 'group', label: 'GROUP', width: 130 }, { key: 'scheme', label: 'SCHEME', width: 130 }]} />} />
        <Route path="party-item-schemes" element={<SetupGenericTablePage title="Setup Party + Item Wise Schemes" description="Complex party-item promotional mapping." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'party', label: 'PARTY', width: 130 }, { key: 'item', label: 'ITEM', width: 130 }, { key: 'scheme', label: 'SCHEME', width: 130 }]} />} />
        <Route path="scheme-campaign" element={<SetupGenericTablePage title="Setup Scheme Campaign" description="Organize schemes into marketing campaigns." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'name', label: 'CAMPAIGN', width: 200 }, { key: 'budget', label: 'BUDGET', width: 120 }, { key: 'status', label: 'STATUS', width: 100 }]} />} />
        <Route path="scheme-campaign-slab" element={<SetupGenericTablePage title="Setup Scheme Campaign Slab Details" description="Define slab-based campaign rules." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'campaign', label: 'CAMPAIGN', width: 150 }, { key: 'slabVal', label: 'SLAB VAL', width: 120 }, { key: 'benefit', label: 'BENEFIT %', width: 100 }]} />} />
        <Route path="series-discount-slabs" element={<SetupGenericTablePage title="Setup Series Wise Discount Slabs" description="Series-specific discount structures." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'series', label: 'SERIES', width: 150 }, { key: 'fromAmt', label: 'FROM AMT', width: 120 }, { key: 'toAmt', label: 'TO AMT', width: 120 }, { key: 'disc', label: 'DISC %', width: 80 }]} />} />
        <Route path="cd-sale" element={<SetupGenericTablePage title="Setup C.D.'s for Sale" description="Cash discount rules for sales." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'name', label: 'CD NAME', width: 150 }, { key: 'days', label: 'DAYS', width: 80 }, { key: 'rate', label: 'RATE %', width: 100 }]} />} />
        <Route path="sale-voucher" element={<SetupGenericTablePage title="Sale Voucher Configuration" description="Global settings for sales transactions." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'param', label: 'PARAMETER', width: 250 }, { key: 'value', label: 'VALUE', width: 150 }, { key: 'remarks', label: 'REMARKS', width: 200 }]} />} />
        <Route path="series-party-printing" element={<SetupGenericTablePage title="Set Series + Party Wise Printing" description="Configure printing per series and party." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'series', label: 'SERIES', width: 130 }, { key: 'party', label: 'PARTY', width: 130 }, { key: 'template', label: 'TEMPLATE', width: 150 }]} />} />
        <Route path="series-outlet-printing" element={<SetupGenericTablePage title="Set Series + Outlet Wise Printing" description="Configure printing per series and outlet." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'series', label: 'SERIES', width: 130 }, { key: 'outlet', label: 'OUTLET', width: 130 }, { key: 'template', label: 'TEMPLATE', width: 150 }]} />} />
        <Route path="series-user-printing" element={<SetupGenericTablePage title="Set Series + User Wise Printing" description="Configure printing per series and user." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'series', label: 'SERIES', width: 130 }, { key: 'user', label: 'USER', width: 130 }, { key: 'template', label: 'TEMPLATE', width: 150 }]} />} />
        <Route path="cashiers-pos" element={<SetupGenericTablePage title="Setup Cashiers for POS" description="Register and manage POS cashiers." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'name', label: 'CASHIER', width: 200 }, { key: 'counter', label: 'COUNTER', width: 120 }, { key: 'shift', label: 'SHIFT', width: 100 }]} />} />
        <Route path="manager-pos" element={<SetupGenericTablePage title="Setup Manager for POS" description="Map managers to POS operations." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'name', label: 'MANAGER', width: 200 }, { key: 'branch', label: 'BRANCH', width: 150 }]} />} />
        <Route path="wallet-payment" element={<SetupGenericTablePage title="Wallet Payment Configuration" description="Manage digital wallet integrations." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'wallet', label: 'WALLET NAME', width: 150 }, { key: 'provider', label: 'PROVIDER', width: 150 }, { key: 'charge', label: 'SVC CHARGE %', width: 100 }]} />} />
        <Route path="credit-note-schemes" element={<SetupGenericTablePage title="Setup Credit Note for Schemes against Sales" description="Configure automatic credit notes." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'scheme', label: 'SCHEME', width: 150 }, { key: 'cnType', label: 'CN TYPE', width: 120 }, { key: 'validity', label: 'VALIDITY (DAYS)', width: 120 }]} />} />
        <Route path="complaints-mgmt" element={<SetupGenericTablePage title="Complaints Management System Configuration" description="Global settings for the CRM system." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'setting', label: 'SETTING', width: 200 }, { key: 'value', label: 'VAL', width: 150 }, { key: 'autoAssign', label: 'AUTO ASSIGN', width: 120 }]} />} />
        <Route path="assembly-expenses" element={<SetupGenericTablePage title="Setup Assembly Expenses" description="Define expenses for kit assembly." columns={[{ key: 'sno', label: 'SNO.', width: 60 }, { key: 'expense', label: 'EXPENSE NAME', width: 180 }, { key: 'calcType', label: 'CALC TYPE', width: 120 }, { key: 'rate', label: 'RATE/PCT', width: 100 }]} />} />
      </Route>
      <Route path="data-import">
        <Route index element={<DataImportExportPage />} />
        <Route path="export-purchase-text" element={<DataImportPlaceholderPage />} />
        <Route path="export-stock-transfer-godown" element={<DataImportPlaceholderPage />} />
        <Route path="export-item-master" element={<DataImportPlaceholderPage />} />
        <Route path="import-purchase-challan-text" element={<DataImportPlaceholderPage />} />
        <Route path="import-purchase-text" element={<DataImportPlaceholderPage />} />
        <Route path="import-item-masters-text" element={<DataImportPlaceholderPage />} />
      </Route>
      <Route path="reports" element={<ReportsQueriesPlaceholderPage pageKey="financial-reports" />} />
      <Route path="reports/dashboard" element={<ReportsDashboard />} />
      <Route path="reports/financial-reports" element={<ReportsQueriesPlaceholderPage pageKey="financial-reports" />} />
      <Route path="reports/financial-reports">
        <Route path="trial-vertical" element={<FinancialReportPlaceholder title="Trial Balance with Vertical View of Fin Years" />} />
        <Route path="trial-horizontal" element={<FinancialReportPlaceholder title="Trial Balance with Horizontal View of Fin Years" />} />
        <Route path="trial-groups" element={<FinancialReportPlaceholder title="Trial Balance - Balance Sheet Groups" />} />
        <Route path="ledger" element={<FinancialReportPlaceholder title="Ledger" />} />
        <Route path="ledger-branch" element={<FinancialReportPlaceholder title="Ledger - Branch Wise" />} />
        <Route path="ledger-double" element={<FinancialReportPlaceholder title="Ledger - Double Column" />} />
        <Route path="ledger-trial" element={<FinancialReportPlaceholder title="Ledger/Trial Balance" />} />
        <Route path="account-tree-query" element={<FinancialReportPlaceholder title="Transactions Query through Treeview of Account Groups" />} />
        <Route path="day-book" element={<FinancialReportPlaceholder title="Day Book(New)" />} />
        <Route path="cash-bank-book" element={<FinancialReportPlaceholder title="Cash/Bank Book" />} />
        <Route path="journal" element={<FinancialReportPlaceholder title="Journal" />} />
        <Route path="bank-clearing" element={<FinancialReportPlaceholder title="Bank Wise Clearing Report" />} />
        <Route path="bank-reconciliation" element={<FinancialReportPlaceholder title="Bank Reconciliation Statement" />} />
        <Route path="cheques-cleared-date" element={<FinancialReportPlaceholder title="Cheques Cleared - Date Wise Report" />} />
        <Route path="advance-receipt-gst" element={<FinancialReportPlaceholder title="Advance Receipt Voucher(GST) Analysis Report" />} />
        <Route path="ageing-analysis" element={<FinancialReportPlaceholder title="Dues/Ageing Analysis" />} />
        <Route path="ageing-analysis-new" element={<FinancialReportPlaceholder title="Dues/Ageing Analysis - New" />} />
        <Route path="collection-report" element={<FinancialReportPlaceholder title="Collection Report" />} />
        <Route path="unadjusted-details" element={<FinancialReportPlaceholder title="Un-Adjusted Payments/SR/PR Details" />} />
        <Route path="interest-calc" element={<FinancialReportPlaceholder title="Interest Calculation" />} />
        <Route path="pending-st-forms" element={<FinancialReportPlaceholder title="Pending ST Forms" />} />
        <Route path="pending-st-forms-item" element={<FinancialReportPlaceholder title="Pending ST Forms - Item Wise" />} />
        <Route path="pdc-report" element={<FinancialReportPlaceholder title="Post Dated Cheques Report" />} />
        <Route path="directory" element={<FinancialReportPlaceholder title="Supplier/Customer Directory" />} />
      </Route>
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
      <Route path="user-access/user-access-reports" element={<Navigate to="../reports" replace />} />
      <Route path="user-access/reports/*" element={<UserAccessPlaceholderPage key="reports-view" />} />
      <Route path="production" element={<ProductionPlaceholderPage pageKey="production-dashboard" />} />
      <Route path="production/setups">
        <Route index element={<ProductionSetupPlaceholder title="Production Master Selection" />} />
        <Route path="process-groups" element={<ProductionSetupPlaceholder title="Setup Process Groups/Processes" />} />
        <Route path="bom-raw-material" element={<ProductionSetupPlaceholder title="Setup BOM Raw Material Types" />} />
        <Route path="bom-expenses" element={<ProductionSetupPlaceholder title="Setup BOM Expenses" />} />
        <Route path="rejection-reasons" element={<ProductionSetupPlaceholder title="Setup Production Rejection Reasons" />} />
        <Route path="qc-parameters" element={<ProductionSetupPlaceholder title="Setup Q.C. Parameters for Production" />} />
        <Route path="machines" element={<ProductionSetupPlaceholder title="Setup Machines" />} />
        <Route path="process-item-linking" element={<ProductionSetupPlaceholder title="Process + Item Linking" />} />
        <Route path="process-item-group-linking" element={<ProductionSetupPlaceholder title="Process + Item Group Linking" />} />
        <Route path="discrete-production-linking" element={<ProductionSetupPlaceholder title="Process + Item Linking for Discrete Production" />} />
        <Route path="raw-material-specs-grid" element={<ProductionSetupPlaceholder title="Items + Process Raw Material Specs(Grid Mode)" />} />
        <Route path="sub-process-item-linking" element={<ProductionSetupPlaceholder title="Sub-Process + Item Linking" />} />
        <Route path="process-wise-rates" element={<ProductionSetupPlaceholder title="Setup Process Wise Item Rates" />} />
      </Route>
      <Route path="production/vouchers" element={<ProductionPlaceholderPage pageKey="production-vouchers" />} />
      <Route path="production/raw-material-processing" element={<ProductionPlaceholderPage pageKey="raw-material-processing" />} />
      <Route path="production/reports-queries" element={<ProductionPlaceholderPage pageKey="reports-queries" />} />
      <Route path="production/utilities" element={<ProductionPlaceholderPage pageKey="production-utilities" />} />
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

      {/* Accounts Vouchers */}
      <Route path="accounts" element={<Navigate to="vouchers" replace />} />
      <Route path="accounts/vouchers">
        <Route index element={<Navigate to="cash-receipts" replace />} />
        <Route path="cash-receipts" element={<CashReceiptVoucher />} />
        <Route path="cash-payments" element={<GenericVoucherForm title="Cash Payments" configName="CASH PAYMENT" defaultAcc="CASH IN HAND" />} />
        <Route path="cheque-nums-bank" element={<GenericVoucherForm title="Enter Cheque Numbers - Bank Payments" configName="BANK CHEQUE REG" defaultAcc="HDFC BANK" />} />
        <Route path="receipt-nums-cash" element={<GenericVoucherForm title="Enter Receipt Numbers - Cash Receipts" configName="CASH RECEIPT REG" defaultAcc="CASH IN HAND" />} />
        <Route path="bank-receipts" element={<GenericVoucherForm title="Bank Receipts" configName="BANK RECEIPT" defaultAcc="HDFC BANK" />} />
        <Route path="bank-payments" element={<GenericVoucherForm title="Bank Payments" configName="BANK PAYMENT" defaultAcc="HDFC BANK" />} />
        <Route path="pdc-receipts" element={<GenericVoucherForm title="Post Dated Cheques(Receipts)" configName="PDC RECEIPT" defaultAcc="POST DATED CHEQUES" />} />
        <Route path="pdc-payments" element={<GenericVoucherForm title="Post Dated Cheques(Payments)" configName="PDC PAYMENT" defaultAcc="POST DATED CHEQUES" />} />
        <Route path="convert-pdc" element={<GenericVoucherForm title="Convert P.D. Cheques" configName="PDC CONVERSION" defaultAcc="CHEQUE COLLECTION" />} />
        <Route path="realise-pdc-receipts" element={<GenericVoucherForm title="Realise Cheques for Collection(Receipts)" configName="PDC REALISATION" defaultAcc="HDFC BANK" />} />
        <Route path="realise-pdc-payments" element={<GenericVoucherForm title="Realise Cheques for Collection(Payments)" configName="PDC CLEARANCE" defaultAcc="HDFC BANK" />} />
        <Route path="cheque-clearing" element={<GenericVoucherForm title="Enter Cheque Clearing" configName="CHEQUE CLEARING" defaultAcc="CASH IN HAND" />} />
        <Route path="journal-sale" element={<GenericVoucherForm title="Journal - Sale" configName="SALE JOURNAL" defaultAcc="ACCOUNTS RECEIVABLE" />} />
        <Route path="journal-sale-return" element={<GenericVoucherForm title="Journal - Sale Return" configName="SALE RETURN JOURNAL" defaultAcc="ACCOUNTS RECEIVABLE" />} />
        <Route path="journal-purchase" element={<GenericVoucherForm title="Journal - Purchase" configName="PURCHASE JOURNAL" defaultAcc="ACCOUNTS PAYABLE" />} />
        <Route path="journal-purchase-return" element={<GenericVoucherForm title="Journal - Purchase Return" configName="PURCHASE RETURN JOURNAL" defaultAcc="ACCOUNTS PAYABLE" />} />
        <Route path="journal-credit-note" element={<GenericVoucherForm title="Journal - Credit Note" configName="CREDIT NOTE JOURNAL" defaultAcc="ACCOUNTS RECEIVABLE" />} />
        <Route path="journal-debit-note" element={<GenericVoucherForm title="Journal - Debit Note" configName="DEBIT NOTE JOURNAL" defaultAcc="ACCOUNTS PAYABLE" />} />
        <Route path="journal-rate-diff" element={<GenericVoucherForm title="Journal Debit/Credit Notes - Rate Difference" configName="RATE DIFF JOURNAL" defaultAcc="ADJUSTMENT ACC" />} />
        <Route path="journal-voucher-entry" element={<GenericVoucherForm title="Journal Voucher - Sale/Purchase Entry" configName="JOURNAL ENTRY" defaultAcc="GENERAL LEDGER" />} />
        <Route path="cost-centre-breakup" element={<GenericVoucherForm title="Cost Centre Wise Transactions Breakup" configName="COST CENTRE BREAKUP" defaultAcc="EXPENSE CONTROL" />} />
        <Route path="adjust-bills" element={<GenericVoucherForm title="Adjust Bills Receivable/Payable" configName="BILL ADJUSTMENT" defaultAcc="ACCOUNTS CONTROL" />} />
        <Route path="opening-st-forms" element={<GenericVoucherForm title="Enter Opening Pending ST Forms" configName="OPENING ST FORM" defaultAcc="TAX CONTROL" />} />
        <Route path="track-st-forms" element={<GenericVoucherForm title="Track Receipt/Issues of ST Forms" configName="ST FORM TRACKING" defaultAcc="TAX CONTROL" />} />
        <Route path="missing-receipt-nums" element={<GenericVoucherForm title="Missing Receipt Numbers" configName="GAP ANALYSIS" defaultAcc="SYSTEM AUDIT" />} />
      </Route>
      <Route path="accounts/printing">
        <Route index element={<Navigate to="cash-receipts" replace />} />
        <Route path="cash-receipts" element={<PrintingPlaceholderPage title="Cash Receipts" />} />
        <Route path="cash-payments" element={<PrintingPlaceholderPage title="Cash Payments" />} />
        <Route path="bank-receipts" element={<PrintingPlaceholderPage title="Bank Receipts" />} />
        <Route path="bank-payments" element={<PrintingPlaceholderPage title="Bank Payments" />} />
        <Route path="pdc-receipts" element={<PrintingPlaceholderPage title="Post Dated Cheques(Receipts)" />} />
        <Route path="pdc-payments" element={<PrintingPlaceholderPage title="Post Dated Cheques(Payments)" />} />
        <Route path="journal" element={<PrintingPlaceholderPage title="Journal" />} />
        <Route path="cash-receipts-designer" element={<PrintingPlaceholderPage title="Cash Receipts - Designer" />} />
        <Route path="cash-payments-designer" element={<PrintingPlaceholderPage title="Cash Payments - Designer" />} />
        <Route path="bank-receipts-designer" element={<PrintingPlaceholderPage title="Bank Receipts - Designer" />} />
        <Route path="bank-payments-designer" element={<PrintingPlaceholderPage title="Bank Payments - Designer" />} />
        <Route path="pdc-receipts-designer" element={<PrintingPlaceholderPage title="Post Dated Cheques(Receipts) - Designer" />} />
        <Route path="pdc-payments-designer" element={<PrintingPlaceholderPage title="Post Dated Cheques(Payments) - Designer" />} />
        <Route path="journal-designer" element={<PrintingPlaceholderPage title="Journal - Designer" />} />
        <Route path="advance-receipt-gst" element={<PrintingPlaceholderPage title="Advance Receipt Voucher GST" />} />
        <Route path="advance-refund-gst" element={<PrintingPlaceholderPage title="Advance Receipt Refund Voucher GST" />} />
      </Route>
      <Route path="accounts/utilities">
        <Route index element={<AccountsUtilitiesPage />} />
        <Route path="re-save-vouchers" element={<SetupGenericTablePage title="Re-Save Cash/Bank Vouchers" description="Batch re-save tool for cash and bank vouchers." columns={[{ key: 'vNo', label: 'VOUCHER NO', width: 150 }, { key: 'status', label: 'STATUS', width: 150 }]} />} />
        <Route path="re-save-journal" element={<SetupGenericTablePage title="Re-Save Journal Vouchers" description="Batch re-save tool for journal vouchers." columns={[{ key: 'vNo', label: 'VOUCHER NO', width: 150 }, { key: 'status', label: 'STATUS', width: 150 }]} />} />
      </Route>
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
      <Route path="accounts" element={<Navigate to="vouchers" replace />} />
      <Route path="accounts/vouchers">
        <Route index element={<Navigate to="cash-receipts" replace />} />
        <Route path="cash-receipts" element={<CashReceiptVoucher />} />
        <Route path="cash-payments" element={<GenericVoucherForm title="Cash Payments" configName="CASH PAYMENT" defaultAcc="CASH IN HAND" />} />
        <Route path="cheque-nums-bank" element={<GenericVoucherForm title="Enter Cheque Numbers - Bank Payments" configName="BANK CHEQUE REG" defaultAcc="HDFC BANK" />} />
        <Route path="receipt-nums-cash" element={<GenericVoucherForm title="Enter Receipt Numbers - Cash Receipts" configName="CASH RECEIPT REG" defaultAcc="CASH IN HAND" />} />
        <Route path="bank-receipts" element={<GenericVoucherForm title="Bank Receipts" configName="BANK RECEIPT" defaultAcc="HDFC BANK" />} />
        <Route path="bank-payments" element={<GenericVoucherForm title="Bank Payments" configName="BANK PAYMENT" defaultAcc="HDFC BANK" />} />
        <Route path="pdc-receipts" element={<GenericVoucherForm title="Post Dated Cheques(Receipts)" configName="PDC RECEIPT" defaultAcc="POST DATED CHEQUES" />} />
        <Route path="pdc-payments" element={<GenericVoucherForm title="Post Dated Cheques(Payments)" configName="PDC PAYMENT" defaultAcc="POST DATED CHEQUES" />} />
        <Route path="convert-pdc" element={<GenericVoucherForm title="Convert P.D. Cheques" configName="PDC CONVERSION" defaultAcc="CHEQUE COLLECTION" />} />
        <Route path="realise-pdc-receipts" element={<GenericVoucherForm title="Realise Cheques for Collection(Receipts)" configName="PDC REALISATION" defaultAcc="HDFC BANK" />} />
        <Route path="realise-pdc-payments" element={<GenericVoucherForm title="Realise Cheques for Collection(Payments)" configName="PDC CLEARANCE" defaultAcc="HDFC BANK" />} />
        <Route path="cheque-clearing" element={<GenericVoucherForm title="Enter Cheque Clearing" configName="CHEQUE CLEARING" defaultAcc="CASH IN HAND" />} />
        <Route path="journal-sale" element={<GenericVoucherForm title="Journal - Sale" configName="SALE JOURNAL" defaultAcc="ACCOUNTS RECEIVABLE" />} />
        <Route path="journal-sale-return" element={<GenericVoucherForm title="Journal - Sale Return" configName="SALE RETURN JOURNAL" defaultAcc="ACCOUNTS RECEIVABLE" />} />
        <Route path="journal-purchase" element={<GenericVoucherForm title="Journal - Purchase" configName="PURCHASE JOURNAL" defaultAcc="ACCOUNTS PAYABLE" />} />
        <Route path="journal-purchase-return" element={<GenericVoucherForm title="Journal - Purchase Return" configName="PURCHASE RETURN JOURNAL" defaultAcc="ACCOUNTS PAYABLE" />} />
        <Route path="journal-credit-note" element={<GenericVoucherForm title="Journal - Credit Note" configName="CREDIT NOTE JOURNAL" defaultAcc="ACCOUNTS RECEIVABLE" />} />
        <Route path="journal-debit-note" element={<GenericVoucherForm title="Journal - Debit Note" configName="DEBIT NOTE JOURNAL" defaultAcc="ACCOUNTS PAYABLE" />} />
        <Route path="journal-rate-diff" element={<GenericVoucherForm title="Journal Debit/Credit Notes - Rate Difference" configName="RATE DIFF JOURNAL" defaultAcc="ADJUSTMENT ACC" />} />
        <Route path="journal-voucher-entry" element={<GenericVoucherForm title="Journal Voucher - Sale/Purchase Entry" configName="JOURNAL ENTRY" defaultAcc="GENERAL LEDGER" />} />
        <Route path="cost-centre-breakup" element={<GenericVoucherForm title="Cost Centre Wise Transactions Breakup" configName="COST CENTRE BREAKUP" defaultAcc="EXPENSE CONTROL" />} />
        <Route path="adjust-bills" element={<GenericVoucherForm title="Adjust Bills Receivable/Payable" configName="BILL ADJUSTMENT" defaultAcc="ACCOUNTS CONTROL" />} />
        <Route path="opening-st-forms" element={<GenericVoucherForm title="Enter Opening Pending ST Forms" configName="OPENING ST FORM" defaultAcc="TAX CONTROL" />} />
        <Route path="track-st-forms" element={<GenericVoucherForm title="Track Receipt/Issues of ST Forms" configName="ST FORM TRACKING" defaultAcc="TAX CONTROL" />} />
        <Route path="missing-receipt-nums" element={<GenericVoucherForm title="Missing Receipt Numbers" configName="GAP ANALYSIS" defaultAcc="SYSTEM AUDIT" />} />
      </Route>
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
      <Route path="data-import">
        <Route index element={<DataImportExportPage />} />
        <Route path="export-purchase-text" element={<DataImportPlaceholderPage />} />
        <Route path="export-stock-transfer-godown" element={<DataImportPlaceholderPage />} />
        <Route path="export-item-master" element={<DataImportPlaceholderPage />} />
        <Route path="import-purchase-challan-text" element={<DataImportPlaceholderPage />} />
        <Route path="import-purchase-text" element={<DataImportPlaceholderPage />} />
        <Route path="import-item-masters-text" element={<DataImportPlaceholderPage />} />
      </Route>
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
