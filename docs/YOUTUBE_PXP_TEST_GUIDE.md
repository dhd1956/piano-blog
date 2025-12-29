# YouTube PXP Integration - Test Guide

## Test Overview

This document provides comprehensive testing procedures for the YouTube video PXP rewards system.

**Feature Status**: ✅ Production Ready (Build Successful)
**Last Build**: 2025-12-28
**Commit**: 2557d49

---

## Pre-Test Setup

### 1. Environment Configuration

**Required** (for basic testing):

```bash
# No YouTube API key needed for submission testing
# Videos can be submitted and 100 PXP awarded immediately
```

**Optional** (for milestone testing):

```bash
# Add to .env file:
YOUTUBE_API_KEY=your-youtube-api-key-here
CRON_SECRET=your-cron-secret-here

# Get YouTube API key:
# 1. Go to https://console.cloud.google.com/apis/credentials
# 2. Enable YouTube Data API v3
# 3. Create API key
# 4. Copy key to .env
```

### 2. Database Status

✅ Database schema migrated
✅ YouTubeVideo table created
✅ User.youtubeVideos relation established
✅ YouTubeVideoStatus enum created

### 3. Test User Account

You'll need:

- A user account (username/password or Google OAuth)
- At least one YouTube video URL (any public video)
- Access to the user's profile page

---

## Test Scenarios

### Test 1: Video Submission (Basic Flow) ✅

**Objective**: Verify users can submit YouTube videos and earn PXP

**Steps**:

1. Sign in to your account
2. Navigate to your profile: `/profile/YOUR_USERNAME` or `/profile/YOUR_WALLET`
3. Scroll to "YouTube Videos" section
4. Locate the upload form
5. Paste a YouTube URL (any format):
   - `https://www.youtube.com/watch?v=VIDEO_ID`
   - `https://youtu.be/VIDEO_ID`
   - `https://www.youtube.com/embed/VIDEO_ID`
6. Click "Submit Video for PXP Rewards"

**Expected Results**:

- ✅ Form shows loading spinner
- ✅ Success message appears: "Video submitted successfully! You earned 100 PXP..."
- ✅ Video appears in gallery below
- ✅ Video shows:
  - Thumbnail image
  - Video title
  - Channel name
  - "100 PXP" badge
  - "Pending verification" status
  - Progress bar (0% toward 1K views)

**Check Database**:

```sql
SELECT * FROM "YouTubeVideo" ORDER BY "createdAt" DESC LIMIT 1;
-- Should show:
-- - youtubeId: VIDEO_ID
-- - title: Fetched from YouTube
-- - pxpAwarded: 100
-- - initialPXPAwarded: true
-- - status: PENDING
```

**Check User PXP**:

```sql
SELECT id, "totalCAVEarned" FROM "User" WHERE id = YOUR_USER_ID;
-- Should increment by 100 PXP
```

---

### Test 2: First PXP Celebration Toast 🎉

**Objective**: Verify celebration toast appears for first-time PXP earners

**Preconditions**:

- User has NEVER earned PXP before
- `totalCAVEarned = 0`
- `firstPXPEarnedAt = NULL`

**Steps**:

1. Use a brand new account (no prior PXP)
2. Submit a YouTube video (follow Test 1)
3. Wait for submission to complete

**Expected Results**:

- ✅ Success message appears
- ✅ Celebration toast slides in from bottom-right:
  - 🎉 confetti emoji bouncing
  - "Congratulations! You earned your first PXP!"
  - Shows "50 PXP" (or 100 PXP if video submission)
  - USD equivalent displayed
  - Lists 3 benefits of wallet linking
  - "Link Wallet Now" button
- ✅ Toast auto-dismisses after 8 seconds
- ✅ User can close manually with X button

**Check Database**:

```sql
SELECT id, "totalCAVEarned", "firstPXPEarnedAt" FROM "User" WHERE id = YOUR_USER_ID;
-- Should show:
-- - totalCAVEarned: 100
-- - firstPXPEarnedAt: [current timestamp]
```

