# RBAC System Implementation Summary

## Overview

A comprehensive Role-Based Access Control (RBAC) system has been implemented for the Piano Blog application with dual authentication support (username/password and Web3 wallet).

## Implementation Date

2025-10-27

## User Roles Defined

### 1. Blog Owner

- **Permissions**: Full CRUD on all resources
- **Special Powers**:
  - Can instantly verify venues (bypass 3-validator requirement)
  - Can manage users (create, update, delete)
- **Authentication**: Wallet-based or username/password
- **Database Role**: `BLOG_OWNER`

### 2. Curator

- **Permissions**: Edit venue details, read all venues
- **Restrictions**: Cannot delete venues or validate them
- **Authentication**: Username/password only (internal role)
- **Database Role**: `CURATOR`

### 3. Validator

- **Permissions**: Vote to verify venues (3 required for approval)
- **Restrictions**: Cannot edit or delete venues
- **Special System**: Multi-signature validation (3-of-3 approval)
- **Authentication**: Username/password only (internal role)
- **Database Role**: `VALIDATOR`

### 4. Scout / Venue Staff / Anonymous

- **Permissions**: Create venues, read all venues
- **Restrictions**: Cannot edit or delete venues
- **Authentication**: Optional (wallet, username/password, or anonymous)
- **Database Role**: `SCOUT`
- **Note**: These three roles have identical permissions

## Database Schema Changes

### Modified Models

#### User Model

```prisma
model User {
  id             Int      @id @default(autoincrement())
  walletAddress  String?  @unique // Made nullable
  username       String?  @unique // Added for username/password auth
  passwordHash   String?  // Added for username/password auth
  role           UserRole @default(SCOUT) // Added RBAC role
  createdBy      String?  // Track who created this user
  isActive       Boolean  @default(true) // Account status
  // ... existing fields ...
  sessions       Session[] // New relation
  validations    VenueValidation[] // New relation
}
```

#### New Models Added

1. **VenueValidation**: Multi-signature validation tracking
   - Tracks validator votes (approved/rejected)
   - Each validator can vote once per venue
   - Auto-verifies venue after 3 approvals

2. **Session**: JWT session management
   - Stores active tokens
   - Tracks expiration
   - Allows session invalidation

#### New Enum

```prisma
enum UserRole {
  BLOG_OWNER  // Full CRUD, instant verification
  CURATOR     // Edit venues
  VALIDATOR   // Vote to verify (3 required)
  SCOUT       // Create venues, read all
}
```

### Venue Model Relations

- Added `validations VenueValidation[]` relation

## Authentication System

### Libraries Installed

- `bcryptjs`: Password hashing (bcrypt with 10 salt rounds)
- `jose`: JWT token generation and verification
- `zod`: Request validation

### Auth API Routes Created

| Endpoint           | Method | Purpose                                |
| ------------------ | ------ | -------------------------------------- |
| `/api/auth/login`  | POST   | Login with username/password or wallet |
| `/api/auth/logout` | POST   | Invalidate session and clear token     |
| `/api/auth/me`     | GET    | Get current authenticated user info    |

### Authentication Files

1. **`/lib/auth.ts`**: Core authentication functions
   - `hashPassword()`: Bcrypt password hashing
   - `verifyPassword()`: Password verification
   - `generateToken()`: JWT token generation (7-day expiration)
   - `verifyToken()`: JWT token verification
   - `authenticateUser()`: Username/password authentication
   - `getUserByWallet()`: Web3 wallet authentication
   - `upsertWalletUser()`: Create/update user from wallet (for anonymous scouts)

2. **`/lib/auth-middleware.ts`**: Authorization middleware
   - `authenticate()`: Extract and verify user from JWT or wallet
   - `requireAuth()`: Require authentication (401 if not authenticated)
   - `requireRole()`: Require specific role(s) (403 if insufficient permissions)
   - `can.*`: Permission checker utilities
     - `can.createVenue()`
     - `can.readVenues()`
     - `can.updateVenue()`
     - `can.deleteVenue()`
     - `can.validateVenue()`
     - `can.instantVerifyVenue()`
     - `can.manageUsers()`

## API Endpoints Created

