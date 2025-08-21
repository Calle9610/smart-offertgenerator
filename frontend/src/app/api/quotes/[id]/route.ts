import { NextRequest, NextResponse } from 'next/server'
import { QuoteDto } from '@/types/quote'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Get JWT token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { detail: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Proxy request to backend
          const backendResponse = await fetch(`${process.env['BACKEND_URL'] || 'http://localhost:8000'}/quotes/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (backendResponse.status === 404) {
      return NextResponse.json(
        { detail: 'Quote not found' },
        { status: 404 }
      )
    }

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json()
      return NextResponse.json(
        { detail: errorData.detail || 'Failed to get quote' },
        { status: backendResponse.status }
      )
    }

    const backendData = await backendResponse.json()
    
    // Transform backend data to match QuoteDto interface
    const quoteData: QuoteDto = {
      id: backendData.id,
      customer: backendData.customer_name || backendData.customer,
      project: backendData.project_name || backendData.project,
      items: backendData.items || [],
      totals: {
        subtotal: backendData.subtotal || 0,
        vat: backendData.vat || 0,
        total: backendData.total || 0,
        currency: backendData.currency || 'SEK'
      },
      status: backendData.status || 'draft',
      createdAt: backendData.created_at || backendData.createdAt,
      updatedAt: backendData.updated_at || backendData.updatedAt
    }

    return NextResponse.json(quoteData)

  } catch (error) {
    console.error('Error in quote GET API route:', error)
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    )
  }
}
