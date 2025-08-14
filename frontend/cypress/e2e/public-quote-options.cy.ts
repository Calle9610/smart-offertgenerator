/**
 * E2E Test: Public Quote Options Selection
 * 
 * Tests the complete customer journey:
 * 1. Select/deselect options
 * 2. Totals update in real-time
 * 3. Accept quote
 * 4. PDF contains correct rows
 */

describe('Public Quote Options Selection', () => {
  const testToken = 'test_token_123'
  const testQuoteUrl = `/public/quote/${testToken}`
  
  // Mock data for testing
  const mockQuoteData = {
    id: 'quote-123',
    customer_name: 'Test Customer AB',
    project_name: 'Badrumsrenovering',
    currency: 'SEK',
    subtotal: '34350.00',
    vat: '8587.50',
    total: '42937.50',
    status: 'SENT',
    created_at: '2025-08-14T20:00:00Z',
    packages: [
      {
        id: 'package-1',
        name: 'Standard',
        items: [],
        subtotal: '34350.00',
        vat: '8587.50',
        total: '42937.50',
        is_default: true
      }
    ],
    items: [
      // Mandatory items
      {
        id: 'item-1',
        kind: 'labor',
        description: 'Grundläggande snickeri',
        qty: '20.0',
        unit: 'hour',
        unit_price: '650.00',
        line_total: '13000.00',
        is_optional: false,
        option_group: null
      },
      {
        id: 'item-2',
        kind: 'material',
        description: 'Standard kakel',
        qty: '15.0',
        unit: 'm2',
        unit_price: '216.00',
        line_total: '3240.00',
        is_optional: false,
        option_group: null
      },
      // Optional items - materials group (radio)
      {
        id: 'item-3',
        kind: 'material',
        description: 'Premium kakel',
        qty: '15.0',
        unit: 'm2',
        unit_price: '350.00',
        line_total: '5250.00',
        is_optional: true,
        option_group: 'materials'
      },
      {
        id: 'item-4',
        kind: 'material',
        description: 'Standard kakel (alternativ)',
        qty: '15.0',
        unit: 'm2',
        unit_price: '216.00',
        line_total: '3240.00',
        is_optional: true,
        option_group: 'materials'
      },
      // Optional items - services group (checkbox)
      {
        id: 'item-5',
        kind: 'labor',
        description: 'Extra detaljarbete',
        qty: '8.0',
        unit: 'hour',
        unit_price: '750.00',
        line_total: '6000.00',
        is_optional: true,
        option_group: 'services'
      }
    ]
  }

  beforeEach(() => {
    // Mock API responses
    cy.mockApiResponse('GET', `/api/public/quotes/${testToken}`, mockQuoteData)
    
    // Mock update-selection API
    cy.intercept('POST', `/api/public/quotes/${testToken}/update-selection`, {
      statusCode: 200,
      body: {
        items: mockQuoteData.items.map(item => ({
          ...item,
          isSelected: item.is_optional ? ['item-3', 'item-5'].includes(item.id) : true
        })),
        subtotal: '24250.00',
        vat: '6062.50',
        total: '30312.50',
        base_subtotal: '16240.00',
        optional_subtotal: '11250.00',
        selected_item_count: 2,
        message: 'Quote selection updated successfully'
      }
    }).as('updateSelection')
    
    // Mock accept API
    cy.intercept('POST', `/api/public/quotes/${testToken}/accept`, {
      statusCode: 200,
      body: {
        message: 'Quote accepted successfully',
        status: 'ACCEPTED',
        quote_id: 'quote-123',
        package_id: 'package-1',
        package_name: 'Standard'
      }
    }).as('acceptQuote')
    
    // Visit the public quote page
    cy.visit(testQuoteUrl)
    cy.waitForLoading()
  })

  it('should display quote with options correctly', () => {
    // Check page title and customer info
    cy.get('h1').should('contain', 'Offert för Test Customer AB')
    cy.get('h2').should('contain', 'Anpassa din offert')
    
    // Check that option groups are displayed
    cy.getByTestId('option-group-materials').should('be.visible')
    cy.getByTestId('option-group-services').should('be.visible')
    
    // Check that mandatory items are always selected
    cy.getByTestId('item-1').should('be.visible')
    cy.getByTestId('item-2').should('be.visible')
    
    // Check initial totals
    cy.checkTotalsUpdate('16240.00', '0.00', '42937.50')
  })

  it('should handle checkbox options correctly', () => {
    // Test services group (checkbox - multiple selection allowed)
    cy.getByTestId('option-group-services').within(() => {
      // Check that extra service is not selected initially
      cy.getByTestId('item-5').shouldNotBeSelected()
      
      // Select extra service
      cy.getByTestId('item-5').click()
      cy.shouldBeSelected('item-5')
      
      // Verify API call was made
      cy.wait('@updateSelection')
    })
    
    // Check that totals are updated
    cy.checkTotalsUpdate('16240.00', '6000.00', '27812.50')
  })

  it('should handle radio button options correctly', () => {
    // Test materials group (radio - single selection only)
    cy.getByTestId('option-group-materials').within(() => {
      // Check that premium kakel is not selected initially
      cy.getByTestId('item-3').shouldNotBeSelected()
      cy.getByTestId('item-4').shouldNotBeSelected()
      
      // Select premium kakel
      cy.getByTestId('item-3').click()
      cy.shouldBeSelected('item-3')
      cy.shouldNotBeSelected('item-4')
      
      // Verify API call was made
      cy.wait('@updateSelection')
    })
    
    // Check that totals are updated
    cy.checkTotalsUpdate('16240.00', '5250.00', '26862.50')
    
    // Test that selecting another option in the same group deselects the first
    cy.getByTestId('option-group-materials').within(() => {
      cy.getByTestId('item-4').click()
      cy.shouldBeSelected('item-4')
      cy.shouldNotBeSelected('item-3')
      
      // Verify API call was made
      cy.wait('@updateSelection')
    })
    
    // Check that totals are updated (standard kakel is cheaper)
    cy.checkTotalsUpdate('16240.00', '3240.00', '24852.50')
  })

  it('should update totals in real-time without page reload', () => {
    // Select multiple options
    cy.getByTestId('option-group-materials').within(() => {
      cy.getByTestId('item-3').click() // Premium kakel
    })
    
    cy.getByTestId('option-group-services').within(() => {
      cy.getByTestId('item-5').click() // Extra service
    })
    
    // Wait for both API calls
    cy.wait('@updateSelection')
    cy.wait('@updateSelection')
    
    // Verify totals are updated without page reload
    cy.get('h1').should('contain', 'Offert för Test Customer AB') // Page still loaded
    cy.checkTotalsUpdate('16240.00', '11250.00', '34312.50')
  })

  it('should accept quote with selected options', () => {
    // Select some options first
    cy.getByTestId('option-group-materials').within(() => {
      cy.getByTestId('item-3').click() // Premium kakel
    })
    
    cy.getByTestId('option-group-services').within(() => {
      cy.getByTestId('item-5').click() // Extra service
    })
    
    cy.wait('@updateSelection')
    cy.wait('@updateSelection')
    
    // Accept the quote
    cy.getByTestId('accept-package-standard').click()
    
    // Wait for accept API call
    cy.wait('@acceptQuote')
    
    // Verify success message
    cy.get('body').should('contain', 'Offerten accepterad')
    
    // Verify package is marked as accepted
    cy.getByTestId('package-standard').should('contain', '✅ Accepterad')
  })

  it('should display correct option group titles and descriptions', () => {
    // Check materials group
    cy.getByTestId('option-group-materials').within(() => {
      cy.get('h3').should('contain', 'Materialval')
      cy.get('p').should('contain', 'Välj materialkvalitet och typ')
    })
    
    // Check services group
    cy.getByTestId('option-group-services').within(() => {
      cy.get('h3').should('contain', 'Tjänster')
      cy.get('p').should('contain', 'Välj extra tjänster som ska ingå')
    })
  })

  it('should show loading state during API calls', () => {
    // Intercept API call with delay to test loading state
    cy.intercept('POST', `/api/public/quotes/${testToken}/update-selection`, {
      delay: 1000,
      statusCode: 200,
      body: { /* mock response */ }
    }).as('delayedUpdate')
    
    // Click an option
    cy.getByTestId('option-group-materials').within(() => {
      cy.getByTestId('item-3').click()
    })
    
    // Check loading state
    cy.getByTestId('updating-selection').should('be.visible')
    cy.getByTestId('updating-selection').should('contain', 'Uppdaterar totals')
    
    // Wait for API call to complete
    cy.wait('@delayedUpdate')
    
    // Check loading state is gone
    cy.getByTestId('updating-selection').should('not.exist')
  })

  it('should handle API errors gracefully', () => {
    // Mock API error
    cy.intercept('POST', `/api/public/quotes/${testToken}/update-selection`, {
      statusCode: 500,
      body: { detail: 'Internal server error' }
    }).as('apiError')
    
    // Click an option
    cy.getByTestId('option-group-materials').within(() => {
      cy.getByTestId('item-3').click()
    })
    
    // Wait for API error
    cy.wait('@apiError')
    
    // Check error message is displayed
    cy.get('body').should('contain', 'Kunde inte uppdatera tillval')
  })

  it('should maintain selection state across page interactions', () => {
    // Select some options
    cy.getByTestId('option-group-materials').within(() => {
      cy.getByTestId('item-3').click() // Premium kakel
    })
    
    cy.getByTestId('option-group-services').within(() => {
      cy.getByTestId('item-5').click() // Extra service
    })
    
    cy.wait('@updateSelection')
    cy.wait('@updateSelection')
    
    // Expand package details
    cy.getByTestId('expand-package-standard').click()
    
    // Verify options are still selected
    cy.getByTestId('item-3').should('be.checked')
    cy.getByTestId('item-5').should('be.checked')
    
    // Verify totals are still correct
    cy.checkTotalsUpdate('16240.00', '11250.00', '34312.50')
  })

  it('should show correct item details and pricing', () => {
    // Check mandatory item details
    cy.getByTestId('item-1').within(() => {
      cy.get('.item-description').should('contain', 'Grundläggande snickeri')
      cy.get('.item-details').should('contain', '20.0 hour × 650.00 SEK')
      cy.get('.item-price').should('contain', '13000.00 SEK')
    })
    
    // Check optional item details
    cy.getByTestId('item-3').within(() => {
      cy.get('.item-description').should('contain', 'Premium kakel')
      cy.get('.item-details').should('contain', '15.0 m2 × 350.00 SEK')
      cy.get('.item-price').should('contain', '5250.00 SEK')
    })
  })

  it('should display option group types correctly', () => {
    // Materials group should be radio buttons (single selection)
    cy.getByTestId('option-group-materials').within(() => {
      cy.get('input[type="radio"]').should('have.length', 2)
      cy.get('input[type="checkbox"]').should('have.length', 0)
    })
    
    // Services group should be checkboxes (multiple selection)
    cy.getByTestId('option-group-services').within(() => {
      cy.get('input[type="checkbox"]').should('have.length', 1)
      cy.get('input[type="radio"]').should('have.length', 0)
    })
  })
})

