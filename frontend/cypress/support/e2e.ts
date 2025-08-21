// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Import Cypress types
/// <reference types="cypress" />

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions (useful for React development mode)
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  return true
})

// Custom commands for testing
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select DOM element by data-testid attribute.
       * @example cy.getByTestId('quote-item')
       */
      getByTestId(value: string): Chainable<JQuery<HTMLElement>>
      
      /**
       * Custom command to wait for API response.
       * @example cy.waitForApi('POST', '/api/public/quotes/:id/update-selection')
       */
      waitForApi(method: string, url: string): Chainable<JQuery<HTMLElement>>
      
      /**
       * Custom command to check if totals are updated correctly.
       * @example cy.checkTotalsUpdate('1000.00', '250.00', '1250.00')
       */
      checkTotalsUpdate(base: string, optional: string, total: string): Chainable<JQuery<HTMLElement>>
    }
  }
}
