# Testing Guide - Role-Based Access Control

This guide explains how to test different user roles and behaviors in the Piano Blog application.

## Table of Contents

1. [How to Logout/Disconnect](#how-to-logoutdisconnect)
2. [How to Switch Accounts](#how-to-switch-accounts)
3. [Testing Different User Roles](#testing-different-user-roles)
4. [Creating Test Accounts](#creating-test-accounts)
5. [Quick Testing Scripts](#quick-testing-scripts)
6. [Common Testing Scenarios](#common-testing-scenarios)

---

## How to Logout/Disconnect

### Option 1: Using the UI (Recommended)

The WalletConnection component provides a "Disconnect" button when connected:

1. Look for the green checkmark with your wallet address (e.g., `✅ 0x1234...5678`)
2. Click **"Disconnect"** button next to your address
3. Your wallet is now disconnected, and all permissions are cleared

**Where to find the Disconnect button:**

- Curator Dashboard (`/curator`)
- Account Settings page
- Any page using the `<WalletConnection />` component

### Option 2: Using Browser Console

```javascript
// Open browser console (F12) and run:
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Option 3: MetaMask Disconnect

1. Open MetaMask extension
2. Click the three dots (⋮) menu
3. Select "Connected sites"
4. Find "localhost:3000" (or your domain)
5. Click "Disconnect"

---

## How to Switch Accounts

### Method 1: Using the "Switch" Button (Easiest)

The WalletConnection component has a built-in account switcher:

1. Look for your connected address
2. Click **"Switch"** button
3. MetaMask will prompt you to select a different account
4. Permissions will automatically reload for the new account

### Method 2: Using MetaMask Directly

1. Open MetaMask extension
2. Click on the account dropdown (top right)
3. Select a different account
4. The app will automatically detect the change and update permissions

### Method 3: Import a New Test Account

1. Open MetaMask
2. Click account dropdown → "Add account or hardware wallet"
3. Choose "Add a new Ethereum account" or "Import account"
4. If importing, enter the private key (see [Creating Test Accounts](#creating-test-accounts))

---

## Testing Different User Roles

### Current Roles in Piano Blog

```
BLOG_OWNER  → Full admin access (manage curators, create events, edit venues)
CURATOR     → Can create events, edit venues, access curator dashboard
VALIDATOR   → Can validate venues
SCOUT       → Can submit venues, RSVP to events, refer users (default role)
```

### Testing as Different Roles

#### Testing as SCOUT (Default Behavior)

**Option 1: Use a new wallet address**

1. Create a new MetaMask account (it will default to SCOUT role)
2. Connect with that account
3. The user will automatically have SCOUT role

**Option 2: Demote your current account**

1. Login as BLOG_OWNER
2. Go to `/admin/curators`
3. Remove your test account from curators (demotes to SCOUT)
4. Disconnect and reconnect to refresh permissions

**What to test as SCOUT:**

- ✅ Can submit new venues
- ✅ Can RSVP to events
- ✅ Can refer other users
- ❌ Cannot create events (should see permission error)
- ❌ Cannot access `/curator` dashboard
- ❌ Cannot edit venues

#### Testing as CURATOR

**Setup:**

1. Login as BLOG_OWNER
2. Go to `/admin/curators`
3. Add the test wallet address as a curator
4. Disconnect and reconnect (or refresh page) to reload permissions

**What to test as CURATOR:**

- ✅ Can create events (`/events/create`)
- ✅ Can access curator dashboard (`/curator`)
- ✅ Can edit venues
- ✅ Can submit venues
- ❌ Cannot manage curators (BLOG_OWNER only)

#### Testing as BLOG_OWNER

**Setup:**
Your wallet must match `NEXT_PUBLIC_BLOG_OWNER_ADDRESS` in `.env.local`

**What to test as BLOG_OWNER:**

- ✅ All CURATOR permissions
- ✅ Can manage curators (`/admin/curators`)
- ✅ Can delete venues
- ✅ Full admin access

#### Testing as VALIDATOR

**Setup:**

1. Run database migration to set a user as VALIDATOR:

```bash
node scripts/set-user-role.mjs <wallet-address> VALIDATOR
```

**What to test as VALIDATOR:**

- ✅ Can validate venues
- ✅ Can access validator dashboard
- ❌ Cannot create events (CURATOR only)

---

## Creating Test Accounts

### Method 1: Generate New MetaMask Accounts

MetaMask can generate unlimited accounts for testing:

1. Open MetaMask
2. Click account dropdown → "Add account"
3. Name it (e.g., "Test Scout", "Test Curator")
4. Copy the address

**Test Account Addresses (Example):**

```
Blog Owner:  0xYourMainAddress (set in .env.local)
Test Scout:  0xNewAccount1
Test Curator: 0xNewAccount2
Test Validator: 0xNewAccount3
```

### Method 2: Use Database Script to Create Test Users

Create a script to seed test users:

**File:** `scripts/create-test-users.mjs`

```javascript
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestUsers() {
  const testUsers = [
    {
      walletAddress: '0x1111111111111111111111111111111111111111',
      username: 'test-scout',
      displayName: 'Test Scout',
      role: UserRole.SCOUT,
    },
    {
      walletAddress: '0x2222222222222222222222222222222222222222',
      username: 'test-curator',
      displayName: 'Test Curator',
      role: UserRole.CURATOR,
      isAuthorizedVerifier: true,
    },
    {
      walletAddress: '0x3333333333333333333333333333333333333333',
      username: 'test-validator',
      displayName: 'Test Validator',
      role: UserRole.VALIDATOR,
    },
  ]

  for (const userData of testUsers) {
    const user = await prisma.user.upsert({
      where: { walletAddress: userData.walletAddress },
      update: userData,
      create: userData,
    })
    console.log(`✅ Created/Updated: ${user.username} (${user.role})`)
  }

  console.log('\n📊 Current user distribution:')
  const roleStats = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
  })
  roleStats.forEach((stat) => {
    console.log(`  ${stat.role}: ${stat._count} users`)
  })
}

createTestUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

**Run it:**

```bash
node scripts/create-test-users.mjs
```

### Method 3: Import Test Accounts to MetaMask

Use the test account addresses created above and import them:

1. MetaMask → Account dropdown → "Import account"
2. Enter private key (⚠️ only use test keys, never real ones)
3. The account will appear in MetaMask

---

## Quick Testing Scripts

### Script: Change User Role

**File:** `scripts/set-user-role.mjs`

```javascript
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function setUserRole() {
  const [, , walletAddress, role] = process.argv

  if (!walletAddress || !role) {
    console.error('Usage: node scripts/set-user-role.mjs <wallet-address> <role>')
    console.error('Roles: BLOG_OWNER, CURATOR, VALIDATOR, SCOUT')
    process.exit(1)
  }

  if (!Object.values(UserRole).includes(role)) {
    console.error(`Invalid role: ${role}`)
    console.error('Valid roles:', Object.values(UserRole).join(', '))
    process.exit(1)
  }

  const normalizedAddress = walletAddress.toLowerCase()

  const user = await prisma.user.update({
    where: { walletAddress: normalizedAddress },
    data: {
      role: role,
      isAuthorizedVerifier: role === UserRole.CURATOR || role === UserRole.BLOG_OWNER,
    },
  })

  console.log(`✅ Updated ${user.username || user.walletAddress} to role: ${role}`)
}

setUserRole()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

**Usage:**

```bash
# Make yourself a curator
node scripts/set-user-role.mjs 0xYourAddress CURATOR

# Demote to scout
node scripts/set-user-role.mjs 0xYourAddress SCOUT

# Make validator
node scripts/set-user-role.mjs 0xYourAddress VALIDATOR
```

### Script: Check User Permissions

**File:** `scripts/check-user-permissions.mjs`

```javascript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkPermissions() {
  const [, , walletAddress] = process.argv

  if (!walletAddress) {
    console.error('Usage: node scripts/check-user-permissions.mjs <wallet-address>')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({
    where: { walletAddress: walletAddress.toLowerCase() },
    select: {
      id: true,
      username: true,
      displayName: true,
      walletAddress: true,
      role: true,
      isAuthorizedVerifier: true,
    },
  })

  if (!user) {
    console.log('❌ User not found in database')
    console.log('   Will default to SCOUT role')
    return
  }

  console.log('\n👤 User Information:')
  console.log(`   Username: ${user.username || 'Not set'}`)
  console.log(`   Display Name: ${user.displayName || 'Not set'}`)
  console.log(`   Wallet: ${user.walletAddress}`)
  console.log(`   Role: ${user.role}`)
  console.log(`   Authorized Verifier: ${user.isAuthorizedVerifier}`)

  console.log('\n🔐 Permissions:')
  console.log(`   Is Blog Owner: ${user.role === 'BLOG_OWNER' ? '✅' : '❌'}`)
  console.log(
    `   Is Curator: ${user.role === 'CURATOR' || user.role === 'BLOG_OWNER' ? '✅' : '❌'}`
  )
  console.log(
    `   Is Validator: ${user.role === 'VALIDATOR' || user.role === 'BLOG_OWNER' ? '✅' : '❌'}`
  )
  console.log(
    `   Can Create Events: ${user.role === 'CURATOR' || user.role === 'BLOG_OWNER' ? '✅' : '❌'}`
  )
  console.log(
    `   Can Edit Venues: ${user.role === 'CURATOR' || user.role === 'BLOG_OWNER' ? '✅' : '❌'}`
  )
  console.log(`   Can Manage Curators: ${user.role === 'BLOG_OWNER' ? '✅' : '❌'}`)
}

checkPermissions()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

**Usage:**

```bash
node scripts/check-user-permissions.mjs 0xYourAddress
```

---

## Common Testing Scenarios

### Scenario 1: Blog Owner wants to test Scout behavior

**Steps:**

1. Note your current wallet address
2. Create a new MetaMask account (it defaults to SCOUT)
3. Switch to the new account using the "Switch" button
4. Test scout features (submit venue, cannot create events)
5. Switch back to your original account when done

### Scenario 2: Test the Event Creation Permission Error

**Steps:**

1. Switch to a SCOUT account (or demote your account to SCOUT)
2. Navigate to `/events/create`
3. **Expected:** See yellow permission error:
   ```
   Permission Required
   Only curators and blog owners can create events.
   Your current role is: SCOUT
   ```
4. Verify the form is not shown

### Scenario 3: Test Curator Dashboard Access

**Steps:**

1. As SCOUT, navigate to `/curator`
2. **Expected:** See "Not Authorized" message
3. Switch to BLOG_OWNER or CURATOR account
4. Navigate to `/curator`
5. **Expected:** See full curator dashboard with venue list

### Scenario 4: Test API-Level Authorization

**Steps:**

1. Open browser DevTools → Network tab
2. As SCOUT, try to create an event via API:

```javascript
fetch('/api/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-wallet-address': '0xScoutAddress',
  },
  body: JSON.stringify({
    title: 'Test Event',
    description: 'Test',
    eventType: 'JAM_SESSION',
    venueId: 1,
    startDate: new Date(),
    endDate: new Date(),
    organizerAddress: '0xScoutAddress',
  }),
})
```

3. **Expected:** 403 Forbidden with error:
   ```json
   { "error": "Only curators and blog owners can create events" }
   ```

### Scenario 5: Test Role Change Persistence

**Steps:**

1. Login as BLOG_OWNER
2. Add a test address as CURATOR via `/admin/curators`
3. **Without disconnecting**, switch to that test address using MetaMask
4. Refresh the page
5. **Expected:** Permissions automatically update to CURATOR
6. Verify you can now access `/curator` and `/events/create`

---

## Troubleshooting

### Issue: Permissions not updating after role change

**Solution:**

1. Click "Disconnect" button
2. Reconnect your wallet
3. Permissions are fetched fresh on each connection

### Issue: Still see old permissions after switching accounts

**Solution:**

1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
2. Or clear localStorage: `localStorage.clear()` in console
3. Reconnect wallet

### Issue: "Disconnect" button not visible

**Solution:**

- Navigate to a page that shows `<WalletConnection />` component:
  - `/curator` (if you have access)
  - `/submit` (submit venue page)
  - `/account/settings`

### Issue: Cannot switch MetaMask accounts

**Solution:**

1. Disconnect from the site first (click "Disconnect")
2. Switch accounts in MetaMask
3. Click "Connect Wallet" again
4. MetaMask will connect with the currently selected account

---

## Developer Tips

### Quick Role Testing During Development

Add this to your `.env.local` for easier testing:

```bash
# Blog Owner (your main wallet)
NEXT_PUBLIC_BLOG_OWNER_ADDRESS=0xYourMainWallet

# Test Accounts (optional - for documentation)
TEST_SCOUT_ADDRESS=0x1111111111111111111111111111111111111111
TEST_CURATOR_ADDRESS=0x2222222222222222222222222222222222222222
TEST_VALIDATOR_ADDRESS=0x3333333333333333333333333333333333333333
```

### Browser Profile for Testing

Create separate browser profiles for each role:

1. **Chrome Profile: Blog Owner**
   - MetaMask with your main wallet
   - Always logged in as BLOG_OWNER

2. **Chrome Profile: Test Scout**
   - MetaMask with test scout account
   - Incognito mode also works

3. **Chrome Profile: Test Curator**
   - MetaMask with curator account

This way you can have multiple browsers open simultaneously to test multi-user interactions.

---

## Testing Checklist

### SCOUT Role Testing

- [ ] Can submit new venues
- [ ] Can RSVP to events
- [ ] Cannot create events (see permission error at `/events/create`)
- [ ] Cannot access curator dashboard (see "Not Authorized" at `/curator`)
- [ ] Cannot edit venues
- [ ] Cannot manage curators

### CURATOR Role Testing

- [ ] Can create events at `/events/create`
- [ ] Can access curator dashboard at `/curator`
- [ ] Can edit venues
- [ ] Can verify/reject venues
- [ ] Cannot manage curators (BLOG_OWNER only)

### BLOG_OWNER Role Testing

- [ ] Can do everything CURATOR can do
- [ ] Can manage curators at `/admin/curators`
- [ ] Can add curators
- [ ] Can remove curators
- [ ] Can delete venues

### Permission API Testing

- [ ] GET `/api/auth/permissions?address=<scout>` returns `role: SCOUT`
- [ ] GET `/api/auth/permissions?address=<curator>` returns `role: CURATOR`
- [ ] POST `/api/events` with SCOUT fails with 403
- [ ] POST `/api/events` with CURATOR succeeds

---

## Next Steps

After testing is complete, consider:

1. Removing test accounts from production database
2. Documenting any discovered bugs
3. Creating automated E2E tests for role-based permissions
4. Adding role switcher for development environment only
