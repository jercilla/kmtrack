const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console logs
  const logs = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
    console.log(`BROWSER ${msg.type()}: ${msg.text()}`);
  });

  // Capture errors
  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
  });

  await page.goto('http://localhost:4200');
  await page.waitForTimeout(3000);

  console.log('\n=== 1. Initial state ===');
  const initialSpeed = await page.locator('.speed-value').textContent();
  const initialDistance = await page.locator('.odometer-digits').textContent();
  console.log(`Speed: ${initialSpeed}, Distance: ${initialDistance}`);

  console.log('\n=== 2. Clicking RESET ===');
  await page.locator('ion-button:has-text("RESET")').click();
  await page.waitForTimeout(2000);

  console.log('\n=== 3. Starting tracking ===');
  await page.locator('.control-button').click();
  await page.waitForTimeout(1000);

  const trackingStatus = await page.locator('.control-button').getAttribute('class');
  console.log(`Tracking status (should have 'recording'): ${trackingStatus}`);

  console.log('\n=== 4. Starting 60 km/h simulation ===');
  await page.locator('ion-button:has-text("60")').click();
  await page.waitForTimeout(1000);

  const speed = await page.locator('.speed-value').textContent();
  console.log(`Speed after clicking 60: ${speed}`);

  console.log('\n=== 5. Waiting 5 seconds and checking distance ===');
  for (let i = 1; i <= 5; i++) {
    await page.waitForTimeout(1000);
    const currentSpeed = await page.locator('.speed-value').textContent();
    const currentDistance = await page.locator('.odometer-digits').textContent();
    console.log(`Second ${i}: Speed=${currentSpeed}, Distance=${currentDistance}`);
  }

  console.log('\n=== 6. All console logs ===');
  logs.forEach(log => console.log(log));

  console.log('\n=== 7. Stopping simulation ===');
  await page.locator('ion-button:has-text("STOP")').click();
  await page.waitForTimeout(1000);

  const finalSpeed = await page.locator('.speed-value').textContent();
  console.log(`Final speed: ${finalSpeed}`);

  await page.waitForTimeout(5000); // Keep open for manual inspection
  await browser.close();
})();