const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    console.log(`BROWSER: ${text}`);
  });

  await page.goto('http://localhost:4200');
  await page.waitForTimeout(2000);

  console.log('\n=== 1. Estado inicial ===');
  const initialDistance = await page.locator('.odometer-digits').textContent();
  console.log(`Distancia inicial: ${initialDistance}`);

  console.log('\n=== 2. Haciendo RESET ===');
  await page.locator('ion-button:has-text("RESET")').click();
  await page.waitForTimeout(3000); // Esperar recarga

  console.log('\n=== 3. Después del RESET ===');
  const afterResetDistance = await page.locator('.odometer-digits').textContent();
  console.log(`Distancia después de RESET: ${afterResetDistance}`);

  console.log('\n=== 4. Iniciando tracking ===');
  await page.locator('.control-button').click();
  await page.waitForTimeout(1000);

  console.log('\n=== 5. Iniciando simulación 60 km/h ===');
  await page.locator('ion-button:has-text("60")').click();
  await page.waitForTimeout(1000);

  const afterSimulationStart = await page.locator('.odometer-digits').textContent();
  console.log(`Distancia inmediatamente después de iniciar simulación: ${afterSimulationStart}`);

  console.log('\n=== 6. Esperando 3 segundos ===');
  await page.waitForTimeout(3000);

  const after3Seconds = await page.locator('.odometer-digits').textContent();
  console.log(`Distancia después de 3 segundos: ${after3Seconds}`);

  console.log('\n=== 7. Parando simulación ===');
  await page.locator('ion-button:has-text("STOP")').click();
  await page.waitForTimeout(1000);

  const afterStop = await page.locator('.odometer-digits').textContent();
  console.log(`Distancia después de parar: ${afterStop}`);

  console.log('\n=== 8. Logs relevantes ===');
  const resetLogs = logs.filter(log => log.includes('RESET:'));
  const distanceLogs = logs.filter(log => log.includes('Distance calculation'));

  console.log('Reset logs:');
  resetLogs.forEach(log => console.log('  ' + log));

  console.log('\nDistance calculation logs (primeros 5):');
  distanceLogs.slice(0, 5).forEach(log => console.log('  ' + log));

  await page.waitForTimeout(3000);
  await browser.close();
})();