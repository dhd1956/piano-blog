# Custom Domain Setup Plan: GlobalPiano.Network

## Overview

Migrate production environment from `piano-blog.vercel.app` to `globalpiano.network` (purchased from Porkbun) while maintaining the Vercel URL as a staging/preview environment.

## User Requirements

- **Primary Domain**: `globalpiano.network` (no www)
- **Staging Environment**: Keep `piano-blog.vercel.app` for development/testing
- **DNS Provider**: Porkbun
- **Hosting**: Vercel
- **Blockchain Network**: Celo Mainnet for production, Celo Sepolia Testnet for staging
- **PXP Ledger**: Production PXP on mainnet, test PXP on testnet

---

## Best Practices Recommendation: Environment Variables

**RECOMMENDATION**: Use environment variables everywhere instead of hardcoded domains.

**Why?**

1. **Environment Flexibility**: Different URLs for dev/staging/prod without code changes
2. **12-Factor App Methodology**: Configuration belongs in environment, not code
3. **No Rebuilds Needed**: Change domains via Vercel dashboard without redeploying
4. **Easier Maintenance**: Single source of truth for domain configuration
5. **Security**: Sensitive OAuth callback URLs managed outside codebase

**Trade-offs**:

- ✅ More flexible and maintainable
- ✅ Industry standard for production apps
- ⚠️ Requires setting environment variables in Vercel dashboard
- ⚠️ Slightly more complex initial setup (but worth it)

---

## Blockchain Network Migration: Testnet → Mainnet

### Overview

**Critical Requirement**: Production domain (`globalpiano.network`) will use **Celo Mainnet** for real PXP tokens and transactions, while staging (`piano-blog.vercel.app`) continues to use **Celo Sepolia Testnet** for development and testing.

### ⚠️ Decision Required: When to Deploy Mainnet?

**Option 1: Deploy Domain + Mainnet Together** (Higher Risk)

- Pros: Complete production setup in one go
- Cons: More complexity, higher risk of issues, longer timeline
- Timeline: ~8-15 hours of active work

**Option 2: Deploy Domain First, Mainnet Later** (Recommended)

- Pros: Incremental rollout, test domain migration separately, reduce risk
- Cons: Production site uses testnet initially (acceptable for MVP)
- Timeline: ~1.5 hours for domain, then ~6-13 hours for mainnet later
- **Allows testing production domain with testnet before committing to mainnet**

**Recommendation**: Start with Option 2

1. Deploy `globalpiano.network` with testnet (Celo Sepolia)
2. Test all features thoroughly on production domain
3. Once stable, deploy mainnet contracts and switch production to mainnet
4. Keep `piano-blog.vercel.app` on testnet for ongoing development

### Network Details

#### Celo Sepolia Testnet (Current - Staging Only)

- **Chain ID**: 11142220 (0xAA044C)
- **Purpose**: Development, testing, staging environment
- **Tokens**: Test CELO, test PXP (no real value)
- **Explorer**: https://celo-sepolia.blockscout.com
- **RPC**: https://rpc.ankr.com/celo_sepolia

#### Celo Mainnet (Production Target)

- **Chain ID**: 42220 (0xA4EC)
- **Purpose**: Production with real value transactions
- **Tokens**: Real CELO, real PXP (actual value)
- **Explorer**: https://celoscan.io
- **RPC**: https://forno.celo.org

### Current Deployed Contracts (Testnet Only)

| Contract       | Address                                      | Network      | Status  |
| -------------- | -------------------------------------------- | ------------ | ------- |
| PXP Token      | `0x04eAE71832147D75D4B69B3FFB5d9514e8471c75` | Celo Sepolia | ✅ Live |
| PXP Rewards    | `0x28aCAf06E470Dad9890d75B7fD55fBDe913D6128` | Celo Sepolia | ✅ Live |
| Venue Registry | `0x325F81e26CF5A757dc63c85f2CE59621D1d1645E` | Celo Sepolia | ✅ Live |

**Status**: All contracts are deployed ONLY on testnet. Mainnet deployment required for production.

---

### Mainnet Deployment Requirements

