const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    permissions: []
  });

  const page = await context.newPage();

  // Override geolocation to simulate permission denied
  await page.addInitScript(() => {
    // Mock permissions API to return denied
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
        code: 1,
        message: 'User denied Geolocation',
        PERMISSION_DENIED: 1
      });
    };

    navigator.geolocation.watchPosition = (success, error) => {
      error({
        code: 1,
        message: 'User denied Geolocation',
        PERMISSION_DENIED: 1
      });
      return 1;
    };
  });

  console.log('=== Test: GPS Permission Check on Page Load ===\n');

  await page.goto('http://localhost:4200');

  console.log('1. Waiting for page to load and check permissions...');
  await page.waitForTimeout(3000);

  console.log('\n2. Checking if permission warning appears immediately (WITHOUT clicking)...');

  const permissionWarning = page.locator('.gps-permission-warning');
  const warningCount = await permissionWarning.count();

  if (warningCount > 0) {
    const warningText = await permissionWarning.textContent();
    console.log(`✅ Permission warning appears on load: "${warningText.trim().substring(0, 50)}..."`);
  } else {
    console.log('❌ Permission warning NOT shown on load (should appear automatically)');
  }

  console.log('\n3. Checking if dashboard is hidden immediately...');

  const dashboardGrid = page.locator('.dashboard-grid.hidden');
  const isDashboardHidden = await dashboardGrid.count() > 0;

  if (isDashboardHidden) {
    console.log('✅ Dashboard is hidden on load (correct behavior)');
  } else {
    console.log('❌ Dashboard is visible on load (should be hidden immediately when no GPS)');
  }

  console.log('\n4. Verifying control button is not in recording state...');

  const controlButton = page.locator('.control-button');
  const hasRecordingClass = await controlButton.evaluate(el => el.classList.contains('recording'));

  if (!hasRecordingClass) {
    console.log('✅ Control button not recording (correct)');
  } else {
    console.log('❌ Control button in recording state (should not be)');
  }

  console.log('\n=== Test Complete ===');
  console.log('Expected: Warning should appear immediately on page load without user interaction');

  await page.waitForTimeout(5000);
  await browser.close();
})();
