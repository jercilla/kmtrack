describe('GPS Simulation Controls', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.wait(2000)

    // Reset to clean state
    cy.get('ion-button:contains("RESET")').click()
    cy.wait(2000)
  })

  it('should increment distance correctly with GPS simulation controls', () => {
    // Verify initial state
    cy.get('.speed-value').should('contain', '0')
    cy.get('.odometer-digits').should('contain', '0.00')

    // Start tracking
    cy.get('.control-button').click()
    cy.get('.control-button').should('have.class', 'recording')
    cy.wait(1000)

    // Test 30 km/h simulation
    cy.get('ion-button:contains("30")').click()
    cy.get('.speed-value').should('contain', '30')

    // Wait and verify distance accumulation at 30 km/h
    cy.wait(3000)
    cy.get('.odometer-digits').invoke('text').then(text => {
      const distance = parseFloat(text)
      // At 30 km/h for 3 seconds: ~0.025 km
      expect(distance).to.be.greaterThan(0.02)
      expect(distance).to.be.lessThan(0.04)
      cy.log(`Distance after 3s at 30 km/h: ${distance} km`)
    })

    // Switch to 60 km/h
    cy.get('ion-button:contains("60")').click()
    cy.get('.speed-value').should('contain', '60')

    // Record distance before 60 km/h phase
    let distanceBefore60
    cy.get('.odometer-digits').invoke('text').then(text => {
      distanceBefore60 = parseFloat(text)
    })

    // Wait 4 seconds at 60 km/h
    cy.wait(4000)
    cy.get('.odometer-digits').invoke('text').then(text => {
      const distanceAfter60 = parseFloat(text)
      const increment = distanceAfter60 - distanceBefore60

      // At 60 km/h for 4 seconds: ~0.067 km increment
      expect(increment).to.be.greaterThan(0.05)
      expect(increment).to.be.lessThan(0.08)
      cy.log(`Distance increment during 4s at 60 km/h: ${increment} km`)
      cy.log(`Total distance: ${distanceAfter60} km`)
    })

    // Switch to 90 km/h
    cy.get('ion-button:contains("90")').click()
    cy.get('.speed-value').should('contain', '90')

    // Record distance before 90 km/h phase
    let distanceBefore90
    cy.get('.odometer-digits').invoke('text').then(text => {
      distanceBefore90 = parseFloat(text)
    })

    // Wait 2 seconds at 90 km/h
    cy.wait(2000)
    cy.get('.odometer-digits').invoke('text').then(text => {
      const distanceAfter90 = parseFloat(text)
      const increment = distanceAfter90 - distanceBefore90

      // At 90 km/h for 2 seconds: ~0.05 km increment
      expect(increment).to.be.greaterThan(0.04)
      expect(increment).to.be.lessThan(0.06)
      cy.log(`Distance increment during 2s at 90 km/h: ${increment} km`)
    })

    // Stop simulation
    cy.get('ion-button:contains("STOP")').click()
    cy.get('.speed-value').should('contain', '0')

    // Verify final total distance is reasonable
    cy.get('.odometer-digits').invoke('text').then(text => {
      const finalDistance = parseFloat(text)
      // Total: ~3s@30kmh + 4s@60kmh + 2s@90kmh = ~0.14 km
      expect(finalDistance).to.be.greaterThan(0.10)
      expect(finalDistance).to.be.lessThan(0.20)
      cy.log(`Final total distance: ${finalDistance} km`)
    })

    // Stop tracking - distance should persist
    cy.get('.control-button').click()
    cy.get('.control-button').should('not.have.class', 'recording')

    cy.get('.odometer-digits').invoke('text').then(text => {
      const persistedDistance = parseFloat(text)
      expect(persistedDistance).to.be.greaterThan(0.10)
      cy.log(`Persisted distance after stopping: ${persistedDistance} km`)
    })
  })

  it('should handle rapid speed changes correctly', () => {
    // Start tracking
    cy.get('.control-button').click()
    cy.wait(1000)

    // Rapid speed changes
    const speeds = [30, 60, 90, 30, 60, 0]
    let previousDistance = 0

    speeds.forEach((speed, index) => {
      if (speed === 0) {
        cy.get('ion-button:contains("STOP")').click()
      } else {
        cy.get(`ion-button:contains("${speed}")`).click()
      }

      cy.get('.speed-value').should('contain', speed.toString())
      cy.wait(1000)

      // Verify distance only increases (never decreases)
      cy.get('.odometer-digits').invoke('text').then(text => {
        const currentDistance = parseFloat(text)
        expect(currentDistance).to.be.at.least(previousDistance)
        previousDistance = currentDistance
        cy.log(`Step ${index + 1}: Speed ${speed} km/h, Distance: ${currentDistance} km`)
      })
    })

    // Stop tracking
    cy.get('.control-button').click()
  })

  it('should show correct button states during simulation', () => {
    // Start tracking
    cy.get('.control-button').click()
    cy.wait(1000)

    // Test each speed button becomes active when clicked
    const speeds = [30, 60, 90]

    speeds.forEach(speed => {
      cy.get(`ion-button:contains("${speed}")`).click()

      // Active button should have solid fill
      cy.get(`ion-button:contains("${speed}")`).should('have.attr', 'fill', 'solid')

      // Other speed buttons should have clear fill
      speeds.filter(s => s !== speed).forEach(otherSpeed => {
        cy.get(`ion-button:contains("${otherSpeed}")`).should('have.attr', 'fill', 'clear')
      })

      cy.wait(500)
    })

    // Stop simulation - STOP button should become active
    cy.get('ion-button:contains("STOP")').click()
    cy.get('ion-button:contains("STOP")').should('have.attr', 'fill', 'solid')

    // All speed buttons should be clear
    speeds.forEach(speed => {
      cy.get(`ion-button:contains("${speed}")`).should('have.attr', 'fill', 'clear')
    })

    // Stop tracking
    cy.get('.control-button').click()
  })

  it('should reset simulation state correctly', () => {
    // Start tracking and simulate some distance
    cy.get('.control-button').click()
    cy.wait(1000)

    cy.get('ion-button:contains("60")').click()
    cy.wait(3000)

    // Verify we have some distance
    cy.get('.odometer-digits').invoke('text').then(text => {
      const distance = parseFloat(text)
      expect(distance).to.be.at.least(0.02)
    })

    // Stop everything
    cy.get('ion-button:contains("STOP")').click()
    cy.get('.control-button').click()

    // Reset
    cy.get('ion-button:contains("RESET")').click()
    cy.wait(2000)

    // Verify everything is reset
    cy.get('.speed-value').should('contain', '0')
    cy.get('.odometer-digits').should('contain', '0.00')
    cy.get('.control-button').should('not.have.class', 'recording')

    // Verify simulation controls are reset
    cy.get('ion-button:contains("STOP")').should('have.attr', 'fill', 'solid')
    const speeds = [30, 60, 90]
    speeds.forEach(speed => {
      cy.get(`ion-button:contains("${speed}")`).should('have.attr', 'fill', 'clear')
    })
  })
})