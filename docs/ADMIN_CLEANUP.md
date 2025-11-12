# Admin User Cleanup Guide

This guide explains how to clean up incomplete or problematic user profiles from the production database.

## Setup

1. Add an admin API key to your Vercel environment variables:

   ```
   ADMIN_API_KEY=<generate-a-secure-random-key>
   ```

2. After adding the environment variable, redeploy the application or wait for the next deployment.

## Usage

### 1. Check if User Exists (Safe, Read-Only)

First, verify the user exists and see what data will be deleted:

```bash
curl -X GET "https://piano-blog.vercel.app/api/admin/cleanup-user?identifier=MalDav" \
  -H "x-admin-key: YOUR_ADMIN_API_KEY"
```

**Response (if found):**

```json
{
  "found": true,
  "user": {
    "id": 123,
    "username": "MalDav",
    "displayName": "Mal Dav",
    "walletAddress": null,
    "email": "user@example.com",
    "createdAt": "2025-01-15T10:30:00Z",
    "associatedData": {
      "hasMusicianProfile": false,
      "reviewCount": 0,
      "sessionCount": 1
    }
  }
}
```

### 2. Delete User (Destructive, Cannot Be Undone)

⚠️ **WARNING**: This permanently deletes the user and all associated data!

```bash
curl -X POST "https://piano-blog.vercel.app/api/admin/cleanup-user" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_API_KEY" \
  -d '{
    "identifier": "MalDav",
    "confirm": true
  }'
```

**Response (if successful):**

```json
{
  "success": true,
  "message": "User deleted successfully",
  "user": {
    "id": 123,
    "username": "MalDav",
    "displayName": "Mal Dav",
    "walletAddress": null,
    "email": "user@example.com",
    "createdAt": "2025-01-15T10:30:00Z",
    "associatedData": {
      "hasMusicianProfile": false,
      "reviewCount": 0,
      "sessionCount": 1
    }
  },
  "deletedData": {
    "musicianProfile": false,
    "sessionsDeleted": 1,
    "reviewsDeleted": 0
  }
}
```

## Using with Postman or Insomnia

1. **Check User Exists:**
   - Method: `GET`
   - URL: `https://piano-blog.vercel.app/api/admin/cleanup-user?identifier=MalDav`
   - Headers:
     - `x-admin-key`: `<YOUR_ADMIN_API_KEY>`

2. **Delete User:**
   - Method: `POST`
   - URL: `https://piano-blog.vercel.app/api/admin/cleanup-user`
   - Headers:
     - `Content-Type`: `application/json`
     - `x-admin-key`: `<YOUR_ADMIN_API_KEY>`
   - Body (JSON):
     ```json
     {
       "identifier": "MalDav",
       "confirm": true
     }
     ```

## For the MalDav Issue

To clean up the partial MalDav profile:

1. **First, check what will be deleted:**

   ```bash
   curl -X GET "https://piano-blog.vercel.app/api/admin/cleanup-user?identifier=MalDav" \
     -H "x-admin-key: YOUR_ADMIN_API_KEY"
   ```

2. **If confirmed, delete the profile:**

   ```bash
   curl -X POST "https://piano-blog.vercel.app/api/admin/cleanup-user" \
     -H "Content-Type: application/json" \
     -H "x-admin-key: YOUR_ADMIN_API_KEY" \
     -d '{"identifier": "MalDav", "confirm": true}'
   ```

3. **User can now create a fresh profile** at `/auth/signup`

## Security Notes

- The `ADMIN_API_KEY` should be a long, random string (at least 32 characters)
- Never commit the API key to the repository
- Only share the key with trusted administrators
- The key should be stored only in Vercel environment variables
- Consider rotating the key periodically

## Troubleshooting

### "Unauthorized - Invalid admin key"

- Ensure `ADMIN_API_KEY` is set in Vercel environment variables
- Ensure you've redeployed after adding the environment variable
- Check that you're using the correct key value

### "Admin API not configured"

- The `ADMIN_API_KEY` environment variable is not set in Vercel
- Add it in: Vercel Dashboard → Project → Settings → Environment Variables

### "User not found"

- The identifier doesn't match any username, wallet address, or display name
- Try different variations (case-insensitive search is performed)
- Check the exact username/identifier in the database
