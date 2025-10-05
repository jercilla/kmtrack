describe('Realistic GPS Simulation', () => {
  it('should simulate GPS movement with time-based distance calculation', () => {
    cy.visit('/')
    cy.wait(2000)

    // Start tracking
    cy.get('.control-button').click()
    cy.get('.control-button').should('have.class', 'recording')
    cy.wait(1000)

    // Initial state
    cy.get('.speed-value').should('contain', '0')
    cy.get('.odometer-digits').should('contain', '0.0')

    // Start 60 km/h simulation
    cy.get('.test-controls').find('ion-button:contains("60")').click()

    // Verify speed changed immediately
    cy.get('.speed-value').should('contain', '60')

    // Wait and check distance accumulation every 2 seconds
    const checkTimes = [2, 4, 6, 8, 10] // seconds
    const expectedDistances = [] // Will store expected distances

    checkTimes.forEach((timeSeconds, index) => {
      cy.wait(2000)

      cy.get('.odometer-digits').invoke('text').then(text => {
        const distance = parseFloat(text)

        // At 60 km/h, in timeSeconds we should travel:
        // 60 km/h = 60/3600 km/s = 0.0167 km/s
        const expectedDistance = (60 / 3600) * timeSeconds

        cy.log(`After ${timeSeconds}s at 60km/h:`)
        cy.log(`  Actual distance: ${distance.toFixed(4)} km`)
        cy.log(`  Expected distance: ${expectedDistance.toFixed(4)} km`)

        // Allow some tolerance for timing and calculation differences
        expect(distance).to.be.at.least(expectedDistance * 0.8)
        expect(distance).to.be.at.most(expectedDistance * 1.2)
      })
    })

    // Test speed change during simulation
    cy.get('.test-controls').find('ion-button:contains("30")').click()
    cy.get('.speed-value').should('contain', '30')

    // Wait a bit more and verify distance continues to accumulate
    cy.wait(3000)
    cy.get('.odometer-digits').invoke('text').then(text => {
      const finalDistance = parseFloat(text)
      cy.log(`Final distance after speed change: ${finalDistance.toFixed(4)} km`)

      // Should have some reasonable distance after ~13 seconds of simulation
      expect(finalDistance).to.be.greaterThan(0.1) // At least 100 meters
    })

    // Stop simulation
    cy.get('.test-controls').find('ion-button:contains("STOP")').click()
    cy.get('.speed-value').should('contain', '0')

    // Stop tracking
    cy.get('.control-button').click()
    cy.get('.control-button').should('not.have.class', 'recording')

    // Distance should persist
    cy.get('.odometer-digits').invoke('text').then(text => {
      const persistedDistance = parseFloat(text)
      expect(persistedDistance).to.be.greaterThan(0)
      cy.log(`Persisted distance: ${persistedDistance.toFixed(4)} km`)
    })
  })

  it('should test different simulation speeds', () => {
    cy.visit('/')
    cy.wait(2000)

    // Start tracking
    cy.get('.control-button').click()
    cy.wait(1000)

    const speeds = [30, 60, 90]

    speeds.forEach(speed => {
      // Reset for each test
      cy.get('.test-controls').find('ion-button:contains("STOP")').click()
      cy.wait(500)

      // Set speed
      cy.get('.test-controls').find(`ion-button:contains("${speed}")`).click()
      cy.get('.speed-value').should('contain', speed.toString())

      // Record initial distance
      let initialDistance = 0
      cy.get('.odometer-digits').invoke('text').then(text => {
        initialDistance = parseFloat(text)
      })

      // Wait 3 seconds
      cy.wait(3000)

      // Check distance increased
      cy.get('.odometer-digits').invoke('text').then(text => {
        const newDistance = parseFloat(text)
        const distanceDiff = newDistance - initialDistance

        // At speed km/h for 3 seconds: expected = (speed/3600) * 3
        const expectedDiff = (speed / 3600) * 3

        cy.log(`Speed ${speed} km/h for 3s:`)
        cy.log(`  Distance difference: ${distanceDiff.toFixed(4)} km`)
        cy.log(`  Expected difference: ${expectedDiff.toFixed(4)} km`)

        expect(distanceDiff).to.be.at.least(expectedDiff * 0.8)
        expect(distanceDiff).to.be.at.most(expectedDiff * 1.2)
      })
    })

    // Stop everything
    cy.get('.test-controls').find('ion-button:contains("STOP")').click()
    cy.get('.control-button').click()
  })
})