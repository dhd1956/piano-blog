#!/bin/bash

# Manual test script for YouTube milestone tracking
# This simulates what the cron job does

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     YouTube Milestone Tracker - Manual Test                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if CRON_SECRET is set
if [ -z "$CRON_SECRET" ]; then
    echo "⚠️  CRON_SECRET not found in environment"
    echo ""

    # Try to read from .env.local
    if [ -f .env.local ]; then
        echo "📖 Reading CRON_SECRET from .env.local..."
        CRON_SECRET=$(grep "CRON_SECRET" .env.local | cut -d'"' -f2 || echo "")
    fi

    if [ -z "$CRON_SECRET" ]; then
        echo "❌ CRON_SECRET not configured"
        echo ""
        echo "To test the cron job, you need to set CRON_SECRET:"
        echo "1. Add to .env.local: CRON_SECRET=\"your-secret-here\""
        echo "2. Generate secret: openssl rand -base64 32"
        echo ""
        exit 1
    fi
fi

echo "🔑 Using CRON_SECRET: ${CRON_SECRET:0:8}... (first 8 chars)"
echo ""

# Determine API URL
API_URL="${APP_URL:-http://localhost:3000}"
ENDPOINT="$API_URL/api/content/youtube/check-milestones"

echo "📡 Calling endpoint: $ENDPOINT"
echo ""

# Make the request
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Triggering milestone check..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

response=$(curl -s -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  "$ENDPOINT")

echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
echo ""

# Check if successful
if echo "$response" | grep -q '"success":true'; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Success! Milestone check completed"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Extract stats if available
    videos_checked=$(echo "$response" | grep -o '"videosChecked":[0-9]*' | cut -d':' -f2 || echo "0")
    milestones_awarded=$(echo "$response" | grep -o '"milestonesAwarded":[0-9]*' | cut -d':' -f2 || echo "0")
    pxp_awarded=$(echo "$response" | grep -o '"pxpAwarded":[0-9]*' | cut -d':' -f2 || echo "0")

    echo ""
    echo "📊 Results:"
    echo "   • Videos checked: $videos_checked"
    echo "   • Milestones awarded: $milestones_awarded"
    echo "   • Total PXP awarded: $pxp_awarded"
    echo ""

    if [ "$milestones_awarded" -gt 0 ]; then
        echo "🎉 Congratulations! $milestones_awarded milestone(s) reached!"
    else
        echo "💡 No new milestones reached this time"
    fi
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ Failed! Check the response above for errors"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Check for common errors
    if echo "$response" | grep -q "Unauthorized"; then
        echo ""
        echo "🔐 Error: Unauthorized - Check your CRON_SECRET"
        echo "   Make sure CRON_SECRET in .env.local matches what you're using"
    elif echo "$response" | grep -q "YOUTUBE_API_KEY"; then
        echo ""
        echo "🔑 Error: YouTube API key not configured"
        echo "   Add YOUTUBE_API_KEY to .env.local"
    fi

    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "💡 Tip: This endpoint runs automatically every 6 hours in production"
echo "   via Vercel Cron or GitHub Actions"
echo ""
