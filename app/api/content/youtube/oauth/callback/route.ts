import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-middleware'
import { getDb } from '@/lib/get-db'

/**
 * GET /api/content/youtube/oauth/callback
 *
 * Handles OAuth callback from Google after user grants permission.
 * Exchanges authorization code for access/refresh tokens.
 * Fetches and stores YouTube channel information.
 *
 * Query Parameters:
 * - code: Authorization code from Google
 * - state: CSRF protection state parameter
 * - error: Error code if user denied permission
 *
 * Response: Redirects to profile page with success/error message
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Check if user denied permission
    if (error) {
      console.log('YouTube OAuth error:', error)
      return NextResponse.redirect(
        new URL(
          `/profile?error=youtube_auth_denied&message=YouTube authorization was denied`,
          request.url
        )
      )
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL(`/profile?error=invalid_oauth_params&message=Missing OAuth parameters`, request.url)
      )
    }

    // Check authentication
    const sessionUser = await getSessionUser()

    if (!sessionUser?.id) {
      return NextResponse.redirect(
        new URL(
          '/auth/login?error=unauthorized&message=Please login to verify your channel',
          request.url
        )
      )
    }

    const db = await getDb()

    // Verify state parameter for CSRF protection
    const storedStateConfig = await db.appConfig.findUnique({
      where: {
        key: `youtube_oauth_state_${sessionUser.id}`,
      },
    })

    if (!storedStateConfig) {
      return NextResponse.redirect(
        new URL(`/profile?error=invalid_state&message=OAuth state not found`, request.url)
      )
    }

    const storedState = (storedStateConfig.value as { state: string; expiresAt: string }).state
    const expiresAt = new Date(
      (storedStateConfig.value as { state: string; expiresAt: string }).expiresAt
    )

    // Validate state matches and hasn't expired
    if (storedState !== state) {
      // Clean up expired state
      await db.appConfig.delete({
        where: { key: `youtube_oauth_state_${sessionUser.id}` },
      })

      return NextResponse.redirect(
        new URL(`/profile?error=invalid_state&message=OAuth state mismatch`, request.url)
      )
    }

    if (expiresAt < new Date()) {
      // Clean up expired state
      await db.appConfig.delete({
        where: { key: `youtube_oauth_state_${sessionUser.id}` },
      })

      return NextResponse.redirect(
        new URL(
          `/profile?error=state_expired&message=OAuth state expired, please try again`,
          request.url
        )
      )
    }

    // Clean up state (one-time use)
    await db.appConfig.delete({
      where: { key: `youtube_oauth_state_${sessionUser.id}` },
    })

    // Exchange authorization code for tokens
    const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID!
    const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET!
    const redirectUri = process.env.YOUTUBE_OAUTH_REDIRECT_URI!

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(
        new URL(
          `/profile?error=token_exchange_failed&message=Failed to exchange authorization code`,
          request.url
        )
      )
    }

    const tokenData = await tokenResponse.json()
    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
    } = tokenData

    // Fetch YouTube channel information
    const channelResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&mine=true',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!channelResponse.ok) {
      const errorData = await channelResponse.json()
      console.error('Failed to fetch channel info:', errorData)
      return NextResponse.redirect(
        new URL(
          `/profile?error=channel_fetch_failed&message=Failed to fetch YouTube channel information`,
          request.url
        )
      )
    }

    const channelData = await channelResponse.json()

    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.redirect(
        new URL(
          `/profile?error=no_channel&message=No YouTube channel found for this account`,
          request.url
        )
      )
    }

    const channel = channelData.items[0]
    const channelId = channel.id
    const channelName = channel.snippet.title

    // Check if channel is already verified by another user
    const existingUser = await db.user.findFirst({
      where: {
        youtubeChannelId: channelId,
        NOT: {
          id: sessionUser.id,
        },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
      },
    })

    if (existingUser) {
      const userName =
        existingUser.displayName || existingUser.username || `User ${existingUser.id}`
      return NextResponse.redirect(
        new URL(
          `/profile?error=channel_already_verified&message=This channel is already verified by ${userName}`,
          request.url
        )
      )
    }

    // Calculate token expiry time
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000)

    // Store OAuth credentials and channel info in database
    // Note: In production, you should encrypt the tokens before storing
    await db.user.update({
      where: { id: sessionUser.id },
      data: {
        youtubeChannelId: channelId,
        youtubeChannelName: channelName,
        youtubeAccessToken: accessToken,
        youtubeRefreshToken: refreshToken || undefined, // May be null on re-auth
        youtubeTokenExpiry: tokenExpiry,
        youtubeVerifiedAt: new Date(),
      },
    })

    // Mark all videos from this channel as verified
    await db.youTubeVideo.updateMany({
      where: {
        userId: sessionUser.id,
        channelId: channelId,
        verified: false,
      },
      data: {
        verified: true,
        verifiedAt: new Date(),
        status: 'VERIFIED',
      },
    })

    // Success! Redirect to profile with success message
    return NextResponse.redirect(
      new URL(
        `/profile/${sessionUser.walletAddress || sessionUser.username}?success=youtube_verified&channel=${encodeURIComponent(channelName)}`,
        request.url
      )
    )
  } catch (error) {
    console.error('Error in YouTube OAuth callback:', error)
    return NextResponse.redirect(
      new URL(
        `/profile?error=oauth_callback_failed&message=An error occurred during YouTube verification`,
        request.url
      )
    )
  }
}