**Note**: Subsequent video submissions should NOT show toast (only first PXP ever)

---

### Test 3: Duplicate Video Prevention ❌

**Objective**: Verify users cannot submit the same video twice

**Steps**:

1. Submit a YouTube video successfully
2. Try to submit the SAME video again
3. Paste the exact same URL
4. Click submit

**Expected Results**:

- ✅ Error message appears:
  - "This video has already been submitted by [Username]"
  - Error code: DUPLICATE_VIDEO
- ✅ No PXP awarded
- ✅ Video does NOT appear in gallery again
- ✅ Total PXP count unchanged

---

### Test 4: Invalid URL Handling ❌

**Objective**: Verify proper error handling for invalid URLs

**Test Cases**:

**A. Non-YouTube URL**:

- Input: `https://vimeo.com/123456`
- Expected: "Invalid YouTube URL. Please provide a valid YouTube video link..."

**B. Malformed YouTube URL**:

- Input: `youtube.com/badurl`
- Expected: Same error as above

**C. Empty Input**:

- Input: (blank)
- Expected: "YouTube URL is required"

**D. Non-Existent Video**:

- Input: `https://www.youtube.com/watch?v=NONEXISTENT123`
- Expected: "Video not found or unavailable" OR "Failed to fetch video information from YouTube"

---

### Test 5: Video Gallery Display 📺

**Objective**: Verify video gallery renders correctly

**Steps**:

1. Submit 3-5 different YouTube videos
2. Refresh profile page
3. Examine gallery layout

**Expected Results**:

- ✅ Grid layout (2 columns on desktop, 1 on mobile)
- ✅ Each video shows:
  - Thumbnail with hover effect
  - Play icon overlay on hover
  - Video title (max 2 lines)
  - Channel name
  - PXP earned badge (yellow)
  - View count and progress bar
  - "Pending verification" or "Verified" badge
  - "Watch on YouTube →" link
- ✅ Total PXP summary at top
- ✅ Videos sorted by newest first
- ✅ Responsive design works

**Visual Check**:

- Thumbnails load properly
- No broken images
- Text doesn't overflow
- Progress bars render correctly
- Badges have proper colors

---

### Test 6: Public Profile View (Other Users) 👀

**Objective**: Verify anyone can see user's YouTube videos

**Steps**:

1. Sign out or use different account
2. Navigate to test user's profile
3. Scroll to YouTube Videos section

**Expected Results**:

- ✅ Upload form NOT visible (only gallery)
- ✅ Gallery displays submitted videos
- ✅ All public information visible:
  - Video titles
  - Thumbnails
  - View counts
  - PXP earned
  - Milestones achieved
- ✅ Can click to watch on YouTube

---

### Test 7: Unauthenticated Access ❌

**Objective**: Verify authentication required for submission

**Steps**:

1. Sign out completely
2. Navigate to any profile page
3. Look for upload form

**Expected Results**:

- ✅ Upload form NOT shown
- ✅ Gallery may or may not show (depends on profile settings)
- ✅ Attempting API call directly returns 401 Unauthorized

**Test API Directly**:

```bash
curl -X POST http://localhost:3000/api/content/youtube/submit \
  -H "Content-Type: application/json" \
  -d '{"youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# Expected: {"success": false, "error": "Authentication required..."}
```

---

### Test 8: Multiple Videos Per User 📚

**Objective**: Verify users can submit multiple videos

**Steps**:

1. Submit 5 different YouTube videos
2. Check gallery updates
3. Verify PXP accumulation

**Expected Results**:

- ✅ All 5 videos appear in gallery
- ✅ Each video has unique entry
- ✅ Total PXP = 500 (5 × 100)
- ✅ No interference between submissions
- ✅ Videos maintain individual state

---

### Test 9: YouTube API Integration (Optional) 🔑

**Prerequisites**: `YOUTUBE_API_KEY` configured in `.env`

