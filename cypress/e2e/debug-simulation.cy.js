describe('Debug GPS Simulation', () => {
  it('should debug the simulation step by step', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        // Capture console logs
        const originalLog = win.console.log
        win.console.log = (...args) => {
          originalLog.apply(win.console, args)
          // Store logs for later inspection
          if (!win.__cypressLogs) win.__cypressLogs = []
          win.__cypressLogs.push(args.join(' '))
        }
      }
    })

    cy.wait(3000)
    cy.get('.speed-value').should('exist')

    // Check initial state
    cy.get('.speed-value').should('contain', '0')
    cy.get('.odometer-digits').should('contain', '0.0')

    // Start tracking
    cy.get('.control-button').click()
    cy.get('.control-button').should('have.class', 'recording')

    // Wait a moment for tracking to initialize
    cy.wait(1000)

    // Simulate speed
    cy.get('.test-controls').find('ion-button:contains("60")').first().click()
    cy.get('.speed-value').should('contain', '60')

    // Wait for simulation
    cy.wait(2000)

    // Stop tracking
    cy.get('.control-button').click()
    cy.get('.control-button').should('not.have.class', 'recording')

    // Wait for stop logic to complete
    cy.wait(500)

    // Check distance and logs
    cy.get('.odometer-digits').invoke('text').then(text => {
      const distance = parseFloat(text)
      cy.log(`Final distance: ${distance}`)
    })

    // Print all console logs
    cy.window().then(win => {
      if (win.__cypressLogs) {
        win.__cypressLogs.forEach(log => cy.log(log))
      }
    })
  })
})