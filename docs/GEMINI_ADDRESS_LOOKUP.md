# Gemini AI Address Lookup - Setup Guide

**Feature:** Auto-fill venue addresses using Google's Gemini AI
**Status:** ✅ Implemented
**Last Updated:** December 12, 2025

---

## Overview

The Submit Venue form includes an **Auto-fill Address** button that uses Google's Gemini AI to automatically lookup and populate the venue address based on the venue name and city.

**User Flow:**

1. User enters venue name (e.g., "Tranzac Club")
2. User enters city (e.g., "Toronto")
3. User clicks "🤖 Auto-fill Address" button
4. Gemini AI looks up the address
5. Address field is automatically populated with formatted address

---

## Setup Instructions

### 1. Get Gemini API Key

1. **Visit Google AI Studio:**
   - Go to https://aistudio.google.com/apikey
   - Sign in with your Google account

2. **Create API Key:**
   - Click "Create API Key"
   - Select a Google Cloud project (or create new one)
   - Copy the API key

3. **Enable Billing (if needed):**
   - Gemini API has a generous free tier
   - May require billing info for higher usage
   - See pricing: https://ai.google.dev/pricing

---

### 2. Add API Key to Environment Variables

Add to `.env.local` (create if it doesn't exist):

```bash
# Gemini AI API Key for address lookup
GEMINI_API_KEY=your_api_key_here
```

**Important:**

- ⚠️ **Never commit `.env.local` to git** (it's in .gitignore)
- ⚠️ **Never expose API key in client-side code** (use API routes only)
- ⚠️ Keep this key secure (rotate if exposed)

---

### 3. Update Production Environment

For production deployment (Vercel, Netlify, etc.):

1. Go to project settings → Environment Variables
2. Add `GEMINI_API_KEY` with your production API key
3. Redeploy the application

---

## How It Works

### API Route: `/api/venues/lookup-address`

**File:** `app/api/venues/lookup-address/route.ts`

```typescript
POST /api/venues/lookup-address

Request Body:
{
  "venueName": "Tranzac Club",
  "city": "Toronto"
}

Response:
{
  "success": true,
  "address": "292 Brunswick Ave, Toronto, ON M5S 2M7, Canada"
}

// OR if error:
{
  "success": false,
  "error": "Could not find address. Please enter manually."
}
```

**How it works:**

1. Receives venue name and city from frontend
2. Validates inputs
3. Calls Gemini AI with prompt:
   ```
   Return the address in Google Maps acceptable format for <Tranzac Club> in <Toronto>.
   Return ONLY the formatted address, nothing else.
   Format: Street Address, City, Province/State, Postal Code, Country
   ```
4. Returns formatted address

---

### Frontend Integration

**File:** `app/venues/submit/page.tsx`

```typescript
// Button in form
<button
  type="button"
  onClick={handleLookupAddress}
  disabled={isLookingUpAddress || !formData.name || !formData.city}
>
  {isLookingUpAddress ? (
    <>
      <span className="animate-spin">⏳</span>
      Looking up...
    </>
  ) : (
    <>🤖 Auto-fill Address</>
  )}
</button>

// Handler function
const handleLookupAddress = async () => {
  const response = await fetch('/api/venues/lookup-address', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      venueName: formData.name,
      city: formData.city,
    }),
  })

  const data = await response.json()
  if (data.success) {
    setFormData(prev => ({ ...prev, address: data.address }))
  }
}
```

---

## Cost Analysis

### Gemini API Pricing (as of Dec 2025)

**Free Tier:**

- **Gemini 2.0 Flash:** 1,500 requests/day (Free)
- **Input:** First 1M tokens/day free
- **Output:** First 1M tokens/day free

**Paid Tier (if exceeds free):**

- **Input:** $0.075 per 1M tokens (~$0.0000075 per request)
- **Output:** $0.30 per 1M tokens (~$0.00003 per request)

**Estimated Cost:**

- 100 address lookups/day: **FREE** (well within limit)
- 10,000 address lookups/month: **FREE**
- Each lookup: ~50 input tokens + ~30 output tokens

**Conclusion:** Extremely affordable, likely free forever for your use case.

---

## Error Handling

### Graceful Degradation

If Gemini API fails or is not configured:

1. **API Key Missing:**
   - API returns error with user-friendly message
   - Button still visible but shows helpful error
   - User can enter address manually

2. **API Call Fails:**
   - Error caught and displayed to user
   - User notified to enter address manually
   - No app crash or broken state

3. **Address Not Found:**
   - Gemini couldn't find the venue
   - User sees message: "Could not find address. Please enter manually."
   - Input field remains editable

**Example Error Messages:**

- "Address lookup service not configured. Please enter address manually."
- "Could not find address. Please enter manually."
- "Failed to lookup address. Please enter manually."

---

## Security Best Practices

### ✅ What We Do Right

1. **API Key Server-Side Only:**
   - API key stored in environment variables
   - Never exposed to client
   - Only used in API routes (server-side)

2. **Input Validation:**
   - Validate venue name and city before API call
   - Prevent empty/malicious inputs
   - Sanitize inputs before sending to Gemini

3. **Rate Limiting (TODO):**
   - Consider adding rate limiting to API route
   - Prevent abuse of Gemini API quota
   - Protect against DoS attacks

4. **Error Messages:**
   - Generic error messages (don't leak API details)
   - No stack traces to client
   - Helpful but not revealing

---

## Testing

### Manual Testing

1. **Test with known venue:**

   ```
   Venue Name: Tranzac Club
   City: Toronto
   Expected: 292 Brunswick Ave, Toronto, ON M5S 2M7, Canada
   ```

2. **Test with unknown venue:**

   ```
   Venue Name: Fake Venue XYZ123
   City: Nowhere
   Expected: Error message, fallback to manual entry
   ```

3. **Test without API key:**

   ```
   Remove GEMINI_API_KEY from .env.local
   Expected: Error message, user can still enter manually
   ```

4. **Test validation:**
   ```
   Click "Auto-fill Address" before entering venue name/city
   Expected: Validation errors, button disabled
   ```

---

## Troubleshooting

### Issue: "Address lookup service not configured"

**Cause:** `GEMINI_API_KEY` not set in environment variables

**Fix:**

1. Check `.env.local` exists in project root
2. Verify `GEMINI_API_KEY=your_key_here` is present
3. Restart dev server: `yarn dev`
4. Check for typos in variable name

---

### Issue: "Failed to lookup address"

**Possible Causes:**

1. **API Key Invalid:** Check key is correct and active
2. **Quota Exceeded:** Check usage at https://aistudio.google.com
3. **Network Issue:** Check internet connection
4. **Gemini API Down:** Check status at https://status.cloud.google.com

**Fix:**

1. Verify API key is valid
2. Check Google Cloud Console for quota/billing
3. Try again later if API is down
4. User can always enter address manually (graceful degradation)

---

### Issue: Address returned is incomplete or wrong

**Cause:** Gemini AI couldn't find exact venue or returned partial info

**Fix:**

1. User can edit the auto-filled address
2. User can ignore auto-fill and type manually
3. Consider improving prompt for better accuracy

---

## Future Improvements

### Potential Enhancements

1. **Caching:**
   - Cache venue addresses in database
   - Reduce Gemini API calls for repeat lookups
   - Faster response time

2. **Fallback to Google Places API:**
   - If Gemini fails, try Google Places autocomplete
   - More reliable but requires separate API key
   - Costs more per request

3. **Rate Limiting:**
   - Limit requests per user/IP
   - Prevent abuse of API quota
   - Implement with Redis or DB

4. **Address Validation:**
   - Verify returned address is valid
   - Check format matches expected pattern
   - Reject obviously wrong addresses

5. **Multiple Results:**
   - Show dropdown if Gemini finds multiple matches
   - Let user choose correct venue
   - Better UX for common names

---

## API Reference

### Environment Variables

| Variable         | Required                  | Description              | Example     |
| ---------------- | ------------------------- | ------------------------ | ----------- |
| `GEMINI_API_KEY` | Yes (for feature to work) | Google Gemini AI API key | `AIzaSy...` |

### API Endpoints

#### POST `/api/venues/lookup-address`

**Request:**

```json
{
  "venueName": "Tranzac Club",
  "city": "Toronto"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "address": "292 Brunswick Ave, Toronto, ON M5S 2M7, Canada"
}
```

**Error Response (400/500/503):**

```json
{
  "success": false,
  "error": "Could not find address. Please enter manually."
}
```

---

## Related Files

**Implementation:**

- `app/api/venues/lookup-address/route.ts` - API route
- `app/venues/submit/page.tsx` - Submit venue form with auto-fill button

**Dependencies:**

- `@google/generative-ai` - Gemini AI SDK (installed via yarn)

**Environment:**

- `.env.local` - Local development API key
- `.env.example` - Example env file (for reference)

---

## References

**Google Gemini AI:**

- API Docs: https://ai.google.dev/docs
- Pricing: https://ai.google.dev/pricing
- Get API Key: https://aistudio.google.com/apikey
- Node.js SDK: https://github.com/google/generative-ai-js

**Our Python Script (Original):**

```python
import google.generativeai as genai

genai.configure(api_key="AIzaSy...")
model = genai.GenerativeModel('gemini-2.0-flash-exp')

response = model.generate_content(
  "return the address in google maps acceptable format for <Tranzac Club> in <Toronto>"
)

print(response.text)
```

---

**Document Owner:** Development Team
**Last Reviewed:** December 12, 2025
**Status:** ✅ Production Ready
