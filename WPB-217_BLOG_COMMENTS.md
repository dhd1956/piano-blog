# WPB-217: Enable Blog Post Comments with Giscus

**Epic**: Blog Engagement Features
**Story Points**: 2
**Priority**: Medium
**Sprint**: Sprint 3
**Labels**: blog, community, engagement, configuration

---

## User Story

**As a** blog reader
**I want to** leave comments on blog posts
**So that** I can share my thoughts, ask questions, and engage with the author and other readers

---

## Acceptance Criteria

### 1. GitHub Discussions Setup

- [ ] Enable GitHub Discussions on the `piano-blog` repository
- [ ] Create a "Blog Comments" category in Discussions
- [ ] Install the Giscus app on the repository

### 2. Giscus Configuration

- [ ] Visit https://giscus.app/ and complete the configuration wizard
- [ ] Generate the required environment variables:
  - `NEXT_PUBLIC_GISCUS_REPO`
  - `NEXT_PUBLIC_GISCUS_REPOSITORY_ID`
  - `NEXT_PUBLIC_GISCUS_CATEGORY`
  - `NEXT_PUBLIC_GISCUS_CATEGORY_ID`
- [ ] Add environment variables to `.env.local` (local development)
- [ ] Add environment variables to production deployment (Vercel/hosting platform)

### 3. Visual Verification

- [ ] Comment box appears at the bottom of all blog posts
- [ ] Comment box supports both light and dark themes
- [ ] Users can sign in with GitHub to leave comments
- [ ] Posted comments display immediately on the blog
- [ ] Emoji reactions work on comments

### 4. Testing

- [ ] Test commenting on at least 2 different blog posts
- [ ] Verify comments appear in GitHub Discussions
- [ ] Test theme switching (light/dark mode)
- [ ] Verify comment moderation works from GitHub
- [ ] Test comment deletion from GitHub reflects on blog

---

## Technical Implementation

### Current State

The blog is already configured to use Giscus in `data/siteMetadata.js`:

```javascript
comments: {
  provider: 'giscus',
  giscusConfig: {
    repo: process.env.NEXT_PUBLIC_GISCUS_REPO,
    repositoryId: process.env.NEXT_PUBLIC_GISCUS_REPOSITORY_ID,
    category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY,
    categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID,
    mapping: 'pathname',
    reactions: '1',
    metadata: '0',
    theme: 'light',
    darkTheme: 'transparent_dark',
    lang: 'en',
  },
}
```

**What's Missing**: Only the environment variables need to be configured.

### Setup Steps

#### Step 1: Enable GitHub Discussions

1. Go to: https://github.com/dhd1956/piano-blog/settings
2. Scroll to "Features" section
3. Check "Discussions"
4. Click "Set up discussions" if prompted

#### Step 2: Create Discussion Category

1. Go to: https://github.com/dhd1956/piano-blog/discussions
2. Click "Categories" (gear icon)
3. Create new category:
   - **Name**: "Blog Comments"
   - **Description**: "Comments from blog posts on Developing My Piano Style"
   - **Format**: "Open-ended discussion"

#### Step 3: Install Giscus App

1. Visit: https://github.com/apps/giscus
2. Click "Install"
3. Select `piano-blog` repository
4. Authorize the app

#### Step 4: Configure Giscus

1. Visit: https://giscus.app/
2. Fill in the configuration form:
   - **Repository**: `dhd1956/piano-blog`
   - **Page ↔️ Discussions Mapping**: "Discussion title contains page `pathname`"
   - **Discussion Category**: "Blog Comments"
   - **Features**: Enable reactions
   - **Theme**: Choose "Preferred color scheme"
3. Copy the generated values from the "Enable giscus" section

#### Step 5: Add Environment Variables

**Local Development** (`.env.local`):

```bash
# Giscus Blog Comments
NEXT_PUBLIC_GISCUS_REPO=dhd1956/piano-blog
NEXT_PUBLIC_GISCUS_REPOSITORY_ID=R_xxxxxxxxxxxxx  # From giscus.app
NEXT_PUBLIC_GISCUS_CATEGORY=Blog Comments
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_xxxxxxxxxxxxx  # From giscus.app
```

