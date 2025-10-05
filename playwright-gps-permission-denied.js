const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    // Deny geolocation permission
    permissions: []
  });

  const page = await context.newPage();

  // Block geolocation entirely
  await context.grantPermissions([], { origin: 'http://localhost:4200' });

  // Override geolocation to simulate permission denied
  await page.addInitScript(() => {
    // Mock permissions API
    navigator.permissions.query = async (descriptor) => {
      if (descriptor.name === 'geolocation') {
        return Promise.resolve({
          state: 'denied',
          onchange: null
        });
      }
      return Promise.reject(new Error('Permission not supported'));
    };

    navigator.geolocation.getCurrentPosition = (success, error) => {
      error({
        code: 1, // PERMISSION_DENIED
        message: 'User denied Geolocation',
        PERMISSION_DENIED: 1
      });
    };

    navigator.geolocation.watchPosition = (success, error) => {
      error({
        code: 1, // PERMISSION_DENIED
        message: 'User denied Geolocation',
        PERMISSION_DENIED: 1
      });
      return 1; // Return a mock watch ID
    };
  });

  console.log('=== Test: GPS Permission Denied ===\n');

  await page.goto('http://localhost:4200');
  await page.waitForTimeout(3000);

  console.log('1. Checking if permission warning is visible automatically...');

  // Should show permission warning
  const permissionWarning = page.locator('.gps-permission-warning');

  try {
    await permissionWarning.waitFor({ timeout: 3000 });
    const warningText = await permissionWarning.textContent();
    console.log(`✅ Permission warning found: "${warningText.trim().substring(0, 50)}..."`);
  } catch (error) {
    console.log('❌ Permission warning NOT found (expected to exist)');
  }

  console.log('\n2. Checking if normal dashboard is hidden...');

  // Normal dashboard elements should not exist in DOM
  const dashboardGrid = page.locator('.dashboard-grid');
  const dashboardExists = await dashboardGrid.count();

  if (dashboardExists === 0) {
    console.log('✅ Dashboard is hidden (correct behavior)');
  } else {
    console.log('❌ Dashboard is visible (should be hidden when no GPS permission)');
  }

  console.log('\n3. Checking that control button does not exist...');

  const controlButton = page.locator('.control-button');
  const buttonExists = await controlButton.count();

  if (buttonExists === 0) {
    console.log('✅ Control button does not exist (correct behavior)');
  } else {
    console.log('❌ Control button exists (should not exist when GPS denied)');
  }

  console.log('\n=== Test Complete ===');

  await page.waitForTimeout(5000); // Keep browser open for inspection
  await browser.close();
})();
