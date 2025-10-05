describe('Minimal UI when GPS Permission Denied', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        // Mock geolocation to simulate permission denied
        cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((success, error) => {
          error({
            code: 1,
            message: 'User denied Geolocation',
            PERMISSION_DENIED: 1
          })
        })

        cy.stub(win.navigator.geolocation, 'watchPosition').callsFake((success, error) => {
          error({
            code: 1,
            message: 'User denied Geolocation',
            PERMISSION_DENIED: 1
          })
          return 1
        })

        if (win.navigator.permissions && win.navigator.permissions.query) {
          cy.stub(win.navigator.permissions, 'query').resolves({
            state: 'denied',
            onchange: null
          })
        }
      }
    })

    cy.wait(3000)
  })

  it('should show only warning message when GPS permission is denied', () => {
    // Warning should be visible
    cy.get('.gps-permission-warning').should('be.visible')

    // Date card should NOT be visible
    cy.get('.date-card').should('not.be.visible')

    // Speedometer should NOT be visible
    cy.get('.speedometer-frame').should('not.be.visible')

    // Odometer should NOT be visible
    cy.get('.odometer-card').should('not.be.visible')

    // Control button should NOT be visible
    cy.get('.control-button').should('not.be.visible')
  })

  it('should hide all dashboard elements when GPS denied', () => {
    // The entire dashboard grid should not exist in DOM
    cy.get('.dashboard-grid').should('not.exist')

    // Only the warning should be present and visible
    cy.get('.gps-permission-warning')
      .should('be.visible')
      .and('contain.text', 'Permiso de Ubicación')
  })

  it('should display helpful message about GPS permissions', () => {
    cy.get('.gps-permission-warning')
      .should('contain.text', 'ubicación')
      .or('contain.text', 'localización')
      .or('contain.text', 'GPS')
  })
})
