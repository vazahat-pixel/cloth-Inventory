/**
 * Prefetch lazy route chunks on sidebar hover / idle time.
 * Keys are route suffixes (without /ho or /store base).
 */
const ROUTE_LOADERS = {
  '/': () => import('../pages/dashboard/DashboardHome'),
  '/items': () => import('../modules/items/ItemListPage'),
  '/items/new': () => import('../modules/items/ItemFormPage'),
  '/inventory/stock-overview': () => import('../modules/inventory/StockOverviewPage'),
  '/orders/delivery-challan': () => import('../modules/dispatch/DeliveryChallanPage'),
  '/orders/dispatch-queue': () => import('../modules/dispatch/DispatchQueuePage'),
  '/sales/billing': () => import('../modules/sales/BillingPage'),
  '/sales': () => import('../modules/sales/SalesListPage'),
  '/purchase': () => import('../modules/purchase/PurchaseListPage'),
  '/grn': () => import('../modules/grn/GRNListPage'),
  '/reports': () => import('../modules/reports/ReportsDashboard'),
  '/masters/suppliers': () => import('../modules/masters/suppliers/ListPage'),
  '/masters/customers': () => import('../modules/masters/customers/ListPage'),
  '/pos/billing': () => import('../modules/sales/BillingPage'),
  '/receipt': () => import('../modules/inventory/StoreReturnReceivePage'),
};

const prefetched = new Set();

const normalizeRouteKey = (fullPath, basePath = '/ho') => {
  if (!fullPath) return '/';
  if (fullPath.startsWith(basePath)) {
    const local = fullPath.slice(basePath.length) || '/';
    return local.startsWith('/') ? local : `/${local}`;
  }
  if (fullPath.startsWith('/store')) {
    const local = fullPath.slice('/store'.length) || '/';
    return local.startsWith('/') ? local : `/${local}`;
  }
  return fullPath;
};

export function prefetchRoute(fullPath, basePath) {
  const key = normalizeRouteKey(fullPath, basePath);
  const loader = ROUTE_LOADERS[key];
  if (!loader || prefetched.has(key)) return;
  prefetched.add(key);
  loader().catch(() => prefetched.delete(key));
}

/** Warm critical chunks after authentication */
export function prefetchCriticalRoutes(basePath = '/ho') {
  const critical = ['/', '/items', '/sales/billing', '/inventory/stock-overview', '/orders/delivery-challan'];
  critical.forEach((route) => prefetchRoute(`${basePath}${route === '/' ? '' : route}`, basePath));
}

export default prefetchRoute;
