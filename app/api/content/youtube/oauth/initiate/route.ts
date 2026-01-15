import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-middleware'
import crypto from 'crypto'
import { getDb } from '@/lib/get-db'

/**
 * GET /api/content/youtube/oauth/initiate
 *
 * Initiates YouTube OAuth flow for channel verification.
 * Generates OAuth URL and stores state for CSRF protection.
 *
 * Authorization: Authenticated user only
 *
 * Response:
 * {
 *   authUrl: string // URL to redirect user to for OAuth consent
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const sessionUser = await getSessionUser()

    if (!sessionUser?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      )
    }

    // Check if YouTube OAuth is configured
    const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID
    const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET
    const redirectUri = process.env.YOUTUBE_OAUTH_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        {
          success: false,
          error: 'YouTube OAuth not configured',
          errorCode: 'OAUTH_NOT_CONFIGURED',
        },
        { status: 503 }
      )
    }

    const db = await getDb()

    // Generate state parameter for CSRF protection
    const state = crypto.randomBytes(32).toString('hex')

    // Store state in database temporarily (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // Use AppConfig table to store OAuth state temporarily
    await db.appConfig.upsert({
      where: {
        key: `youtube_oauth_state_${sessionUser.id}`,
      },
      update: {
        value: {
          state,
          userId: sessionUser.id,
          expiresAt: expiresAt.toISOString(),
        },
        updatedAt: new Date(),
      },
      create: {
        key: `youtube_oauth_state_${sessionUser.id}`,
        value: {
          state,
          userId: sessionUser.id,
          expiresAt: expiresAt.toISOString(),
        },
        description: 'YouTube OAuth state for CSRF protection',
      },
    })

    // Build YouTube OAuth consent URL
    const scopes = [
      'https://www.googleapis.com/auth/youtube.readonly', // Read channel info
    ]

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.append('client_id', clientId)
    authUrl.searchParams.append('redirect_uri', redirectUri)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('scope', scopes.join(' '))
    authUrl.searchParams.append('state', state)
    authUrl.searchParams.append('access_type', 'offline') // Get refresh token
    authUrl.searchParams.append('prompt', 'consent') // Force consent to get refresh token

    return NextResponse.json(
      {
        success: true,
        authUrl: authUrl.toString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error initiating YouTube OAuth:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initiate YouTube OAuth',
      },
      { status: 500 }
    )
  }
}
