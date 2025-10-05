const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    permissions: []
  });

  const page = await context.newPage();

  let permissionDeniedCount = 0;
  let permissionPromptCount = 0;

  // Override geolocation to simulate permission denied initially
  await page.addInitScript(() => {
    let callCount = 0;

    navigator.permissions.query = async (descriptor) => {
      console.log(`permissions.query called (count: ${callCount + 1})`);
      if (descriptor.name === 'geolocation') {
        callCount++;
        // First call: denied, second call onwards: allow user to grant
        if (callCount === 1) {
          return Promise.resolve({
            state: 'denied',
            onchange: null
          });
        } else {
          // Simulate user granting permission on retry
          return Promise.resolve({
            state: 'granted',
            onchange: null
          });
        }
      }
      return Promise.reject(new Error('Permission not supported'));
    };

    navigator.geolocation.getCurrentPosition = (success, error) => {
      console.log('getCurrentPosition called');
      // Simulate successful position after permission granted
      success({
        coords: {
          latitude: 40.4168,
          longitude: -3.7038,
          speed: 0,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null
        },
        timestamp: Date.now()
      });
    };

    navigator.geolocation.watchPosition = (success, error) => {
      console.log('watchPosition called');
      // Simulate successful position
      success({
        coords: {
          latitude: 40.4168,
          longitude: -3.7038,
          speed: 0,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null
        },
        timestamp: Date.now()
      });
      return 1;
    };
  });

  console.log('=== Test: Retry GPS Permission Request ===\n');

  await page.goto('http://localhost:4200');
  await page.waitForTimeout(3000);

  console.log('1. Checking if permission warning is visible...');
  const warningVisible = await page.locator('.gps-permission-warning').isVisible();
  console.log(warningVisible ? '✅ Warning is visible' : '❌ Warning is NOT visible');

  console.log('\n2. Checking if there is a button to retry permission request...');
  const retryButton = page.locator('.gps-permission-warning ion-button, .gps-permission-warning button, ion-button:has-text("Activar"), ion-button:has-text("Permitir")');
  const retryButtonExists = await retryButton.count();

  if (retryButtonExists > 0) {
    const buttonText = await retryButton.first().textContent();
    console.log(`✅ Retry button found: "${buttonText.trim()}"`);
  } else {
    console.log('❌ Retry button NOT found (should exist)');
  }

  console.log('\n3. Clicking retry button...');
  if (retryButtonExists > 0) {
    await retryButton.first().click();
    await page.waitForTimeout(2000);

    console.log('\n4. Checking if warning disappears after granting permission...');
    const warningStillVisible = await page.locator('.gps-permission-warning').isVisible().catch(() => false);

    if (!warningStillVisible) {
      console.log('✅ Warning disappeared (permission granted)');
    } else {
      console.log('❌ Warning still visible (permission may still be denied)');
    }

    console.log('\n5. Checking if dashboard is now visible...');
    const dashboardVisible = await page.locator('.dashboard-grid').isVisible().catch(() => false);

    if (dashboardVisible) {
      console.log('✅ Dashboard is now visible');
    } else {
      console.log('❌ Dashboard is still hidden');
    }
  } else {
    console.log('⚠️  Cannot test retry flow without button');
  }

  console.log('\n=== Summary ===');
  console.log('Expected: Button in warning message that retries GPS permission request');
  console.log('After clicking and granting permission, dashboard should appear');

  await page.waitForTimeout(5000);
  await browser.close();
})();
