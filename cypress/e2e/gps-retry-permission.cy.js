describe('Retry GPS Permission Request', () => {
  it('should have a button to retry GPS permission request', () => {
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

    // Warning should be visible
    cy.get('.gps-permission-warning').should('be.visible')

    // Should have a button to retry
    cy.get('.gps-permission-warning ion-button, .gps-permission-warning button')
      .should('exist')
      .and('be.visible')
  })

  it('should show button text related to activating or allowing permissions', () => {
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

    // Button should have text indicating action
    cy.get('.gps-permission-warning ion-button, .gps-permission-warning button')
      .should('satisfy', ($btn) => {
        const text = $btn.text().toLowerCase()
        return text.includes('activar') ||
               text.includes('permitir') ||
               text.includes('habilitar') ||
               text.includes('intentar') ||
               text.includes('reintentar')
      })
  })

  it('should be clickable and trigger permission check', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        let permissionQueryCount = 0

        cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((success, error) => {
          error({ code: 1, message: 'User denied Geolocation', PERMISSION_DENIED: 1 })
        })

        cy.stub(win.navigator.geolocation, 'watchPosition').callsFake((success, error) => {
          error({ code: 1, message: 'User denied Geolocation', PERMISSION_DENIED: 1 })
          return 1
        })

        if (win.navigator.permissions && win.navigator.permissions.query) {
          cy.stub(win.navigator.permissions, 'query').callsFake(() => {
            permissionQueryCount++
            console.log(`Permission query called ${permissionQueryCount} times`)
            return Promise.resolve({
              state: 'denied',
              onchange: null
            })
          })

          // Store count on window for testing
          win.__permissionQueryCount = () => permissionQueryCount
        }
      }
    })

    cy.wait(3000)

    // Click the retry button
    cy.get('.gps-permission-warning ion-button, .gps-permission-warning button')
      .first()
      .click()

    // Wait for permission check
    cy.wait(1000)

    // Verify permission was queried again (count should be > 1)
    cy.window().then(win => {
      if (win.__permissionQueryCount) {
        const count = win.__permissionQueryCount()
        expect(count).to.be.greaterThan(1)
      }
    })
  })
})
