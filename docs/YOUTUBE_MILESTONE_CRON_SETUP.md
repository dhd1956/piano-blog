# YouTube Milestone Tracking - Cron Job Setup

Automated view count tracking and PXP milestone rewards for YouTube videos.

---

## Overview

The milestone tracking system:

- ✅ Checks video view counts every 6 hours
- ✅ Awards 150 PXP when videos reach 1,000 views
- ✅ Awards 200 PXP when videos reach 10,000 views
- ✅ Updates view counts in database
- ✅ Only checks verified videos
- ✅ Skips videos that already reached milestones

---

## Deployment Options

### Option 1: Vercel Cron (Recommended for Vercel)

**Setup**: Automatic when deployed to Vercel

**Configuration**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/content/youtube/check-milestones",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Schedule**: Every 6 hours (0:00, 6:00, 12:00, 18:00 UTC)

**How it works**:

1. Vercel reads `vercel.json` during deployment
2. Automatically creates cron job
3. Calls endpoint with correct authentication
4. No additional configuration needed

**Monitoring**:

- View logs: Vercel Dashboard > Deployments > Functions > Cron
- Check execution history and errors

**Limitations**:

- Only works on Vercel Hobby plan or higher
- Cannot customize schedule beyond what's in `vercel.json`

---

### Option 2: GitHub Actions (Works anywhere)

**Setup**: Automatic via GitHub Actions workflow

**Configuration**: `.github/workflows/youtube-milestone-tracker.yml`

**Schedule**: Every 6 hours (0:00, 6:00, 12:00, 18:00 UTC)

**Prerequisites**:

1. **GitHub Secrets** - Add in Settings > Secrets and variables > Actions:
   - `CRON_SECRET`: Your cron secret (generate with `openssl rand -base64 32`)
   - `APP_URL`: Your deployed app URL (e.g., `https://yourdomain.com`)

2. **Enable GitHub Actions**:
   - Settings > Actions > General > Allow all actions

**How it works**:

1. GitHub triggers workflow on schedule
2. Workflow makes authenticated POST request to your API
3. API checks milestones and awards PXP
4. Results logged in Actions tab

**Monitoring**:

- View logs: Actions tab > YouTube Milestone Tracker
- See success/failure status
- Debug with workflow run details

**Advantages**:

- Works with any hosting provider
- Free for public repositories
- Easy to customize schedule
- Can trigger manually for testing

**Manual Trigger**:

```
GitHub > Actions > YouTube Milestone Tracker > Run workflow
```

---

### Option 3: External Cron Services

Use services like **Cron-job.org**, **EasyCron**, or **UptimeRobot**:

**Configuration**:

- **URL**: `https://yourdomain.com/api/content/youtube/check-milestones`
- **Method**: POST
- **Headers**:
  - `Authorization: Bearer YOUR_CRON_SECRET`
  - `Content-Type: application/json`
- **Schedule**: Every 6 hours (or custom)

**Services**:

