# PXPRewards V2 Deployment Guide

## Overview

PXPRewards V2 introduces **configurable reward amounts** that can be adjusted by the contract owner without redeployment. This allows for dynamic reward management through an admin interface.

## Key Changes from V1

### What's New

- ✅ Configurable reward amounts (no longer hardcoded constants)
- ✅ Setter functions with `onlyOwner` modifier
- ✅ Validation (1-1000 PXP range)
- ✅ Events emitted when rewards change
- ✅ Getter functions for all rewards
- ✅ Comprehensive test coverage (21 tests, all passing)

### Breaking Changes

- Reward variables changed from `constant` to mutable state variables
- Variable names changed from UPPERCASE to camelCase (`NEW_USER_REWARD` → `newUserReward`)

## Deployment Steps

### Prerequisites

1. **Foundry installed**

   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Environment variables** (.env file in foundry-contracts/)

   ```env
   PRIVATE_KEY=your_private_key_here
   CELO_ALFAJORES_RPC=https://alfajores-forno.celo-testnet.org
   CELOSCAN_API_KEY=your_celoscan_api_key
   ```

3. **Existing PXP Token** (already deployed)
   - Address: `0x7B1E3d40Acf8ea8717822E23096eFf8fE8573d35`

### Step 1: Build and Test

```bash
cd foundry-contracts

# Build contracts
forge build

# Run tests (ensure all pass)
forge test --match-path test/PXPRewards.t.sol -vv

# Expected: 21 tests passed
```

### Step 2: Deploy to Celo Alfajores Testnet

```bash
# Deploy contract
forge script script/DeployPXPRewardsV2.s.sol:DeployPXPRewardsV2 \
  --rpc-url $CELO_ALFAJORES_RPC \
  --broadcast \
  --verify \
  -vvvv

# Save the deployed contract address from output
```

### Step 3: Fund the Rewards Contract

```bash
# Using cast (Foundry CLI)
cast send <PXP_TOKEN_ADDRESS> \
  "transfer(address,uint256)" \
  <REWARDS_CONTRACT_ADDRESS> \
  100000000000000000000000 \  # 100,000 PXP
  --rpc-url $CELO_ALFAJORES_RPC \
  --private-key $PRIVATE_KEY

# Verify balance
cast call <REWARDS_CONTRACT_ADDRESS> \
  "getContractBalance()" \
  --rpc-url $CELO_ALFAJORES_RPC
```

### Step 4: Add Authorized Verifiers

```bash
# Add a single verifier
cast send <REWARDS_CONTRACT_ADDRESS> \
  "setVerifierStatus(address,bool)" \
  <VERIFIER_ADDRESS> \
  true \
  --rpc-url $CELO_ALFAJORES_RPC \
  --private-key $PRIVATE_KEY

# Or add multiple verifiers at once
cast send <REWARDS_CONTRACT_ADDRESS> \
  "addVerifiersBatch(address[])" \
  "[0xVerifier1,0xVerifier2,0xVerifier3]" \
  --rpc-url $CELO_ALFAJORES_RPC \
  --private-key $PRIVATE_KEY
```

### Step 5: Update Frontend Configuration

Update the following files:

**1. Environment variables** (`.env.local`):

```env
NEXT_PUBLIC_PXP_REWARDS_ADDRESS=<NEW_REWARDS_V2_ADDRESS>
```

**2. Rewards contract utility** (`utils/rewards-contract.ts`):

- Update contract address
- Update ABI to include new functions:
  - `setNewUserReward(uint256)`
  - `setScoutReward(uint256)`
  - `setVerifierReward(uint256)`
  - `setAllRewards(uint256,uint256,uint256)`
  - `getAllRewards()` → `(uint256,uint256,uint256)`
  - `getRewardLimits()` → `(uint256,uint256)`

## Testing Reward Configuration

### Test with Cast (Command Line)

