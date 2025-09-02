# Smart Contracts

## 🔴 CURRENTLY DEPLOYED & ACTIVE

### VenueRegistry Contract
- **Address**: `0x7AaafaF53A972Bd11f0912049C0268dAE492D175`
- **Network**: Celo Alfajores Testnet  
- **Source**: `VenueRegistry_Simple.sol` (likely matches deployed version)
- **ABI**: Defined in `/deploy.js` and `/utils/contract.ts`

**Current Status**: ✅ Working with 3 active venues
- "The Governer" (Aurora)
- "Tranzac Club" (Toronto) 
- "The City Room Blues Bar" (Toronto)

## 📂 Contract Files

### Active Contracts:
- **`VenueRegistry_Simple.sol`** - Simple venue registry (matches deployed contract)

### Other Feature Contracts:
- **`DecentralizedBlog.sol`** - Blog management features
- **`DrinkPayment.sol`** - Payment system features

### Development Tools:
- **`foundry.toml`** - Foundry configuration
- **`script/DeployOptimized.s.sol`** - Deployment script

### Archived Versions:
- **`archive/`** - Contains 5 previous VenueRegistry iterations that were not deployed

## 🔧 Deployment & Integration

The deployed contract uses a simple 4-parameter `submitVenue` method:
```solidity
function submitVenue(
    string memory name,
    string memory city, 
    string memory contactInfo,
    bool hasPiano
) external
```

Frontend integration is handled in:
- `/utils/contract.ts` - Contract configuration and ABI
- `/hooks/useWallet.ts` - Contract interaction methods