#### 1. Prerequisites Before Mainnet Deployment

**Technical**:

- [ ] Foundry contracts fully tested (run `cd foundry-contracts && forge test`)
- [ ] Security audit recommended (especially for PXP Token and Rewards contracts)
- [ ] Owner wallet secured with hardware wallet (Ledger/Trezor)
- [ ] Multi-sig wallet considered for contract ownership
- [ ] Sufficient CELO in deployer wallet for gas fees (~5-10 CELO recommended)

**Business**:

- [ ] PXP tokenomics finalized (total supply, distribution, minting policy)
- [ ] Legal review for token classification (if applicable in your jurisdiction)
- [ ] Reward amounts confirmed for production
- [ ] Venue verification process validated on testnet

#### 2. Mainnet Deployment Process

**Step-by-step guide**:

```bash
# 1. Navigate to Foundry contracts
cd foundry-contracts

# 2. Set environment variables for mainnet (create .env.mainnet)
PRIVATE_KEY="your-hardware-wallet-or-secure-key"
RPC_URL="https://forno.celo.org"
CHAIN_ID="42220"
ETHERSCAN_API_KEY="your-celoscan-api-key" # for verification

# 3. Deploy PXP Token to mainnet
forge script script/DeployPXPToken.s.sol --rpc-url $RPC_URL --broadcast --verify

# 4. Deploy PXP Rewards contract (with PXP Token address)
# Edit script to use mainnet PXP Token address
forge script script/DeployPXPRewards.s.sol --rpc-url $RPC_URL --broadcast --verify

# 5. Deploy Venue Registry contract (if needed)
forge script script/DeployVenueRegistry.s.sol --rpc-url $RPC_URL --broadcast --verify

# 6. Fund PXP Rewards contract with tokens
# Transfer initial PXP supply to PXP Rewards contract so it can distribute rewards

# 7. Add authorized verifiers/curators
# Call appropriate functions to whitelist curator addresses

# 8. Save deployed addresses to DEPLOYED_CONTRACTS.md
```

**Expected costs**:

- PXP Token deployment: ~0.5-1 CELO
- PXP Rewards deployment: ~0.5-1 CELO
- Venue Registry deployment: ~0.5-1 CELO
- Verification: Free on Celoscan
- **Total**: ~2-5 CELO (~$2-10 USD at current prices)

#### 3. Database Considerations

**Critical Decision**: What happens to existing testnet data?

**Option A: Fresh Start on Mainnet** (Recommended for MVP)