**Objective**: Verify view count fetching works

**Steps**:

1. Find test video's ID in database:
   ```sql
   SELECT id, "youtubeId", "viewCount" FROM "YouTubeVideo" LIMIT 1;
   ```
2. Manually call milestone endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/content/youtube/check-milestones \
     -H "Authorization: Bearer YOUR_CRON_SECRET" \
     -H "Content-Type: application/json"
   ```
3. Check response

**Expected Results**:

- ✅ Response shows:
  ```json
  {
    "success": true,
    "videosChecked": 1,
    "milestonesAwarded": 0,
    "pxpAwarded": 0,
    "errors": [],
    "timestamp": "..."
  }
  ```
- ✅ Database updated with current view count:
  ```sql
  SELECT "youtubeId", "viewCount", "lastChecked" FROM "YouTubeVideo";
  -- viewCount should be updated from YouTube
  -- lastChecked should be current timestamp
  ```

---

### Test 10: Milestone PXP Awards (Advanced) 🏆

**Prerequisites**:

- YouTube API configured
- Test video with 1,000+ views OR mock data

**Objective**: Verify milestone PXP awarded correctly

**Test 1K Milestone**:

1. Update test video to have 1,000+ views:
   ```sql
   UPDATE "YouTubeVideo"
   SET "viewCount" = 1500, "verified" = true, "status" = 'APPROVED'
   WHERE id = YOUR_VIDEO_ID;
   ```
2. Run milestone check:
   ```bash
   curl -X POST http://localhost:3000/api/content/youtube/check-milestones \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```
3. Verify results

**Expected**:

- ✅ Response shows `milestonesAwarded: 1`, `pxpAwarded: 150`
- ✅ Database updated:
  ```sql
  SELECT "milestone1kAwarded", "pxpAwarded" FROM "YouTubeVideo" WHERE id = YOUR_VIDEO_ID;
  -- milestone1kAwarded: true
  -- pxpAwarded: 250 (100 + 150)
  ```
- ✅ User PXP increased by 150:
  ```sql
  SELECT "totalCAVEarned" FROM "User" WHERE id = YOUR_USER_ID;
  -- Should be +150 from before
  ```

**Test 10K Milestone**:

1. Update video to 10,000+ views:
   ```sql
   UPDATE "YouTubeVideo"
   SET "viewCount" = 12000
   WHERE id = YOUR_VIDEO_ID;
   ```
2. Run milestone check again
3. Verify +200 PXP awarded

---

### Test 11: Progress Bar Visualization 📊

**Objective**: Verify progress bars show correct percentage

**Test Cases**:

**A. 0 views (new video)**:

- Progress bar: 0%
- Label: "0 / 1,000 views"
- Next reward: "150 PXP at 1K views"

**B. 500 views (halfway to 1K)**:

- Progress bar: 50%
- Label: "500 / 1,000 views"
- Same next reward

**C. 1,500 views (passed 1K, working toward 10K)**:

- 1K milestone badge shows: "1K ✓"
- Progress bar: 15%
- Label: "1,500 / 10,000 views"
- Next reward: "200 PXP at 10K views"

**D. 12,000 views (all milestones reached)**:

- Both badges show: "1K ✓" and "10K ✓"
- Progress bar: 100%
- Label: "All milestones reached!"
- Green color

**Update Test Data**:

```sql
-- Test various view counts
UPDATE "YouTubeVideo" SET "viewCount" = 500 WHERE id = 1;  -- 50%
UPDATE "YouTubeVideo" SET "viewCount" = 1500, "milestone1kAwarded" = true WHERE id = 2;  -- 15%
UPDATE "YouTubeVideo" SET "viewCount" = 12000, "milestone1kAwarded" = true, "milestone10kAwarded" = true WHERE id = 3;  -- 100%
```

---

### Test 12: Error Handling & Edge Cases 🛡️

**Test PXP Award Failure**:

