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
    
    // Test the actual quote endpoint
          const quoteResponse = await fetch(`${process.env['BACKEND_URL'] || 'http://localhost:8000'}/quotes/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    console.log('🔍 Test route: Backend response status:', quoteResponse.status)
    console.log('🔍 Test route: Backend response ok:', quoteResponse.ok)

    if (quoteResponse.status === 404) {
      return NextResponse.json(
        { 
          detail: 'Quote not found',
          test_info: 'Backend returned 404 - quote does not exist',
          quote_id: id
        },
        { status: 404 }
      )
    }

    if (!quoteResponse.ok) {
      const errorData = await quoteResponse.json()
      return NextResponse.json(
        { 
          detail: errorData.detail || 'Failed to get quote',
          test_info: 'Backend error occurred',
          status: quoteResponse.status,
          quote_id: id
        },
        { status: quoteResponse.status }
      )
    }

    const backendData = await quoteResponse.json()
    console.log('🔍 Test route: Backend data received:', backendData)
    
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

    return NextResponse.json({
      ...quoteData,
      test_info: 'Quote retrieved successfully from backend',
      backend_status: quoteResponse.status
    })

  } catch (error) {
    console.error('Error in quote test API route:', error)
    return NextResponse.json(
      { 
        detail: 'Internal server error',
        test_info: 'Exception occurred while testing quote endpoint',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