- [Cron-job.org](https://cron-job.org) - Free, 1 min resolution
- [EasyCron](https://www.easycron.com) - Free plan available
- [UptimeRobot](https://uptimerobot.com) - Free monitoring + cron

---

## Environment Variables

Add to `.env.local` and production environment:

```bash
# Cron Job Security (Required)
# Generate with: openssl rand -base64 32
CRON_SECRET="your-cron-secret-change-in-production"

# YouTube API Key (Required for view counts)
YOUTUBE_API_KEY="your-youtube-api-key"
```

**For production** (Vercel, Railway, etc.):

- Add same variables to deployment environment variables
- Don't commit secrets to git

---

## Testing

### Local Testing (Development)

Run the test script:

```bash
./scripts/test-milestone-tracker.sh
```

Or manually with curl:

```bash
# Get CRON_SECRET from .env.local
CRON_SECRET="your-secret-here"

curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/content/youtube/check-milestones
```

**Expected Response**:

```json
{
  "success": true,
  "videosChecked": 5,
  "milestonesAwarded": 2,
  "pxpAwarded": 350,
  "timestamp": "2025-12-28T12:00:00.000Z"
}
```

### Production Testing

**Vercel**:

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://yourdomain.vercel.app/api/content/youtube/check-milestones
```

**GitHub Actions**:

- Go to: Actions > YouTube Milestone Tracker
- Click: "Run workflow"
- Branch: main
- Run workflow

---

## How It Works

### Workflow

1. **Cron triggers** (every 6 hours)
2. **Endpoint called**: `POST /api/content/youtube/check-milestones`
3. **Authentication**: Verifies `Authorization: Bearer CRON_SECRET`
4. **Fetch videos**: Get verified videos without all milestones
5. **Check view counts**: Call YouTube API for current views
6. **Update database**: Store new view counts
7. **Award PXP**: If milestone reached (1K or 10K)
8. **Update user balance**: Increment totalCAVEarned
9. **Mark milestone**: Set milestone1kAwarded or milestone10kAwarded
10. **Return stats**: Videos checked, milestones awarded, PXP awarded

### Database Updates

When a milestone is reached:

```sql
-- User table
UPDATE "User"
SET "totalCAVEarned" = "totalCAVEarned" + 150  -- or 200 for 10K
WHERE id = [user_id];

-- YouTubeVideo table
UPDATE "YouTubeVideo"
SET
  "viewCount" = [new_count],
  "pxpAwarded" = "pxpAwarded" + 150,  -- or 200
  "milestone1kAwarded" = true,  -- or milestone10kAwarded
  "lastChecked" = NOW()
WHERE id = [video_id];
```

### Rate Limiting

- Maximum 100 videos checked per run (prevents API quota exhaustion)
- Only checks videos that:
  - Are verified (`verified: true`)
  - Are approved (`status: APPROVED`)
  - Haven't reached both milestones
- Sorted by oldest lastChecked first (fair distribution)

### YouTube API Quota

**Quota per day**: 10,000 units (free tier)

**Cost per check**: ~1 unit per video

**Videos per run**: Up to 100

**Runs per day**: 4 (every 6 hours)

**Max videos tracked**: 2,500 per day (well within quota)

---

## Monitoring & Debugging

### Check Last Run

Query database:

```sql
SELECT
  MAX("lastChecked") as last_run,
  COUNT(*) as total_videos,
  COUNT(*) FILTER (WHERE "milestone1kAwarded" = true) as reached_1k,
  COUNT(*) FILTER (WHERE "milestone10kAwarded" = true) as reached_10k
FROM "YouTubeVideo"
WHERE verified = true;
```

### Check Pending Milestones

Videos close to milestones:

```sql
SELECT
  id,
  title,
  viewCount,
  "milestone1kAwarded",
  "milestone10kAwarded",
  "lastChecked"
FROM "YouTubeVideo"
WHERE
  verified = true
  AND (
    (viewCount >= 900 AND viewCount < 1000 AND "milestone1kAwarded" = false)
    OR (viewCount >= 9000 AND viewCount < 10000 AND "milestone10kAwarded" = false)
  )
ORDER BY viewCount DESC;
```

### View Cron Logs

**Vercel**:

- Dashboard > Project > Functions > Cron
- Filter by function name: `check-milestones`

**GitHub Actions**:

- Repository > Actions > YouTube Milestone Tracker
- Click on specific run for details

**Custom Service**:

- Check service's execution logs

---

## Troubleshooting

### Error: "Unauthorized"

**Cause**: CRON_SECRET mismatch

**Solution**:

```bash
# 1. Check .env.local has CRON_SECRET
grep CRON_SECRET .env.local

# 2. For Vercel, check environment variables
# Dashboard > Settings > Environment Variables

# 3. For GitHub Actions, check secrets
# Settings > Secrets > CRON_SECRET
```

### Error: "YOUTUBE_API_KEY not configured"

**Cause**: Missing YouTube API key

**Solution**:

```bash
# Add to .env.local
YOUTUBE_API_KEY="your-api-key"

# For production, add to environment variables
```

### No milestones awarded

**Possible reasons**:

1. No videos close to milestones yet
2. Videos not verified (`verified: false`)
3. Videos not approved (`status != APPROVED`)
4. Milestones already awarded

**Debug query**:

```sql
SELECT
  id,
  title,
  viewCount,
  verified,
  status,
  "milestone1kAwarded",
  "milestone10kAwarded"
FROM "YouTubeVideo"
ORDER BY viewCount DESC
LIMIT 10;
```

### YouTube API quota exceeded

**Symptoms**: Errors after checking many videos

**Solution**:

1. Reduce check frequency (e.g., every 12 hours instead of 6)
2. Request quota increase from Google
3. Prioritize videos close to milestones

---

## Production Checklist

Before deploying:

- [ ] `CRON_SECRET` set in production environment
- [ ] `YOUTUBE_API_KEY` set in production environment
- [ ] Vercel cron configured (`vercel.json` committed)
- [ ] OR GitHub Actions secrets configured
- [ ] Test endpoint manually in production
- [ ] Monitor first few automatic runs
- [ ] Set up error alerting (optional)

---

## Customization

### Change Schedule

**Vercel** (`vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/content/youtube/check-milestones",
      "schedule": "0 */12 * * *" // Every 12 hours
    }
  ]
}
```

**GitHub Actions** (`.github/workflows/youtube-milestone-tracker.yml`):

```yaml
on:
  schedule:
    - cron: '0 */12 * * *' # Every 12 hours
