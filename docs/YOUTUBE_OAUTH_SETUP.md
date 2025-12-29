# YouTube OAuth Channel Verification Setup

This guide explains how to set up YouTube OAuth channel verification to prevent fraud and ensure users own the videos they submit for PXP rewards.

## Overview

The YouTube OAuth integration verifies channel ownership by:

1. Redirecting users to Google's OAuth consent screen
2. Requesting permission to access their YouTube channel information
3. Verifying the channel ID matches the video they're submitting
4. Storing verified channel credentials for future video submissions
5. Automatically marking all videos from the verified channel as legitimate

## Why OAuth Verification?

Without verification, users could:

- Submit videos from other people's channels
- Earn PXP rewards for content they don't own
- Game the system by claiming popular videos

With OAuth verification:

- ✅ Users must prove they own the YouTube channel
- ✅ One-time verification process per user
- ✅ All future videos from that channel are auto-verified
- ✅ Prevents fraud and ensures fair PXP distribution

---

## Google Cloud Console Setup

### Step 1: Create/Select Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID for later

### Step 2: Enable YouTube Data API v3

1. Navigate to **APIs & Services > Library**
2. Search for "YouTube Data API v3"
3. Click **Enable**
4. Wait for confirmation (may take a minute)

### Step 3: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client ID**
3. If prompted, configure the OAuth consent screen first:

   **OAuth Consent Screen Configuration:**
   - User Type: **External** (unless you have Google Workspace)
   - App name: `Your App Name` (e.g., "Piano Style Network")
   - User support email: Your email
   - Developer contact email: Your email
   - Scopes: Add `https://www.googleapis.com/auth/youtube.readonly`
   - Test users: Add your email (for testing)
   - Save and continue

4. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: `YouTube OAuth Client` (or any descriptive name)
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     https://yourdomain.com
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/content/youtube/oauth/callback
     https://yourdomain.com/api/content/youtube/oauth/callback
     ```
   - Click **Create**

5. **Copy the credentials**:
   - Client ID: `xxxxx.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-xxxxxxxxxxxxx`
   - Save these securely - you'll need them for environment variables

### Step 4: Configure Quota Limits (Optional)

YouTube Data API v3 has a default quota of 10,000 units/day (free):

- Each channel verification uses ~5 units
- Each view count check uses ~1 unit
- Enough for ~2,000 verifications or ~10,000 view checks per day

To increase quota:

1. Navigate to **APIs & Services > YouTube Data API v3**
2. Click **Quotas**
3. Request quota increase if needed (usually not necessary)

---

## Environment Variables Configuration

Add the following to your `.env.local` file:

```bash
# YouTube Data API (for view counts)
YOUTUBE_API_KEY="your-youtube-api-key"

# YouTube OAuth (for channel verification)
YOUTUBE_OAUTH_CLIENT_ID="xxxxx.apps.googleusercontent.com"
YOUTUBE_OAUTH_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxx"
YOUTUBE_OAUTH_REDIRECT_URI="http://localhost:3000/api/content/youtube/oauth/callback"

# For production, use your domain:
# YOUTUBE_OAUTH_REDIRECT_URI="https://yourdomain.com/api/content/youtube/oauth/callback"
```

---

## OAuth Flow Architecture

### 1. Initiation (`/api/content/youtube/oauth/initiate`)

**User Action**: Clicks "Verify YouTube Channel" button

**Backend Process**:

1. Generate random state parameter (CSRF protection)
2. Store state in database with 10-minute expiry
3. Build Google OAuth URL with scopes:
   - `https://www.googleapis.com/auth/youtube.readonly`
4. Return OAuth URL to frontend

**Frontend**:

- Redirects user to Google OAuth consent screen

### 2. User Consent (Google)

**Google OAuth Screen**:

1. User logs into Google account
2. Reviews requested permissions:
   - "View your YouTube channel"
