# System Components

Detta är en samling av återanvändbara komponenter för att hantera vanliga UI-states som loading, error och empty states på ett konsistent sätt.

## Komponenter

### LoadingSkeleton

Visa skeleton-loading för olika innehållstyper.

```tsx
import { LoadingSkeleton, TableSkeleton, CardSkeleton } from '@/components/system'

// Grundläggande skeleton
<LoadingSkeleton variant="card" rows={3} />

// Specifika skeleton-komponenter
<TableSkeleton rows={5} />
<CardSkeleton />
<ListSkeleton rows={10} />
<FormSkeleton />
<ProfileSkeleton />
```

**Variants:**
- `table` - Tabellstruktur med kolumner
- `card` - Kort-layout med titel och innehåll
- `list` - Lista med avatar och text
- `form` - Formulär med inputs och knappar
- `profile` - Profil-layout med avatar och information

### EmptyState

Visa tydliga meddelanden när det inte finns något innehåll.

```tsx
import { EmptyState, QuotesEmptyState, CustomersEmptyState } from '@/components/system'

// Grundläggande empty state
<EmptyState
  title="Inget innehåll"
  description="Det finns inget att visa just nu."
  action={{
    label: "Skapa nytt",
    onClick: handleCreate,
    variant: "primary"
  }}
/>

// Fördefinierade empty states
<QuotesEmptyState
  onCreateQuote={handleCreateQuote}
  onImportQuotes={handleImportQuotes}
/>

<CustomersEmptyState
  onAddCustomer={handleAddCustomer}
  onImportCustomers={handleImportCustomers}
/>
```

### ErrorState

Hantera fel med standardiserad feltext, retry-knapp och Sentry-logging.

```tsx
import { 
  ErrorState, 
  NetworkErrorState, 
  ServerErrorState,
  AuthErrorState 
} from '@/components/system'

// Grundläggande error state
<ErrorState
  error={error}
  retry={{
    onClick: handleRetry,
    label: "Försök igen"
  }}
  actions={[{
    label: "Kontakta support",
    onClick: handleContactSupport,
    variant: "outline"
  }]}
/>

// Fördefinierade error states
<NetworkErrorState
  onRetry={handleRetry}
  onGoHome={handleGoHome}
/>

<ServerErrorState
  onRetry={handleRetry}
  onContactSupport={handleContactSupport}
/>

<AuthErrorState
  onLogin={handleLogin}
  onGoBack={handleGoBack}
/>
```

## Hooks

### usePromiseState

Hook för att hantera promise-states (idle/loading/success/error).

```tsx
import { usePromiseState } from '@/components/system'

function MyComponent() {
  const state = usePromiseState()
  
  const handleFetch = async () => {
    try {
      const result = await state.execute(fetchData())
      // result innehåller data
    } catch (error) {
      // error hanteras automatiskt av hooken
    }
  }
  
  if (state.isLoading) return <LoadingSkeleton />
  if (state.isError) return <ErrorState error={state.error} />
  if (state.isSuccess) return <div>{state.data}</div>
  
  return <button onClick={handleFetch}>Hämta data</button>
}
```

### useFetch

Enklare hook för data-fetching.

```tsx
import { useFetch } from '@/components/system'

function MyComponent() {
  const { data, isLoading, isError, error, refetch } = useFetch(
    () => fetch('/api/data')
  )
  
  if (isLoading) return <LoadingSkeleton />
  if (isError) return <ErrorState error={error} retry={{ onClick: refetch }} />
  
  return <div>{data}</div>
}
```

## Användning i sidor

### Exempel: Offertlista

```tsx
export default function QuotesPage() {
  const quotesState = usePromiseState()
  
  // Loading state
  if (quotesState.isLoading) {
    return (
      <div className="space-y-6">
        <h1>Offertlista</h1>
        <TableSkeleton rows={5} />
      </div>
    )
  }
  
  // Error state
  if (quotesState.isError) {
    return (
      <ServerErrorState
        error={quotesState.error}
        onRetry={() => quotesState.execute(fetchQuotes())}
      />
    )
  }
  
  // Empty state
  if (!quotesState.data || quotesState.data.length === 0) {
    return (
      <QuotesEmptyState
        onCreateQuote={handleCreateQuote}
      />
    )
  }
  
  // Success state
  return (
    <div>
      <h1>Offertlista</h1>
      {/* Visa offerter */}
    </div>
  )
}
```

### Exempel: Kundlista

```tsx
export default function CustomersPage() {
  const customersState = usePromiseState()
  
  // Loading state
  if (customersState.isLoading) {
    return (
      <div className="space-y-6">
        <h1>Kunder</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }
  
  // Error state
  if (customersState.isError) {
    return (
      <ServerErrorState
        error={customersState.error}
        onRetry={() => customersState.execute(fetchCustomers())}
      />
    )
  }
  
  // Empty state
  if (!customersState.data || customersState.data.length === 0) {
    return (
      <CustomersEmptyState
        onAddCustomer={handleAddCustomer}
      />
    )
  }
  
  // Success state
  return (
    <div>
      <h1>Kunder</h1>
      {/* Visa kunder */}
    </div>
  )
}
```

## Sentry-integration

ErrorState-komponenterna loggar automatiskt fel till Sentry om det finns tillgängligt:

```tsx
// Sentry loggas automatiskt
<ErrorState error={error} logToSentry={true} />

// Inaktivera Sentry-logging
<ErrorState error={error} logToSentry={false} />
```

## Anpassning

Alla komponenter stöder anpassning via `className` och andra props:

```tsx
<LoadingSkeleton 
  variant="card" 
  rows={5} 
  className="my-custom-class" 
/>

<EmptyState
  title="Anpassad titel"
  description="Anpassad beskrivning"
  icon={<CustomIcon />}
  className="bg-blue-50"
/>
```

## Bästa praxis

1. **Använd alltid samma struktur** för loading/error/empty states
2. **Visa relevanta actions** i empty states (t.ex. "Skapa nytt")
3. **Ge användbara retry-alternativ** i error states
4. **Använd rätt skeleton-variant** för innehållet
5. **Låt Sentry logga fel** automatiskt för debugging
6. **Använd fördefinierade komponenter** när det är möjligt
