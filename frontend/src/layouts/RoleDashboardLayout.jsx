import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import RoleSidebar from '../components/RoleSidebar';
import Topbar from '../components/Topbar';
import { getNavConfigForRole } from '../common/roleConfig';
import SetupSubnav from '../modules/setup/SetupSubnav';
import { setupMatchPaths } from '../modules/setup/setupNavConfig';
import SetupAccountsSubnav from '../modules/setup/SetupAccountsSubnav';
import { setupAccountsMatchPaths } from '../modules/setup/setupAccountsNavConfig';
import AccountsSubnav from '../modules/accounts/AccountsSubnav';
import { accountsMatchPaths } from '../modules/accounts/accountsNavConfig';
import PurchaseSubnav from '../modules/purchase/PurchaseSubnav';
import { purchaseMatchPaths } from '../modules/purchase/purchaseNavConfig';
import OrderProcessingSubnav from '../modules/orders/OrderProcessingSubnav';
import { orderProcessingMatchPaths } from '../modules/orders/orderProcessingNavConfig';
import InventorySubnav from '../modules/inventory/InventorySubnav';
import { inventoryMatchPaths } from '../modules/inventory/inventoryNavConfig';
import BillingSubnav from '../modules/sales/BillingSubnav';
import { billingMatchPaths } from '../modules/sales/billingNavConfig';
import PayrollSetupsSubnav from '../modules/payroll/PayrollSetupsSubnav';
import { payrollSetupsMatchPaths } from '../modules/payroll/payrollSetupsNavConfig';
import PayrollEntrySubnav from '../modules/payroll/PayrollEntrySubnav';
import { payrollEntryMatchPaths } from '../modules/payroll/payrollEntryNavConfig';
import PayrollReportsSubnav from '../modules/payroll/PayrollReportsSubnav';
import { payrollReportsMatchPaths } from '../modules/payroll/payrollReportsNavConfig';
import ReportsQueriesSubnav from '../modules/reports/ReportsQueriesSubnav';
import { reportsQueriesMatchPaths } from '../modules/reports/reportsQueriesNavConfig';
import UtilitiesSubnav from '../modules/utilities/UtilitiesSubnav';
import { utilitiesMatchPaths } from '../modules/utilities/utilitiesNavConfig';
import ProductionSubnav from '../modules/production/ProductionSubnav';
import { productionMatchPaths } from '../modules/production/productionNavConfig';
import UserAccessSubnav from '../modules/userAccess/UserAccessSubnav';
import { userAccessMatchPaths } from '../modules/userAccess/userAccessNavConfig';

