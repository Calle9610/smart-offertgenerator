import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const backendResponse = await fetch(
      `${process.env.BACKEND_URL || 'http://localhost:8000'}/public/quotes/${token}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json()
      return NextResponse.json(
        { detail: errorData.detail || 'Failed to fetch public quote' },
        { status: backendResponse.status }
      )
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in public quote API route:', error)
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    )
  }
} 
