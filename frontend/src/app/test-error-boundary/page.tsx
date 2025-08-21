import { ErrorTestComponent, AlwaysErrorComponent, DelayedErrorComponent } from '@/components/test/ErrorTestComponent'
import { ErrorBoundary, AsyncErrorBoundary } from '@/components/system'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function TestErrorBoundaryPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">ErrorBoundary Test Page</h1>
        <p className="text-gray-600 mt-2">
          Testa olika typer av fel och se hur ErrorBoundary hanterar dem
        </p>
      </div>

      {/* Test ErrorTestComponent wrapped in ErrorBoundary */}
      <Card>
        <CardHeader>
          <CardTitle>Test ErrorTestComponent</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorBoundary>
            <ErrorTestComponent />
          </ErrorBoundary>
        </CardContent>
      </Card>

      {/* Test AlwaysErrorComponent wrapped in ErrorBoundary */}
      <Card>
        <CardHeader>
          <CardTitle>Test AlwaysErrorComponent</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorBoundary>
            <AlwaysErrorComponent />
          </ErrorBoundary>
        </CardContent>
      </Card>

      {/* Test DelayedErrorComponent wrapped in AsyncErrorBoundary */}
      <Card>
        <CardHeader>
          <CardTitle>Test DelayedErrorComponent med AsyncErrorBoundary</CardTitle>
        </CardHeader>
        <CardContent>
          <AsyncErrorBoundary>
            <DelayedErrorComponent />
          </AsyncErrorBoundary>
        </CardContent>
      </Card>

      {/* Test nested ErrorBoundaries */}
      <Card>
        <CardHeader>
          <CardTitle>Test Nested ErrorBoundaries</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorBoundary>
            <div className="space-y-4">
              <p>Detta är en normal komponent</p>
              <ErrorBoundary>
                <AlwaysErrorComponent />
              </ErrorBoundary>
              <p>Detta ska fortfarande visas</p>
            </div>
          </ErrorBoundary>
        </CardContent>
      </Card>

      {/* Test custom fallback */}
      <Card>
        <CardHeader>
          <CardTitle>Test Custom Fallback</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorBoundary
            fallback={
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-800">Custom Fallback UI</h3>
                <p className="text-yellow-700 text-sm">
                  Detta är en anpassad fallback-komponent som visas istället för standard ErrorState.
                </p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Ladda om sidan
                </button>
              </div>
            }
          >
            <AlwaysErrorComponent />
          </ErrorBoundary>
        </CardContent>
      </Card>

      {/* Information about ErrorBoundary */}
      <Card>
        <CardHeader>
          <CardTitle>Om ErrorBoundary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium">Vad är ErrorBoundary?</h4>
              <p className="text-gray-600">
                ErrorBoundary är en React-komponent som fångar JavaScript-fel i komponentträdet 
                och visar en fallback UI istället för att hela appen kraschar.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">Typer av fel som fångas:</h4>
              <ul className="text-gray-600 list-disc list-inside space-y-1">
                <li>Render-fel (komponenter som kastar fel under rendering)</li>
                <li>JavaScript-fel (undefined metoder, null-referenser, etc.)</li>
                <li>Async-fel (nätverksfel, API-fel)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium">Fel som INTE fångas:</h4>
              <ul className="text-gray-600 list-disc list-inside space-y-1">
                <li>Event handlers (onClick, onSubmit, etc.)</li>
                <li>Async-kod (setTimeout, fetch, etc.)</li>
                <li>Server-side rendering</li>
                <li>Fel som kastas i själva ErrorBoundary-komponenten</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium">Användning:</h4>
              <ul className="text-gray-600 list-disc list-inside space-y-1">
                <li>Wrappa viktiga komponenter för att förhindra krasch</li>
                <li>Använd AsyncErrorBoundary för nätverksfel</li>
                <li>Anpassa fallback UI med fallback-prop</li>
                <li>Logga fel med onError-callback</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