- Simulate database error during PXP award
- Video submission should still succeed
- Error logged but not shown to user

**Test YouTube API Failure** (with API key):

- Invalid API key or quota exceeded
- Milestone check should handle gracefully
- Return error in response, don't crash

**Test Long Video Titles**:

- Submit video with very long title
- Verify truncation works (2 lines max)
- No layout breaking

**Test Missing Thumbnail**:

- Video without thumbnail
- Placeholder icon should show
- No broken images

---

## Console Log Verification

Expected logs during successful submission:

```javascript
// Backend (API route)
🚀 About to submit video: { youtubeId: "...", title: "..." }
✅ Awarded 100 PXP to user 123 for YouTube video submission
// OR for first PXP:
✅ Awarded 100 PXP to user 123 for YouTube video submission (FIRST PXP!)

// Frontend (component)
Video submitted: { id: 456, youtubeId: "...", ... }
// If first PXP:
🎉 First PXP earned! Showing celebration toast
```

Expected logs during milestone check:

```javascript
🔄 Starting YouTube view count check...
🎉 Video "Amazing Piano Performance" reached 1,000 views!
✅ Awarded 150 PXP to user 123 for 1k views milestone on video 456
✅ View count check complete:
  - Videos checked: 10
  - Milestones awarded: 2
  - Total PXP awarded: 350
  - Errors: 0
```

---

## API Endpoint Testing

### POST /api/content/youtube/submit

**Valid Request**:

```bash
curl -X POST http://localhost:3000/api/content/youtube/submit \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{"youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

**Expected Response (201)**:

```json
{
  "success": true,
  "video": {
    "id": 1,
    "youtubeId": "dQw4w9WgXcQ",
    "title": "Rick Astley - Never Gonna Give You Up",
    "channelName": "Rick Astley",
    "thumbnailUrl": "...",
    "pxpAwarded": 100,
    "status": "PENDING"
  },
  "pxpEarned": 100,
  "showFirstPXPToast": false,
  "message": "Video submitted successfully! You earned 100 PXP. Verify channel ownership to unlock view milestone rewards."
}
```

### GET /api/content/youtube/submit

**Request**:

```bash
curl http://localhost:3000/api/content/youtube/submit?limit=10 \
  -H "Cookie: auth_token=YOUR_TOKEN"
```

**Expected Response (200)**:

```json
{
  "success": true,
  "videos": [
    {
      "id": 1,
      "youtubeId": "...",
      "title": "...",
      "viewCount": 1234,
      "pxpAwarded": 100,
      "milestone1kAwarded": true,
      "milestone10kAwarded": false,
      "verified": false,
      "status": "PENDING"
    }
  ],
  "totalCount": 5,
  "hasMore": false,
  "pagination": {
    "limit": 10,
    "offset": 0,
    "currentPage": 1,
    "totalPages": 1
  }
}
```

### POST /api/content/youtube/check-milestones

**Request** (requires auth):

```bash
curl -X POST http://localhost:3000/api/content/youtube/check-milestones \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected Response (200)**:

```json
{
  "success": true,
  "videosChecked": 10,
  "milestonesAwarded": 2,
  "pxpAwarded": 350,
  "errors": [],
  "timestamp": "2025-12-28T12:00:00.000Z"
}
```

### GET /api/content/youtube/check-milestones

**Request**:

```bash
curl http://localhost:3000/api/content/youtube/check-milestones
```

**Expected Response (200)**:

```json
{
  "success": true,
  "configured": false,
  "videosEligible": 5,
  "nextMilestones": [
    {
      "videoId": 1,
      "youtubeId": "...",
      "title": "...",
      "currentViews": 950,
      "nextMilestone": {
        "type": "1k",
        "viewsNeeded": 50,
        "pxpReward": 150
      },
      "user": "John Doe"
    }
  ],
  "message": "YouTube milestone tracking requires YOUTUBE_API_KEY environment variable"
}
```

---

## Performance Testing

### Load Testing