3. User clicks "Allow" or "Deny"
4. Google redirects back with authorization code

### 3. Callback (`/api/content/youtube/oauth/callback`)

**Backend Process**:

1. Receive authorization code and state from Google
2. Validate state matches stored value (CSRF check)
3. Exchange authorization code for access/refresh tokens
4. Call YouTube API to get channel information:
   ```
   GET https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true
   ```
5. Extract channel ID and channel name
6. Check if channel is already verified by another user
7. Store credentials in database:
   - `youtubeChannelId`
   - `youtubeChannelName`
   - `youtubeAccessToken` (encrypted in production)
   - `youtubeRefreshToken` (encrypted in production)
   - `youtubeTokenExpiry`
   - `youtubeVerifiedAt`
8. Mark all existing videos from this channel as verified
9. Redirect to profile page with success message

**Error Handling**:

- State mismatch → CSRF attack detected
- No channel found → User doesn't have a YouTube channel
- Channel already verified → Prevent duplicate verification
- Token exchange failed → Google API error

### 4. Status Check (`/api/content/youtube/oauth/status`)

**Purpose**: Check if user has verified their channel

**Response**:

```json
{
  "verified": true,
  "channelId": "UCxxxxxxxxxxxxxxxxxx",
  "channelName": "Piano Performances",
  "verifiedAt": "2025-12-28T12:00:00.000Z",
  "tokenExpiry": "2025-12-29T12:00:00.000Z",
  "needsReauth": false
}
```

---

## Frontend Integration

### Component: `YouTubeChannelVerification.tsx`

**States**:

1. **Not Verified**: Shows blue card with "Verify Channel" button
2. **Verified**: Shows green card with channel name and checkmark
3. **Needs Re-auth**: Shows yellow card (token expired)
4. **Loading**: Shows spinner while checking status
5. **Error**: Shows red error message

**User Flow**:

```
User visits profile
  ↓
Component fetches verification status
  ↓
If not verified:
  → Shows "Verify Channel" button
  → User clicks button
  → Redirects to Google OAuth
  → User grants permission
  → Redirects back to profile
  → Shows success message
  ↓
If verified:
  → Shows green checkmark
  → User can submit videos
```

**Benefits Display**:

- "You'll be redirected to Google to grant permission"
- "We'll verify you own the YouTube channel"
- "All your submitted videos will be automatically verified"
- "You can start earning PXP rewards immediately"

---

## Database Schema

### User Model Updates

```prisma
model User {
  // ... existing fields

  // YouTube OAuth integration
  youtubeChannelId       String?   @unique
  youtubeChannelName     String?
  youtubeAccessToken     String?   // Encrypted in production
  youtubeRefreshToken    String?   // Encrypted in production
  youtubeTokenExpiry     DateTime?
  youtubeVerifiedAt      DateTime?

  // Relations
  youtubeVideos   YouTubeVideo[]
}
```

### YouTubeVideo Model

```prisma
model YouTubeVideo {
  // ... existing fields

  // Verification
  verified      Boolean  @default(false)
  verifiedAt    DateTime?
  status        YouTubeVideoStatus @default(PENDING)

  // Status changes:
  // PENDING → VERIFIED (after OAuth)
  // VERIFIED → APPROVED (after manual review if needed)
}
```

---

## Security Considerations

### 1. CSRF Protection

**State Parameter**:

- Generate random 32-byte hex string
- Store in database with user ID and expiry (10 minutes)
- Validate on callback
- Delete after use (one-time only)

**Implementation**:

```typescript
const state = crypto.randomBytes(32).toString('hex')
const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

await prisma.appConfig.upsert({
  where: { key: `youtube_oauth_state_${userId}` },
  update: { value: { state, userId, expiresAt } },
})
```

### 2. Token Storage

**Current**: Tokens stored in plaintext (development)

**Production Recommendation**:

