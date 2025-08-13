import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
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
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8000'}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json()
      return NextResponse.json(
        { detail: errorData.detail || 'Failed to get user' },
        { status: backendResponse.status }
      )
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error in users/me API route:', error)
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    )
  }
} 
