# Piano Style Platform - User Guide

## Overview

**Piano Style** is a decentralized platform that combines a piano-focused blog with a community-driven venue discovery system. Built on the Celo blockchain, the platform rewards users for discovering and verifying piano venues while creating a comprehensive global directory of piano-friendly spaces.

### Key Features

- 🎹 **Piano Blog**: Articles, tutorials, and stories about piano culture
- 🗺️ **Venue Discovery**: Find and share piano venues worldwide
- 💎 **PXP Token Rewards**: Earn tokens for contributing to the community
- ✅ **Curator Verification**: Trusted curators verify venue submissions
- 🌐 **Web3 Integration**: Blockchain-powered transparency and rewards

---

## Current Features (MVP 3 - Live Now)

### 1. Blog & Content

- Browse piano-related articles and tutorials
- Search content by tags and categories
- Author profiles with social links
- RSS feed support
- Comment system (Giscus integration)

### 2. Venue Discovery System

#### For Scouts (Venue Discoverers)

- **Submit New Venues**
  - Navigate to `/submit`
  - Connect your Web3 wallet (MetaMask, Valora, etc.)
  - Fill in venue details:
    - Name, city, contact information
    - Piano availability and type
    - Jam session schedules
    - Operating hours and amenities
  - Submit to blockchain (Celo Alfajores testnet)
  - Earn **50 PXP tokens** when your venue is verified

#### Browse Venues

- **All Venues Page** (`/venues`)
  - Filter by city, piano availability, verification status
  - Search by name or description
  - View venue ratings and reviews
  - See blockchain verification status

- **Venue Details** (`/venueDetails/[id]`)
  - Complete venue information
  - Contact details and website links
  - User reviews and ratings
  - Verification history
  - Map location (coming soon)

### 3. PXP Token & Rewards

**Token Address**: `0x7B1E3d40Acf8ea8717822E23096eFf8fE8573d35` (Celo Alfajores)

**Rewards Contract**: `0x79cC4705739c42628Ac93523AAaCe023B9520d38`

#### How to Earn PXP

1. **New User Reward**: 25 PXP (one-time)
   - Claim via your profile after connecting wallet

2. **Venue Scout**: 50 PXP per verified venue
   - Submit a new venue
   - Wait for curator verification
   - Receive tokens automatically when approved

3. **Curator Verification**: 25 PXP per verification
   - Authorized curators earn for reviewing venues
   - Requires curator status (contact platform owner)

#### Check Your Balance

