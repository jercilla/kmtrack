const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    permissions: []
  });

  const page = await context.newPage();

  // Mock geolocation to simulate permission denied
  await page.addInitScript(() => {
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

  console.log('=== Test: Minimal UI when GPS Permission Denied ===\n');

  await page.goto('http://localhost:4200');
  await page.waitForTimeout(3000);

  console.log('1. Permission warning should be visible...');
  const warningVisible = await page.locator('.gps-permission-warning').isVisible();
  console.log(warningVisible ? '✅ Warning is visible' : '❌ Warning is NOT visible');

  console.log('\n2. Date card should NOT be visible...');
  const dateCardVisible = await page.locator('.date-card').isVisible();
  console.log(!dateCardVisible ? '✅ Date card is hidden' : '❌ Date card is visible (should be hidden)');

  console.log('\n3. Speedometer should NOT be visible...');
  const speedometerVisible = await page.locator('.speedometer-frame').isVisible();
  console.log(!speedometerVisible ? '✅ Speedometer is hidden' : '❌ Speedometer is visible (should be hidden)');

  console.log('\n4. Odometer card should NOT be visible...');
  const odometerVisible = await page.locator('.odometer-card').isVisible();
  console.log(!odometerVisible ? '✅ Odometer is hidden' : '❌ Odometer is visible (should be hidden)');

  console.log('\n5. Control button should NOT be visible...');
  const buttonVisible = await page.locator('.control-button').isVisible();
  console.log(!buttonVisible ? '✅ Control button is hidden' : '❌ Control button is visible (should be hidden)');

  console.log('\n6. Test controls should still be visible (for testing)...');
  const testControlsVisible = await page.locator('.test-controls').isVisible();
  console.log(testControlsVisible ? '✅ Test controls visible' : '⚠️  Test controls hidden');

  console.log('\n=== Summary ===');
  console.log('When GPS permission is denied, ONLY the warning message should be visible.');
  console.log('All dashboard elements (date, speedometer, odometer, control button) should be hidden.');

  await page.waitForTimeout(5000);
  await browser.close();
})();
