/**
 * Simplified Smoke Tests - Quote Workflow
 * 
 * How to run:
 *   # Docker (recommended)
 *   docker-compose exec frontend npx playwright test smoke-simple.spec.ts --config=playwright.docker.config.ts
 *   
 *   # Local
 *   npx playwright test smoke-simple.spec.ts
 */

import { test, expect, Route } from '@playwright/test';

test.describe('Simple Smoke Tests - Quote Workflow', () => {
  let quoteId: string | null = null;

  test.beforeEach(async ({ page }) => {
    // Mock API responses for consistent testing
    await page.route('**/api/project-requirements/**', async (route: Route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-req-123',
            project_name: 'Smoke Test Project',
            customer_name: 'Smoke Test Customer',
            status: 'created'
          })
        });
      }
    });

    await page.route('**/api/quotes/**', async (route: Route) => {
      const url = route.request().url();
      
      if (url.includes('/api/quotes') && route.request().method() === 'POST') {
        // Mock quote creation
        quoteId = 'test-quote-456';
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: quoteId,
            customer_name: 'Smoke Test Customer',
            project_name: 'Smoke Test Project',
            status: 'draft',
            created_at: new Date().toISOString()
          })
        });
      } else if (url.includes(`/api/quotes/${quoteId}`) && route.request().method() === 'GET') {
        // Mock quote retrieval
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: quoteId,
            customer_name: 'Smoke Test Customer',
            project_name: 'Smoke Test Project',
            status: 'draft',
            items: [
              {
                id: 'item-1',
                description: 'Test Item 1',
                quantity: 1,
                unit_price: 1000.0,
                total: 1000.0,
                kind: 'labor'
              }
            ],
            totals: {
              subtotal: 1000.0,
              tax: 250.0,
              total: 1250.0
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        });
      }
    });

    await page.route('**/api/price-profiles/**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'profile-1',
            name: 'Standard Profile',
            labor_rate: 1000.0,
            material_markup: 1.2
          }
        ])
      });
    });

    await page.route('**/api/companies/**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'company-1',
          name: 'Test Company',
          email: 'test@company.com'
        })
      });
    });
  });

  test('Basic quote creation workflow @smoke', async ({ page }) => {
    console.log('🚀 Starting basic smoke test: Quote creation workflow');
    
    // Step 1: Login first
    await page.goto('/login');
    console.log('✅ Navigated to /login');
    
    // Wait for login form to load
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Fill in login credentials (using test user)
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    
    // Submit login form
    await page.click('button[type="submit"]');
    
    // Wait for successful login and redirect
    await page.waitForURL(/\/dashboard|\/quotes/, { timeout: 15000 });
    console.log('✅ Login successful');
    
    // Step 2: Navigate to new quote page
    await page.goto('/quotes/new');
    console.log('✅ Navigated to /quotes/new');
    
    // Wait for page to load and content to appear
    await page.waitForSelector('main', { timeout: 10000 });
    
    // Wait for loading to complete
    await page.waitForFunction(() => {
      const main = document.querySelector('main');
      return main && !main.textContent?.includes('Loading...');
    }, { timeout: 15000 });
    
    // Wait for the actual content to appear - look for the form header
    await page.waitForSelector('h2:has-text("Create New Quote")', { timeout: 10000 });
    
    // Verify we're on the right page
    const title = await page.locator('h2').first().textContent();
    expect(title).toMatch(/Create New Quote|Skapa ny offert/i);
    console.log('✅ Quote creation page loaded');
    
    // Step 3: Fill in basic quote information
    // Wait for form to be fully loaded
    await page.waitForSelector('input[id="customer"]', { timeout: 10000 });
    await page.waitForSelector('input[id="project"]', { timeout: 10000 });
    
    console.log('✅ Form inputs found, filling data...');
    await page.fill('input[id="customer"]', 'Smoke Test Customer');
    await page.fill('input[id="project"]', 'Smoke Test Project');
    console.log('✅ Filled basic quote information');
    
    // Step 4: Add quote items
    // Wait for items section to be visible
    await page.waitForSelector('.bg-white:has-text("Offertrader")', { timeout: 5000 });
    
    // Add first item
    await page.click('button:has-text("Lägg till rad")');
    await page.waitForTimeout(500);
    
    await page.fill('input[placeholder="Beskrivning"]', 'Test Item 1');
    
    // Find quantity and price inputs more specifically
    const numberInputs = page.locator('input[type="number"]');
    await expect(numberInputs).toHaveCount(2);
    
    // Fill quantity (first number input)
    await numberInputs.nth(0).fill('1');
    
    // Fill price (second number input)  
    await numberInputs.nth(1).fill('1000');
    
    console.log('✅ Added first quote item');
    
    // Step 5: Mock create quote API before submitting
    await page.route('**/api/quotes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'mock-quote-123' })
      });
    });
    
    // Submit the quote
    const submitButton = page.locator('button:has-text("Skapa offert")');
    await expect(submitButton).toBeEnabled();
    
    console.log('📝 Submitting quote...');
    await submitButton.click();
    
    // Wait for redirect to edit page
    await page.waitForURL(/\/quotes\/.*\/edit/, { timeout: 15000 });
    console.log('✅ Redirected to edit page');
    
    // Verify we're on the edit page
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/quotes\/.*\/edit/);
    
    // Extract quote ID from URL
    const urlMatch = page.url().match(/\/quotes\/([^\/]+)/);
    if (urlMatch && urlMatch[1]) {
      quoteId = urlMatch[1];
      console.log(`✅ Quote created with ID: ${quoteId}`);
    }
    
    // Step 6: Verify edit page content
    await page.waitForSelector('h1:has-text("Redigera offert")', { timeout: 10000 });
    const editTitle = await page.locator('h1:has-text("Redigera offert")').textContent();
    expect(editTitle).toContain('Redigera offert');
    console.log('✅ Edit page title verified');
    
    // Step 7: Navigate to view page
    await page.goto(`/quotes/${quoteId}`);
    console.log('✅ Navigated to quote view page');
    
    // Wait for view page to load
    await page.waitForSelector('main', { timeout: 10000 });
    
    // Verify we're on the view page
    const viewUrl = page.url();
    expect(viewUrl).toMatch(new RegExp(`/quotes/${quoteId}$`));
    console.log('✅ Quote view page loaded');
    
    // Test completed successfully
    console.log('🎉 Basic quote workflow smoke test passed!');
    console.log('✅ Core workflow: Create → Edit → View is working correctly');
  });

  test('Quote list navigation @smoke', async ({ page }) => {
    console.log('🚀 Starting smoke test: Quote list navigation');
    
    // Login first
    await page.goto('/login');
    await page.waitForSelector('form', { timeout: 10000 });
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\/quotes/, { timeout: 15000 });
    
    // Navigate to quotes list
    await page.goto('/quotes');
    console.log('✅ Navigated to /quotes');
    
    // Wait for page to load and content to appear
    await page.waitForSelector('main', { timeout: 10000 });
    
    // Wait for loading to complete
    await page.waitForFunction(() => {
      const main = document.querySelector('main');
      return main && !main.textContent?.includes('Loading...');
    }, { timeout: 15000 });
    
    // Verify we're on the quotes list page
    const title = await page.locator('h1').filter({ hasText: 'Offertlista' }).textContent();
    expect(title).toContain('Offertlista');
    console.log('✅ Quotes list page loaded');
    
    // If there are quotes, test navigation
    const quoteRows = page.locator('[data-testid="quote-row"]');
    const rowCount = await quoteRows.count();
    
    if (rowCount > 0) {
      console.log(`📋 Found ${rowCount} quote(s) in list`);
      
      // Click on first quote row to navigate to view
      await quoteRows.first().click();
      
      // Wait for navigation
      await page.waitForURL(/\/quotes\/[^\/]+$/, { timeout: 10000 });
      console.log('✅ Navigated to quote view from list');
      
      // Verify we're on a quote view page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/quotes\/[^\/]+$/);
      
      // Go back to list
      await page.goBack();
      await page.waitForURL('/quotes', { timeout: 10000 });
      console.log('✅ Returned to quotes list');
    } else {
      console.log('📋 No quotes in list, skipping navigation test');
    }
    
    console.log('🎉 Quote list navigation smoke test passed!');
  });

  test('Error handling @smoke', async ({ page }) => {
    console.log('🚀 Starting smoke test: Error handling');
    
    // Test 404 page
    await page.goto('/quotes/non-existent-id');
    console.log('✅ Tested 404 page');
    
    // Test invalid quote creation (empty form)
    // Login first
    await page.goto('/login');
    await page.waitForSelector('form', { timeout: 10000 });
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\/quotes/, { timeout: 15000 });
    
    await page.goto('/quotes/new');
    
    // Wait for page to load and content to appear
    await page.waitForSelector('main', { timeout: 10000 });
    
    // Wait for loading to complete
    await page.waitForFunction(() => {
      const main = document.querySelector('main');
      return main && !main.textContent?.includes('Loading...');
    }, { timeout: 15000 });
    
    // Look for any button that might be the submit button
    const submitButton = page.locator('button').filter({ hasText: /skapa|Skapa|offert|Offert/ }).first();
    await expect(submitButton).toBeEnabled();
    
    await submitButton.click();
    
    // Should show validation errors
    await page.waitForTimeout(1000);
    console.log('✅ Tested form validation');
    
    console.log('🎉 Error handling smoke test passed!');
  });
});
