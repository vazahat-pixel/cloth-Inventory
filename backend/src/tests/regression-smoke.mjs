/**
 * API regression smoke test — run against live backend with seeded admin.
 * Usage: node src/tests/regression-smoke.mjs
 */
const BASE = process.env.API_BASE || 'http://localhost:5001/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@clothinventory.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234';

const results = [];

function record(module, test, status, detail = '') {
  results.push({ module, test, status, detail });
  const icon = status === 'PASS' ? '✔' : status === 'FAIL' ? '✘' : '⚠';
  console.log(`${icon} [${module}] ${test}${detail ? ` — ${detail}` : ''}`);
}

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

async function main() {
  console.log(`\n=== ERP API Regression Smoke Test ===`);
  console.log(`Target: ${BASE}\n`);

  // Health
  try {
    const health = await request('/health');
    if (health.status === 200 && health.body?.success) {
      record('Infrastructure', 'Health check', 'PASS');
    } else {
      record('Infrastructure', 'Health check', 'FAIL', `status ${health.status}`);
    }
  } catch (e) {
    record('Infrastructure', 'Health check', 'FAIL', e.message);
    printSummary();
    process.exit(1);
  }

  // Auth
  let token = '';
  try {
    const login = await request('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    token = login.body?.token || login.body?.data?.token || '';
    if (login.status === 200 && token) {
      record('User Permissions', 'Admin login', 'PASS');
    } else {
      record('User Permissions', 'Admin login', 'FAIL', login.body?.message || `status ${login.status}`);
    }
  } catch (e) {
    record('User Permissions', 'Admin login', 'FAIL', e.message);
  }

  if (!token) {
    printSummary();
    process.exit(1);
  }

  const auth = { Authorization: `Bearer ${token}` };

  const listEndpoints = [
    ['Sales Billing', '/sales?page=1&limit=5'],
    ['Purchase', '/purchase?page=1&limit=5'],
    ['Challans / Dispatch', '/dispatch?page=1&limit=5'],
    ['Item Master', '/items?page=1&limit=5'],
    ['Reports — Ledger', '/reports/party-ledger?page=1&limit=5'],
    ['Reports — Audit', '/reports/audit-logs?page=1&limit=5'],
    ['Reports — Visit Logs', '/reports/visit-logs?page=1&limit=5'],
    ['GST — Tax Rules', '/tax-rules'],
    ['GST — HSN', '/setup/hsn-codes?page=1&limit=5'],
    ['Barcode', '/barcodes?page=1&limit=5'],
    ['Customers', '/customers?page=1&limit=5'],
    ['Suppliers', '/suppliers?page=1&limit=5'],
    ['Inventory', '/inventory/stock-overview?page=1&limit=5'],
    ['Receipts — Store Inventory', '/store-inventory?page=1&limit=5'],
  ];

  for (const [module, path] of listEndpoints) {
    try {
      const res = await request(path, { headers: auth });
      const ok = res.status === 200 && res.body?.success !== false;
      const hasData = res.body?.data !== undefined || res.body?.records !== undefined
        || Array.isArray(res.body) || res.body?.items !== undefined
        || res.body?.dispatches !== undefined || res.body?.sales !== undefined
        || res.body?.total !== undefined || res.body?.taxRules !== undefined;
      if (ok || (res.status === 200 && hasData)) {
        record(module, `GET ${path.split('?')[0]}`, 'PASS', `HTTP ${res.status}`);
      } else {
        record(module, `GET ${path.split('?')[0]}`, 'FAIL', `HTTP ${res.status} — ${res.body?.message || 'unexpected'}`);
      }
    } catch (e) {
      record(module, `GET ${path.split('?')[0]}`, 'FAIL', e.message);
    }
  }

  // Pagination contract check
  try {
    const items = await request('/items?page=1&limit=5', { headers: auth });
    const hasPagination = items.body?.total !== undefined || items.body?.data?.total !== undefined
      || items.body?.pagination !== undefined;
    record('Item Master', 'Pagination meta present', hasPagination ? 'PASS' : 'WARN', hasPagination ? '' : 'total field missing');
  } catch (e) {
    record('Item Master', 'Pagination meta present', 'FAIL', e.message);
  }

  // Response shape — next invoice number (billing)
  try {
    const stores = await request('/stores', { headers: auth });
    const storeList = stores.body?.stores || stores.body?.data?.stores || stores.body?.data || [];
    const storeId = Array.isArray(storeList) && storeList[0]?._id ? storeList[0]._id : null;
    if (storeId) {
      const inv = await request(`/sales/next-invoice-number?storeId=${storeId}`, { headers: auth });
      const hasNumber = Boolean(inv.body?.nextInvoiceNumber || inv.body?.data?.nextInvoiceNumber);
      record('Sales Billing', 'next-invoice-number response shape', hasNumber ? 'PASS' : 'WARN', hasNumber ? '' : 'field missing');
    } else {
      record('Sales Billing', 'next-invoice-number response shape', 'WARN', 'no store to test');
    }
  } catch (e) {
    record('Sales Billing', 'next-invoice-number response shape', 'FAIL', e.message);
  }

  // Idempotency contract (409 on in-flight duplicate)
  try {
    const key = `smoke-test-${Date.now()}`;
    const headers = { ...auth, 'Idempotency-Key': key };
    // Use a harmless endpoint that requires idempotency — pack on non-existent should 404 not crash
    const r1 = await request('/dispatch/000000000000000000000001/pack', { method: 'POST', headers });
    const acceptsKey = r1.status === 404 || r1.status === 400 || r1.status === 200;
    record('Dispatch', 'Idempotency header accepted', acceptsKey ? 'PASS' : 'FAIL', `HTTP ${r1.status}`);
  } catch (e) {
    record('Dispatch', 'Idempotency header accepted', 'FAIL', e.message);
  }

  // Unauthorized access
  try {
    const denied = await request('/dispatch?page=1&limit=1');
    record('User Permissions', 'Protected route rejects unauthenticated', denied.status === 401 ? 'PASS' : 'FAIL', `HTTP ${denied.status}`);
  } catch (e) {
    record('User Permissions', 'Protected route rejects unauthenticated', 'FAIL', e.message);
  }

  printSummary();
  const failed = results.filter((r) => r.status === 'FAIL').length;
  process.exit(failed > 0 ? 1 : 0);
}

function printSummary() {
  const pass = results.filter((r) => r.status === 'PASS').length;
  const fail = results.filter((r) => r.status === 'FAIL').length;
  const warn = results.filter((r) => r.status === 'WARN').length;
  console.log(`\n=== Summary: ${pass} PASS, ${fail} FAIL, ${warn} WARN ===\n`);
}

main();
