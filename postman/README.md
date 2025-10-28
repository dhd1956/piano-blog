# Piano Blog RBAC Postman Testing Guide

This directory contains a comprehensive Postman collection for testing the Role-Based Access Control (RBAC) system in the Piano Blog application.

## Setup

### 1. Install Postman

Download and install [Postman](https://www.postman.com/downloads/) if you haven't already.

### 2. Import the Collection

1. Open Postman
2. Click **Import** button
3. Select `Piano-Blog-RBAC-Tests.postman_collection.json`
4. Click **Import**

### 3. Configure Environment Variables

The collection uses the following variables (already pre-configured):

- `base_url`: `http://localhost:3000` (your local dev server)
- `blog_owner_wallet`: `0xe8985AEDF83E2a58fEf53B45db2d9556CD5F453A`
- Tokens will be automatically captured during login tests

### 4. Ensure Dev Server is Running

```bash
yarn dev
```

### 5. Seed Test Users (if not done already)

```bash
npx tsx prisma/seed-users.ts
```

## Test User Credentials

| Role            | Username     | Password     | Permissions                     |
| --------------- | ------------ | ------------ | ------------------------------- |
| **Blog Owner**  | (wallet)     | N/A          | Full CRUD, instant verification |
| **Curator**     | `curator`    | `curator123` | Edit venues, no verification    |
| **Validator 1** | `validator1` | `validator1` | Vote to verify venues           |
| **Validator 2** | `validator2` | `validator2` | Vote to verify venues           |
| **Validator 3** | `validator3` | `validator3` | Vote to verify venues           |
| **Scout**       | `scout`      | `scout123`   | Create venues, read all         |
| **Anonymous**   | N/A          | N/A          | Create venues, read all         |

## Running the Tests

### Run All Tests Sequentially

1. Select the **Piano Blog RBAC Tests** collection
2. Click the **Run** button (▶️)
3. Click **Run Piano Blog RBAC Tests**
4. Watch all tests execute in sequence

### Run Individual Test Folders

You can run specific test groups:

- **01 - Authentication**: Login tests for all users
- **02 - Scout Tests**: Verify scouts can create but not edit/delete
- **03 - Validator Tests**: Test 3-of-3 approval system
- **04 - Curator Tests**: Verify curators can edit but not delete/validate
- **05 - Anonymous Tests**: Test anonymous venue submission

### Run Individual Requests

Click any request and click **Send** to test individually.

## Test Scenarios Covered

### 1. Authentication Tests

- ✅ Login with username/password for all roles
- ✅ JWT token generation and storage
- ✅ Automatic token capture for subsequent requests

### 2. Scout Permissions

- ✅ **Can** create venues
- ✅ **Can** read all venues
- ❌ **Cannot** update venues
- ❌ **Cannot** delete venues
- ❌ **Cannot** validate venues

### 3. Validator Permissions (3-of-3 System)

- ✅ **Can** vote to validate venues
- ✅ Automatic verification after 3 approvals
- ✅ Each validator can only vote once per venue
- ❌ **Cannot** edit venues
- ❌ **Cannot** delete venues

### 4. Curator Permissions

- ✅ **Can** edit venue details
- ✅ **Can** read all venues
- ❌ **Cannot** delete venues
- ❌ **Cannot** validate venues

### 5. Anonymous User Permissions

- ✅ **Can** create venues (same as Scout)
- ✅ **Can** read all venues
- ❌ **Cannot** update venues
- ❌ **Cannot** delete venues

### 6. Blog Owner Permissions

- ✅ Full CRUD on all resources
- ✅ Instant venue verification (bypass 3-validator requirement)
- ✅ User management (create/update/delete users)

## Expected Test Results

When you run the full collection, you should see:

- **All authentication requests succeed** (5/5 logins)
- **Scout can create but fails to edit/delete** (✅ ❌ ❌)
- **3 validators approve sequentially, venue auto-verifies** (✅ ✅ ✅)
- **Curator can edit but fails to delete/validate** (✅ ❌ ❌)
- **Anonymous can create and read venues** (✅ ✅)

Total expected: **~30-40 tests** depending on assertions

## Troubleshooting

### Tokens Not Capturing

- Ensure the collection variables are set correctly
- Check that login requests are returning `token` in response
- Verify the `test` script in login requests sets the token

### 403 Forbidden Errors (Unexpected)

- Check that authentication succeeded and token is valid
- Verify user roles in database match expected roles
- Run seed script again: `npx tsx prisma/seed-users.ts`

### Venue ID Not Found

- Ensure the Scout creates a venue first (test 02)
- The `test_venue_id` variable should be automatically set
- Check console for any errors during venue creation

### Dev Server Not Responding

- Ensure `yarn dev` is running on port 3000
- Check for any build errors in terminal
- Restart dev server if needed

## Database Inspection

To view the database directly:

```bash
yarn db:studio
```

This opens Prisma Studio at `http://localhost:5555` where you can:

- View all users and their roles
- See venue validation records
- Check authentication sessions

## Permission Matrix Reference

| Action         | Anonymous | Scout | Validator   | Curator | Blog Owner   |
| -------------- | --------- | ----- | ----------- | ------- | ------------ |
| Create Venue   | ✅        | ✅    | ❌          | ❌      | ✅           |
| Read Venues    | ✅        | ✅    | ✅          | ✅      | ✅           |
| Update Venue   | ❌        | ❌    | ❌          | ✅      | ✅           |
| Delete Venue   | ❌        | ❌    | ❌          | ❌      | ✅           |
| Validate Venue | ❌        | ❌    | ✅ (1 of 3) | ❌      | ✅ (instant) |
| Manage Users   | ❌        | ❌    | ❌          | ❌      | ✅           |

## API Endpoints Reference

### Authentication

- `POST /api/auth/login` - Login with username/password or wallet
- `POST /api/auth/logout` - Logout and invalidate session
- `GET /api/auth/me` - Get current user info

### Venues

- `GET /api/venues` - List all venues
- `POST /api/venues` - Create venue (Scout, Anonymous, Blog Owner)
- `GET /api/venues/[id]` - Get venue details
- `PUT /api/venues/[id]` - Update venue (Curator, Blog Owner)
- `DELETE /api/venues/[id]` - Delete venue (Blog Owner only)

### Venue Validation

- `POST /api/venues/[id]/validate` - Submit validation vote (Validator, Blog Owner)
- `GET /api/venues/[id]/validate` - Get validation status

### Admin (Blog Owner Only)

- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `GET /api/admin/users/[id]` - Get user details
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user

## Next Steps

After verifying all tests pass:

1. **Integrate with CI/CD**: Use Newman to run tests in pipeline
2. **Add more edge cases**: Test duplicate validations, invalid tokens, etc.
3. **Load testing**: Test with multiple simultaneous validators
4. **Security audit**: Verify JWT expiration, password complexity, etc.

## Questions?

Check the main project README or CLAUDE.md for more information about the RBAC system architecture.
