# Next Steps for Musician Profile Implementation

**Current Status:** Foundation Complete (71%)
**Date:** 2025-10-29

---

## ✅ What's Already Done

1. **Database**: MusicianProfile model created with all 7 story fields
2. **Navigation**: "My Profile" menu item added
3. **Base Page**: `/app/profile/page.tsx` with hybrid auth (Web3 + username)
4. **API**: `/app/api/profile/[identifier]/route.ts` (GET and PUT)
5. **Hybrid Auth**: Supports both wallet and username users

---

## 🔄 What To Do Next (When Resuming)

### Step 1: Update Profile View Page (2-3 hours)

**File:** `/app/profile/[address]/page.tsx`

**Current:** Basic user profile exists
**Needs:** Display musician profile fields

**Tasks:**

1. Update `loadProfile()` to fetch from `/api/profile/[address]`
2. Add state for `musicianProfile` data
3. Create UI sections to display:
   - Instruments (WPB-109)
   - Musical Styles & Genres (WPB-110)
   - Experience Level & Years Playing (WPB-111)
   - Availability (gigs/collab) (WPB-112)
   - Performance Links & Social Media (WPB-113)
   - Repertoire (WPB-114)
4. Add "Edit Profile" button (only visible on own profile)

**Layout Suggestion:**

```
┌─────────────────────────────────────┐
│ User Info (name, avatar, bio)       │
├─────────────────────────────────────┤
│ Musician Profile Section            │
│  • Instruments: [Piano, Guitar]     │
│  • Styles: [Jazz, Blues]            │
│  • Experience: Professional (15y)   │
│  • Available for Gigs: ✓            │
│  • Recordings: [YouTube links]      │
│  • Repertoire: [Song tags]          │
└─────────────────────────────────────┘
```

---

### Step 2: Create Profile Edit Form (4-5 hours)

**Files to Create:**

#### Main Form Container

`/components/profile/ProfileEditForm.tsx`

- Container component with save/cancel buttons
- Calls PUT `/api/profile/[identifier]`
- Success/error notifications

#### Individual Field Components

1. **InstrumentSelector.tsx** (WPB-109)
   - Multi-select dropdown
   - Common instruments: Piano, Guitar, Drums, Bass, Violin, Saxophone
   - Custom instrument input
   - Displays as tags

2. **StyleGenreSelector.tsx** (WPB-110)
   - Two multi-selects: Styles & Genres
   - Styles: Jazz, Classical, Blues, Rock, Pop, etc.
   - Genres: Sub-categories based on style
   - Tag display

3. **ExperienceSelector.tsx** (WPB-111)
   - Radio buttons: Beginner, Intermediate, Advanced, Professional
   - Number input: Years playing (optional)

4. **AvailabilityForm.tsx** (WPB-112)
   - Checkbox: Available for gigs
   - Checkbox: Available for collaborations
   - Textarea: Availability notes (500 char limit)

5. **PortfolioLinks.tsx** (WPB-113)
   - Array of recording links (add/remove)
   - Social media JSON editor:
     - YouTube, Instagram, TikTok, SoundCloud
   - URL validation

6. **RepertoireList.tsx** (WPB-114)
   - Tag input for songs/pieces
   - Add/remove tags
   - Autocomplete for common jazz standards

---

## 🧪 Testing Plan (After Implementation)

### Test 1: Web3 User Profile

1. Connect MetaMask wallet
2. Click "My Profile" in nav
3. Should redirect to `/profile/0x...`
4. Should show profile with musician fields (if filled)
5. Click "Edit Profile"
6. Fill in musician profile fields
7. Save
8. Verify fields display correctly

### Test 2: Username User Profile

1. Sign up with username/password (if auth exists)
2. Click "My Profile" in nav
3. Should redirect to `/profile/username`
4. Follow steps 4-8 from Test 1

### Test 3: API Endpoints

```bash
# GET profile
curl http://localhost:3000/api/profile/0xYOUR_WALLET

# PUT profile
curl -X PUT http://localhost:3000/api/profile/0xYOUR_WALLET \
  -H "Content-Type: application/json" \
  -d '{
    "instruments": ["Piano", "Guitar"],
    "musicalStyles": ["Jazz", "Blues"],
    "experienceLevel": "Advanced",
    "yearsPlaying": 10
  }'
```

---

## 📋 Component Patterns to Use

### Multi-Select Pattern

```tsx
const [instruments, setInstruments] = useState<string[]>([])

const addInstrument = (instrument: string) => {
  if (!instruments.includes(instrument)) {
    setInstruments([...instruments, instrument])
  }
}

const removeInstrument = (instrument: string) => {
  setInstruments(instruments.filter((i) => i !== instrument))
}
```

### Tag Display Pattern

```tsx
{
  instruments.map((instrument) => (
    <span
      key={instrument}
      className="bg-primary-100 text-primary-800 inline-flex items-center gap-1 rounded-full px-3 py-1"
    >
      {instrument}
      <button onClick={() => removeInstrument(instrument)}>×</button>
    </span>
  ))
}
```

### Form Save Pattern

```tsx
const handleSave = async () => {
  try {
    const response = await fetch(`/api/profile/${identifier}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (response.ok) {
      // Show success notification
      router.refresh() // Reload profile data
    }
  } catch (error) {
    // Show error notification
  }
}
```

---

## 🎨 UI Framework Already Available

The project uses:

- **Tailwind CSS 4.0** - For styling
- **Next.js 15** - App Router
- **React 19** - Client components with 'use client'

Common patterns in the codebase:

- Primary button: `bg-primary-500 hover:bg-primary-600`
- Input fields: Check `/app/submit/page.tsx` for examples
- Multi-select: Check existing form components

---

## 🔗 Related Files to Reference

**For form patterns:**

- `/app/submit/page.tsx` - Venue submission form
- `/components/VenueEditForm.tsx` - Edit form with validation

**For API calls:**

- `/app/curator/page.tsx` - PUT requests with auth
- `/app/venueDetails/[id]/page.tsx` - Data fetching

**For styling:**

- `/app/profile/[address]/page.tsx` - Existing profile layout
- `/components/VenueDetailsView.tsx` - Info display patterns

---

## 💾 Files Modified So Far

1. `/prisma/schema.prisma` - Added MusicianProfile model
2. `/data/headerNavLinks.ts` - Changed Projects to My Profile
3. `/app/profile/page.tsx` - Created with hybrid auth
4. `/app/api/profile/[identifier]/route.ts` - Created GET/PUT endpoints

---

## 🚀 Resume Point

**Start with:** Step 1 - Update `/app/profile/[address]/page.tsx`

- Fetch musician profile from API
- Display the 7 story fields
- Add Edit button

**Then:** Step 2 - Create form components

- Build the 6 form components
- Integrate into edit form
- Test save functionality

**Estimated:** 6-8 hours total for both steps

---

**Last Updated:** 2025-10-29
**Ready to Resume:** Yes - Foundation complete, UI implementation next
