# Testing Quick Reference

Quick commands and workflows for testing role-based access control.

## 🚀 Quick Start

### 1. Create Test Users

```bash
node scripts/create-test-users.mjs
```

Creates 3 test accounts: Scout, Curator, and Validator.

### 2. Check User Permissions

```bash
node scripts/check-user-permissions.mjs 0xYourAddress
```

Shows detailed permission breakdown for any wallet address.

### 3. Change User Role

```bash
node scripts/set-user-role.mjs 0xYourAddress CURATOR
node scripts/set-user-role.mjs 0xYourAddress SCOUT
node scripts/set-user-role.mjs 0xYourAddress VALIDATOR
```

---

## 🔄 How to Switch Users

### In the UI (Recommended)

1. Look for your wallet address (e.g., `✅ 0x1234...5678`)
2. Click **"Switch"** button
3. Select different MetaMask account
4. Permissions auto-reload

### Manual Method

1. Click **"Disconnect"** button
2. Switch account in MetaMask
3. Click **"Connect Wallet"**

---

## 🧪 Test Scenarios

### Test as SCOUT

```bash
# Create or use test account
node scripts/set-user-role.mjs 0xTestAddress SCOUT

# Expected behaviors:
✅ Can submit venues
✅ Can RSVP to events
❌ Cannot create events (permission error)
❌ Cannot access /curator
```

### Test as CURATOR

```bash
# Promote user to curator
node scripts/set-user-role.mjs 0xTestAddress CURATOR

# Expected behaviors:
✅ Can create events at /events/create
✅ Can access /curator dashboard
✅ Can edit venues
❌ Cannot manage curators (BLOG_OWNER only)
```

### Test as BLOG_OWNER

```bash
# Must match NEXT_PUBLIC_BLOG_OWNER_ADDRESS in .env.local
# Expected behaviors:
✅ All CURATOR permissions
✅ Can manage curators at /admin/curators
✅ Can delete venues
```

---

## 📋 Quick Permission Matrix

| Feature         | SCOUT | VALIDATOR | CURATOR | BLOG_OWNER |
| --------------- | ----- | --------- | ------- | ---------- |
| Submit Venues   | ✅    | ✅        | ✅      | ✅         |
| RSVP Events     | ✅    | ✅        | ✅      | ✅         |
| Refer Users     | ✅    | ✅        | ✅      | ✅         |
| Create Events   | ❌    | ❌        | ✅      | ✅         |
| Edit Venues     | ❌    | ❌        | ✅      | ✅         |
| Validate Venues | ❌    | ✅        | ❌      | ✅         |
| Access /curator | ❌    | ❌        | ✅      | ✅         |
| Manage Curators | ❌    | ❌        | ❌      | ✅         |
| Delete Venues   | ❌    | ❌        | ❌      | ✅         |

---

## 🔍 Debug Checklist

### Permissions Not Updating?

```bash
# In browser console:
localStorage.clear()
location.reload()

# Or click "Disconnect" and reconnect
```

### Check Current Role

```bash
# Via script:
node scripts/check-user-permissions.mjs 0xYourAddress

# Via API:
curl "http://localhost:3000/api/auth/permissions?address=0xYourAddress"
```

### Verify Database State

```bash
# Run migration to ensure all users have roles:
node scripts/migrate-to-role-based-system.mjs

# Check role distribution:
npx prisma studio
# Browse to User table and filter by role
```

---

## 🎯 Common Tasks

### Blog Owner Tests Scout Behavior

```bash
# 1. Create new MetaMask account (auto-defaults to SCOUT)
# 2. Click "Switch" button in app
# 3. Select new account
# 4. Test scout features
# 5. Switch back when done
```

### Temporarily Promote User to Curator

```bash
# Promote
node scripts/set-user-role.mjs 0xAddress CURATOR

# Test curator features...

# Demote back
node scripts/set-user-role.mjs 0xAddress SCOUT
```

### Test API Authorization

```bash
# Test event creation (should fail as SCOUT)
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "x-wallet-address: 0xScoutAddress" \
  -d '{
    "title": "Test",
    "description": "Test",
    "eventType": "JAM_SESSION",
    "venueId": 1,
    "startDate": "2025-01-01",
    "endDate": "2025-01-02",
    "organizerAddress": "0xScoutAddress"
  }'

# Expected: 403 Forbidden
# { "error": "Only curators and blog owners can create events" }
```

---

## 📖 Full Documentation

For detailed instructions, see:

- **[Full Testing Guide](./TESTING_GUIDE.md)** - Comprehensive testing scenarios
- **[Login Sequence Diagrams](./diagrams/login-sequence.md)** - Authentication flows
- **[Sprint 2 Plan](../.claude/plans/velvet-wandering-anchor.md)** - RBAC implementation details

---

## 🆘 Quick Help

| Issue                        | Solution                                      |
| ---------------------------- | --------------------------------------------- |
| Can't find Disconnect button | Go to `/curator` or `/submit` page            |
| Permissions stale            | Disconnect and reconnect                      |
| Role not changing            | Verify with `check-user-permissions.mjs`      |
| API returns 403              | Check role with script, verify headers        |
| MetaMask won't switch        | Disconnect first, then switch, then reconnect |

---

## 📞 Support

For detailed help, check:

- `docs/TESTING_GUIDE.md` - Full testing documentation
- `docs/diagrams/login-sequence.md` - Authentication flow diagrams
- `.claude/plans/velvet-wandering-anchor.md` - RBAC implementation plan