- Pros: Clean slate, no testnet pollution, clear separation
- Cons: Users lose testnet PXP (acceptable since it's test tokens)
- Implementation: Database tracks which chain each record is on

**Option B: Migrate Venue Data (More Complex)**

- Pros: Preserve venue discoveries from testnet
- Cons: More complex migration, mixing test/prod data
- Implementation: Add `chainId` field to Venue table, filter by network

**Recommendation**: Option A - Fresh start on mainnet. Testnet was for testing; production should be clean.

#### 4. Environment-Based Network Configuration

**Code changes required** (in addition to domain changes):

**File**: `config/reown.tsx`

Add network selection based on environment:

```typescript
// Determine which network to use based on environment
const isProduction = process.env.NEXT_PUBLIC_APP_URL?.includes('globalpiano.network')
const primaryNetwork = isProduction ? celo : celoSepolia // Mainnet for prod, testnet for staging

export const networks = [primaryNetwork]

// Also update contract addresses based on environment
export const PXP_TOKEN_ADDRESS = isProduction
  ? process.env.NEXT_PUBLIC_PXP_TOKEN_ADDRESS_MAINNET!
  : process.env.NEXT_PUBLIC_PXP_TOKEN_ADDRESS_TESTNET!

export const PXP_REWARDS_ADDRESS = isProduction
  ? process.env.NEXT_PUBLIC_PXP_REWARDS_ADDRESS_MAINNET!
  : process.env.NEXT_PUBLIC_PXP_REWARDS_ADDRESS_TESTNET!

export const VENUE_REGISTRY_ADDRESS = isProduction
  ? process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET!
  : process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET!
```

**Environment variables** (add to Vercel):

**Production Environment**:

```bash
# Celo Mainnet Configuration
NEXT_PUBLIC_CHAIN_ID="42220"
NEXT_PUBLIC_NETWORK_NAME="Celo Mainnet"
NEXT_PUBLIC_PXP_TOKEN_ADDRESS_MAINNET="<deployed-mainnet-address>"
NEXT_PUBLIC_PXP_REWARDS_ADDRESS_MAINNET="<deployed-mainnet-address>"
NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET="<deployed-mainnet-address>"
```

**Preview/Staging Environment**:

```bash
# Celo Sepolia Testnet Configuration
NEXT_PUBLIC_CHAIN_ID="11142220"
NEXT_PUBLIC_NETWORK_NAME="Celo Sepolia Testnet"
NEXT_PUBLIC_PXP_TOKEN_ADDRESS_TESTNET="0x04eAE71832147D75D4B69B3FFB5d9514e8471c75"
NEXT_PUBLIC_PXP_REWARDS_ADDRESS_TESTNET="0x28aCAf06E470Dad9890d75B7fD55fBDe913D6128"
NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET="0x325F81e26CF5A757dc63c85f2CE59621D1d1645E"
```

---

### Critical Warnings & Risks

⚠️ **Security Risks**:

- Mainnet contracts handle REAL value - bugs can cause permanent loss
- Smart contract exploits can drain entire PXP supply
- Owner private key compromise = total contract control loss
- Recommendation: Security audit before mainnet launch

⚠️ **Irreversibility**:

- Smart contracts are immutable once deployed
- Cannot fix bugs without redeployment (new addresses)
- Users must migrate to new contracts if redeployment needed

⚠️ **Gas Costs**:

- Every mainnet transaction costs real CELO
- Venue submissions, verifications, PXP claims all cost gas
- Consider gas sponsorship for user experience (Account Abstraction)

⚠️ **Testing Importance**:

- Test EVERYTHING on Celo Sepolia testnet first
- Simulate high-value transactions
- Test contract upgrade paths if using upgradeable contracts

---

### Rollback Plan for Mainnet Issues

If critical issues discovered after mainnet deployment:

1. **Immediate**: Pause contracts if emergency pause functionality exists
2. **Communication**: Notify users via website banner/Discord/social media
3. **Assessment**: Identify bug severity and impact
4. **Fix Options**:
   - If using upgradeable contracts: Deploy fixed implementation
   - If not upgradeable: Deploy new contracts, migrate users
5. **Recovery**: Reimburse affected users if funds were lost (from team wallet)

---

### Testing Checklist Before Mainnet Launch

On **Celo Sepolia Testnet** (`piano-blog.vercel.app`):

- [ ] Deploy test versions of all three contracts
- [ ] Fund PXP Rewards with test tokens
- [ ] Submit 10+ test venues
- [ ] Verify venues with curator accounts
- [ ] Claim new user rewards
- [ ] Claim venue discovery rewards
- [ ] Test venue uniqueness checks (duplicates rejected)
- [ ] Test wallet connection (MetaMask, Google OAuth)
- [ ] Test QR code generation and scanning
- [ ] Verify all PXP rewards are credited correctly
- [ ] Load test with multiple users/venues
- [ ] Test contract ownership functions (only owner can call)

Only proceed to mainnet after ALL tests pass.

---

## Implementation Plan

### Phase 1: DNS Configuration (Porkbun → Vercel)

**In Porkbun Dashboard:**

1. **Add A Record for Root Domain**

   ```
   Type: A
   Host: @ (or leave blank for root)
   Answer: 76.76.21.21
   TTL: 600 (or default)
   ```

2. **Add CNAME for www Subdomain** (optional, for redirect)
   ```
   Type: CNAME
   Host: www
   Answer: cname.vercel-dns.com
   TTL: 600
   ```

**In Vercel Dashboard:**

1. Go to Project Settings → Domains
2. Click "Add Domain"
3. Enter `globalpiano.network`
4. Vercel will verify DNS propagation (may take 24-48 hours)
5. Enable "Redirect www to non-www" option
6. Enable HTTPS (Vercel auto-provisions SSL certificate)

**Expected Result**: `globalpiano.network` → Production, `piano-blog.vercel.app` → Staging

---

### Phase 2: Code Changes (Replace Hardcoded Domains)

#### 2.1 Update Site Metadata

**File**: `data/siteMetadata.js`

**Change Line 12**:

```javascript
// Before
siteUrl: 'https://tailwind-nextjs-starter-blog.vercel.app',

// After
siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
```

**Impact**: SEO metadata, sitemaps, canonical URLs will use environment variable

---

#### 2.2 Update Reown/WalletConnect Configuration

**File**: `config/reown.tsx`

**Change Lines 53-56**:

```typescript
// Before
export const metadata = {
  name: 'Piano Style Blog',
  description: 'Developing My Piano Style - A blog and venue discovery platform',
  url: 'https://piano-blog.vercel.app',
  icons: ['https://piano-blog.vercel.app/static/favicons/favicon.ico'],
}

// After
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const metadata = {
  name: 'GlobalPiano.Network',
  description: 'Discover piano-friendly venues and connect with the global piano community',
  url: APP_URL,
  icons: [`${APP_URL}/static/favicons/favicon.ico`],
}
```

**Impact**: Wallet connection modals will show correct domain

---

#### 2.3 Update QR Code Components

**File**: `components/qr/VenueQRCard.tsx`

**Change Lines 69-72**:

```typescript
// Before
const baseUrl =
  typeof window !== 'undefined'
    ? `${window.location.origin}/venueDetails/${venueData.id}`
    : `https://GlobalPiano.Network/venueDetails/${venueData.id}`

// After
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const baseUrl =
  typeof window !== 'undefined'
    ? `${window.location.origin}/venueDetails/${venueData.id}`
    : `${APP_URL}/venueDetails/${venueData.id}`
```

**File**: `components/qr/UserProfileQRCard.tsx`

**Change Line 38** (description string):

```typescript
// Before
const PROFILE_DESCRIPTION =
  'Connect with me on GlobalPiano.Network! Scan to view my profile, venues discovered, and piano journey.'

// After
const PROFILE_DESCRIPTION =
  'Connect with me! Scan to view my profile, venues discovered, and piano journey.'
```

**Change Lines 142-145**:

```typescript
// Before
const baseUrl =
  typeof window !== 'undefined'
    ? `${window.location.origin}/profile/${profileIdentifier}`
    : `https://GlobalPiano.Network/profile/${profileIdentifier}`

// After
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const baseUrl =
  typeof window !== 'undefined'
    ? `${window.location.origin}/profile/${profileIdentifier}`
    : `${APP_URL}/profile/${profileIdentifier}`
```

**Impact**: QR codes will use environment-based URLs

---

#### 2.4 Update Leaderboard Metadata

**File**: `app/leaderboard/page.tsx`

**Change Lines 5-10**:

```typescript
// Before
export const metadata: Metadata = {
  title: 'PXP Leaderboard | GlobalPiano.Network',
  description:
    'See who has earned the most PXP points in the GlobalPiano.Network community. Track your progress and compete with other piano enthusiasts.',
  openGraph: {
    title: 'PXP Leaderboard | GlobalPiano.Network',
    description: 'Top contributors ranked by PXP earned in the piano community',
    type: 'website',
  },
}

// After
export const metadata: Metadata = {
  title: 'PXP Leaderboard | GlobalPiano.Network',
  description:
    'See who has earned the most PXP points in our piano community. Track your progress and compete with other piano enthusiasts.',
  openGraph: {
    title: 'PXP Leaderboard | GlobalPiano.Network',
    description: 'Top contributors ranked by PXP earned in the piano community',
    type: 'website',
  },
}
```

**Note**: Keeping "GlobalPiano.Network" in titles/branding is fine - just remove from URLs

---

### Phase 3: Environment Variable Configuration

#### 3.1 Update Local Development (.env.local)

**File**: `.env.local` (or `.env`)

```bash
# Application URL (used for emails, OAuth callbacks, QR codes)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# YouTube OAuth Redirect URI
YOUTUBE_OAUTH_REDIRECT_URI="http://localhost:3000/api/content/youtube/oauth/callback"
```

**Keep local development URLs unchanged**

---

#### 3.2 Configure Vercel Production Environment Variables

**In Vercel Dashboard** → Project Settings → Environment Variables

**Add/Update for Production Environment**:

| Variable Name                | Value                                                            | Environment |
| ---------------------------- | ---------------------------------------------------------------- | ----------- |
| `NEXT_PUBLIC_APP_URL`        | `https://globalpiano.network`                                    | Production  |
| `YOUTUBE_OAUTH_REDIRECT_URI` | `https://globalpiano.network/api/content/youtube/oauth/callback` | Production  |

**Add/Update for Preview Environment** (optional, for staging):

| Variable Name                | Value                                                              | Environment |
| ---------------------------- | ------------------------------------------------------------------ | ----------- |
| `NEXT_PUBLIC_APP_URL`        | `https://piano-blog.vercel.app`                                    | Preview     |
| `YOUTUBE_OAUTH_REDIRECT_URI` | `https://piano-blog.vercel.app/api/content/youtube/oauth/callback` | Preview     |

**Important**: After adding environment variables, **redeploy** your application for them to take effect.

---

### Phase 4: External Service Updates

#### 4.1 Update Google Cloud Console (YouTube OAuth)

**Location**: Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs

**Update Authorized Redirect URIs**:

```
Production:
https://globalpiano.network/api/content/youtube/oauth/callback

Staging (optional):
https://piano-blog.vercel.app/api/content/youtube/oauth/callback

Development:
http://localhost:3000/api/content/youtube/oauth/callback
```

**Why**: YouTube OAuth won't work without whitelisting your production domain

---

#### 4.2 Update Reown/WalletConnect Project Settings

**Location**: Reown Cloud Dashboard → Your Project → Settings

**Update Allowed Domains**:

```
Production:
https://globalpiano.network

Staging (optional):
https://piano-blog.vercel.app

Development:
http://localhost:3000
```

**Why**: Wallet connections will fail if domain not whitelisted

---

### Phase 5: Testing & Verification Checklist

After deployment, test the following on `https://globalpiano.network`:

#### Basic Functionality

- [ ] Site loads correctly
- [ ] HTTPS certificate is valid (padlock in browser)
- [ ] www redirects to non-www (if configured)
- [ ] All images and assets load

#### Authentication & OAuth

- [ ] User registration works
- [ ] Email verification links use correct domain
- [ ] Password reset links use correct domain
- [ ] Magic link login uses correct domain
- [ ] Wallet connection (MetaMask/Google OAuth) works
- [ ] YouTube OAuth authorization flow works

#### QR Codes

- [ ] On-screen QR codes scan to correct production URL
- [ ] Downloaded QR codes scan to correct production URL
- [ ] QR code URLs don't have localhost or staging URLs

#### Emails

- [ ] Verification emails contain production domain links
- [ ] Password reset emails contain production domain links
- [ ] All email links are clickable and work

#### Referral System

- [ ] Referral share URLs use production domain
- [ ] Referral links work correctly

#### SEO & Metadata

- [ ] Open Graph tags use production domain
- [ ] Sitemap uses production domain
- [ ] Canonical URLs use production domain

---

## Rollback Plan

If issues occur after migration:

1. **Immediate**: In Vercel, remove custom domain temporarily
2. **DNS**: Keep Porkbun DNS records (they're harmless if domain not connected)
3. **Code**: Revert commits if environment variables cause issues
4. **OAuth**: Google OAuth and Reown will still work with staging URL
5. **Environment Variables**: Can change in Vercel dashboard without code changes

---

## Timeline Estimate

### Domain Migration Only (No Mainnet)

| Phase                    | Estimated Time | Notes                                     |
| ------------------------ | -------------- | ----------------------------------------- |
| DNS Configuration        | 5-10 minutes   | Porkbun setup                             |
| DNS Propagation          | 1-48 hours     | Waiting period (usually 1-2 hours)        |
| Code Changes (Domain)    | 20-30 minutes  | 5 files to update for env vars            |
| Vercel Setup             | 10-15 minutes  | Environment variables + domain connection |
| External Service Updates | 10-15 minutes  | Google Cloud + Reown dashboard            |
| Testing                  | 30-45 minutes  | Domain + OAuth testing                    |
| **Total Active Work**    | ~1.5 hours     | Excluding DNS propagation wait time       |

### Full Migration (Domain + Mainnet Deployment)

| Phase                            | Estimated Time | Notes                                     |
| -------------------------------- | -------------- | ----------------------------------------- |
| **Domain Migration**             | 1.5 hours      | (as above)                                |
| Mainnet Pre-Launch Testing       | 2-3 hours      | Comprehensive testnet validation          |
| Smart Contract Security Review   | 4-8 hours      | Code audit, vulnerability checks          |
| Mainnet Deployment               | 30-60 minutes  | Deploy 3 contracts, fund, configure       |
| Code Changes (Network Selection) | 30-45 minutes  | Update reown.tsx for dual-network support |
| Post-Deployment Testing          | 1-2 hours      | Verify all features work on mainnet       |
| **Total Active Work**            | ~8-15 hours    | Excluding DNS propagation                 |

**Recommendation**: Deploy domain migration first, test thoroughly on testnet, then do mainnet deployment separately after validation.

---

## Critical Files to Modify

### Domain Migration

1. `data/siteMetadata.js` - SEO/sitemap configuration (use env var)
2. `config/reown.tsx` - Wallet connection metadata + **network selection**
3. `components/qr/VenueQRCard.tsx` - Venue QR code URLs (use env var)
4. `components/qr/UserProfileQRCard.tsx` - Profile QR code URLs (use env var)
5. `app/leaderboard/page.tsx` - Page metadata strings

### Blockchain Network Migration

6. `config/reown.tsx` - Add environment-based network selection (mainnet vs testnet)
7. `DEPLOYED_CONTRACTS.md` - Document mainnet contract addresses after deployment
8. `.env.local` - Add mainnet/testnet contract address environment variables

### Foundry Contracts (For Mainnet Deployment)

9. `foundry-contracts/script/DeployPXPToken.s.sol` - Token deployment script
10. `foundry-contracts/script/DeployPXPRewards.s.sol` - Rewards deployment script
11. `foundry-contracts/script/DeployVenueRegistry.s.sol` - Registry deployment script

---

## Post-Migration Monitoring

**First 24 Hours**:

- Monitor Vercel deployment logs for errors
- Check email deliverability (verification, password reset)
- Test OAuth flows (YouTube, Google, WalletConnect)
- Verify QR code functionality
- Monitor DNS propagation status

**First Week**:

- Watch for user-reported issues
- Check SEO indexing (Google Search Console)
- Verify SSL certificate auto-renewal is configured
- Monitor analytics for traffic drop (indicating broken links)

---

## Notes

### Domain Migration

- **No downtime expected**: Vercel handles domain migration gracefully
- **SSL is automatic**: Vercel provisions Let's Encrypt certificates
- **DNS takes time**: Full global propagation can take up to 48 hours
- **Environment variables are powerful**: Consider this for all future configuration
- **Staging remains useful**: Keep `piano-blog.vercel.app` for testing before production deploys

### Blockchain Network

- **Testnet is safe**: Can launch production domain on testnet initially
- **Mainnet is permanent**: Smart contracts cannot be easily changed once deployed
- **Security first**: Audit contracts before mainnet deployment
- **Phased approach recommended**: Domain first, mainnet later
- **Real money involved**: Mainnet transactions have real costs and value
- **Test everything twice**: Once on testnet staging, once on testnet production domain, then mainnet

### Implementation Phases

**Phase 1**: Domain migration with testnet (globalpiano.network uses Celo Sepolia)
**Phase 2**: Mainnet deployment once Phase 1 is stable (globalpiano.network switches to Celo Mainnet)

This allows production domain testing before committing to real-value blockchain transactions.
