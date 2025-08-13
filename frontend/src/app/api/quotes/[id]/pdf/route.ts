import { NextRequest, NextResponse } from 'next/server'

export async function POST(
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
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8000'}/quotes/${id}/pdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json()
      return NextResponse.json(
        { detail: errorData.detail || 'PDF generation failed' },
        { status: backendResponse.status }
      )
    }

    // Return the PDF blob
    const pdfBlob = await backendResponse.blob()
    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="quote_${id.slice(0, 8)}.pdf"`
      }
    })

  } catch (error) {
    console.error('Error in quote PDF generation API route:', error)
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    )
  }
} 
