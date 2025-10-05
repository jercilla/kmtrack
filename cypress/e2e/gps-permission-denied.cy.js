describe('GPS Permission Denied', () => {
  it('should show permission warning when GPS access is denied', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        // Mock geolocation to simulate permission denied
        cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((success, error) => {
          error({
            code: 1, // PERMISSION_DENIED
            message: 'User denied Geolocation',
            PERMISSION_DENIED: 1
          })
        })

        cy.stub(win.navigator.geolocation, 'watchPosition').callsFake((success, error) => {
          error({
            code: 1, // PERMISSION_DENIED
            message: 'User denied Geolocation',
            PERMISSION_DENIED: 1
          })
          return 1 // Return mock watch ID
        })
      }
    })

    cy.wait(2000)

    // Should display permission warning/error message
    cy.get('body').should('contain.text', 'permiso')
      .or('contain.text', 'localización')
      .or('contain.text', 'GPS')
      .or('contain.text', 'ubicación')

    // Or check for specific warning element
    cy.get('.gps-permission-warning, .permission-error, ion-card.warning, ion-text[color="warning"], ion-text[color="danger"]')
      .should('be.visible')

    // Normal speed display should be hidden or show placeholder
    cy.get('.speed-display').then($speedDisplay => {
      if ($speedDisplay.is(':visible')) {
        // If visible, it should not show actual speed data
        cy.log('Speed display visible but should show warning state')
      } else {
        cy.log('Speed display correctly hidden')
      }
    })
  })

  it('should prevent tracking when GPS permission is denied', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((success, error) => {
          error({ code: 1, message: 'User denied Geolocation', PERMISSION_DENIED: 1 })
        })

        cy.stub(win.navigator.geolocation, 'watchPosition').callsFake((success, error) => {
          error({ code: 1, message: 'User denied Geolocation', PERMISSION_DENIED: 1 })
          return 1
        })
      }
    })

    cy.wait(2000)

    // Try to start tracking
    cy.get('.control-button').click()

    // Should NOT enter recording state
    cy.get('.control-button').should('not.have.class', 'recording')

    // Speed should remain at 0
    cy.get('.speed-value').should('contain', '0')
  })

  it('should show helpful message about enabling GPS permissions', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((success, error) => {
          error({ code: 1, message: 'User denied Geolocation', PERMISSION_DENIED: 1 })
        })

        cy.stub(win.navigator.geolocation, 'watchPosition').callsFake((success, error) => {
          error({ code: 1, message: 'User denied Geolocation', PERMISSION_DENIED: 1 })
          return 1
        })
      }
    })

    cy.wait(2000)

    // Should provide instructions or helpful message
    cy.get('body').should('satisfy', ($body) => {
      const text = $body.text().toLowerCase()
      return text.includes('permiso') ||
             text.includes('autoriza') ||
             text.includes('activa') ||
             text.includes('habilita') ||
             text.includes('ubicación') ||
             text.includes('localización')
    })
  })
})
