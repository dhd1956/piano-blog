# YouTube Milestone Tracking Cron Job - Setup Complete ✅

**Setup Date**: 2025-12-28
**Status**: Ready for deployment

---

## ✅ What's Been Configured

### 1. Vercel Cron (Primary Method)

**File**: `vercel.json`

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

**Status**: ✅ Configured
**Schedule**: Every 6 hours (0:00, 6:00, 12:00, 18:00 UTC)
**Activation**: Automatic when deployed to Vercel

### 2. GitHub Actions (Alternative Method)

**File**: `.github/workflows/youtube-milestone-tracker.yml`

**Status**: ✅ Configured
**Schedule**: Every 6 hours
**Requirements**: Add GitHub Secrets (see below)

### 3. Test Script

**File**: `scripts/test-milestone-tracker.sh`

**Status**: ✅ Executable
**Usage**: `./scripts/test-milestone-tracker.sh`

### 4. Security

**CRON_SECRET**: ✅ Generated and added to `.env.local`

- First 16 chars: `RvANgnf3WzWNj/WG...`
- Full secret stored in `.env.local`

### 5. Endpoint

**URL**: `/api/content/youtube/check-milestones`
**Method**: POST
**Auth**: Bearer token (CRON_SECRET)
**Status**: ✅ Tested and secured

**Test Result**:

```bash
curl -X POST http://localhost:3000/api/content/youtube/check-milestones
# Response: {"success":false,"error":"Unauthorized"}
# ✅ Properly secured - requires CRON_SECRET
```

---

## 📋 Deployment Checklist

### For Vercel Deployment

- [x] `vercel.json` created
- [x] `CRON_SECRET` generated
- [ ] Add `CRON_SECRET` to Vercel environment variables
- [ ] Add `YOUTUBE_API_KEY` to Vercel environment variables
- [ ] Deploy to Vercel
- [ ] Verify cron job appears in Vercel Dashboard
- [ ] Monitor first execution in Vercel logs

**Steps**:

1. Go to Vercel Dashboard > Project > Settings > Environment Variables
2. Add:
   - `CRON_SECRET`: (copy from `.env.local`)
   - `YOUTUBE_API_KEY`: (from Google Cloud Console)
3. Deploy your project
4. Cron job will automatically activate

### For GitHub Actions Deployment

- [x] Workflow file created
- [x] `CRON_SECRET` generated
- [ ] Add GitHub Secrets:
  - `CRON_SECRET`
  - `APP_URL`
- [ ] Enable GitHub Actions
- [ ] Push to GitHub
- [ ] Verify workflow appears in Actions tab
- [ ] Test manual trigger

**Steps**:

1. Go to GitHub > Settings > Secrets and variables > Actions
2. Add secrets:
   - `CRON_SECRET`: (copy from `.env.local`)
   - `APP_URL`: Your production URL (e.g., `https://yourdomain.com`)
3. Enable Actions: Settings > Actions > General > Allow all actions
4. Push code to GitHub
5. Test: Actions > YouTube Milestone Tracker > Run workflow

---

## 🧪 Testing

### Local Testing (Immediate)

**Restart dev server first** (to load new CRON_SECRET):

```bash
# Stop current server
pkill -f "yarn dev"

# Start fresh
yarn dev
```

**Run test script**:

```bash
./scripts/test-milestone-tracker.sh
```

**Expected output**:

```
✅ Success! Milestone check completed
📊 Results:
   • Videos checked: 0
   • Milestones awarded: 0
   • Total PXP awarded: 0
💡 No new milestones reached this time
```

### Manual Testing with Curl

```bash
# Get CRON_SECRET from .env.local
CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d'"' -f2)

# Test endpoint
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/content/youtube/check-milestones
```

### Production Testing

**After deployment to Vercel**:

```bash
CRON_SECRET="your-cron-secret"
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://yourdomain.vercel.app/api/content/youtube/check-milestones
```

**Via GitHub Actions**:

- Go to: Actions > YouTube Milestone Tracker
- Click: "Run workflow"
- Select branch: main
- Click: "Run workflow"
- View logs for results

---

## 📊 How It Works

### Automatic Execution

1. **Cron triggers** (every 6 hours)
2. **Endpoint called** with authentication
3. **Fetches videos** (verified, not all milestones reached)
4. **Checks view counts** via YouTube API
5. **Updates database** with new view counts
6. **Awards PXP** when milestones reached:
   - 1,000 views → 150 PXP
   - 10,000 views → 200 PXP
7. **Returns stats**:
   - Videos checked
   - Milestones awarded
   - Total PXP distributed

### What Gets Checked

- ✅ Verified videos only (`verified: true`)
- ✅ Approved status (`status: APPROVED`)
- ✅ Haven't reached both milestones yet
- ✅ Maximum 100 videos per run
- ✅ Oldest checked first (fair distribution)

### PXP Distribution

**1,000 View Milestone**:

```
User receives: 150 PXP
Video total: +150 PXP
Database: milestone1kAwarded = true
```

**10,000 View Milestone**:

```
User receives: 200 PXP
Video total: +200 PXP (now 350 total)
Database: milestone10kAwarded = true
```