```bash
# Get current rewards
cast call <REWARDS_CONTRACT_ADDRESS> \
  "getAllRewards()" \
  --rpc-url $CELO_ALFAJORES_RPC

# Set new user reward to 30 PXP
cast send <REWARDS_CONTRACT_ADDRESS> \
  "setNewUserReward(uint256)" \
  30000000000000000000 \  # 30 * 10^18
  --rpc-url $CELO_ALFAJORES_RPC \
  --private-key $PRIVATE_KEY

# Set all rewards at once
cast send <REWARDS_CONTRACT_ADDRESS> \
  "setAllRewards(uint256,uint256,uint256)" \
  30000000000000000000 \  # 30 PXP newUser
  75000000000000000000 \  # 75 PXP scout
  35000000000000000000 \  # 35 PXP verifier
  --rpc-url $CELO_ALFAJORES_RPC \
  --private-key $PRIVATE_KEY

# Verify changes
cast call <REWARDS_CONTRACT_ADDRESS> \
  "getAllRewards()" \
  --rpc-url $CELO_ALFAJORES_RPC
```

### Validation Tests

The contract enforces 1-1000 PXP limits:

```bash
# This will FAIL (too low)
cast send <REWARDS_CONTRACT_ADDRESS> \
  "setNewUserReward(uint256)" \
  500000000000000000 \  # 0.5 PXP (below minimum)
  --rpc-url $CELO_ALFAJORES_RPC \
  --private-key $PRIVATE_KEY

# This will FAIL (too high)
cast send <REWARDS_CONTRACT_ADDRESS> \
  "setScoutReward(uint256)" \
  1001000000000000000000 \  # 1001 PXP (above maximum)
  --rpc-url $CELO_ALFAJORES_RPC \
  --private-key $PRIVATE_KEY
```

## Contract Functions Reference

### Read Functions

| Function               | Returns                     | Description                    |
| ---------------------- | --------------------------- | ------------------------------ |
| `newUserReward()`      | `uint256`                   | Current new user reward in wei |
| `scoutReward()`        | `uint256`                   | Current scout reward in wei    |
| `verifierReward()`     | `uint256`                   | Current verifier reward in wei |
| `getAllRewards()`      | `(uint256,uint256,uint256)` | All rewards at once            |
| `getRewardLimits()`    | `(uint256,uint256)`         | Min and max allowed rewards    |
| `getContractBalance()` | `uint256`                   | PXP balance of contract        |

### Write Functions (Owner Only)

| Function                                 | Parameters               | Description             |
| ---------------------------------------- | ------------------------ | ----------------------- |
| `setNewUserReward(uint256)`              | amount                   | Set new user reward     |
| `setScoutReward(uint256)`                | amount                   | Set scout reward        |
| `setVerifierReward(uint256)`             | amount                   | Set verifier reward     |
| `setAllRewards(uint256,uint256,uint256)` | newUser, scout, verifier | Set all rewards at once |

### Events

```solidity
event RewardAmountUpdated(
    string indexed rewardType,  // "NEW_USER", "SCOUT", or "VERIFIER"
    uint256 oldAmount,
    uint256 newAmount
);
```

## Migration from V1

If you have an existing V1 deployment:

1. **Deploy V2** (new contract address)
2. **Transfer PXP tokens** from V1 to V2
3. **Update frontend** to use V2 address
4. **Migrate verifiers** (re-add them to V2)
5. **Optionally**: Withdraw remaining PXP from V1 using `emergencyWithdraw()`

## Security Considerations

1. **Only owner can change rewards** - Protected by `onlyOwner` modifier
2. **Validation enforced** - 1-1000 PXP range prevents mistakes
3. **Events logged** - All changes are transparent on blockchain
4. **Auditable** - Check events on [Celoscan](https://alfajores.celoscan.io)

## Troubleshooting

### "Insufficient balance" error

- Fund the rewards contract with more PXP tokens
- Check balance: `cast call <ADDRESS> "getContractBalance()"`

### "Reward out of range" error

- Ensure amount is between 1-1000 PXP
- Remember to multiply by 10^18 (wei)

### "Not authorized" error (for verifiers)

- Add verifier using `setVerifierStatus(address, true)`

### Gas estimation failed

- Ensure wallet has CELO for gas fees
- Get testnet CELO from [faucet](https://faucet.celo.org)

## Next Steps

After deployment:

1. ✅ Build admin UI for reward management (`/app/admin/rewards/`)
2. ✅ Create API endpoints for reward configuration
3. ✅ Add database sync for reward values
4. ✅ Test end-to-end reward flow
5. ✅ Deploy to mainnet when ready

## Support

For issues or questions:

- Check [Foundry docs](https://book.getfoundry.sh/)
- View contract on [Celoscan](https://alfajores.celoscan.io)
- Review test file: `test/PXPRewards.t.sol`