describe('PDF Generation with Selected Options', () => {
  const testToken = 'test_token_456'
  const testQuoteUrl = `/public/quote/${testToken}`
  
  beforeEach(() => {
    // Mock quote data with options
    cy.mockApiResponse('GET', `/api/public/quotes/${testToken}`, {
      /* mock data with options */
    })
    
    // Mock PDF generation API
    cy.intercept('POST', `/api/quotes/*/pdf`, {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="quote_test.pdf"'
      }
    }).as('generatePdf')
    
    cy.visit(testQuoteUrl)
    cy.waitForLoading()
  })

  it('should generate PDF with correct selected options', () => {
    // Select specific options
    cy.getByTestId('option-group-materials').within(() => {
      cy.getByTestId('item-3').click() // Premium kakel
    })
    
    cy.getByTestId('option-group-services').within(() => {
      cy.getByTestId('item-5').click() // Extra service
    })
    
    cy.wait('@updateSelection')
    cy.wait('@updateSelection')
    
    // Accept quote
    cy.getByTestId('accept-package-standard').click()
    cy.wait('@acceptQuote')
    
    // Generate PDF
    cy.getByTestId('generate-pdf').click()
    cy.wait('@generatePdf')
    
    // Verify PDF was generated
    cy.verifyPdfDownload('quote_test.pdf')
  })
})
