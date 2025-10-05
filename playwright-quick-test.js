const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:4200');
  await page.waitForTimeout(2000);

  console.log('=== Testing distance accumulation with better formatting ===');

  // Reset and start tracking
  await page.locator('ion-button:has-text("RESET")').click();
  await page.waitForTimeout(2000);
  await page.locator('.control-button').click();
  await page.waitForTimeout(1000);

  // Start 60 km/h simulation
  await page.locator('ion-button:has-text("60")').click();

  // Check distance every second for 8 seconds
  for (let i = 1; i <= 8; i++) {
    await page.waitForTimeout(1000);
    const distance = await page.locator('.odometer-digits').textContent();
    console.log(`Second ${i}: Distance = ${distance} km`);
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();