**Test 1: Concurrent Submissions**:

- Submit 10 videos simultaneously
- All should succeed
- No race conditions in PXP awarding
- Database handles concurrent writes

**Test 2: Gallery with Many Videos**:

- User with 50+ videos
- Gallery should load within 2 seconds
- Pagination works correctly
- No memory leaks

**Test 3: Milestone Check Performance**:

- 100 videos eligible for checking
- Cron job completes within 2 minutes
- YouTube API quota not exceeded
- Database updates batched

---

## Success Criteria

**✅ Feature Ready for Production When**:

1. **Basic Functionality**:
   - [ ] Users can submit YouTube videos
   - [ ] 100 PXP awarded immediately
   - [ ] Videos appear in gallery
   - [ ] Duplicate detection works

2. **First PXP Toast**:
   - [ ] Shows for first-time earners
   - [ ] Auto-dismisses after 8 seconds
   - [ ] Never shows again for same user

3. **Error Handling**:
   - [ ] Invalid URLs rejected gracefully
   - [ ] Duplicates prevented
   - [ ] API errors don't break submissions

4. **Display & UI**:
   - [ ] Gallery renders correctly
   - [ ] Thumbnails load
   - [ ] Progress bars accurate
   - [ ] Responsive design works

5. **Milestone System** (if API configured):
   - [ ] View counts update
   - [ ] 1K milestone awards 150 PXP
   - [ ] 10K milestone awards 200 PXP
   - [ ] Badges display correctly

6. **Security**:
   - [ ] Authentication required
   - [ ] Rate limiting enforced
   - [ ] Cron endpoint protected

---

## Known Issues & Limitations

1. **YouTube API Quota**:
   - Free tier: 10,000 units/day
   - Each video check: ~1 unit
   - Max ~200 videos/day
   - Solution: Increase quota or limit checks

2. **View Count Accuracy**:
   - YouTube API updates hourly
   - Some delay in milestone detection
   - Not critical for rewards

3. **OAuth Verification** (Not Implemented):
   - Cannot verify channel ownership
   - Users could submit others' videos
   - Future enhancement

4. **Manual Review** (Not Implemented):
   - No admin approval workflow
   - All submissions auto-approved
   - Consider for production

---

## Troubleshooting

**Problem**: Video submission fails with "Failed to fetch video information"

- **Cause**: YouTube video is private, deleted, or region-locked
- **Solution**: Use a different public video

**Problem**: PXP not awarded

- **Check**: Console logs for errors
- **Check**: Database user record
- **Verify**: Transaction didn't silently fail

**Problem**: Toast doesn't appear

- **Check**: Is this truly first PXP? (`firstPXPEarnedAt` should be NULL before)
- **Check**: Browser console for errors
- **Verify**: Response includes `showFirstPXPToast: true`

**Problem**: Gallery not loading

- **Check**: Browser console for 401 errors (auth issue)
- **Check**: Network tab for failed API calls
- **Verify**: User ID matches profile

**Problem**: Milestone PXP not awarded

- **Check**: `YOUTUBE_API_KEY` configured
- **Check**: Video is `verified: true` and `status: APPROVED`
- **Check**: Cron secret matches
- **Run**: Manual milestone check to debug

---

## Next Steps After Testing

1. **Deploy to Staging**:
   - Test with real YouTube videos
   - Monitor API quota usage
   - Gather user feedback

2. **Set Up Cron Job**:
   - Vercel Cron (recommended)
   - External scheduler (Render, Railway)
   - Run every 6-12 hours

3. **Monitor Analytics**:
   - Track submission rate
   - Monitor PXP distribution
   - Check milestone achievement rate

4. **Consider Enhancements**:
   - OAuth channel verification
   - Admin review workflow
   - Notification system
   - Video categories/tags

---

**Document Version**: 1.0
**Last Updated**: 2025-12-28
**Test Status**: ⏳ Ready for Manual Testing
**Build Status**: ✅ Successful
