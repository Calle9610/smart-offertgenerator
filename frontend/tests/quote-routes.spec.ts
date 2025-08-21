// How to run: npx playwright install && npx playwright test

import { test, expect, Page, Route } from '@playwright/test'

test.describe('Quote Routes Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for consistent testing
    await page.route('**/api/quotes', async (route: Route) => {
      if (route.request().method() === 'POST') {
        // Mock successful quote creation
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-quote-123',
            message: 'Quote created successfully'
          })
        })
      } else {
        // Mock GET quotes list
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'test-quote-123',
              quoteNumber: 'OFF-2024-001',
              customer: 'Testkund AB',
              project: 'Testprojekt',
              amount: 50000,
              status: 'draft',
              updatedAt: '2024-01-15T10:30:00Z'
            }
          ])
        })
      }
    })

    // Mock individual quote fetch
    await page.route('**/api/quotes/test-quote-123', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-quote-123',
          customer: 'Testkund AB',
          project: 'Testprojekt',
          items: [
            {
              id: 'item-1',
              kind: 'labor',
              ref: 'LAB001',
              description: 'Installation arbete',
              qty: 2.0,
              unit: 'hour',
              unit_price: 500.0,
              is_optional: false,
              option_group: null
            }
          ],
          totals: {
            subtotal: 1000,
            vat: 250,
            total: 1250,
            currency: 'SEK'
          },
          status: 'draft',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        })
      })
    })

    // Mock quote edit (PUT request)
    await page.route('**/api/quotes/test-quote-123', async (route: Route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-quote-123',
            message: 'Quote updated successfully'
          })
        })
      }
    })
  })

  test('Complete quote flow: create → edit → view → list navigation', async ({ page }) => {
    // 1. Besök /quotes/new och skapa en minimal offert
    await page.goto('/quotes/new')
    
    // Verifiera att vi är på rätt sida
    await expect(page).toHaveTitle(/.*/)
    await expect(page.locator('h2')).toContainText('Skapa ny offert')
    
    // Fyll i minimal offertdata
    await page.fill('input[placeholder="Ange kundnamn"]', 'Testkund AB')
    await page.fill('input[placeholder="Ange projektnamn"]', 'Testprojekt')
    
    // Klicka "Skapa offert"
    await page.click('button[type="submit"]')
    
    // 2. Vänta på navigation till /quotes/[id]/edit
    await expect(page).toHaveURL(/\/quotes\/.*\/edit$/)
    
    // Verifiera att vi är på redigeringssidan
    await expect(page.locator('h1')).toContainText('Redigera offert')
    await expect(page.locator('h2')).toContainText('Redigera offert')
    
    // Verifiera att formuläret är ifyllt med rätt data
    await expect(page.locator('input[placeholder="Ange kundnamn"]')).toHaveValue('Testkund AB')
    await expect(page.locator('input[placeholder="Ange projektnamn"]')).toHaveValue('Testprojekt')
    
    // 3. Klicka "Tillbaka" och verifiera /quotes/[id]
    await page.click('button:has-text("Tillbaka")')
    
    // Vänta på navigation till offertvisningssidan
    await expect(page).toHaveURL(/\/quotes\/.*$/)
    await expect(page).not.toHaveURL(/\/edit$/)
    
    // Verifiera att vi är på offertvisningssidan
    await expect(page.locator('h1')).toContainText('Offert #')
    await expect(page.locator('h2')).toContainText('Kund & Projekt')
    
    // Verifiera att offertdata visas korrekt
    await expect(page.locator('text=Testkund AB')).toBeVisible()
    await expect(page.locator('text=Testprojekt')).toBeVisible()
    
    // 4. Gå till /quotes och klicka på raden → /quotes/[id]
    await page.goto('/quotes')
    
    // Verifiera att vi är på offertlistan
    await expect(page.locator('h1')).toContainText('Offertlista')
    
    // Vänta på att tabellen laddas
    await expect(page.locator('table')).toBeVisible()
    
    // Hitta offerten i listan och klicka "Visa"
    const viewButton = page.locator('button[aria-label*="Visa offert"]').first()
    await expect(viewButton).toBeVisible()
    await viewButton.click()
    
    // Verifiera att vi navigerar tillbaka till offertvisningssidan
    await expect(page).toHaveURL(/\/quotes\/.*$/)
    await expect(page).not.toHaveURL(/\/edit$/)
    
    // Verifiera att offertdata visas korrekt
    await expect(page.locator('h1')).toContainText('Offert #')
    await expect(page.locator('text=Testkund AB')).toBeVisible()
    await expect(page.locator('text=Testprojekt')).toBeVisible()
  })

  test('Quote edit functionality', async ({ page }) => {
    // Gå direkt till redigeringssidan
    await page.goto('/quotes/test-quote-123/edit')
    
    // Verifiera att vi är på redigeringssidan
    await expect(page.locator('h1')).toContainText('Redigera offert')
    
    // Ändra kundnamn
    await page.fill('input[placeholder="Ange kundnamn"]', 'Uppdaterad Kund AB')
    
    // Klicka "Spara ändringar"
    await page.click('button:has-text("Spara ändringar")')
    
    // Vänta på navigation tillbaka till offertvisningssidan
    await expect(page).toHaveURL(/\/quotes\/test-quote-123$/)
    
    // Verifiera att ändringen sparades
    await expect(page.locator('text=Uppdaterad Kund AB')).toBeVisible()
  })

  test('Quote list navigation', async ({ page }) => {
    // Gå till offertlistan
    await page.goto('/quotes')
    
    // Verifiera att vi är på rätt sida
    await expect(page.locator('h1')).toContainText('Offertlista')
    
    // Testa "Redigera" knappen
    const editButton = page.locator('button[aria-label*="Redigera offert"]').first()
    await expect(editButton).toBeVisible()
    await editButton.click()
    
    // Verifiera att vi navigerar till redigeringssidan
    await expect(page).toHaveURL(/\/quotes\/.*\/edit$/)
    
    // Gå tillbaka till listan
    await page.goBack()
    await expect(page).toHaveURL('/quotes')
    
    // Testa "Skapa offert" knappen
    const createButton = page.locator('button:has-text("Skapa offert")').first()
    await expect(createButton).toBeVisible()
    await createButton.click()
    
    // Verifiera att vi navigerar till ny offert-sidan
    await expect(page).toHaveURL('/quotes/new')
  })

  test('Error handling for invalid quote ID', async ({ page }) => {
    // Testa att besöka en icke-existerande offert
    await page.goto('/quotes/invalid-id-999')
    
    // Verifiera att vi får ett felmeddelande
    await expect(page.locator('text=Offert hittades inte')).toBeVisible()
    await expect(page.locator('text=Gå tillbaka')).toBeVisible()
    
    // Testa att besöka en icke-existerande redigeringssida
    await page.goto('/quotes/invalid-id-999/edit')
    
    // Verifiera att vi får ett felmeddelande
    await expect(page.locator('text=Offert hittades inte')).toBeVisible()
    await expect(page.locator('text=Gå tillbaka')).toBeVisible()
  })
})
