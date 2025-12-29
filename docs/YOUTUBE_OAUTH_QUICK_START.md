# YouTube OAuth - Quick Start Guide

⏱️ **Estimated Time**: 10-15 minutes

This guide will help you set up YouTube OAuth channel verification in the fastest way possible.

---

## Option 1: Automated Setup Script (Recommended)

Run the interactive setup script:

```bash
./scripts/setup-youtube-oauth.sh
```

The script will:

1. Guide you through Google Cloud Console setup
2. Prompt for your credentials
3. Automatically update .env.local
4. Restart your dev server (optional)

---

## Option 2: Manual Setup

### Step 1: Google Cloud Console (5 minutes)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create or select a project

2. **Enable YouTube Data API v3**
   - Navigate to: **APIs & Services > Library**
   - Search: "YouTube Data API v3"
   - Click: **Enable**

3. **Create OAuth Credentials**
   - Navigate to: **APIs & Services > Credentials**
   - Click: **Create Credentials > OAuth 2.0 Client ID**

4. **Configure OAuth Consent Screen** (if prompted)
   - User Type: **External**
   - App name: `Piano Style Network` (or your choice)
   - User support email: Your email
   - Developer contact email: Your email
   - Scopes: Add `https://www.googleapis.com/auth/youtube.readonly`
   - Test users: Add your email
   - Click: **Save and Continue**

5. **Create OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: `YouTube OAuth Client`
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/content/youtube/oauth/callback
     ```
   - Click: **Create**

6. **Copy Credentials**
   - Client ID: `xxxxx.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-xxxxxxxxxxxxx`

### Step 2: Update Environment Variables (2 minutes)

Add to `.env.local`:

```bash
# YouTube Integration
YOUTUBE_API_KEY="your-youtube-api-key"

# YouTube OAuth (Channel Verification)
YOUTUBE_OAUTH_CLIENT_ID="xxxxx.apps.googleusercontent.com"
YOUTUBE_OAUTH_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxx"
YOUTUBE_OAUTH_REDIRECT_URI="http://localhost:3000/api/content/youtube/oauth/callback"
```

**To get YouTube API Key**:

- Google Cloud Console > APIs & Services > Credentials
- Create Credentials > API Key
- Copy the key

### Step 3: Restart Dev Server

```bash
# Stop current server
pkill -f "yarn dev"

# Start fresh
yarn dev
```

---

## Testing the Setup (5 minutes)

### Test 1: Verify Configuration

Check if OAuth is working:

```bash
curl -s http://localhost:3000/api/content/youtube/oauth/initiate
```

**Expected Result** (without authentication):

```json
{
  "success": false,
  "error": "Authentication required"
}
```

✅ If you see this, OAuth endpoints are configured correctly!

❌ If you see "OAuth not configured", check your .env.local

### Test 2: Full OAuth Flow (Browser)

1. **Sign In**
   - Visit: http://localhost:3000
   - Sign in to your account

2. **Navigate to Profile**
   - Click on your profile
   - Scroll to "YouTube Videos" section

3. **Start Verification**
   - You should see a **blue card** with "Verify YouTube Channel" button
   - Click the button

4. **Google OAuth Consent**
   - You'll be redirected to Google
   - Select your Google account
   - Review permissions: "View your YouTube channel"
   - Click: **Allow**

5. **Verification Success**
   - Redirected back to your profile
   - See **green card** with "Channel Verified ✓"
   - Your channel name displayed

6. **Submit Video**
   - Paste a YouTube URL from YOUR channel
   - Click "Submit Video for PXP Rewards"
   - Video automatically marked as "VERIFIED"

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem**: Redirect URI not authorized in Google Cloud

**Solution**:

1. Go to Google Cloud Console > Credentials
2. Edit your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add:
   ```
   http://localhost:3000/api/content/youtube/oauth/callback
   ```
4. Save and try again

### Error: "OAuth not configured"

**Problem**: Environment variables not set or server not restarted

**Solution**:

1. Check `.env.local` has all 3 OAuth variables
2. Restart dev server:
   ```bash
   pkill -f "yarn dev" && yarn dev
   ```

### Error: "No YouTube channel found"

**Problem**: Google account has no YouTube channel

**Solution**:

1. Go to YouTube.com
2. Create a channel (free, takes 1 minute)
3. Try verification again

### Error: "Channel already verified by another user"

**Problem**: Someone else already verified this channel

**Solution**:

- Each channel can only be verified once
- Use a different Google account / YouTube channel
- Contact admin to reset if needed

---

## Quick Reference

### Google Cloud Console URLs

- **Console Home**: https://console.cloud.google.com/
- **APIs Library**: https://console.cloud.google.com/apis/library
- **Credentials**: https://console.cloud.google.com/apis/credentials
- **OAuth Consent**: https://console.cloud.google.com/apis/credentials/consent

### Environment Variables

```bash
YOUTUBE_OAUTH_CLIENT_ID="xxxxx.apps.googleusercontent.com"
YOUTUBE_OAUTH_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxx"
YOUTUBE_OAUTH_REDIRECT_URI="http://localhost:3000/api/content/youtube/oauth/callback"
```

### Testing Endpoints

```bash
# Should return 401 (good!)
curl http://localhost:3000/api/content/youtube/oauth/initiate

# Should return 401 (good!)
curl http://localhost:3000/api/content/youtube/oauth/status
```

---

## What Happens After Verification?

1. ✅ Your YouTube channel is linked to your account
2. ✅ All videos you submit from that channel are **auto-verified**
3. ✅ You earn PXP rewards immediately
4. ✅ No need to verify again (one-time only)
5. ✅ Token valid for ~1 hour (auto-refresh in production)

---

## Next Steps

Once verified, you can:

1. **Submit Videos**: Share your piano performances
2. **Earn PXP**: 100 PXP per video, 150 at 1K views, 200 at 10K views
3. **Build Portfolio**: Videos displayed on your profile
4. **Track Progress**: See view counts and milestone progress bars

---

## Need More Help?

- **Full Documentation**: `docs/YOUTUBE_OAUTH_SETUP.md`
- **Test Guide**: `docs/YOUTUBE_E2E_TEST_RESULTS.md`
- **API Reference**: See docs/YOUTUBE_OAUTH_SETUP.md#api-reference

---

**Last Updated**: 2025-12-28
**Setup Time**: ~10-15 minutes
**Difficulty**: Easy (step-by-step)
