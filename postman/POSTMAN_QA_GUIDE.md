# Postman QA Testing Guide - Piano Blog

## Setup (Postman Free Tier)

### 1. Create Collection

- Collection Name: `Piano Blog API Tests`
- Base URL Variable: `{{baseUrl}}` = `https://your-domain.vercel.app`

### 2. Environment Variables

Create environment: `Piano Blog - Production`

Variables:

```
baseUrl = https://your-production-url.vercel.app
authToken = (will be set after login)
testUsername = test_user_001
testPassword = TestPass123!
testEmail = test@example.com
referralCode = (will be set after generating)
userId = (will be set after signup)
eventId = (existing event ID for testing)
venueId = (existing venue ID for testing)
```

---

## Test Suite 1: Authentication & User Management

### Test 1.1: User Signup (POST /api/auth/signup)

**Purpose:** Create new test user and capture auth token

**Request:**

```json
POST {{baseUrl}}/api/auth/signup
Content-Type: application/json

{
  "username": "{{testUsername}}",
  "password": "{{testPassword}}",
  "email": "{{testEmail}}",
  "displayName": "Test User"
}
```

**Tests (Postman Tests tab):**

```javascript
pm.test('Status code is 201', function () {
  pm.response.to.have.status(201)
})

pm.test('Response has user and token', function () {
  var jsonData = pm.response.json()
  pm.expect(jsonData.success).to.eql(true)
  pm.expect(jsonData.user).to.exist
  pm.expect(jsonData.token).to.exist

  // Save token and userId for future requests
  pm.environment.set('authToken', jsonData.token)
  pm.environment.set('userId', jsonData.user.id)
})

pm.test('User has correct username', function () {
  var jsonData = pm.response.json()
  pm.expect(jsonData.user.username).to.eql(pm.environment.get('testUsername'))
})
```

**Expected Result:**

- ✅ Status 201
- ✅ Returns user object with id, username, role
- ✅ Returns JWT token
- ✅ Sets auth cookie

---

### Test 1.2: User Login (POST /api/auth/login)

**Purpose:** Verify login works and refreshes token

**Request:**

```json
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "username": "{{testUsername}}",
  "password": "{{testPassword}}"
}
```

**Tests:**

```javascript
pm.test('Login successful', function () {
  pm.response.to.have.status(200)
  var jsonData = pm.response.json()
  pm.expect(jsonData.success).to.eql(true)
  pm.expect(jsonData.token).to.exist
  pm.environment.set('authToken', jsonData.token)
})
```

---

## Test Suite 2: Referral System

### Test 2.1: Generate Referral Code (POST /api/user/referral/generate)

**Purpose:** Generate unique referral code for user

**Request:**

```json
POST {{baseUrl}}/api/user/referral/generate
Cookie: auth_token={{authToken}}
```

**Tests:**

```javascript
pm.test('Referral code generated', function () {
  pm.response.to.have.status(200)
  var jsonData = pm.response.json()
  pm.expect(jsonData.success).to.eql(true)
  pm.expect(jsonData.referralCode).to.exist
  pm.expect(jsonData.referralCode).to.match(/^PIANIST\d{5}$/)

  // Save for later tests
  pm.environment.set('referralCode', jsonData.referralCode)
})

pm.test('Share URL is valid', function () {
  var jsonData = pm.response.json()
  pm.expect(jsonData.shareUrl).to.include('/signup?ref=')
})
```

**Expected Result:**

- ✅ Status 200
- ✅ referralCode format: PIANIST12345
- ✅ shareUrl contains referral parameter

---

### Test 2.2: Get Referral Stats (GET /api/user/referral/stats)

**Purpose:** Retrieve user's referral statistics

**Request:**

```json
GET {{baseUrl}}/api/user/referral/stats
Cookie: auth_token={{authToken}}
```

**Tests:**

```javascript
pm.test('Referral stats retrieved', function () {
  pm.response.to.have.status(200)
  var jsonData = pm.response.json()
  pm.expect(jsonData.success).to.eql(true)
  pm.expect(jsonData.stats).to.exist
  pm.expect(jsonData.stats.totalReferrals).to.be.a('number')
  pm.expect(jsonData.stats.totalPXPEarned).to.be.a('number')
  pm.expect(jsonData.referrals).to.be.an('array')
})

pm.test('Config values exist', function () {
  var jsonData = pm.response.json()
  pm.expect(jsonData.config.profileCreated).to.be.above(0)
  pm.expect(jsonData.config.firstEvent).to.be.above(0)
  pm.expect(jsonData.config.maxPerUser).to.be.above(0)
})
```