```

**Cron syntax reference**:

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
* * * * *
```

**Common schedules**:

- Every 6 hours: `0 */6 * * *`
- Every 12 hours: `0 */12 * * *`
- Daily at midnight: `0 0 * * *`
- Every Monday at 9 AM: `0 9 * * 1`

### Limit Videos Per Run

Edit `app/api/content/youtube/check-milestones/route.ts`:

```typescript
const videos = await prisma.youTubeVideo.findMany({
  where: {
    /* ... */
  },
  take: 50, // Change from 100 to 50
  orderBy: { lastChecked: 'asc' },
})
```

---

## Cost Analysis

### YouTube API Costs

**Free tier**: 10,000 units/day

**Usage**:

- 4 runs/day × 100 videos/run = 400 API calls
- Well within free tier limits

**If you exceed quota**:

- Cost: ~$0.004 per 10,000 additional units
- Very affordable even at scale

### Hosting Costs

**Vercel**:

- Hobby plan: Free (includes cron jobs)
- Pro plan: $20/month (more cron executions)

**GitHub Actions**:

- Free for public repositories
- 2,000 minutes/month free for private repos

**Conclusion**: Near-zero cost for most use cases

---

## API Reference

### Endpoint

```
POST /api/content/youtube/check-milestones
```

### Headers

```
Authorization: Bearer YOUR_CRON_SECRET
Content-Type: application/json
```

### Response

**Success** (200):

```json
{
  "success": true,
  "videosChecked": 45,
  "milestonesAwarded": 3,
  "pxpAwarded": 500,
  "milestoneBreakdown": {
    "1k": 2,
    "10k": 1
  },
  "timestamp": "2025-12-28T12:00:00.000Z"
}
```

**Error** (401):

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Error** (503):

```json
{
  "success": false,
  "error": "YouTube API not configured"
}
```

---

## Support

**Documentation**:

- Setup guide: This document
- API implementation: `app/api/content/youtube/check-milestones/route.ts`
- Test script: `scripts/test-milestone-tracker.sh`

**Testing**:

```bash
# Local test
./scripts/test-milestone-tracker.sh

# Production test
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://yourdomain.com/api/content/youtube/check-milestones
```

---

**Last Updated**: 2025-12-28
**Status**: Production Ready
**Schedule**: Every 6 hours
**Cost**: Free (within API quotas)
