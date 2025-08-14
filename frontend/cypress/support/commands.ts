// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to select elements by data-testid
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`)
})

// Custom command to wait for API response
Cypress.Commands.add('waitForApi', (method: string, url: string) => {
  return cy.intercept(method, url).as('apiCall')
})

// Custom command to check totals update
Cypress.Commands.add('checkTotalsUpdate', (base: string, optional: string, total: string) => {
  cy.getByTestId('base-subtotal').should('contain', base)
  cy.getByTestId('optional-subtotal').should('contain', optional)
  cy.getByTestId('total-amount').should('contain', total)
})

// Override visit command to handle Next.js routing
Cypress.Commands.overwrite('visit', (originalFn, url, options) => {
  // Add custom headers if needed
  const customOptions = {
    ...options,
    headers: {
      ...options?.headers,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    }
  }
  
  return originalFn(url, customOptions)
})

// Custom command to mock API responses
Cypress.Commands.add('mockApiResponse', (method: string, url: string, response: any) => {
  cy.intercept(method, url, response).as('mockedApi')
})

// Custom command to check if element is visible and contains text
Cypress.Commands.add('shouldBeVisibleAndContain', (selector: string, text: string) => {
  cy.get(selector).should('be.visible').and('contain', text)
})

// Custom command to wait for loading to complete
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-testid="loading-spinner"]', { timeout: 10000 }).should('not.exist')
})

// Custom command to check if checkbox/radio is selected
Cypress.Commands.add('shouldBeSelected', (selector: string) => {
  cy.get(selector).should('be.checked')
})

// Custom command to check if checkbox/radio is not selected
Cypress.Commands.add('shouldNotBeSelected', (selector: string) => {
  cy.get(selector).should('not.be.checked')
})

// Custom command to select option in radio group
Cypress.Commands.add('selectRadioOption', (groupName: string, optionValue: string) => {
  cy.get(`input[name="${groupName}"][value="${optionValue}"]`).check()
})

// Custom command to toggle checkbox
Cypress.Commands.add('toggleCheckbox', (selector: string) => {
  cy.get(selector).click()
})

// Custom command to verify PDF download
Cypress.Commands.add('verifyPdfDownload', (filename: string) => {
  // This would need to be implemented based on how PDFs are handled
  // For now, we'll just check if the download button exists and is clickable
  cy.getByTestId('download-pdf').should('be.visible').and('be.enabled')
})

// Custom command to check option group behavior
Cypress.Commands.add('checkOptionGroupBehavior', (groupName: string, selectedOption: string) => {
  // Check that only the selected option is checked
  cy.get(`input[name="${groupName}"]:checked`).should('have.value', selectedOption)
  
  // Check that other options in the same group are unchecked
  cy.get(`input[name="${groupName}"]:not(:checked)`).each(($option) => {
    cy.wrap($option).should('not.be.checked')
  })
})
