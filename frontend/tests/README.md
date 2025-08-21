# Playwright Tests - Smoke Tests

## Översikt

Smoke-testerna verifierar att grundläggande funktionalitet fungerar med den nya cookie-baserade autentiseringen. Testerna använder manuell inloggning i varje test för enkelhet och tillförlitlighet.

## Konfiguration

### 1. Docker (Rekommenderat)

```bash
# Kör smoke-testerna i Docker
docker-compose exec frontend npx playwright test smoke-simple.spec.ts --config=playwright.docker.config.ts
```

### 2. Lokalt

```bash
# Kör smoke-testerna lokalt
npx playwright test smoke-simple.spec.ts
```

### 3. Specifika tester

```bash
# Kör endast quote workflow testet
docker-compose exec frontend npx playwright test --grep "Basic quote creation workflow" --config=playwright.docker.config.ts

# Kör endast navigation testet
docker-compose exec frontend npx playwright test --grep "Quote list navigation" --config=playwright.docker.config.ts
```

## Testflöde

### Basic Quote Creation Workflow
1. **Login** → `/login` (manuell inloggning med test-användare)
2. **Skapa offert** → `/quotes/new` (fyll i formulär och lägg till rader)
3. **Submit** → Redirect till `/quotes/[id]/edit`
4. **Verifiera edit** → Kontrollera att edit-sidan laddas korrekt
5. **Navigera till view** → `/quotes/[id]` för att se offerten

### Quote List Navigation
- Testar navigation mellan offertlista och enskilda offerter
- Verifierar att skyddade sidor är tillgängliga efter inloggning

### Error Handling
- Testar 404-sidor
- Verifierar formulärvalidering
- Kontrollerar felhantering

## Filer

- **`smoke-simple.spec.ts`** - Enkel smoke-testfil med manuell inloggning
- **`playwright.docker.config.ts`** - Docker-konfiguration för tester
- **`playwright.config.ts`** - Standard Playwright-konfiguration

## Autentisering

### Test-användare
- **Email:** `admin@example.com`
- **Lösenord:** `admin123`

### Autentiseringsflöde
Varje test loggar in manuellt för att säkerställa att autentiseringen fungerar korrekt. Detta ger enklare och mer tillförlitliga tester än komplexa storageState-lösningar.

## Felsökning

### Vanliga problem

1. **Authentication failed**
   - Kontrollera att test-användaren finns i databasen
   - Verifiera att backend körs och är tillgänglig

2. **Page not loading**
   - Kontrollera att frontend-servern körs
   - Verifiera att alla API-endpoints fungerar

3. **Tests timing out**
   - Öka timeout-värden i testen
   - Kontrollera nätverksprestanda

### Debug-läge

Aktivera debug-läge för att se vad som händer:

```bash
# Kör med debug-utskrifter
DEBUG=pw:api npx playwright test smoke-simple.spec.ts --config=playwright.docker.config.ts
```

## Utveckling

### Lägga till nya tester

1. Skapa ny test-fil i `tests/` mappen
2. Använd samma mönster som befintliga tester
3. Inkludera manuell inloggning i varje test

### Uppdatera mocks

API-mocks finns i `test.beforeEach()` i smoke-testerna. Uppdatera dem efter behov för att matcha backend-ändringar.

## CI/CD

För CI/CD-pipelines, kör testerna direkt:

```yaml
- name: Run smoke tests
  run: npx playwright test smoke-simple.spec.ts --config=playwright.docker.config.ts
```

## Teststruktur

### Befintliga tester
- **Basic quote creation workflow** - Testar hela offertflödet
- **Quote list navigation** - Testar navigation mellan sidor
- **Error handling** - Testar felhantering och validering

### Framtida tester
- **Admin functionality** - Testar admin-sidor och funktioner
- **User management** - Testar användarhantering
- **API endpoints** - Testar backend-API:er direkt
