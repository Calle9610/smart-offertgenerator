import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get cookies from the request
    const cookies = request.headers.get('cookie')
    
    // Proxy request to backend
    const backendResponse = await fetch(`${process.env['BACKEND_URL'] || 'http://localhost:8000'}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || '',
      }
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json()
      return NextResponse.json(
        { detail: errorData.detail || 'Token refresh failed' },
        { status: backendResponse.status }
      )
    }

    const data = await backendResponse.json()
    
    // Create response with cookies from backend
    const response = NextResponse.json(data)
    
    // Copy cookies from backend response to frontend response
    const setCookieHeaders = backendResponse.headers.getSetCookie()
    setCookieHeaders.forEach(cookie => {
      response.headers.append('Set-Cookie', cookie)
    })
    
    return response

  } catch (error) {
    console.error('Error in refresh API route:', error)
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    )
  }
}
