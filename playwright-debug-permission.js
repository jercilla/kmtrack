const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    permissions: []
  });

  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));

  // Override geolocation
  await page.addInitScript(() => {
    navigator.permissions.query = async (descriptor) => {
      console.log('permissions.query called with:', descriptor.name);
      if (descriptor.name === 'geolocation') {
        console.log('Returning denied state');
        return Promise.resolve({
          state: 'denied',
          onchange: null
        });
      }
      return Promise.reject(new Error('Permission not supported'));
    };

    navigator.geolocation.watchPosition = (success, error) => {
      console.log('watchPosition called, calling error callback');
      error({
        code: 1,
        message: 'User denied Geolocation',
        PERMISSION_DENIED: 1
      });
      return 1;
    };
  });

  await page.goto('http://localhost:4200');
  await page.waitForTimeout(3000);

  console.log('\n=== Checking page content ===');
  const bodyText = await page.locator('body').textContent();
  console.log('Body contains "permiso":', bodyText.toLowerCase().includes('permiso'));
  console.log('Body contains "ubicación":', bodyText.toLowerCase().includes('ubicación'));

  console.log('\n=== Checking for warning card ===');
  const warningCard = page.locator('.gps-permission-warning');
  const warningExists = await warningCard.count();
  console.log('Warning card count:', warningExists);

  if (warningExists > 0) {
    const text = await warningCard.textContent();
    console.log('Warning text:', text);
  }

  console.log('\n=== Clicking start button to trigger permission check ===');
  await page.locator('.control-button').click();
  await page.waitForTimeout(2000);

  const warningExistsAfterClick = await page.locator('.gps-permission-warning').count();
  console.log('Warning card count after click:', warningExistsAfterClick);

  await page.waitForTimeout(5000);
  await browser.close();
})();
