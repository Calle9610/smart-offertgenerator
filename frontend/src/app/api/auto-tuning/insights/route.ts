import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')
    
    if (!token) {
      return NextResponse.json(
        { detail: 'Authorization header required' },
        { status: 401 }
      )
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/auto-tuning/insights`, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { detail: errorData.detail || 'Backend error' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Auto-tuning insights error:', error)
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    )
  }
} 