**Expected Result:**

- ✅ Status 200
- ✅ Returns stats object with counts and PXP
- ✅ Returns array of referred users
- ✅ Returns config with reward amounts

---

### Test 2.3: Signup with Referral Code (POST /api/auth/signup)

**Purpose:** Verify referral tracking on signup

**Request:**

```json
POST {{baseUrl}}/api/auth/signup
Content-Type: application/json

{
  "username": "referred_user_001",
  "password": "RefTest123!",
  "email": "referred@example.com",
  "displayName": "Referred User",
  "referralCode": "{{referralCode}}"
}
```

**Tests:**

```javascript
pm.test('Referred user created', function () {
  pm.response.to.have.status(201)
  var jsonData = pm.response.json()
  pm.expect(jsonData.success).to.eql(true)
  pm.environment.set('referredUserId', jsonData.user.id)
  pm.environment.set('referredAuthToken', jsonData.token)
})
```

**Manual Verification:**

- Check referrer's stats (Test 2.2) - totalReferrals should increment
- Check referrer sees new user in referrals array

---

## Test Suite 3: PXP Configuration (Admin Only)

### Test 3.1: Get PXP Config (GET /api/admin/pxp-config-db)

**Purpose:** Retrieve all configurable PXP rewards

**Pre-requisite:** User must have BLOG_OWNER or ADMIN role

**Request:**

```json
GET {{baseUrl}}/api/admin/pxp-config-db
Cookie: auth_token={{authToken}}
```

**Tests:**

```javascript
pm.test('PXP config retrieved', function () {
  pm.response.to.have.status(200)
  var jsonData = pm.response.json()
  pm.expect(jsonData.success).to.eql(true)
  pm.expect(jsonData.configs).to.be.an('array')
  pm.expect(jsonData.configs.length).to.be.above(0)
})

pm.test('Config has required fields', function () {
  var jsonData = pm.response.json()
  var config = jsonData.configs[0]
  pm.expect(config).to.have.property('key')
  pm.expect(config).to.have.property('value')
  pm.expect(config).to.have.property('label')
  pm.expect(config).to.have.property('category')
  pm.expect(config).to.have.property('enabled')
})

pm.test('Grouped configs exist', function () {
  var jsonData = pm.response.json()
  pm.expect(jsonData.groupedConfigs).to.exist
  pm.expect(jsonData.groupedConfigs.referral).to.exist
  pm.expect(jsonData.groupedConfigs.youtube).to.exist
})
```

**Expected Result:**

- ✅ Status 200 (or 403 if not admin)
- ✅ Returns array of all PXP configs
- ✅ Grouped by category (referral, youtube, event, community)

---

### Test 3.2: Update PXP Config (POST /api/admin/pxp-config-db)

**Purpose:** Update PXP reward amounts

**Request:**

```json
POST {{baseUrl}}/api/admin/pxp-config-db
Cookie: auth_token={{authToken}}
Content-Type: application/json

{
  "updates": [
    {
      "key": "referral_profile_created",
      "value": 75,
      "enabled": true
    },
    {
      "key": "referral_first_event",
      "value": 150,
      "enabled": true
    }
  ]
}
```

**Tests:**

```javascript
pm.test('Config updated successfully', function () {
  pm.response.to.have.status(200)
  var jsonData = pm.response.json()
  pm.expect(jsonData.success).to.eql(true)
  pm.expect(jsonData.updated).to.eql(2)
})

pm.test('Updated values match', function () {
  var jsonData = pm.response.json()
  var config1 = jsonData.configs.find((c) => c.key === 'referral_profile_created')
  pm.expect(config1.value).to.eql(75)
})
```

**Manual Verification:**

- Run Test 3.1 again to verify values persisted
- Check admin UI at /admin/pxp-rewards

---

## Test Suite 4: Profile & Rewards

### Test 4.1: Update Profile (PATCH /api/profile/[address])

**Purpose:** Complete profile and trigger PXP rewards

**Request:**

```json
PATCH {{baseUrl}}/api/profile/{{testUsername}}
Content-Type: application/json

{
  "requesterAddress": "{{testUsername}}",
  "displayName": "Test User Updated",
  "bio": "Test bio for QA",
  "title": "Pianist",
  "skills": ["Piano", "Jazz"],
  "location": "Test City",
  "profileCompleted": true
}
```

**Tests:**

