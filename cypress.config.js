const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 390,
    viewportHeight: 844, // iPhone 14 Pro dimensions
    video: false,
    screenshotOnRunFailure: true,
  },
})