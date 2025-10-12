# Fresh Start Guide - PostgreSQL Venue System

This guide explains how to start fresh with venues in PostgreSQL, leaving the old blockchain data behind.

## ✅ What's Already Configured

Your application is now **fully configured** to use PostgreSQL for all venue operations:

- ✅ Venue submission saves to PostgreSQL
- ✅ Curator dashboard loads from PostgreSQL
- ✅ Venue verification updates PostgreSQL
- ✅ Venue editing updates PostgreSQL
- ✅ Venue deletion removes from PostgreSQL
- ✅ No blockchain interaction required

---

## 🚀 How to Submit New Venues

### Option 1: Submit via Web UI

1. **Navigate to**: `http://localhost:3000/submit`
2. **Fill out the form**:
   - Name (required)
   - City (required)
   - Address (required)
   - At least one contact method (email, phone, or website)
   - Piano availability checkbox
   - Venue type dropdown
   - Description (optional)

3. **Optional: Connect Wallet**
   - Click "Connect Wallet" to get credit for your submission
   - Or submit anonymously (will show as "anonymous")

4. **Submit**
   - Click "Submit Venue"
   - Success message will show: "✅ Venue submitted successfully! ID: X"
   - Venue is now in PostgreSQL, pending curator approval

---

### Option 2: Submit via API

```bash
curl -X POST http://localhost:3000/api/venues \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jazz Bistro",
    "city": "Toronto",
    "address": "251 Victoria St, Toronto, ON M5B 1T8",
    "contactInfo": "info@jazzbistro.ca",
    "email": "info@jazzbistro.ca",
    "phone": "+1-416-363-5299",
    "website": "https://jazzbistro.ca",
    "hasPiano": true,
    "hasJamSession": true,
    "venueType": 1,
    "description": "Live jazz performances with grand piano",
    "submittedBy": "0x1234...5678"
  }'
```

---

## 👥 Managing Venues as Curator

### Access Curator Dashboard

1. **Navigate to**: `http://localhost:3000/curator`
2. **Connect your wallet** (must be blog owner or authorized curator)
3. **View pending venues** in the list

### Verify Venues

1. Click **"Review"** on any venue
2. Review the venue details
3. Click **"✓ Approve"** or **"✗ Reject"**
4. Venue status updates in PostgreSQL immediately

### Edit Venues

1. Click **"Review"** on a venue
2. Click **"✏️ Edit Info"**
3. Update name, contact info, description, address, piano status
4. Click **"Update Venue"**
5. Changes save to PostgreSQL

### Delete Venues (Blog Owner Only)

1. Click **"Review"** on a venue
2. Scroll down to see **"🗑️ Delete Venue"** button
3. Click and confirm deletion
4. Venue removed from PostgreSQL permanently

---

## 🔐 Managing Curators

### Add Curators

1. **Navigate to**: `http://localhost:3000/admin/curators`
2. **Enter wallet address** of the user you want to authorize
3. Click **"Add Curator"**
4. User can now access `/curator` dashboard

### Remove Curators

1. On the curator management page
2. Click **"Remove"** next to curator's name
3. Confirm removal
4. User loses curator access immediately

---

## 📊 Current System Status

### Database Schema

Your PostgreSQL database has these tables:

- **Venue** - All venue data
- **User** - User profiles and curator status
- **VenueReview** - User reviews (not yet implemented)
- **VenueVerification** - Verification history
- **VenueAnalytics** - View/click tracking
- **CAVPayment** - Payment transaction references

### Permissions Hierarchy

1. **Blog Owner** (`NEXT_PUBLIC_BLOG_OWNER_ADDRESS`)
   - All curator permissions
   - Delete venues
   - Manage curators

2. **Authorized Curators** (database: `User.isAuthorizedVerifier = true`)
   - Verify/reject venues
   - Edit venue information
   - Cannot delete venues
   - Cannot manage curators

3. **Regular Users**
   - Submit venues
   - View public venues
   - (Future: write reviews, make payments)

---

## 🎯 Quick Start Checklist

- [ ] Set `NEXT_PUBLIC_BLOG_OWNER_ADDRESS` in `.env.local`
- [ ] Start dev server: `yarn dev`
- [ ] Submit 2-3 test venues at `/submit`
- [ ] Connect wallet and access `/curator`
- [ ] Verify test venues
- [ ] Test editing a venue
- [ ] Test deleting a venue (blog owner only)
- [ ] Add a test curator at `/admin/curators`
- [ ] Test curator access with different wallet

---

## 🐛 Troubleshooting

### "No venues found"

- Database is empty - submit some venues first
- Check browser console for errors
- Verify PostgreSQL connection in `.env.local`

### "Not authorized"

- Check that `NEXT_PUBLIC_BLOG_OWNER_ADDRESS` matches your wallet
- Reconnect your wallet
- Check debug panel on `/curator` page

### "Failed to load venues"

- Check that PostgreSQL is running
- Verify `DATABASE_URL` in `.env.local`
- Check server logs for errors

### Curator dashboard stuck loading

- Open browser console (F12)
- Look for error messages
- Check network tab for failed API requests
- Verify `/api/venues` returns data: `curl http://localhost:3000/api/venues`

---

## 📝 Testing Your Setup

### Test Venue Submission

```bash
# Test anonymous submission
curl -X POST http://localhost:3000/api/venues \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Venue",
    "city": "Toronto",
    "address": "123 Test St",
    "contactInfo": "test@example.com",
    "hasPiano": true,
    "submittedBy": "anonymous"
  }'

# Should return: {"success":true,"venue":{...},"message":"Venue submitted successfully!"}
```

### Check Venue Count

```bash
curl http://localhost:3000/api/venues

# Should return: {"success":true,"venues":[...],"totalCount":X}
```

### Test Permissions API

```bash
curl "http://localhost:3000/api/auth/permissions?address=YOUR_WALLET_ADDRESS"

# Should return: {"success":true,"permissions":{"isBlogOwner":true,"isAuthorizedCurator":true,"canAccessCurator":true}}
```

---

## 🔄 Migration from Blockchain (If Needed Later)

If you later decide to migrate blockchain venues to PostgreSQL, you would need to:

1. Read all venues from blockchain contract
2. Format data for PostgreSQL schema
3. Bulk insert via API or Prisma
4. Verify counts match

This can be done with a custom migration script. Let me know if you need this!

---

## 📚 Related Files

- `/app/submit/page.tsx` - Venue submission form
- `/app/curator/page.tsx` - Curator dashboard
- `/app/admin/curators/page.tsx` - Curator management
- `/app/api/venues/route.ts` - Venue API (GET, POST)
- `/app/api/venues/[id]/route.ts` - Single venue operations (PUT, DELETE)
- `/app/api/admin/curators/route.ts` - Curator management API
- `/lib/database-simplified.ts` - PostgreSQL service layer
- `/prisma/schema.prisma` - Database schema

---

_Last Updated: 2025-10-12_