- Encrypt access/refresh tokens before storing
- Use environment variable for encryption key
- Decrypt only when making API calls
- Rotate encryption keys periodically

**Example Encryption**:

```typescript
import crypto from 'crypto'

const algorithm = 'aes-256-cbc'
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

function decrypt(text: string): string {
  const parts = text.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = parts[1]
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
```

### 3. Token Expiry Handling

**Access Token Lifespan**: ~1 hour

**Refresh Token**: Valid until revoked

**Re-authentication Flow**:

1. Check `youtubeTokenExpiry` before API calls
2. If expired, use refresh token to get new access token
3. Update `youtubeAccessToken` and `youtubeTokenExpiry`
4. If refresh fails, show "Re-verify Channel" prompt

### 4. Channel Uniqueness

**Prevent Multiple Users Claiming Same Channel**:

```typescript
const existingUser = await prisma.user.findFirst({
  where: {
    youtubeChannelId: channelId,
    NOT: { id: currentUserId },
  },
})

if (existingUser) {
  throw new Error('Channel already verified by another user')
}
```

---

## Testing

### Manual Testing Checklist

**Prerequisites**:

- ✅ Google Cloud project created
- ✅ YouTube Data API v3 enabled
- ✅ OAuth 2.0 credentials created
- ✅ Environment variables configured
- ✅ Dev server running

**Test Scenarios**:

1. **First-Time Verification**:
   - Visit your profile page
   - See "Verify YouTube Channel" blue card
   - Click "Verify YouTube Channel" button
   - Redirected to Google OAuth consent screen
   - Grant permission
   - Redirected back to profile
   - See green "Channel Verified" card
   - Channel name displayed correctly

2. **Already Verified**:
   - Refresh profile page
   - Still shows green verified card
   - No verification button visible

3. **Submit Video from Verified Channel**:
   - Submit YouTube URL from your verified channel
   - Video should be marked as `verified: true`
   - Video status should be `VERIFIED`

4. **OAuth Denied**:
   - Initiate verification
   - Click "Deny" on Google consent screen
   - Redirected back with error message
   - Can try again

5. **State Mismatch (CSRF Test)**:
   - Manually construct callback URL with wrong state
   - Should reject with "OAuth state mismatch" error

6. **Channel Already Claimed**:
   - Create second test account
   - Try to verify same channel
   - Should reject with "Channel already verified by [user]"

7. **Token Expiry Simulation**:
   - Manually update `youtubeTokenExpiry` in database to past date
   - Reload profile page
   - Should show yellow "Re-verification Required" card

### Testing Without OAuth Setup

If OAuth is not configured, the system gracefully degrades:

- Verification button shows "Not configured" error
- Users can still submit videos (but unverified)
- Manual admin verification can be used as fallback

---

## Troubleshooting

### Error: "YouTube OAuth not configured"

**Cause**: Missing environment variables

**Solution**:

```bash
# Check .env.local has all three variables:
YOUTUBE_OAUTH_CLIENT_ID="..."
YOUTUBE_OAUTH_CLIENT_SECRET="..."
YOUTUBE_OAUTH_REDIRECT_URI="http://localhost:3000/api/content/youtube/oauth/callback"
```

### Error: "redirect_uri_mismatch"

**Cause**: Redirect URI not authorized in Google Cloud Console

**Solution**:

1. Go to Google Cloud Console > Credentials
2. Edit your OAuth 2.0 Client ID
3. Add exact redirect URI to "Authorized redirect URIs"
4. Must match exactly (including http vs https)

### Error: "OAuth state mismatch"

**Cause**: State parameter validation failed

**Possible Reasons**:

- Cookie issues (third-party cookies blocked)
- State expired (> 10 minutes)
- CSRF attack attempt

**Solution**:

- Clear browser cookies
- Try verification again
- Check database for orphaned state records

### Error: "No YouTube channel found"

**Cause**: Google account has no YouTube channel

**Solution**:

