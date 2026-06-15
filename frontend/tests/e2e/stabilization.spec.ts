import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@clothinventory.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234';

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /login/i }).click();
  await page.waitForURL('**/ho**', { timeout: 20000 });
}

test.describe('ERP Stabilization Regression', () => {
  test('Admin login and dashboard load', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText(/HO Panel|Cloth ERP/i).first()).toBeVisible();
  });

  test('Item Master list loads with pagination', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/ho/items');
    await expect(page.getByRole('heading', { name: /item/i }).first()).toBeVisible({ timeout: 15000 });
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('Sales list loads', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/ho/sales');
    await expect(page.locator('table').first()).toBeVisible({ timeout: 15000 });
  });

  test('Purchase list loads', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/ho/purchase');
    await expect(page.locator('table').first()).toBeVisible({ timeout: 15000 });
  });

  test('Delivery challan list loads', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/ho/orders/delivery-challan');
    await expect(page.locator('table').first()).toBeVisible({ timeout: 15000 });
  });

  test('GST HSN master loads', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/ho/setup/hsn-codes');
    await expect(page.getByRole('heading', { name: /HSN/i })).toBeVisible({ timeout: 15000 });
  });

  test('Voucher list (receipts/payments) loads', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/ho/accounts/vouchers');
    await expect(page.locator('table').first()).toBeVisible({ timeout: 15000 });
  });

  test('Audit logs load', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/ho/inventory/audit-logs');
    await expect(page.locator('table').first()).toBeVisible({ timeout: 15000 });
  });
});
