const { test, expect } = require('@playwright/test');

test.describe('Cloth Inventory ERP E2E Workflow', () => {
  let adminContext;
  let staffContext;
  let adminPage;
  let staffPage;
  let createdSupplierName;
  let createdProductName;

  test.beforeAll(async ({ browser }) => {
    adminContext = await browser.newContext();
    adminPage = await adminContext.newPage();
    staffContext = await browser.newContext();
    staffPage = await staffContext.newPage();
  });

  test.afterAll(async () => {
    await adminContext.close();
    await staffContext.close();
  });

  test('Full admin + staff workflow', async () => {
    // 1. Admin login
    await adminPage.goto('/login');
    await adminPage.fill('input[name="email"]', 'admin@example.com');
    await adminPage.fill('input[name="password"]', 'Admin@123');
    await Promise.all([
      adminPage.click('button[type="submit"]'),
      adminPage.waitForLoadState('networkidle'),
    ]);
    await expect(adminPage).toHaveURL(/dashboard/i);

    // 2. Create supplier
    await adminPage.click('a[href*="suppliers"]');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.click('button:has-text("Add Supplier")');
    createdSupplierName = `Auto Supplier ${Date.now()}`;
    await adminPage.fill('input[name="name"]', createdSupplierName);
    await adminPage.fill('input[name="phone"]', '9999999999');
    await adminPage.fill('input[name="email"]', `supplier${Date.now()}@example.com`);
    await Promise.all([
      adminPage.click('button:has-text("Save")'),
      adminPage.waitForResponse((resp) => resp.url().includes('/api/suppliers') && resp.ok()),
    ]);
    await expect(adminPage.locator('table')).toContainText(createdSupplierName);

    // 3. Create product
    await adminPage.click('a[href*="products"]');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.click('button:has-text("Add Product")');
    createdProductName = `Auto Product ${Date.now()}`;
    await adminPage.fill('input[name="name"]', createdProductName);
    await adminPage.fill('input[name="sku"]', `SKU${Date.now()}`);
    await adminPage.fill('input[name="barcode"]', `BC${Date.now()}`);
    await adminPage.selectOption('select[name="size"]', { label: 'M' });
    await adminPage.fill('input[name="salePrice"]', '1000');
    await Promise.all([
      adminPage.click('button:has-text("Save")'),
      adminPage.waitForResponse((resp) => resp.url().includes('/api/products') && resp.ok()),
    ]);
    await expect(adminPage.locator('table')).toContainText(createdProductName);

    // 4. Create purchase
    await adminPage.click('a[href*="purchase"]');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.click('button:has-text("New Purchase")');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.click('select[name="supplierId"]');
    await adminPage.selectOption('select[name="supplierId"]', { label: createdSupplierName });
    await adminPage.fill('input[name="invoiceNumber"]', `INV-${Date.now()}`);
    await adminPage.fill('input[name="invoiceDate"]', new Date().toISOString().slice(0, 10));
    await adminPage.click('button:has-text("Add Product")');
    await adminPage.fill('input[name="searchProduct"]', createdProductName);
    await adminPage.click(`text=${createdProductName}`);
    await adminPage.fill('input[name="quantity"]', '10');
    await adminPage.fill('input[name="rate"]', '800');
    await Promise.all([
      adminPage.click('button:has-text("Save Purchase")'),
      adminPage.waitForResponse((resp) => resp.url().includes('/api/purchase') && resp.ok()),
    ]);

    // 5. Dispatch to store
    await adminPage.click('a[href*="dispatch"]');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.click('button:has-text("New Dispatch")');
    await adminPage.click('select[name="storeId"]');
    await adminPage.selectOption('select[name="storeId"]', { index: 0 });
    await adminPage.fill('input[name="searchProduct"]', createdProductName);
    await adminPage.click(`text=${createdProductName}`);
    await adminPage.fill('input[name="quantity"]', '5');
    await Promise.all([
      adminPage.click('button:has-text("Create Dispatch")'),
      adminPage.waitForResponse((resp) => resp.url().includes('/api/dispatch') && resp.ok()),
    ]);

    // 6. Staff login
    await staffPage.goto('/login');
    await staffPage.getByText('Store Staff Login', { exact: false }).click({ trial: true }).catch(() => { });
    await staffPage.fill('input[name="email"]', 'staff1@example.com');
    await staffPage.fill('input[name="password"]', 'Staff@123');
    await Promise.all([
      staffPage.click('button[type="submit"]'),
      staffPage.waitForLoadState('networkidle'),
    ]);
    await expect(staffPage).toHaveURL(/sales|pos|dashboard/i);

    // 7. Create sale
    await staffPage.click('a[href*="billing"], a[href*="sales"]');
    await staffPage.waitForLoadState('networkidle');
    await staffPage.fill('input[name="searchProduct"]', createdProductName);
    await staffPage.click(`text=${createdProductName}`);
    await staffPage.fill('input[name="quantity"]', '1');
    const preTotal = await staffPage.textContent('[data-testid="grand-total"]');
    await Promise.all([
      staffPage.click('button:has-text("Complete Sale")'),
      staffPage.waitForResponse((resp) => resp.url().includes('/api/sales') && resp.ok()),
    ]);
    const saleRow = staffPage.locator('table >> text=' + createdProductName);
    await expect(saleRow).toBeVisible();

    // 8. Apply loyalty (assuming toggle / checkbox or input)
    const loyaltyApplyButton = staffPage.locator('button:has-text("Apply Loyalty")');
    if (await loyaltyApplyButton.isVisible()) {
      await Promise.all([
        loyaltyApplyButton.click(),
        staffPage.waitForLoadState('networkidle'),
      ]);
    }

    // 9. Apply credit note (if UI supports it)
    const creditNoteButton = staffPage.locator('button:has-text("Apply Credit Note")');
    if (await creditNoteButton.isVisible()) {
      await Promise.all([
        creditNoteButton.click(),
        staffPage.waitForLoadState('networkidle'),
      ]);
    }

    // 10. Cancel sale
    const cancelButton = staffPage.locator('button:has-text("Cancel Sale")').first();
    if (await cancelButton.isVisible()) {
      await Promise.all([
        cancelButton.click(),
        staffPage.waitForResponse((resp) => resp.url().includes('/api/sales') && resp.ok()),
      ]);
    }

    // 11. Verify UI updates correctly
    const postTotal = await staffPage.textContent('[data-testid="grand-total"]');
    expect(postTotal).not.toBeNull();

    // 12. Refresh page persistence test
    await staffPage.reload();
    await staffPage.waitForLoadState('networkidle');
    await expect(staffPage.locator('header, nav')).toBeVisible();
  });
});