**Production** (Vercel/hosting):
Add the same variables in your hosting platform's environment variables settings.

#### Step 6: Restart Dev Server

```bash
yarn dev
```

---

## Benefits

### For Readers

- ✅ Share thoughts and feedback on blog posts
- ✅ Ask questions directly to the author
- ✅ Engage with other readers
- ✅ Simple GitHub authentication (no extra account needed)
- ✅ Emoji reactions for quick feedback

### For Blog Owner

- ✅ Free forever (no hosting costs)
- ✅ No spam (GitHub authentication required)
- ✅ Easy moderation from GitHub interface
- ✅ Comments stored reliably in GitHub
- ✅ No database setup or maintenance
- ✅ Open source and transparent

### For Community

- ✅ Builds engagement around blog content
- ✅ Creates discussion threads that persist
- ✅ Allows readers to help each other
- ✅ Increases return visits to check responses

---

## Known Limitations

⚠️ **GitHub Account Required**: Readers must have a GitHub account to comment

- **Why**: This is how Giscus authenticates users and prevents spam
- **Mitigation**: Most tech-savvy musicians and developers already have GitHub accounts
- **Alternative**: If broader audience needed, consider Disqus or custom solution

---

## Dependencies

- GitHub Discussions must be enabled on repository
- Giscus app must be installed and authorized
- Environment variables must be set in both development and production

---

## Testing Checklist

### Functional Testing

- [ ] Navigate to a blog post (e.g., `/blog/pictures-of-canada`)
- [ ] Scroll to bottom and verify comment box appears
- [ ] Click "Sign in with GitHub" and authenticate
- [ ] Write a test comment and submit
- [ ] Verify comment appears immediately on the blog
- [ ] Check that comment appears in GitHub Discussions
- [ ] Test emoji reaction by clicking reaction button
- [ ] Switch between light/dark themes - verify styling works

### Moderation Testing

- [ ] Go to GitHub Discussions for the blog post
- [ ] Edit a comment from GitHub
- [ ] Verify edit appears on blog within ~1 minute
- [ ] Delete a comment from GitHub
- [ ] Verify deletion appears on blog within ~1 minute

### Cross-Browser Testing

- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test on mobile device

---

## Documentation

### For Users

Add a note to the About page or blog footer:

> "Comments are powered by GitHub Discussions. Sign in with your GitHub account to join the conversation!"

### For Developers

Document the Giscus setup in `README.md`:

```markdown
## Blog Comments

This blog uses [Giscus](https://giscus.app/) for comments, powered by GitHub Discussions.

### Setup

1. Enable GitHub Discussions on the repository
2. Create a "Blog Comments" category
3. Install the Giscus app
4. Configure environment variables (see `.env.example`)
```

---

## Related Stories

- **WPB-218**: Add comment count badge to blog post cards (Future)
- **WPB-219**: Email notifications for new comments (Future)
- **WPB-220**: Comment moderation guidelines and policy (Future)

---

## Definition of Done

- [ ] GitHub Discussions enabled and configured
- [ ] Giscus app installed and authorized
- [ ] Environment variables set in development and production
- [ ] Comments appear on all blog posts
- [ ] Light and dark themes work correctly
- [ ] Test comments posted and verified
- [ ] Documentation updated
- [ ] Code reviewed and merged
- [ ] Feature tested in production

---

## Estimated Time

- **Setup**: 15-20 minutes
- **Testing**: 10 minutes
- **Documentation**: 5 minutes
- **Total**: ~30-35 minutes

---

## Notes

- Giscus is completely free and open source
- No backend code changes needed - already configured in `siteMetadata.js`
- Comments are stored in GitHub Discussions, not in our database
- Each blog post gets its own Discussion thread automatically
- Blog owner can moderate comments from GitHub's web interface
- Supports markdown in comments
- Supports @mentions of GitHub users
- Works with Content Security Policy (already allowed in `next.config.js`)

---

**Created**: 2025-10-30
**Author**: David Davies
**Story Type**: Feature
**Component**: Blog
