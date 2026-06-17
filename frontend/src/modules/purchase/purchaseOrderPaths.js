export function getPurchaseOrderListPath(basePath, pathname = '') {
  if (pathname.includes('/orders/purchase-order')) {
    return `${basePath}/orders/purchase-order`;
  }
  return `${basePath}/purchase/purchase-order`;
}
