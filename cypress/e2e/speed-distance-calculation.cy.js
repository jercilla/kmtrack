describe('Speed Simulation and Distance Calculation', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        // Disable webpack overlay
        win.document.addEventListener('DOMContentLoaded', () => {
          const overlay = win.document.getElementById('webpack-dev-server-client-overlay')
          if (overlay) {
            overlay.remove()
          }
        })
      }
    })
    // Wait for Angular to load
    cy.wait(3000)
    cy.get('.speed-value').should('exist')
    cy.get('.odometer-digits').should('exist')
  })

  it('should calculate distance correctly when tracking at constant speed', () => {
    // Initial state checks
    cy.get('.speed-value').should('contain', '0')
    cy.get('.odometer-digits').should('contain', '0.0')

    // Start tracking
    cy.startTracking()
    cy.get('.control-button').should('have.class', 'recording')
    cy.get('.speedometer-glow').should('have.class', 'active')

    // Simulate constant speed of 60 km/h
    cy.simulateSpeed(60)
    cy.get('.speed-value').should('contain', '60')

    // Wait and simulate multiple speed calls to generate movement
    cy.wait(1000)
    cy.simulateSpeed(60)
    cy.wait(1000)
    cy.simulateSpeed(60)
    cy.wait(1000)

    // Stop tracking to save the distance
    cy.stopTracking()
    cy.get('.control-button').should('not.have.class', 'recording')
    cy.get('.speedometer-glow').should('not.have.class', 'active')

    // Now check that distance has been saved
    cy.getTotalKm().then((distance) => {
      expect(distance).to.be.greaterThan(0)
      expect(distance).to.be.lessThan(1) // Should be reasonable for test duration
    })
  })

  it('should accumulate distance correctly across different speeds', () => {
    // Start tracking
    cy.startTracking()

    // Test 30 km/h
    cy.simulateSpeed(30)
    cy.get('.speed-value').should('contain', '30')
    cy.wait(1000)
    cy.simulateSpeed(30)
    cy.wait(500)

    // Test 60 km/h (should accumulate more)
    cy.simulateSpeed(60)
    cy.get('.speed-value').should('contain', '60')
    cy.wait(1000)
    cy.simulateSpeed(60)
    cy.wait(500)

    // Stop tracking to save the distance
    cy.stopTracking()

    // Check accumulated distance from both speeds
    cy.getTotalKm().then((totalDistance) => {
      expect(totalDistance).to.be.greaterThan(0)
      // Should have distance from multiple speed simulations
      expect(totalDistance).to.be.lessThan(1)
    })
  })

  it('should not accumulate distance when speed is 0', () => {
    // Start tracking
    cy.startTracking()

    // Set speed to 0 and wait
    cy.simulateSpeed(0)
    cy.get('.speed-value').should('contain', '0')

    // Wait and verify no distance accumulated
    cy.wait(3000)
    cy.getTotalKm().then((distance) => {
      expect(distance).to.equal(0)
    })

    // Stop tracking
    cy.stopTracking()
  })

  it('should persist distance data after stopping and starting tracking', () => {
    // First tracking session
    cy.startTracking()
    cy.simulateSpeed(60)
    cy.wait(1000)
    cy.simulateSpeed(60)
    cy.wait(500)

    let firstSessionDistance
    cy.getTotalKm().then((distance) => {
      firstSessionDistance = distance
      expect(distance).to.be.greaterThan(0)
    })

    cy.stopTracking()

    // Verify distance persists after stopping
    cy.getTotalKm().then((distance) => {
      expect(distance).to.equal(firstSessionDistance)
    })

    // Second tracking session
    cy.startTracking()
    cy.simulateSpeed(30)
    cy.wait(1000)
    cy.simulateSpeed(30)
    cy.wait(500)
    cy.stopTracking()

    // Verify total distance has increased
    cy.getTotalKm().then((finalDistance) => {
      expect(finalDistance).to.be.greaterThan(firstSessionDistance)
    })
  })
})