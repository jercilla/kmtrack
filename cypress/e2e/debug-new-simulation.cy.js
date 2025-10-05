describe('Debug New GPS Simulation', () => {
  it('should debug the new simulation implementation', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        // Capture console logs
        const originalLog = win.console.log
        const originalError = win.console.error

        win.console.log = (...args) => {
          originalLog.apply(win.console, args)
          if (!win.__cypressLogs) win.__cypressLogs = []
          win.__cypressLogs.push('LOG: ' + args.join(' '))
        }

        win.console.error = (...args) => {
          originalError.apply(win.console, args)
          if (!win.__cypressLogs) win.__cypressLogs = []
          win.__cypressLogs.push('ERROR: ' + args.join(' '))
        }
      }
    })

    cy.wait(2000)

    // Check initial state
    cy.get('.speed-value').should('contain', '0')
    cy.get('.odometer-digits').should('contain', '0.0')

    // Start tracking
    cy.get('.control-button').click()
    cy.get('.control-button').should('have.class', 'recording')
    cy.wait(1000)

    // Try simulation at 60 km/h
    cy.get('.test-controls').find('ion-button:contains("60")').click()

    // Verify speed shows 60
    cy.get('.speed-value').should('contain', '60')

    // Wait and log state every second for 5 seconds
    for (let i = 1; i <= 5; i++) {
      cy.wait(1000)
      cy.get('.speed-value').invoke('text').then(speed => {
        cy.get('.odometer-digits').invoke('text').then(distance => {
          cy.log(`Second ${i}: Speed=${speed}, Distance=${distance}`)
        })
      })
    }

    // Print all console logs
    cy.window().then(win => {
      if (win.__cypressLogs) {
        cy.log('=== Console Logs ===')
        win.__cypressLogs.forEach(log => cy.log(log))
      }
    })

    // Stop simulation
    cy.get('.test-controls').find('ion-button:contains("STOP")').click()
    cy.get('.speed-value').should('contain', '0')

    // Stop tracking
    cy.get('.control-button').click()
  })
})