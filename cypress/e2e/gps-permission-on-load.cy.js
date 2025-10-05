describe('GPS Permission Check on Page Load', () => {
  it('should show permission warning immediately when GPS is denied on page load', () => {
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

        // Mock permissions.query to return denied
        if (win.navigator.permissions && win.navigator.permissions.query) {
          cy.stub(win.navigator.permissions, 'query').resolves({
            state: 'denied',
            onchange: null
          })
        }
      }
    })

    // Wait for Angular to initialize
    cy.wait(3000)

    // Should display permission warning immediately WITHOUT clicking anything
    cy.get('.gps-permission-warning')
      .should('be.visible')
      .and('contain.text', 'Permiso de Ubicación')

    // Dashboard should not exist in DOM (removed by *ngIf)
    cy.get('.dashboard-grid').should('not.exist')

    // Control button should not exist in DOM
    cy.get('.control-button').should('not.exist')
  })

  it('should check GPS permissions on component initialization', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((success, error) => {
          error({ code: 1, message: 'User denied Geolocation', PERMISSION_DENIED: 1 })
        })

        cy.stub(win.navigator.geolocation, 'watchPosition').callsFake((success, error) => {
          error({ code: 1, message: 'User denied Geolocation', PERMISSION_DENIED: 1 })
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

    // The warning should be visible without any user interaction
    cy.get('.gps-permission-warning').should('exist').and('be.visible')

    // Should show helpful message
    cy.get('.gps-permission-warning').should('contain.text', 'localización')
      .or('contain.text', 'ubicación')
  })
})