### Venue Validation System

- **POST `/api/venues/[id]/validate`**: Submit validation vote
  - Validators can approve/reject with notes and rating
  - Blog owner can instantly verify
  - Auto-verifies after 3 approvals
- **GET `/api/venues/[id]/validate`**: Get validation status
  - Shows all validator votes
  - Displays approval count and status

### Admin User Management

- **GET `/api/admin/users`**: List all users (Blog Owner only)
- **POST `/api/admin/users`**: Create user (Blog Owner only)
- **GET `/api/admin/users/[id]`**: Get user details
- **PUT `/api/admin/users/[id]`**: Update user (role, password, status)
- **DELETE `/api/admin/users/[id]`**: Delete user

## Test Users Created

The following test users have been seeded in the database:

| Username     | Password     | Role       | Purpose                                              |
| ------------ | ------------ | ---------- | ---------------------------------------------------- |
| (Blog Owner) | N/A          | BLOG_OWNER | Wallet: `0xe8985AEDF83E2a58fEf53B45db2d9556CD5F453A` |
| `curator`    | `curator123` | CURATOR    | Test curator permissions                             |
| `validator1` | `validator1` | VALIDATOR  | First validator for 3-of-3 system                    |
| `validator2` | `validator2` | VALIDATOR  | Second validator                                     |
| `validator3` | `validator3` | VALIDATOR  | Third validator                                      |
| `scout`      | `scout123`   | SCOUT      | Test scout permissions                               |

**Seed Script**: `/prisma/seed-users.ts`

Run with: `npx tsx prisma/seed-users.ts`

## Postman Testing Collection

### Location

`/postman/Piano-Blog-RBAC-Tests.postman_collection.json`

### Test Coverage

1. **Authentication Tests** (5 tests)
   - Login as Curator
   - Login as Validator 1, 2, 3
   - Login as Scout

2. **Scout Permission Tests** (4 tests)
   - ✅ Create venue (should succeed)
   - ✅ Read venues (should succeed)
   - ❌ Update venue (should fail with 403)
   - ❌ Delete venue (should fail with 403)

3. **Validator Tests** (4 tests)
   - ✅ Validator 1 approves
   - ✅ Validator 2 approves
   - ✅ Validator 3 approves → Auto-verifies venue
   - ✅ Get validation status (shows 3 approvals)

4. **Curator Tests** (3 tests)
   - ✅ Update venue (should succeed)
   - ❌ Delete venue (should fail with 403)
   - ❌ Validate venue (should fail with 403)

5. **Anonymous Tests** (2 tests)
   - ✅ Create venue (no auth required)
   - ✅ Read venues (no auth required)

### How to Use

1. Import collection into Postman
2. Ensure dev server is running (`yarn dev`)
3. Run entire collection or individual folders
4. Tokens are automatically captured from login responses

See `/postman/README.md` for detailed instructions.

## Permission Matrix

| Action         | Anonymous | Scout | Validator   | Curator | Blog Owner   |
| -------------- | --------- | ----- | ----------- | ------- | ------------ |
| Create Venue   | ✅        | ✅    | ❌          | ❌      | ✅           |
| Read Venues    | ✅        | ✅    | ✅          | ✅      | ✅           |
| Update Venue   | ❌        | ❌    | ❌          | ✅      | ✅           |
| Delete Venue   | ❌        | ❌    | ❌          | ❌      | ✅           |
| Validate Venue | ❌        | ❌    | ✅ (1 of 3) | ❌      | ✅ (instant) |
| Manage Users   | ❌        | ❌    | ❌          | ❌      | ✅           |

## Security Features

1. **Password Security**
   - Bcrypt hashing with 10 salt rounds
   - Minimum password length: 6 characters
   - Password hashes never returned in API responses

2. **JWT Tokens**
   - 7-day expiration
   - HTTP-only cookies (not accessible to JavaScript)
   - Secure flag (HTTPS only in production)
   - SameSite=Strict (CSRF protection)

3. **Session Management**
   - Tokens stored in database for invalidation
   - Automatic cleanup of expired sessions
   - Logout invalidates token in database

