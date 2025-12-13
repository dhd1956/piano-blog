import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: Lookup venue address using OpenStreetMap Nominatim
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
 *   address?: string     // Formatted address
 *   phone?: string       // Phone number (if available)
 *   website?: string     // Website URL (if available)
 *   email?: string       // Email address (if available)
 *   error?: string
 * }
 */

interface NominatimResult {
  display_name: string
  address?: {
    house_number?: string
    road?: string
    suburb?: string
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
    postcode?: string
    country?: string
    country_code?: string
  }
  extratags?: {
    phone?: string
    website?: string
    email?: string
    'contact:phone'?: string
    'contact:website'?: string
    'contact:email'?: string
  }
  lat?: string
  lon?: string
}

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

    // Query OpenStreetMap Nominatim API
    const searchQuery = `${venueName}, ${city}`
    const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search')
    nominatimUrl.searchParams.set('q', searchQuery)
    nominatimUrl.searchParams.set('format', 'json')
    nominatimUrl.searchParams.set('addressdetails', '1')
    nominatimUrl.searchParams.set('extratags', '1') // Get phone, website, email, etc.
    nominatimUrl.searchParams.set('limit', '1')

    const response = await fetch(nominatimUrl.toString(), {
      headers: {
        'User-Agent': 'Piano-Blog-Venue-Lookup/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`)
    }

    const results: NominatimResult[] = await response.json()

    console.log(`🗺️ Nominatim search for "${searchQuery}" returned ${results.length} results`)
    if (results.length > 0) {
      console.log('First result:', JSON.stringify(results[0], null, 2))
    }

    if (!results || results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Could not find address. Please enter manually.',
      })
    }

    const result = results[0]
    let formattedAddress = ''

    // Format address in Google Maps style: Street Address, City, Province/State, Postal Code, Country
    if (result.address) {
      const addr = result.address
      const parts: string[] = []

      // Street address
      if (addr.house_number && addr.road) {
        parts.push(`${addr.house_number} ${addr.road}`)
      } else if (addr.road) {
        parts.push(addr.road)
      }

      // City
      const cityName = addr.city || addr.town || addr.village || addr.suburb
      if (cityName) {
        parts.push(cityName)
      }

      // State/Province
      if (addr.state) {
        parts.push(addr.state)
      }

      // Postal code
      if (addr.postcode) {
        parts.push(addr.postcode)
      }

      // Country
      if (addr.country) {
        parts.push(addr.country)
      }

      formattedAddress = parts.join(', ')
    } else {
      // Fallback to display_name if structured address not available
      formattedAddress = result.display_name
    }

    // Basic validation of response
    if (!formattedAddress || formattedAddress.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Could not find complete address. Please enter manually.',
      })
    }

    // Extract contact information from extratags
    const contactInfo: {
      phone?: string
      website?: string
      email?: string
    } = {}

    if (result.extratags) {
      const tags = result.extratags
      // Phone: try 'phone' or 'contact:phone'
      contactInfo.phone = tags.phone || tags['contact:phone']
      // Website: try 'website' or 'contact:website'
      contactInfo.website = tags.website || tags['contact:website']
      // Email: try 'email' or 'contact:email'
      contactInfo.email = tags.email || tags['contact:email']
    }

    console.log('📞 Contact info found:', contactInfo)

    return NextResponse.json({
      success: true,
      address: formattedAddress,
      ...contactInfo, // Include phone, website, email if available
    })
  } catch (error: any) {
    console.error('Error looking up address with Nominatim:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to lookup address. Please enter manually.',
      },
      { status: 500 }
    )
  }
}

/* ============================================================================
 * COMMENTED OUT: Google Gemini AI Implementation
 * Reason: Gemini v1beta API has no free tier for stable models
 * Keeping for reference in case Gemini improves free tier in the future
 * ============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST_GEMINI(request: NextRequest) {
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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

 * ============================================================================ */
