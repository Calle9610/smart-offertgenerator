import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token
    
    // Proxy request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://backend:8000'
    const response = await fetch(`${backendUrl}/public/quotes/${token}`)
    
    if (!response.ok) {
      return NextResponse.json(
        { detail: 'Quote not found' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error fetching public quote:', error)
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    )
  }
} 