---

## 💰 Cost Analysis

### YouTube API Quota

- **Free tier**: 10,000 units/day
- **Usage**: ~400 units/day (4 runs × 100 videos)
- **Utilization**: 4% of free quota
- **Cost**: $0

### Hosting

**Vercel**:

- Hobby plan: Free (includes cron)
- Pro plan: $20/month (more execution time)

**GitHub Actions**:

- Free for public repos
- 2,000 min/month free for private repos
- Estimated usage: <10 min/month

**Total Monthly Cost**: $0

---

## 📈 Expected Results

### Scenario: Active Community

**Assumptions**:

- 50 users submit videos
- Average 2 videos per user = 100 videos
- 30% reach 1K views in first month
- 10% reach 10K views in first month

**PXP Distribution**:

- Initial submissions: 100 × 100 PXP = 10,000 PXP
- 1K milestone: 30 × 150 PXP = 4,500 PXP
- 10K milestone: 10 × 200 PXP = 2,000 PXP
- **Total first month**: 16,500 PXP (~$165 USD equivalent)

**Ongoing**:

- New videos: ~20/week × 100 PXP = 2,000 PXP/week
- Milestones: ~10/week × 175 PXP avg = 1,750 PXP/week
- **Monthly steady state**: ~15,000 PXP/month

---

## 🔍 Monitoring

### Vercel Dashboard

After deployment:

1. Go to Vercel Dashboard
2. Select your project
3. Functions > Cron
4. View execution logs
5. Check for errors

### GitHub Actions

1. Go to repository > Actions
2. YouTube Milestone Tracker
3. View runs and logs
4. Set up notifications for failures

### Database Queries

**Check recent milestone awards**:

```sql
SELECT
  v.title,
  v.viewCount,
  v.pxpAwarded,
  v.milestone1kAwarded,
  v.milestone10kAwarded,
  u.displayName
FROM "YouTubeVideo" v
JOIN "User" u ON v."userId" = u.id
WHERE
  v.milestone1kAwarded = true
  OR v.milestone10kAwarded = true
ORDER BY v.updatedAt DESC
LIMIT 20;
```

**Check pending milestones**:

```sql
SELECT
  title,
  viewCount,
  CASE
    WHEN viewCount >= 900 AND milestone1kAwarded = false THEN '1K soon'
    WHEN viewCount >= 9000 AND milestone10kAwarded = false THEN '10K soon'
  END as milestone_status
FROM "YouTubeVideo"
WHERE
  verified = true
  AND (
    (viewCount >= 900 AND viewCount < 1000 AND milestone1kAwarded = false)
    OR (viewCount >= 9000 AND viewCount < 10000 AND milestone10kAwarded = false)
  )
ORDER BY viewCount DESC;
```

---

## 🚨 Troubleshooting

### Cron not running (Vercel)

**Check**:

1. `vercel.json` committed to repository
2. Deployed to Vercel (not just preview)
3. Vercel plan supports cron (Hobby or higher)

**Solution**:

- Redeploy to production
- Check Vercel logs for cron executions

### GitHub Actions failing

**Common issues**:

1. Secrets not set correctly
2. `APP_URL` wrong or missing
3. Actions not enabled

**Solution**:

- Check Settings > Secrets > Actions
- Verify secrets match .env.local
- Enable Actions in repository settings

### No milestones awarded

**Reasons**:

1. No videos close to thresholds
2. YouTube API key not configured
3. Videos not verified

**Debug**:

```bash
# Run test script to see details
./scripts/test-milestone-tracker.sh
```

---

## 📚 Documentation

- **Setup Guide**: `docs/YOUTUBE_MILESTONE_CRON_SETUP.md`
- **Test Script**: `scripts/test-milestone-tracker.sh`
- **Vercel Config**: `vercel.json`
- **GitHub Workflow**: `.github/workflows/youtube-milestone-tracker.yml`

---

## ✅ Implementation Summary

**Files Created**: 4

- `vercel.json` - Vercel Cron configuration
- `.github/workflows/youtube-milestone-tracker.yml` - GitHub Actions
- `scripts/test-milestone-tracker.sh` - Test script
- `docs/YOUTUBE_MILESTONE_CRON_SETUP.md` - Documentation

**Environment Variables Added**:

- `CRON_SECRET` - Generated and added to `.env.local`

**Total Lines**: 721+ lines

**Commit**: `0e49dfe` - "feat: Add YouTube milestone tracking cron job"

**Status**: ✅ Ready for deployment

---

## 🚀 Next Steps

1. **Test Locally**:

   ```bash
   # Restart dev server
   pkill -f "yarn dev" && yarn dev

   # Wait for server to start, then test
   ./scripts/test-milestone-tracker.sh
   ```

2. **Deploy to Production**:
   - Add environment variables to Vercel/hosting
   - Deploy code
   - Monitor first automatic execution

3. **Monitor Results**:
   - Check cron logs after 6 hours
   - Verify milestone PXP awards
   - Adjust schedule if needed

---

**Setup Complete!** The cron job will automatically award PXP when videos reach milestones. 🎉
