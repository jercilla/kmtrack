const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Distance calculation') || text.includes('RESET:') || text.includes('No previous position')) {
      console.log(`LOG: ${text}`);
    }
  });

  await page.goto('http://localhost:4200');
  await page.waitForTimeout(2000);

  console.log('\n=== RESET TEST ===');
  await page.locator('ion-button:has-text("RESET")').click();
  await page.waitForTimeout(3000);

  const afterReset = await page.locator('.odometer-digits').textContent();
  console.log(`Después de RESET: ${afterReset}`);

  console.log('\n=== START TRACKING ===');
  await page.locator('.control-button').click();
  await page.waitForTimeout(1000);

  console.log('\n=== START SIMULATION ===');
  await page.locator('ion-button:has-text("60")').click();
  await page.waitForTimeout(2000);

  const afterSimulation = await page.locator('.odometer-digits').textContent();
  console.log(`Después de iniciar simulación: ${afterSimulation}`);

  await page.waitForTimeout(3000);
  await browser.close();
})();