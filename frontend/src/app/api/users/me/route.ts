import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get cookies from the request
    const cookies = request.headers.get('cookie')
    
    if (!cookies) {
      return NextResponse.json(
        { detail: 'No cookies found' },
        { status: 401 }
      )
    }
    
    // Proxy request to backend
    const backendResponse = await fetch(`${process.env['BACKEND_URL'] || 'http://localhost:8000'}/users/me`, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        'Accept': 'application/json'
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