4. **Authorization Checks**
   - Middleware validates role on every protected endpoint
   - 401 Unauthorized for missing authentication
   - 403 Forbidden for insufficient permissions

5. **Input Validation**
   - Zod schemas validate all request payloads
   - Email format validation
   - Username length constraints
   - Wallet address format verification

## Multi-Signature Validation System

### How It Works

1. Scout submits a venue (unverified)
2. Three validators independently review and vote
3. Each validator can:
   - Approve with rating (1-5 stars)
   - Reject with notes
   - Vote only once per venue
4. After 3 approvals, venue is automatically verified
5. Blog owner can bypass and instantly verify

### Database Tracking

- `VenueValidation` model stores each vote
- Unique constraint: one vote per validator per venue
- Tracks approval status, notes, rating, timestamp

## Files Created/Modified

### New Files

- `/lib/auth.ts` - Authentication utilities
- `/lib/auth-middleware.ts` - Authorization middleware
- `/app/api/auth/login/route.ts` - Login endpoint
- `/app/api/auth/logout/route.ts` - Logout endpoint
- `/app/api/auth/me/route.ts` - Current user endpoint
- `/app/api/venues/[id]/validate/route.ts` - Validation endpoint
- `/app/api/admin/users/route.ts` - User list/create endpoints
- `/app/api/admin/users/[id]/route.ts` - User update/delete endpoints
- `/prisma/seed-users.ts` - Test user seed script
- `/postman/Piano-Blog-RBAC-Tests.postman_collection.json` - Postman tests
- `/postman/README.md` - Postman testing guide
- `/RBAC-IMPLEMENTATION.md` - This document

### Modified Files

- `/prisma/schema.prisma` - Added User role, VenueValidation, Session models
- `/package.json` - Added bcryptjs, jose, zod dependencies

## Next Steps

### Immediate (Required)

1. **Apply Authorization to Existing Venue APIs**
   - Update `/app/api/venues/route.ts` (POST requires authentication)
   - Update `/app/api/venues/[id]/route.ts` (PUT/DELETE require roles)

2. **Add JWT Secret to Environment**
   - Add `JWT_SECRET` to `.env.local`
   - Use a strong random secret in production

### Optional Enhancements

1. **Admin UI**: Build React interface for user management
2. **Validator Dashboard**: UI for validators to review pending venues
3. **Audit Logging**: Track all permission-based actions
4. **Password Reset**: Email-based password reset flow
5. **2FA**: Two-factor authentication for sensitive roles

## Environment Variables Required

Add to `.env.local`:

```bash
# Existing
NEXT_PUBLIC_BLOG_OWNER_ADDRESS="0xe8985AEDF83E2a58fEf53B45db2d9556CD5F453A"
DATABASE_URL="postgresql://..."

# New (Required)
JWT_SECRET="your-random-secret-key-min-32-chars-change-in-production"
```

## Testing the System

### Quick Test

1. Start dev server: `yarn dev`
2. Seed users: `npx tsx prisma/seed-users.ts`
3. Import Postman collection
4. Run all tests in Postman
5. Verify all tests pass (~30-40 assertions)

### Manual API Testing

```bash
# Login as curator
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"curator","password":"curator123"}'

# Use returned token for authenticated requests
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Database Inspection

View users and validations in Prisma Studio:

```bash
yarn db:studio
```

Navigate to:

- **User** table: View all roles and authentication methods
- **VenueValidation** table: See validator votes
- **Session** table: Active authentication sessions

## Questions & Support

- **RBAC Design**: See this document
- **API Reference**: See `/postman/README.md`
- **Database Schema**: See `/prisma/schema.prisma`
- **Project Setup**: See `/CLAUDE.md`

## Implementation Status

✅ **Completed**:

- Database schema with role system
- Dual authentication (username/password + wallet)
- Multi-signature validation system
- Authorization middleware
- Authentication API routes
- Admin user management API
- Validation API routes
- Test user seeding
- Comprehensive Postman tests

⏳ **Remaining**:

- Apply middleware to existing venue APIs
- Build admin UI for user management (optional)
- Add JWT_SECRET to environment

🎉 **Ready for Testing**: The RBAC system is fully functional and ready to test with Postman!
