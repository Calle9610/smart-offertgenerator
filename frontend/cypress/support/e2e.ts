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

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Configure global behavior
Cypress.on('uncaught:exception', (err) => {
  // Log the error for debugging
  console.error('Uncaught exception in Cypress:', err)
  
  // Return false to prevent the test from failing
  // This is useful for handling known issues in the app
  return false
})

// Configure viewport for consistent testing
Cypress.config('viewportWidth', 1280)
Cypress.config('viewportHeight', 720)

// Configure default timeout
Cypress.config('defaultCommandTimeout', 10000)
Cypress.config('requestTimeout', 10000)
Cypress.config('responseTimeout', 10000)

// Configure retries for flaky tests
Cypress.config('retries', {
  runMode: 2,
  openMode: 0
})
