# Postman Setup Guide - Piano Blog Admin API

## Step 1: Set Up Admin API Key in Vercel

Before using the API, you need to set up authentication:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `piano-blog` project
3. Go to **Settings** → **Environment Variables**
4. Add a new environment variable:
   - **Key:** `ADMIN_API_KEY`
   - **Value:** Generate a secure random string (at least 32 characters)
   - **Example format:** `admin_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (replace x's with random chars)

   You can generate one using:

   ```bash
   # On Mac/Linux - generates a 64-character hex string:
   openssl rand -hex 32

   # Example output: 7f3a9b2c1d5e8f4a6b9c2d5e8f1a3b6c9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4a

   # Or use an online generator:
   # https://generate-random.org/api-key-generator
   ```

5. Click **Save**
6. **Important:** Redeploy your application or wait for the next automatic deployment

## Step 2: Import Postman Collection

1. Open Postman
2. Click **Import** (top left)
3. Drag and drop the file: `docs/Piano-Blog-Admin-API.postman_collection.json`
4. The collection will appear in your sidebar

## Step 3: Configure Collection Variables

After importing:

1. Click on the collection name **"Piano Blog - Admin API"**
2. Go to the **Variables** tab
3. Update these variables:

   | Variable        | Current Value                   | Your Value                             |
   | --------------- | ------------------------------- | -------------------------------------- |
   | `base_url`      | `https://piano-blog.vercel.app` | Keep as is (or use your custom domain) |
   | `admin_api_key` | `YOUR_ADMIN_API_KEY_HERE`       | **Paste the key from Vercel**          |

4. Click **Save**

## Step 4: Test the API (Recommended Order)

### Test 1: Verify Authentication Works

Run: **"5. Test - Without Auth (Should Fail)"**

- Expected: `401 Unauthorized` error
- This confirms the endpoint is protected

### Test 2: Check if MalDav User Exists

Run: **"1. Check if User Exists (Safe)"**

- This is **READ ONLY** - safe to run
- You'll see what data exists for MalDav:
  ```json
  {
    "found": true,
    "user": {
      "username": "MalDav",
      "email": "...",
      "associatedData": {
        "hasMusicianProfile": false,
        "reviewCount": 0,
        "sessionCount": 1
      }
    }
  }
  ```

### Test 3: Verify Safety Check

Run: **"4. Test - Without Confirm (Should Fail)"**

- Expected: `400 Bad Request` - "Must set confirm: true"
- This confirms deletion requires explicit confirmation

### Test 4: Delete MalDav Profile ⚠️

Run: **"2. Delete User - MalDav (DESTRUCTIVE)"**

- ⚠️ **THIS WILL PERMANENTLY DELETE THE USER**
- Only run this after confirming Steps 1-3 worked
- Response will show what was deleted:
  ```json
  {
    "success": true,
    "message": "User deleted successfully",
    "deletedData": {
      "musicianProfile": false,
      "sessionsDeleted": 1,
      "reviewsDeleted": 0
    }
  }
  ```

## Step 5: Verify Cleanup Worked

After deletion, run **"1. Check if User Exists"** again:

- Expected: `404 Not Found` - User no longer exists
- MalDav can now create a fresh profile!

## Using the Custom Template

For deleting other users in the future:

1. Run **"1. Check if User Exists"** first with their username
2. If you need to delete them, use **"3. Delete User - Custom (Template)"**
3. Edit the Body and replace `USERNAME_HERE` with the actual identifier
4. Click **Send**

## Troubleshooting

### Error: "Unauthorized - Invalid admin key"

- Double-check the `admin_api_key` variable matches what's in Vercel
- Ensure Vercel has been redeployed after adding the environment variable
- The key is case-sensitive

### Error: "Admin API not configured"

- The `ADMIN_API_KEY` environment variable is not set in Vercel
- Go back to Step 1 and add it

### Error: "User not found" (404)

- The identifier doesn't match any username/wallet/display name
- Try searching by email or check the exact username in your database
- The search is case-insensitive

### The API times out or doesn't respond

- Check that you've deployed the latest code with the API endpoint
- Verify the URL is correct: `https://piano-blog.vercel.app/api/admin/cleanup-user`
- Check Vercel logs for errors

## Security Best Practices

1. **Never commit the API key** to git
2. **Don't share** the API key publicly
3. **Rotate the key** periodically (every 3-6 months)
4. **Use different keys** for production and staging if you have multiple environments
5. **Keep the Postman collection private** - it contains your API structure

## Need Help?

See the full documentation in `docs/ADMIN_CLEANUP.md`
