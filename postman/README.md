# Postman QA Testing - Piano Blog API

Quick start guide for testing all Piano Blog APIs using Postman Free Tier.

## Quick Import (< 2 minutes)

### Step 1: Import Collection

1. Open Postman Desktop or Web
2. Click **Import** button (top left)
3. Drag and drop `Piano_Blog_API_Tests.postman_collection.json`
4. Click **Import**

### Step 2: Import Environment

1. Click **Environments** tab (left sidebar)
2. Click **Import** button
3. Drag and drop `Piano_Blog_Environment.postman_environment.json`
4. Click **Import**

### Step 3: Configure Environment

1. Select **Piano Blog - Production** environment (dropdown, top right)
2. Click the eye icon to edit variables
3. Update `baseUrl` to your Vercel deployment URL:
   ```
   https://your-app-name.vercel.app
   ```
4. Save changes

## Running Tests

### Quick Test Run (5 minutes)

Run tests in this order to verify core functionality:

1. **Authentication** → `1.1 User Signup`
   - Creates test user, captures auth token

2. **Referral System** → `2.1 Generate Referral Code`
   - Generates unique referral code

3. **Referral Stats** → `2.2 Get Referral Stats`
   - Verifies initial stats are 0

4. **Admin Config** → `3.1 Get PXP Config`
   - Requires BLOG_OWNER or ADMIN role

### Full Test Suite (45 minutes)

Use Postman Collection Runner:

1. Select **Piano Blog API Tests** collection
2. Click **Run** button
3. Select **Piano Blog - Production** environment
4. Click **Run Piano Blog API Tests**
5. Watch test results in real-time

See `POSTMAN_QA_GUIDE.md` for detailed test scenarios and manual verification steps.

## Test Coverage

- **Authentication**: Signup, login, token management
- **Referral System**: Code generation, tracking, stats, PXP distribution
- **PXP Configuration**: Admin CRUD operations for reward amounts
- **Profile & Rewards**: Profile completion triggers
- **Events & RSVPs**: Event attendance tracking
- **YouTube Integration**: Video submission and milestones

## Expected Results

All tests should pass with green checkmarks. Key validations:

- ✅ Status codes (200, 201 for success)
- ✅ Response structure (success flag, data fields)
- ✅ Referral code format (PIANIST#####)
- ✅ PXP reward amounts match config
- ✅ Environment variables auto-populate (authToken, userId, referralCode)

## Troubleshooting

### "401 Unauthorized" errors

- Check that auth token is set in environment
- Re-run `1.2 User Login` to refresh token
- Verify cookies are enabled in Postman settings

### "403 Forbidden" on admin endpoints

- Test user needs BLOG_OWNER or ADMIN role
- Manually update user role in database:
  ```sql
  UPDATE "User" SET role = 'ADMIN' WHERE username = 'test_user_001';
  ```

### Referral code not generating

- User may already have a referral code
- Check `2.2 Get Referral Stats` to see existing code
- Or run `DELETE FROM "User" WHERE username = 'test_user_001'` to reset

### Tests failing after first run

- Some tests create one-time data (user signup, referral tracking)
- Clean up test data between runs:
  ```sql
  DELETE FROM "User" WHERE username LIKE 'test_%' OR username LIKE 'referred_%';
  DELETE FROM "EventRSVP" WHERE notes = 'Looking forward to it!';
  ```

## Test Data Cleanup

After QA testing, remove test data:

```sql
-- Delete test users
DELETE FROM "User" WHERE username IN ('test_user_001', 'referred_user_001');

-- Reset PXP config to production values (if modified)
UPDATE "PXPConfig" SET value = 50 WHERE key = 'referral_profile_created';
UPDATE "PXPConfig" SET value = 100 WHERE key = 'referral_first_event';
```

## Next Steps

1. Run quick test run to verify setup
2. Review `POSTMAN_QA_GUIDE.md` for detailed test scenarios
3. Set up Collection Runner for automated regression testing
4. Export test results for documentation

## Support

For detailed API documentation and test scenarios, see:

- `POSTMAN_QA_GUIDE.md` - Full testing guide with all test cases
- `Piano_Blog_API_Tests.postman_collection.json` - Complete collection with test scripts
- `/docs/` - API endpoint documentation (if available)
