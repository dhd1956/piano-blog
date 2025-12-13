import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * API Route: Lookup venue address using Gemini AI
 * POST /api/venues/lookup-address
 *
 * Request body:
 * {
 *   venueName: string  // e.g., "Tranzac Club"
 *   city: string       // e.g., "Toronto"
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   address?: string   // Formatted address
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { venueName, city } = body

    // Validation
    if (!venueName || !city) {
      return NextResponse.json(
        { success: false, error: 'Venue name and city are required' },
        { status: 400 }
      )
    }

    // Get Gemini API key from environment
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.error('⚠️ GEMINI_API_KEY not configured')
      return NextResponse.json(
        {
          success: false,
          error: 'Address lookup service not configured. Please enter address manually.',
        },
        { status: 503 }
      )
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    // Generate address using Gemini
    const prompt = `Return the address in Google Maps acceptable format for <${venueName}> in <${city}>.
Return ONLY the formatted address, nothing else.
Format: Street Address, City, Province/State, Postal Code, Country
Example: 292 Brunswick Ave, Toronto, ON M5S 2M7, Canada`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const address = response.text().trim()

    // Basic validation of response
    if (!address || address.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Could not find address. Please enter manually.',
      })
    }

    return NextResponse.json({
      success: true,
      address,
    })
  } catch (error: any) {
    console.error('Error looking up address with Gemini:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to lookup address. Please enter manually.',
      },
      { status: 500 }
    )
  }
}
