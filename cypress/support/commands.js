// Custom commands for KMTrack app

Cypress.Commands.add('simulateSpeed', (speed) => {
  cy.get('.test-controls').find(`ion-button:contains("${speed}")`).first().click()
})

Cypress.Commands.add('startTracking', () => {
  cy.get('.control-button').click()
})

Cypress.Commands.add('stopTracking', () => {
  cy.get('.control-button').click()
})

Cypress.Commands.add('getCurrentSpeed', () => {
  return cy.get('.speed-value').invoke('text').then(text => parseFloat(text))
})

Cypress.Commands.add('getTotalKm', () => {
  return cy.get('.odometer-digits').invoke('text').then(text => parseFloat(text))
})