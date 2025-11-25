# Deployed Smart Contracts

## Production Contracts (Celo Sepolia Testnet)

### Active Contracts (Currently Used)

| Contract           | Version | Address                                      | Network      | Status  |
| ------------------ | ------- | -------------------------------------------- | ------------ | ------- |
| **PXP Token**      | V1      | `0x04eAE71832147D75D4B69B3FFB5d9514e8471c75` | Celo Sepolia | ✅ LIVE |
| **PXP Rewards**    | V1      | `0x28aCAf06E470Dad9890d75B7fD55fBDe913D6128` | Celo Sepolia | ✅ LIVE |
| **Venue Registry** | V1      | `0x325F81e26CF5A757dc63c85f2CE59621D1d1645E` | Celo Sepolia | ✅ LIVE |

### Contract Details

#### PXP Token (V1)

- **Symbol:** PXP
- **Name:** Piano eXPerience Token
- **Standard:** ERC-20
- **Decimals:** 18
- **Initial Supply:** 1,000,000 PXP
- **Features:** Mintable, Burnable, Ownable
- **Contract File:** `foundry-contracts/src/PXPToken.sol`
- **Explorer:** [View on Celoscan](https://celo-sepolia.blockscout.com/address/0x04eAE71832147D75D4B69B3FFB5d9514e8471c75)

#### PXP Rewards (V1)

- **Purpose:** Distribute PXP rewards for user actions
- **Reward Amounts:**
  - New User: 25 PXP (hardcoded)
  - Scout (venue discovery): 50 PXP (hardcoded)
  - Verifier (venue verification): 25 PXP (hardcoded)
- **Features:** New user rewards, venue verification rewards, payment tracking
- **Limitations:** Reward amounts are hardcoded constants (cannot be changed without redeployment)
- **Contract File:** `foundry-contracts/src/PXPRewards.sol` (V1 features)
- **Explorer:** [View on Celoscan](https://celo-sepolia.blockscout.com/address/0x28aCAf06E470Dad9890d75B7fD55fBDe913D6128)

#### Venue Registry (V1)

- **Purpose:** Track piano venues with on-chain verification
- **Data Storage:** Hybrid (metadata on IPFS, verification on-chain)
- **Features:** Venue submission, multi-curator verification, uniqueness checks
- **Verification Requirements:** 2-3 curator approvals needed
- **Contract File:** `foundry-contracts/src/VenueRegistry.sol`
- **Explorer:** [View on Celoscan](https://celo-sepolia.blockscout.com/address/0x325F81e26CF5A757dc63c85f2CE59621D1d1645E)

---

## Pending Deployments (Code Complete, Ready to Deploy)

### PXP Rewards V2

**Status:** 🟡 Code Complete, Tests Passing, Awaiting Deployment

**Key Changes from V1:**

- ✅ **Configurable reward amounts** (no longer hardcoded)
- ✅ Owner can update rewards via `setNewUserReward()`, `setScoutReward()`, `setVerifierReward()`
- ✅ Validation enforced (1-1000 PXP range)
- ✅ `RewardAmountUpdated` event for transparency
- ✅ Comprehensive test coverage (21 tests passing)

**Contract File:** `foundry-contracts/src/PXPRewards.sol` (with V2 features)

**Deployment Script:** `foundry-contracts/script/DeployPXPRewardsV2.s.sol`

**Documentation:** `foundry-contracts/DEPLOY_V2_GUIDE.md`

**Testing:**

```bash
cd foundry-contracts
forge test --match-path test/PXPRewards.t.sol -vv
# Expected: 21 tests passed
```

**Deployment Command:**

```bash
forge script script/DeployPXPRewardsV2.s.sol:DeployPXPRewardsV2 \
  --rpc-url $CELO_SEPOLIA_RPC \
  --broadcast \
  --verify
```

**Migration Plan:**

1. Deploy V2 contract
2. Fund V2 with PXP tokens
3. Add authorized verifiers to V2
4. Update `.env.local` with new V2 address
5. Optionally withdraw funds from V1 using `emergencyWithdraw()`

---

## Planned Deployments (In Development)

### Venue Registry V2

**Status:** 🔴 In Development (ABI defined, not ready)

**Planned Changes:**

- On-chain data storage instead of IPFS
- Direct blockchain queries for venue data
- Improved performance and reliability

**Files:**

- ABI: `utils/venue-registry-v2.ts`
- Deployment Script: `scripts/deploy-venue-registry-v2.js`

**Note:** Not ready for deployment. Design decisions pending.

---

## Legacy/Deprecated Contracts

### CAV Token (Deprecated)

**Status:** ❌ Deprecated, replaced by PXP

**Address:** `0xe787A01BafC3276D0B3fEB93159F60dbB99b889F`

**Reason:** Rebranded from "CAV" to "PXP" (Piano eXPerience)

**Migration:** All users migrated to PXP token

---

## Environment Configuration

### Current (.env.local)

```bash
# Active Contracts (V1) - Celo Sepolia Testnet
NEXT_PUBLIC_PXP_TOKEN_ADDRESS="0x04eAE71832147D75D4B69B3FFB5d9514e8471c75"
NEXT_PUBLIC_PXP_REWARDS_ADDRESS="0x28aCAf06E470Dad9890d75B7fD55fBDe913D6128"
NEXT_PUBLIC_CONTRACT_ADDRESS="0x325F81e26CF5A757dc63c85f2CE59621D1d1645E"

# Network Configuration
NEXT_PUBLIC_NETWORK_NAME="Celo Sepolia Testnet"
NEXT_PUBLIC_CHAIN_ID="11142220"
NEXT_PUBLIC_RPC_URL="https://rpc.ankr.com/celo_sepolia"

# Blog Owner (Contract Admin)
NEXT_PUBLIC_BLOG_OWNER_ADDRESS="your_wallet_address_here"
```

### After PXP Rewards V2 Deployment

Update this line:

```bash
NEXT_PUBLIC_PXP_REWARDS_ADDRESS="<NEW_V2_ADDRESS>"
```

---

## Contract Architecture

```
┌─────────────────────────────────────────┐
│          PXP Token (ERC-20)             │
│  0x7B1E...d35                           │
│  - Total Supply: 1M PXP                 │
│  - Mintable by owner                    │
└───────────────┬─────────────────────────┘
                │
                ├──────────┬──────────────┐
                │          │              │
                ▼          ▼              ▼
    ┌───────────────┐  ┌─────────────┐  ┌────────────────┐
    │ PXP Rewards   │  │   Venue     │  │   Users        │
    │ 0x79cC...d38  │  │  Registry   │  │   (Wallets)    │
    │               │  │ 0x29FC...B2  │  │                │
    │ Distributes:  │  │              │  │ Claim rewards  │
    │ - 25 PXP new  │  │ Tracks:      │  │ - New user     │
    │ - 50 PXP scout│  │ - Venues     │  │ - Scout        │
    │ - 25 PXP verify│  │ - Curators  │  │ - Verifier     │
    └───────────────┘  └─────────────┘  └────────────────┘
```

---

## Useful Links

### Explorers

- [Celo Sepolia Testnet Explorer](https://celo-sepolia.blockscout.com/)
- [Celo Mainnet Explorer](https://celoscan.io/)

### Faucets

- [Celo Sepolia Faucet](https://faucet.celo.org/sepolia)

### Documentation

- [Celo Developer Docs](https://docs.celo.org/)
- [Foundry Book](https://book.getfoundry.sh/)
- [PXP Rewards V2 Deployment Guide](./foundry-contracts/DEPLOY_V2_GUIDE.md)
- [Configurable Rewards Implementation](./CONFIGURABLE_REWARDS_IMPLEMENTATION.md)

---

## Contract Ownership & Security

**Contract Owner:** Set via `NEXT_PUBLIC_BLOG_OWNER_ADDRESS`

**Owner Privileges:**

- Mint PXP tokens
- Set reward amounts (V2 only)
- Add/remove authorized verifiers
- Emergency withdraw funds
- Transfer ownership

**Security Best Practices:**

- Owner wallet should use hardware wallet (Ledger/Trezor)
- Consider multi-sig for mainnet deployment
- Test all operations on testnet first
- Monitor contract events for suspicious activity

---

## Version History

| Date       | Contract       | Version | Change                         | Deployment  |
| ---------- | -------------- | ------- | ------------------------------ | ----------- |
| 2024-XX-XX | PXP Token      | V1      | Initial deployment (Alfajores) | ✅ Deployed |
| 2024-XX-XX | PXP Rewards    | V1      | Initial deployment (Alfajores) | ✅ Deployed |
| 2024-XX-XX | Venue Registry | V1      | Initial deployment (Alfajores) | ✅ Deployed |
| 2025-01-24 | PXP Token      | V1      | Migrated to Sepolia            | ✅ Deployed |
| 2025-01-24 | PXP Rewards    | V1      | Migrated to Sepolia            | ✅ Deployed |
| 2025-01-25 | Venue Registry | V1      | Migrated to Sepolia            | ✅ Deployed |
| 2025-11-13 | PXP Rewards    | V2      | Configurable rewards           | 🟡 Ready    |

---

## Migration Notes

**Alfajores → Sepolia Migration (2025-01-24/25)**

- All contracts migrated from Celo Alfajores (Chain ID: 44787) to Celo Sepolia (Chain ID: 11142220)
- Alfajores testnet will be sunset on September 30, 2025
- Sepolia is the new official Celo testnet

---

**Last Updated:** 2025-01-25

**Maintainer:** dhd1956

**Network:** Celo Sepolia Testnet (Chain ID: 11142220)