- View PXP balance in your wallet
- Check transaction history on [Celoscan](https://alfajores.celoscan.io/)

### 4. User Profiles

**Access**: Navigate to `/profile/[your-wallet-address]`

**Profile Features**:

- Display name and bio
- Professional title and skills
- Social media links (Twitter, LinkedIn, GitHub)
- PXP token balance
- Venues discovered count
- Profile slug (custom URL)
- Avatar (IPFS or URL)

**Edit Your Profile**:

- Click "Edit Profile" button
- Update personal information
- Add professional details
- Save changes to database

### 5. Curator Dashboard

**Access**: `/curator` (requires curator authorization)

**Curator Capabilities**:

- Review pending venue submissions
- Verify venue accuracy and quality
- Add curator notes and ratings
- Approve or reject submissions
- Earn 25 PXP per verification
- View verification history

**Verification Process**:

1. Access curator dashboard
2. Review venue details
3. Check contact information validity
4. Add notes and rating (1-5 stars)
5. Approve or reject
6. Transaction sent to blockchain
7. Scout receives PXP if approved

### 6. Web3 Wallet Integration

**Supported Wallets**:

- MetaMask (Desktop & Mobile)
- Valora (Celo native, Mobile)
- Coinbase Wallet
- WalletConnect v2

**Connect Wallet**:

1. Click "Connect Wallet" in navigation
2. Select your wallet provider
3. Approve connection request
4. Switch to Celo Alfajores network (auto-prompt)

**Network Details**:

- Network: Celo Alfajores Testnet
- Chain ID: 44787 (0xaef3)
- RPC URL: https://alfajores-forno.celo-testnet.org
- Explorer: https://alfajores.celoscan.io/

---

## Coming in MVP 4 (Q2 2024)

### QR Code Payment System

- **User Profile QR Cards**
  - Generate printable QR business cards
  - Share profile at events
  - Receive PXP tips via QR scan
  - Multiple themes and layouts (business card, badge, poster)

- **Venue Payment QR Codes**
  - Venues can accept PXP payments
  - QR codes for tips and payments
  - Track payment history
  - Integration with venue profiles

### Hybrid Wallet Experience

- **Progressive Enhancement**
  - Auto-detect Web3 vs non-Web3 users
  - QR code flows for non-crypto users
  - Seamless Web3 wallet integration for crypto users

- **Mobile-First QR Scanner**
  - Scan QR codes to view profiles
  - Scan to send PXP payments
  - Camera permissions handling
  - Torch/flashlight support

### Enhanced Analytics

- **Venue Analytics Dashboard**
  - View counts and engagement
  - QR scan tracking
  - Geographic insights
  - Popular times and trends

- **User Analytics**
  - Profile views
  - PXP earnings history
  - Venues discovered over time
  - Community contributions

---

## Coming in MVP 5 (Q3 2024)

### Advanced Features

#### Event System

- Piano events and performances
- Jam session scheduling
- RSVP and ticketing
- Event discovery by location

#### Community Features

- User-to-user messaging
- Venue check-ins
- Photo sharing
- Community challenges and leaderboards

#### Enhanced Verification

- Multi-curator consensus
- Photo verification requirements
- Real-time venue status updates
- Dispute resolution system

#### Mobile App

- Native iOS and Android apps
- Push notifications
- Offline venue browsing
- Enhanced QR scanning

---

## Getting Started Guide

### For New Users

1. **Explore the Blog**
   - Visit homepage
   - Browse articles about piano culture
   - No wallet required for reading

2. **Connect Your Wallet**
   - Click "Connect Wallet"
   - Choose wallet provider
   - Approve Celo Alfajores network switch
   - Claim your 25 PXP new user reward

3. **Create Your Profile**
   - Visit `/profile/[your-address]`
   - Add display name and bio
   - Set professional title
   - Add social links
   - Save changes

4. **Discover Venues**
   - Browse `/venues`
   - Filter by your city
   - Check out piano availability
   - Read reviews from community

5. **Submit Your First Venue**
   - Found a piano venue? Share it!
   - Navigate to `/submit`
   - Fill in complete details
   - Submit (requires wallet signature)
   - Earn 50 PXP when verified

### For Venue Scouts

**Best Practices**:

- Provide accurate contact information
- Include detailed piano descriptions
- Add operating hours and amenities
- Upload clear photos (coming soon)
- Tag venues appropriately

**Tips for Success**:

- Visit venues before submitting
- Verify piano is publicly accessible
- Include jam session schedules if applicable
- Add website and social media links
- Write helpful descriptions

### For Curators

**Verification Guidelines**:

- Verify venue actually exists
- Check contact information validity
- Assess piano quality and accessibility
- Evaluate venue description accuracy
- Add helpful notes for users
- Rate venues objectively (1-5 stars)

**Curator Responsibilities**:

- Respond to submissions within 48 hours
- Maintain high verification standards
- Provide constructive feedback
- Report fraudulent submissions
- Stay active in the community

---

## Frequently Asked Questions

### General Questions

**Q: Is Piano Style free to use?**
A: Yes! Reading content and browsing venues is completely free. Submitting venues and earning PXP requires a Web3 wallet with minimal CELO for gas fees.

**Q: What is PXP?**
A: PXP (Piano eXperience Points) is the platform's reward token built on Celo. Earn PXP by contributing venues, verifying submissions, and participating in the community.

**Q: Do I need cryptocurrency to use the platform?**
A: Not for browsing! You only need a wallet to submit venues, claim rewards, or edit your profile. Future QR code features will support non-crypto users.

### Technical Questions

**Q: Why Celo blockchain?**
A: Celo offers fast transactions, low fees (< $0.01), mobile-first design, and carbon-negative operations. Perfect for a global community platform.

**Q: How do I get CELO for gas fees?**
A: Visit the [Celo Faucet](https://faucet.celo.org/) to get free testnet CELO for Alfajores. For mainnet, purchase CELO on exchanges.

**Q: Can I use the platform on mobile?**
A: Yes! The web app is mobile-responsive. Use Valora or MetaMask Mobile for the best Web3 experience.

**Q: Where is my data stored?**
A: Venue submissions are recorded on the Celo blockchain for transparency. User profiles and reviews are stored in a PostgreSQL database for performance.

### Token & Rewards Questions

**Q: Can I transfer PXP to other users?**
A: Yes! PXP is a standard ERC-20 token. You can send it to any Celo address via your wallet or the platform's upcoming payment features.

**Q: What can I do with PXP tokens?**
A: Currently, PXP represents community contribution. Future features include: tipping creators, unlocking premium features, event ticketing, and governance voting.

**Q: How long until I receive PXP rewards?**
A: New user rewards are instant (self-claim). Venue scout rewards are sent automatically when a curator approves your submission (usually within 48 hours).

---

## Support & Community

### Get Help

- **Documentation**: Check `/docs` for detailed guides
- **GitHub Issues**: Report bugs at [github.com/yourusername/piano-blog](https://github.com/dhd1956/piano-blog/issues)
- **Email**: support@pianostyle.app (coming soon)

### Stay Connected

- **Twitter**: @PianoStyleApp (coming soon)
- **Discord**: Join our community (coming soon)
- **Newsletter**: Subscribe for updates (coming soon)

### Contributing

We welcome contributions! Check our GitHub repository for:

- Bug reports
- Feature requests
- Code contributions
- Documentation improvements

---

## Technical Details

### Smart Contracts

**Venue Registry Contract**
Address: `0x29FC1Cc9D4451896CaDD41ceA7C6aBd1E71Ab3B2`
Network: Celo Alfajores Testnet

**PXP Token Contract**
Address: `0x7B1E3d40Acf8ea8717822E23096eFf8fE8573d35`
Network: Celo Alfajores Testnet
Standard: ERC-20

**PXP Rewards Contract**
Address: `0x79cC4705739c42628Ac93523AAaCe023B9520d38`
Network: Celo Alfajores Testnet

### Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4.0
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Prisma
- **Blockchain**: Celo (Alfajores testnet)
- **Web3**: Web3.js, @celo/contractkit
- **Content**: MDX with Contentlayer
- **Deployment**: Vercel

### API Endpoints

**Venues API**

- `GET /api/venues` - List all venues
- `POST /api/venues` - Submit new venue
- `GET /api/venues/[id]` - Get venue details
- `PUT /api/venues/[id]` - Update venue (owner only)

**Profile API**

- `GET /api/profile/[address]` - Get user profile
- `PUT /api/profile/[address]` - Update profile (owner only)

**Blockchain API**

- `POST /api/blockchain/sync` - Trigger blockchain sync (admin only)

---

## Roadmap

### Q1 2024 ✅

- [x] Blog platform launch
- [x] Venue registry (blockchain-based)
- [x] PXP token deployment
- [x] Basic rewards system
- [x] User profiles
- [x] Curator dashboard

### Q2 2024 🚧

- [ ] QR code payment system
- [ ] Hybrid wallet support
- [ ] Mobile QR scanner
- [ ] Analytics dashboard
- [ ] Event system (beta)

### Q3 2024 📅

- [ ] Native mobile apps
- [ ] Photo uploads & galleries
- [ ] Advanced search & filters
- [ ] Community messaging
- [ ] Mainnet deployment

### Q4 2024 🔮

- [ ] NFT profile pictures
- [ ] Premium memberships
- [ ] Governance system (DAO)
- [ ] International expansion
- [ ] Partnerships with venues

---

## Privacy & Security

### Data Privacy

- Wallet addresses are public (blockchain nature)
- Email addresses are optional and private
- Profile information is public by default
- You control what information to share

### Security Best Practices

- Never share your private keys
- Verify contract addresses before transactions
- Use hardware wallets for large amounts
- Enable 2FA on your wallet app
- Keep wallet software updated

### Platform Security

- All smart contracts are open source
- Regular security audits (planned)
- Bug bounty program (coming soon)
- Encrypted database connections
- HTTPS everywhere

---

## Terms & Conditions

**Last Updated**: January 2024

By using Piano Style, you agree to:

- Provide accurate information when submitting venues
- Respect intellectual property rights
- Not submit fraudulent or spam content
- Comply with local laws and regulations
- Accept that blockchain transactions are irreversible

**Disclaimer**: Piano Style is currently in beta on Celo Alfajores testnet. PXP tokens have no monetary value and are for platform use only. Use at your own risk.

---

## About Piano Style

Piano Style was created to connect piano enthusiasts worldwide and build a comprehensive, community-driven directory of piano-accessible venues. By combining Web3 technology with traditional social features, we're creating a platform that rewards contributors and celebrates piano culture.

**Mission**: Make piano music more accessible by mapping every piano venue on Earth.

**Vision**: A global community where pianists can discover, share, and celebrate piano spaces everywhere.

**Values**:

- 🎹 **Piano First**: Everything we build serves the piano community
- 🌍 **Community Driven**: Users own and grow the platform together
- 💎 **Fair Rewards**: Contributors earn tokens for their efforts
- ✅ **Quality Content**: Verified information you can trust
- 🔓 **Open & Transparent**: Blockchain-powered accountability

---

_Built with ❤️ by the Piano Style community_

_Powered by Celo blockchain_
