# Sprint 2 Planning Guide

_Based on Sprint 1 Final Analysis_

## Sprint 2 Objectives

Building on the 100% completion of Sprint 1, Sprint 2 should focus on:

1. Completing the economic reward system
2. Implementing multi-verifier consensus
3. Enhancing venue discovery with advanced features
4. Building out user profiles and reputation

---

## Recommended Sprint 2 Backlog

### MUST HAVE (Critical Path)

#### 1. Complete Economic/Reward System

**Epic:** Economic System & Payments

- **Story:** TCoin Reward Distribution
  - As a venue scout, I want to receive TCoin rewards when my submitted venue is approved so that I'm incentivized to contribute quality venues
  - AC: Scout receives predetermined TCoin amount upon venue approval
  - AC: Transaction is recorded on blockchain
  - AC: Scout can view reward balance in UI

- **Story:** Reward Calculation Logic
  - As the system, I need to calculate appropriate rewards based on venue quality so that scouts are fairly compensated
  - AC: Base reward amount configured per venue
  - AC: Quality multipliers applied based on verification feedback
  - AC: Reward amounts are transparent to users

- **Story:** TCoin Contract Integration
  - As a developer, I need to integrate the TCoin smart contract so that rewards can be distributed
  - AC: TCoin contract deployed on Celo Alfajores
  - AC: VenueRegistry can trigger TCoin transfers
  - AC: Scout wallet receives tokens automatically

#### 2. Multi-Verifier Consensus

**Epic:** Venues Discovery & Content Management

- **Story:** Three-Verifier Requirement
  - As a community member, I want venues to require 3 verifier approvals so that quality is ensured through consensus
  - AC: Venues need 3 different verifiers to approve
  - AC: Blog owner can still solo-verify (bypass)
  - AC: Verification status shows number of approvals (e.g., "2/3 verified")

- **Story:** Verifier Voting Interface
  - As a verifier, I want to see who else has verified a venue so that I can make informed decisions
  - AC: Display list of verifiers who approved
  - AC: Show remaining verifications needed
  - AC: Prevent duplicate votes from same verifier

#### 3. Production IPFS Integration

**Epic:** Infrastructure & Technical Debt

- **Story:** Real IPFS Storage
  - As a developer, I need to replace simulated IPFS with production Pinata integration so that venue data is permanently stored
  - AC: Venue metadata uploaded to IPFS via Pinata
  - AC: IPFS hash stored on blockchain
  - AC: Venue data retrievable from IPFS hash
  - AC: Fallback mechanism if IPFS unavailable

### SHOULD HAVE (High Value)

#### 4. Enhanced Venue Discovery

**Epic:** Venues Discovery & Content Management

- **Story:** City-Based Filtering
  - As a user, I want to filter venues by city so that I can find pianos near me
  - AC: Dropdown or search for city selection
  - AC: Venue list updates based on city filter
  - AC: Shows count of venues per city

- **Story:** Piano Availability Filter
  - As a user, I want to filter by piano availability so that I know which venues currently have pianos
  - AC: Filter by "Has Piano", "No Piano", "All"
  - AC: Piano status clearly indicated on venue cards
  - AC: Filter persists across page refreshes

- **Story:** Map View
  - As a user, I want to see venues on a map so that I can visualize their locations
  - AC: Interactive map showing venue markers
  - AC: Click marker to see venue details
  - AC: Toggle between list and map view

#### 5. User Profiles & Reputation

**Epic:** User Onboarding and Identity Management

- **Story:** Scout Profile Page
  - As a scout, I want to view my profile showing my contributions so that I can track my activity
  - AC: Profile shows wallet address
  - AC: List of submitted venues with status
  - AC: Total rewards earned
  - AC: Scout reputation score

- **Story:** Verifier Dashboard
  - As a verifier, I want a dashboard showing my verification statistics so that I can track my contributions
  - AC: Number of venues verified
  - AC: Pending verifications count
  - AC: Verification accuracy score
  - AC: Link to curator interface

### COULD HAVE (Nice to Have)

#### 6. Venue Enhancements

- **Story:** Venue Photo Upload
  - As a scout, I want to upload photos of the venue so that verifiers have more context
  - AC: Upload 1-5 photos during submission
  - AC: Photos stored on IPFS
  - AC: Photos displayed in verification interface

- **Story:** Operating Hours
  - As a user, I want to see venue operating hours so that I know when I can visit
  - AC: Add operating hours during submission
  - AC: Display hours on venue detail page
  - AC: Indicate if venue is open now

#### 7. Phone Number Support

- **Story:** Phone Number Verification (Resolve WPB-2 Question)
  - As a product owner, I need clarity on phone-only users so that we can support non-wallet users
  - AC: Define if phone-only users can submit venues
  - AC: Implement SMS verification if needed
  - AC: Link phone numbers to wallet addresses

