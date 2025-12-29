#!/bin/bash

# YouTube OAuth Setup Helper Script
# This script helps you configure YouTube OAuth credentials for channel verification

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        YouTube OAuth Setup - Quick Start Guide              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found"
    echo "   Please create .env.local first (copy from .env.example)"
    exit 1
fi

# Check if OAuth already configured
if grep -q "YOUTUBE_OAUTH_CLIENT_ID" .env.local; then
    echo "⚠️  YouTube OAuth credentials already exist in .env.local"
    echo ""
    read -p "Do you want to update them? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 1: Google Cloud Console Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "You need to create OAuth credentials in Google Cloud Console."
echo "Follow these steps:"
echo ""
echo "1. Go to: https://console.cloud.google.com/"
echo "2. Create or select a project"
echo "3. Enable YouTube Data API v3:"
echo "   → APIs & Services > Library"
echo "   → Search 'YouTube Data API v3'"
echo "   → Click Enable"
echo ""
echo "4. Create OAuth credentials:"
echo "   → APIs & Services > Credentials"
echo "   → Create Credentials > OAuth 2.0 Client ID"
echo ""
echo "5. Configure OAuth consent screen (if prompted):"
echo "   → User Type: External"
echo "   → App name: Piano Style Network (or your app name)"
echo "   → Add your email"
echo "   → Scopes: Add 'YouTube Data API v3 - View your YouTube channel'"
echo "   → Test users: Add your email"
echo ""
echo "6. Create OAuth Client ID:"
echo "   → Application type: Web application"
echo "   → Name: YouTube OAuth Client"
echo "   → Authorized redirect URIs:"
echo "     http://localhost:3000/api/content/youtube/oauth/callback"
echo "     https://yourdomain.com/api/content/youtube/oauth/callback (for production)"
echo ""
echo "7. Copy the credentials (Client ID and Client Secret)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Press Enter when you have the credentials ready..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Step 2: Enter Your Credentials"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get YouTube API Key (if not already set)
if ! grep -q "YOUTUBE_API_KEY" .env.local || grep -q "YOUTUBE_API_KEY=\"your-youtube-api-key\"" .env.local; then
    echo "Enter your YouTube API Key:"
    echo "(Create at: Google Cloud Console > APIs & Services > Credentials > Create Credentials > API Key)"
    read -p "YouTube API Key: " YOUTUBE_API_KEY

    if [ -z "$YOUTUBE_API_KEY" ]; then
        echo "⚠️  Warning: No API key provided. View count tracking won't work."
        YOUTUBE_API_KEY="your-youtube-api-key"
    fi
else
    echo "✅ YouTube API Key already configured"
    YOUTUBE_API_KEY=$(grep "YOUTUBE_API_KEY" .env.local | cut -d'"' -f2)
fi

echo ""
echo "Enter your OAuth Client ID:"
echo "(Format: xxxxxx.apps.googleusercontent.com)"
read -p "Client ID: " CLIENT_ID

if [ -z "$CLIENT_ID" ]; then
    echo "❌ Error: Client ID is required"
    exit 1
fi

echo ""
echo "Enter your OAuth Client Secret:"
echo "(Format: GOCSPX-xxxxxxxxxxxxx)"
read -sp "Client Secret: " CLIENT_SECRET
echo ""

if [ -z "$CLIENT_SECRET" ]; then
    echo "❌ Error: Client Secret is required"
    exit 1
fi

echo ""
echo "Enter your redirect URI:"
echo "(Default: http://localhost:3000/api/content/youtube/oauth/callback)"
read -p "Redirect URI [press Enter for default]: " REDIRECT_URI

if [ -z "$REDIRECT_URI" ]; then
    REDIRECT_URI="http://localhost:3000/api/content/youtube/oauth/callback"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 Step 3: Saving Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Backup existing .env.local
BACKUP_FILE=".env.local.backup.$(date +%s)"
cp .env.local "$BACKUP_FILE"
echo "📦 Backup created: $BACKUP_FILE"

# Remove old YouTube OAuth entries if they exist
sed -i '/YOUTUBE_OAUTH_CLIENT_ID/d' .env.local
sed -i '/YOUTUBE_OAUTH_CLIENT_SECRET/d' .env.local
sed -i '/YOUTUBE_OAUTH_REDIRECT_URI/d' .env.local

# Update or add YouTube API key
if grep -q "YOUTUBE_API_KEY" .env.local; then
    sed -i "s|YOUTUBE_API_KEY=.*|YOUTUBE_API_KEY=\"$YOUTUBE_API_KEY\"|" .env.local
else
    echo "" >> .env.local
    echo "# YouTube Integration" >> .env.local
    echo "YOUTUBE_API_KEY=\"$YOUTUBE_API_KEY\"" >> .env.local
fi

# Add OAuth credentials
echo "" >> .env.local
echo "# YouTube OAuth (Channel Verification)" >> .env.local
echo "YOUTUBE_OAUTH_CLIENT_ID=\"$CLIENT_ID\"" >> .env.local
echo "YOUTUBE_OAUTH_CLIENT_SECRET=\"$CLIENT_SECRET\"" >> .env.local
echo "YOUTUBE_OAUTH_REDIRECT_URI=\"$REDIRECT_URI\"" >> .env.local

echo "✅ Credentials saved to .env.local"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Step 4: Restart Development Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Your development server needs to be restarted to pick up the new"
echo "environment variables."
echo ""

# Check if dev server is running
if pgrep -f "yarn dev" > /dev/null; then
    echo "⚠️  Development server is currently running"
    echo ""
    read -p "Do you want to restart it now? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🛑 Stopping dev server..."
        pkill -f "yarn dev"
        sleep 2
        echo "🚀 Starting dev server..."
        yarn dev > /dev/null 2>&1 &
        echo "✅ Dev server restarted"
    else
        echo "⚠️  Please restart manually: pkill -f 'yarn dev' && yarn dev"
    fi
else
    echo "💡 Start the dev server with: yarn dev"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Visit http://localhost:3000 and sign in"
echo "2. Go to your profile page"
echo "3. Scroll to 'YouTube Videos' section"
echo "4. Click 'Verify YouTube Channel'"
echo "5. Grant permission on Google OAuth screen"
echo "6. Submit videos from your verified channel!"
echo ""
echo "📖 Full documentation: docs/YOUTUBE_OAUTH_SETUP.md"
echo "🧪 Test guide: docs/YOUTUBE_E2E_TEST_RESULTS.md"
echo ""
echo "═══════════════════════════════════════════════════════════════"