```javascript
pm.test('Profile updated', function () {
  pm.response.to.have.status(200)
  var jsonData = pm.response.json()
  pm.expect(jsonData.user.profileCompleted).to.eql(true)
  pm.expect(jsonData.user.displayName).to.eql('Test User Updated')
})

// Note: PXP award happens in background
pm.test('Profile completion timestamp set', function () {
  var jsonData = pm.response.json()
  pm.expect(jsonData.user.profileCompletedAt).to.exist
})
```

**Manual Verification:**

- Check user's totalCAVEarned increased by 30 PXP
- If user was referred, check referrer's PXP increased by 50

---

## Test Suite 5: Events & RSVPs

### Test 5.1: Create Event RSVP (POST /api/events/[id]/rsvp)

**Purpose:** RSVP to event and trigger attendance PXP

**Request:**

```json
POST {{baseUrl}}/api/events/{{eventId}}/rsvp
Content-Type: application/json

{
  "userAddress": "{{testUsername}}",
  "status": "CONFIRMED",
  "attendeeCount": 1,
  "notes": "Looking forward to it!"
}
```

**Tests:**

```javascript
pm.test('RSVP created', function () {
  pm.response.to.have.status(200)
  var jsonData = pm.response.json()
  pm.expect(jsonData.rsvp).to.exist
  pm.expect(jsonData.rsvp.status).to.be.oneOf(['CONFIRMED', 'PENDING'])
})

pm.test('RSVP has user details', function () {
  var jsonData = pm.response.json()
  pm.expect(jsonData.rsvp.user).to.exist
  pm.expect(jsonData.rsvp.event).to.exist
})
```

**Manual Verification:**

- Check user's PXP increased by 25 (event_attend reward)
- If first event for referred user, referrer gets 100 PXP

---

## Test Suite 6: YouTube Video Submission

### Test 6.1: Submit YouTube Video (POST /api/content/youtube/submit)

**Purpose:** Link YouTube video to event for PXP rewards

**Request:**

```json
POST {{baseUrl}}/api/content/youtube/submit
Content-Type: application/json
Cookie: auth_token={{authToken}}

{
  "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "eventId": {{eventId}},
  "title": "Test Performance",
  "description": "Test video for QA"
}
```

**Tests:**

```javascript
pm.test('Video submitted', function () {
  pm.response.to.have.status(200)
  var jsonData = pm.response.json()
  pm.expect(jsonData.success).to.eql(true)
  pm.expect(jsonData.video).to.exist
  pm.expect(jsonData.video.youtubeId).to.exist
})
```

---

## QA Test Execution Plan

### Phase 1: Authentication Flow (5 min)

1. Run Test 1.1 - Signup
2. Run Test 1.2 - Login
3. Verify auth token is saved in environment

### Phase 2: Referral System (10 min)

1. Run Test 2.1 - Generate referral code
2. Run Test 2.2 - Get initial stats (should be 0)
3. Run Test 2.3 - Signup with referral code
4. Run Test 2.2 again - Verify totalReferrals = 1

### Phase 3: Profile & PXP Rewards (10 min)

1. Run Test 4.1 as referred user - Complete profile
2. Check referrer's stats - Should earn 50 PXP
3. Check user's PXP - Should earn 30 PXP

### Phase 4: Event Participation (10 min)

1. Run Test 5.1 - RSVP to event
2. Check user's PXP - Should earn 25 PXP
3. If first event for referred user, check referrer earned 100 PXP

### Phase 5: Admin Functions (5 min)

1. Run Test 3.1 - Get PXP config
2. Run Test 3.2 - Update config values
3. Verify changes in admin UI

### Phase 6: YouTube Integration (5 min)

1. Run Test 6.1 - Submit video
2. Verify video appears in gallery
3. Check milestone tracking cron logs

---

## Success Criteria

✅ All authentication tests pass
✅ Referral tracking works end-to-end
✅ PXP rewards distributed correctly
✅ Admin can modify PXP configuration
✅ Event RSVPs trigger rewards
✅ YouTube video submission works

---

## Test Data Cleanup

After testing, clean up test data:

1. Delete test users from database
2. Reset PXP config to production values
3. Remove test RSVPs
4. Archive test videos

---

## Postman Collection Export

Save this collection as JSON and import into Postman Free tier.
Collection includes:

- 15 API endpoint tests
- Environment variables template
- Pre-request scripts for auth
- Test assertions for validation

**Total estimated QA time:** 45 minutes for full suite