---

## Sprint 2 Success Criteria

### Definition of Done for Sprint 2

- TCoin rewards are distributed to approved venue scouts
- Multi-verifier consensus (3 verifiers) is functional
- Production IPFS integration is complete
- At least 2 enhanced discovery features are delivered
- All code is tested and deployed to testnet
- Documentation is updated

### Sprint 2 Goal (Proposed)

> "Complete the economic reward loop and implement community-driven verification with enhanced venue discovery capabilities"

### Key Results

1. Scouts receive TCoin rewards for approved venues
2. Community can verify venues through 3-verifier consensus
3. Venue metadata stored permanently on IPFS
4. Users can filter venues by city and piano availability
5. Scout and verifier profiles display contribution statistics

---

## Technical Considerations

### Smart Contract Changes Needed

1. **TCoin Contract**
   - Deploy new ERC-20 contract for TCoin
   - Add minting/distribution functions
   - Integrate with VenueRegistry

2. **VenueRegistry Updates**
   - Add multi-verifier tracking
   - Add reward distribution trigger
   - Add IPFS hash validation

### Frontend Changes Needed

1. **New Pages**
   - `/profile/[address]` - User profile page
   - `/dashboard` - Verifier dashboard
   - `/map` - Map view of venues

2. **Component Updates**
   - Venue cards with enhanced filters
   - Verification status indicators (2/3, 3/3)
   - Reward balance display

3. **API Routes**
   - `/api/profile/[address]` - User stats
   - `/api/venues/by-city/[city]` - City filtering
   - `/api/ipfs/upload` - IPFS upload proxy

### Third-Party Integrations

1. **Pinata/IPFS**
   - API key setup
   - Upload endpoints
   - Gateway configuration

2. **Map Provider** (if implementing map view)
   - Google Maps or Mapbox API
   - Geocoding service
   - Marker clustering

---

## Risk Assessment for Sprint 2

### High Risk

1. **Smart Contract Modifications**
   - Risk: Breaking existing venue submission flow
   - Mitigation: Comprehensive testing on testnet before mainnet

2. **IPFS Integration Complexity**
   - Risk: Upload failures, slow performance
   - Mitigation: Implement retry logic and fallbacks

### Medium Risk

3. **Multi-Verifier Logic**
   - Risk: Complex consensus logic with edge cases
   - Mitigation: Detailed acceptance criteria and test cases

4. **TCoin Economic Model**
   - Risk: Reward amounts may need adjustment
   - Mitigation: Make rewards configurable, not hardcoded

### Low Risk

5. **UI/UX Enhancements**
   - Risk: User confusion with new features
   - Mitigation: Clear onboarding and help text

---

## Suggested Sprint 2 Capacity

Based on Sprint 1 velocity:

- **Sprint 1 Velocity:** 8 stories completed
- **Recommended Sprint 2 Commitment:** 8-10 stories
- **Prioritization:** Focus on MUST HAVE items first

### Recommended Story Point Distribution

- MUST HAVE (Critical Path): 60% of capacity
- SHOULD HAVE (High Value): 30% of capacity
- COULD HAVE (Nice to Have): 10% of capacity

---

## Open Questions for Sprint 2 Planning

1. **Phone Number Users:** Should non-wallet users be able to submit venues? (From WPB-2)
2. **Reward Amounts:** What is the TCoin reward per approved venue?
3. **Verifier Requirements:** How do users become verifiers? Is there a reputation threshold?
4. **IPFS Provider:** Use Pinata, Web3.Storage, or self-hosted IPFS node?
5. **Map View:** Is map view MVP for Sprint 2 or can it wait until Sprint 3?
6. **Token Economics:** What is the TCoin supply? Inflation rate? Vesting schedule?

---

## Dependencies & Prerequisites

Before starting Sprint 2:

- [ ] TCoin contract architecture approved
- [ ] IPFS provider account created (Pinata/Web3.Storage)
- [ ] Reward amount decided by product owner
- [ ] Multi-verifier consensus rules documented
- [ ] Database schema updates designed (if needed)
- [ ] Map provider selected and API key obtained (if implementing map)

---

## Success Metrics to Track

### Quantitative Metrics

- Number of venues submitted
- Number of venues approved
- TCoin rewards distributed
- Number of verifiers active
- Average time to venue approval

### Qualitative Metrics

- User feedback on reward system
- Verifier satisfaction with consensus model
- IPFS performance and reliability
- User engagement with new discovery features

---

**Next Steps:**

1. Review Sprint 1 retrospective feedback
2. Refine Sprint 2 backlog with team
3. Estimate story points for each item
4. Confirm sprint capacity and commitment
5. Schedule Sprint 2 kick-off meeting

---

_Document Created: October 29, 2025_  
_Sprint 1 Completion: 100%_  
_Recommended Sprint 2 Duration: 2-3 weeks_
