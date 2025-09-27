import { NextRequest, NextResponse } from 'next/server'

interface FeedbackData {
  name: string
  email: string
  subject: string
  message: string
}

// Validation function for feedback data
function validateFeedbackData(data: unknown): { isValid: boolean; errors: string[]; data?: FeedbackData } {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid data format'] }
  }

  const feedback = data as Record<string, unknown>

  if (!feedback.name || typeof feedback.name !== 'string' || feedback.name.trim().length === 0) {
    errors.push('Name is required')
  }
  if (feedback.name && typeof feedback.name === 'string' && feedback.name.length > 100) {
    errors.push('Name must be less than 100 characters')
  }

  if (!feedback.email || typeof feedback.email !== 'string') {
    errors.push('Email is required')
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (feedback.email && typeof feedback.email === 'string' && !emailRegex.test(feedback.email)) {
    errors.push('Invalid email format')
  }

  if (!feedback.subject || typeof feedback.subject !== 'string' || feedback.subject.trim().length === 0) {
    errors.push('Subject is required')
  }
  if (feedback.subject && typeof feedback.subject === 'string' && feedback.subject.length > 200) {
    errors.push('Subject must be less than 200 characters')
  }

  if (!feedback.message || typeof feedback.message !== 'string' || feedback.message.trim().length === 0) {
    errors.push('Message is required')
  }
  if (feedback.message && typeof feedback.message === 'string' && feedback.message.length > 2000) {
    errors.push('Message must be less than 2000 characters')
  }

  if (errors.length > 0) {
    return { isValid: false, errors }
  }

  return {
    isValid: true,
    errors: [],
    data: {
      name: feedback.name as string,
      email: feedback.email as string,
      subject: feedback.subject as string,
      message: feedback.message as string,
    }
  }
}

// Production API route for feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input data
    const validationResult = validateFeedbackData(body)
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.errors },
        { status: 400 }
      )
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    
    const response = await fetch(`${apiUrl}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validationResult.data)
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.message || 'Failed to send feedback' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}