1. Go to [YouTube.com](https://youtube.com)
2. Create a channel (free)
3. Try verification again

### Error: "Channel already verified by another user"

**Cause**: Another user already claimed this channel

**Solution**:

- Each channel can only be verified once
- Contact admin to reset if needed
- Use different YouTube account

### Error: "Token exchange failed"

**Cause**: OAuth authorization code could not be exchanged for tokens

**Possible Reasons**:

- Invalid client ID or secret
- Authorization code expired (only valid for ~10 minutes)
- Network error

**Solution**:

- Verify OAuth credentials in .env.local
- Try verification flow again
- Check Google Cloud Console for API errors

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] OAuth credentials created for production domain
- [ ] Production redirect URI added to Google Cloud Console
- [ ] Environment variables set in production environment
- [ ] Token encryption implemented
- [ ] HTTPS enabled (required for OAuth)
- [ ] Database backup before migration
- [ ] Test OAuth flow in production

### Environment Variables (Production)

```bash
# Use production domain
YOUTUBE_OAUTH_REDIRECT_URI="https://yourdomain.com/api/content/youtube/oauth/callback"

# Add encryption key for token storage
ENCRYPTION_KEY="generate-with-openssl-rand-hex-32"
```

### Monitoring

**Metrics to Track**:

- Verification success rate
- Verification failure rate by error type
- Token expiry events
- Re-authentication requests
- Average time from first video to verification

**Alerts**:

- High verification failure rate (> 10%)
- OAuth API errors
- State validation failures (potential CSRF attacks)

---

## Future Enhancements

### Planned Features

1. **Automatic Token Refresh**:
   - Background job to refresh expiring tokens
   - Prevent users seeing re-auth prompts

2. **Multi-Channel Support**:
   - Allow users to verify multiple channels
   - Separate PXP rewards per channel

3. **Channel Analytics**:
   - Show total views across all videos
   - Growth metrics (subscribers, views over time)
   - Top-performing videos

4. **Automated Fraud Detection**:
   - Flag suspicious patterns (too many videos, view count drops)
   - Require additional verification for high-value rewards

5. **Admin Dashboard**:
   - View all verified channels
   - Manually approve/reject channels
   - Reset verification if channel ownership changes

---

## API Reference

### Endpoints

#### GET `/api/content/youtube/oauth/initiate`

Starts OAuth verification flow.

**Request**: Authenticated user (JWT cookie)

**Response**:

```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=...&state=..."
}
```

**Errors**:

- `401`: Unauthorized (not logged in)
- `503`: OAuth not configured

---

#### GET `/api/content/youtube/oauth/callback`

Handles OAuth redirect from Google.

**Query Parameters**:

- `code`: Authorization code from Google
- `state`: CSRF protection state
- `error`: Error code if user denied

**Response**: Redirects to profile page with success/error message

**Success**: `/?success=youtube_verified&channel=ChannelName`

**Errors**:

- `/?error=youtube_auth_denied`
- `/?error=invalid_state`
- `/?error=channel_already_verified`
- `/?error=no_channel`
- `/?error=token_exchange_failed`

---

#### GET `/api/content/youtube/oauth/status`

Checks verification status for current user.

**Request**: Authenticated user (JWT cookie)

**Response**:

```json
{
  "success": true,
  "verified": true,
  "channelId": "UCxxxxxxxxxxxxxxxxxx",
  "channelName": "Piano Performances",
  "verifiedAt": "2025-12-28T12:00:00.000Z",
  "tokenExpiry": "2025-12-29T12:00:00.000Z",
  "needsReauth": false
}
```

**Errors**:

- `401`: Unauthorized
- `404`: User not found

---

## Support

For issues or questions:

- Check the troubleshooting section above
- Review [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- Review [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- Contact development team

---

**Document Version**: 1.0
**Last Updated**: 2025-12-28
**Status**: Production Ready