function RoleDashboardLayout() {
  const role = useSelector((state) => state.auth.role);
  const location = useLocation();
  const navConfig = getNavConfigForRole(role);
  const localPath = location.pathname.startsWith(navConfig.basePath)
    ? location.pathname.slice(navConfig.basePath.length) || '/'
    : location.pathname;

  const showSetupSubnav = navConfig.role === 'admin' && setupMatchPaths.some((candidate) => (
    candidate === '/'
      ? localPath === '/'
      : localPath === candidate || localPath.startsWith(`${candidate}/`)
  ));
  const showSetupAccountsSubnav = navConfig.role === 'admin' && setupAccountsMatchPaths.some((candidate) => (
    candidate === '/'
      ? localPath === '/'
      : localPath === candidate || localPath.startsWith(`${candidate}/`)
  ));
  const showAccountsSubnav = navConfig.role === 'admin' && accountsMatchPaths.some((candidate) => (
    candidate === '/'
      ? localPath === '/'
      : localPath === candidate || localPath.startsWith(`${candidate}/`)
  ));
  const showPurchaseSubnav = navConfig.role === 'admin' && purchaseMatchPaths.some((candidate) => (
    candidate === '/'
      ? localPath === '/'
      : localPath === candidate || localPath.startsWith(`${candidate}/`)
  ));
  const showOrderProcessingSubnav = navConfig.role === 'admin' && orderProcessingMatchPaths.some((candidate) => (
    candidate === '/'
      ? localPath === '/'
      : localPath === candidate || localPath.startsWith(`${candidate}/`)
  ));
  const showInventorySubnav = navConfig.role === 'admin' && inventoryMatchPaths.some((candidate) => (
    candidate === '/'
      ? localPath === '/'
      : localPath === candidate || localPath.startsWith(`${candidate}/`)
  ));
  const showBillingSubnav = navConfig.role === 'admin' && billingMatchPaths.some((candidate) => (
    candidate === '/'
      ? localPath === '/'
      : localPath === candidate || localPath.startsWith(`${candidate}/`)
  ));
  const showPayrollSetupsSubnav = navConfig.role === 'admin' && payrollSetupsMatchPaths.some((candidate) => (
    candidate === '/'
      ? localPath === '/'
      : localPath === candidate || localPath.startsWith(`${candidate}/`)
  ));
  const showPayrollEntrySubnav = navConfig.role === 'admin' && payrollEntryMatchPaths.some((candidate) => (
    candidate === '/'
      ? localPath === '/'
      : localPath === candidate || localPath.startsWith(`${candidate}/`)
  ));
  const showPayrollReportsSubnav = navConfig.role === 'admin' && payrollReportsMatchPaths.some((candidate) => (
    candidate === '/'
      ? localPath === '/'
      : localPath === candidate || localPath.startsWith(`${candidate}/`)
  ));
  const showReportsQueriesSubnav = navConfig.role === 'admin' && reportsQueriesMatchPaths.some((candidate) => (
    candidate === '/'
      ? localPath === '/'
      : localPath === candidate || localPath.startsWith(`${candidate}/`)
  ));
  const showUtilitiesSubnav = navConfig.role === 'admin' && utilitiesMatchPaths.some((candidate) => (
    candidate === '/'
      ? localPath === '/'
      : localPath === candidate || localPath.startsWith(`${candidate}/`)
  ));
  const showUserAccessSubnav = navConfig.role === 'admin' && userAccessMatchPaths.some((candidate) => (
    candidate === '/'
      ? localPath === '/'
      : localPath === candidate || localPath.startsWith(`${candidate}/`)
  ));
  const showProductionSubnav = navConfig.role === 'admin' && productionMatchPaths.some((candidate) => (
    candidate === '/'
      ? localPath === '/'
      : localPath === candidate || localPath.startsWith(`${candidate}/`)
  ));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 40%, #F8FAFC 100%)',
      }}
    >
      <RoleSidebar navConfig={navConfig} />
      <Box sx={{ width: 240, flexShrink: 0 }} aria-hidden />
      {showSetupSubnav ? <SetupSubnav /> : null}
      {showSetupAccountsSubnav ? <SetupAccountsSubnav /> : null}
      {showAccountsSubnav ? <AccountsSubnav /> : null}
      {showPurchaseSubnav ? <PurchaseSubnav /> : null}
      {showOrderProcessingSubnav ? <OrderProcessingSubnav /> : null}
      {showInventorySubnav ? <InventorySubnav /> : null}
      {showBillingSubnav ? <BillingSubnav /> : null}
      {showPayrollSetupsSubnav ? <PayrollSetupsSubnav /> : null}
      {showPayrollEntrySubnav ? <PayrollEntrySubnav /> : null}
      {showPayrollReportsSubnav ? <PayrollReportsSubnav /> : null}
      {showReportsQueriesSubnav ? <ReportsQueriesSubnav /> : null}
      {showUtilitiesSubnav ? <UtilitiesSubnav /> : null}
      {showUserAccessSubnav ? <UserAccessSubnav /> : null}
      {showProductionSubnav ? <ProductionSubnav /> : null}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <Box
          component="main"
          sx={{
            flex: 1,
            width: '100%',
            minWidth: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            p: { xs: 2.5, sm: 3.5 },
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default RoleDashboardLayout;
