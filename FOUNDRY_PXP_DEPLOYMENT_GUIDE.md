# PXP Token Deployment Guide using Foundry

## Overview

This guide walks through creating and deploying the PXP (Piano eXPerience) token and PXPRewards contract using Foundry on the Celo Alfajores testnet.

---

## What is Foundry?

Foundry is a blazing fast, portable and modular toolkit for Ethereum development written in Rust. It consists of:

- **Forge**: Ethereum testing framework (like Hardhat/Truffle)
- **Cast**: Swiss army knife for interacting with EVM smart contracts
- **Anvil**: Local Ethereum node (like Ganache)
- **Chisel**: Solidity REPL for quick testing

---

## Prerequisites

✅ **Already Installed:**

- Foundry (forge available at `/home/ave/.foundry/bin/forge`)
- Node.js and Yarn

**You'll Need:**

- Celo wallet private key with CELO tokens on Alfajores testnet
- RPC URL for Celo Alfajores

---

## Step-by-Step Deployment Process

### Step 1: Initialize Foundry Project

```bash
# Navigate to your project
cd /home/ave/projects/piano-blog

# Initialize Foundry in a subdirectory
mkdir -p foundry-contracts
cd foundry-contracts
forge init --no-git
```

This creates:

```
foundry-contracts/
├── src/              # Smart contracts
├── test/             # Tests
├── script/           # Deployment scripts
├── lib/              # Dependencies
└── foundry.toml      # Configuration
```

---

### Step 2: Create the PXP Token Contract

**File:** `foundry-contracts/src/PXPToken.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PXP Token
 * @dev Piano eXPerience Token - Simple ERC20 token for the Piano Style community
 * No demurrage, no decay, just a standard community token
 */
contract PXPToken is ERC20, Ownable {
    // Total supply: 1 million PXP tokens
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18;

    constructor() ERC20("Piano eXPerience Token", "PXP") {
        // Mint initial supply to deployer
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @dev Mint additional tokens (only owner)
     * Allows for controlled supply expansion if needed
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from caller's balance
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
```

---

### Step 3: Install OpenZeppelin Dependencies

```bash
cd foundry-contracts

# Install OpenZeppelin contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit

# Update foundry.toml to include remappings
```

**Update `foundry.toml`:**

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
remappings = [
    "@openzeppelin/=lib/openzeppelin-contracts/"
]

# Celo Alfajores configuration
[rpc_endpoints]
alfajores = "https://alfajores-forno.celo-testnet.org"

[etherscan]
alfajores = { key = "${CELOSCAN_API_KEY}" }
```

---

### Step 4: Copy PXPRewards Contract

**File:** `foundry-contracts/src/PXPRewards.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PXP Rewards Contract
 * @dev Simplified contract focused only on PXP token rewards and payment tracking
 * All venue data is stored off-chain in PostgreSQL for performance
 */
contract PXPRewards is Ownable, ReentrancyGuard {
    IERC20 public immutable pxpToken;

    // Reward amounts (in PXP tokens with 18 decimals)
    uint256 public constant NEW_USER_REWARD = 25 * 10**18;      // 25 PXP
    uint256 public constant SCOUT_REWARD = 50 * 10**18;         // 50 PXP
    uint256 public constant VERIFIER_REWARD = 25 * 10**18;      // 25 PXP

    // Verification requirements
    uint256 public constant MIN_VERIFICATIONS = 2;
    uint256 public constant MAX_VERIFICATIONS = 3;

    // Authorized verifiers (curators)
    mapping(address => bool) public authorizedVerifiers;

    // Track user rewards to prevent double-claiming
    mapping(address => bool) public hasClaimedNewUserReward;
    mapping(bytes32 => bool) public venueVerificationPaid;
    mapping(bytes32 => uint256) public venueVerificationCount;
    mapping(bytes32 => mapping(address => bool)) public hasVerified;

    // Events
    event NewUserRewarded(address indexed user, uint256 amount);
    event ScoutRewarded(address indexed scout, bytes32 indexed venueHash, uint256 amount);
    event VerifierRewarded(address indexed verifier, bytes32 indexed venueHash, uint256 amount);
    event VenueVerified(bytes32 indexed venueHash, address indexed verifier, bool approved);
    event PaymentTracked(address indexed from, address indexed to, uint256 amount, string memo);
    event VerifierStatusUpdated(address indexed verifier, bool authorized);

    constructor(address _pxpToken) {
        pxpToken = IERC20(_pxpToken);
    }

    function claimNewUserReward() external nonReentrant {
        require(!hasClaimedNewUserReward[msg.sender], "Already claimed");
        require(pxpToken.balanceOf(address(this)) >= NEW_USER_REWARD, "Insufficient balance");

        hasClaimedNewUserReward[msg.sender] = true;
        require(pxpToken.transfer(msg.sender, NEW_USER_REWARD), "Transfer failed");

        emit NewUserRewarded(msg.sender, NEW_USER_REWARD);
    }

    function verifyVenue(
        bytes32 venueHash,
        address scout,
        bool approved
    ) external nonReentrant {
        require(authorizedVerifiers[msg.sender], "Not authorized");
        require(!hasVerified[venueHash][msg.sender], "Already verified");
        require(scout != address(0), "Invalid scout");

        hasVerified[venueHash][msg.sender] = true;

        if (approved) {
            venueVerificationCount[venueHash]++;

            require(pxpToken.balanceOf(address(this)) >= VERIFIER_REWARD, "Insufficient balance");
            require(pxpToken.transfer(msg.sender, VERIFIER_REWARD), "Transfer failed");
            emit VerifierRewarded(msg.sender, venueHash, VERIFIER_REWARD);

            if (venueVerificationCount[venueHash] >= MIN_VERIFICATIONS &&
                !venueVerificationPaid[venueHash]) {
                venueVerificationPaid[venueHash] = true;

                require(pxpToken.balanceOf(address(this)) >= SCOUT_REWARD, "Insufficient balance");
                require(pxpToken.transfer(scout, SCOUT_REWARD), "Transfer failed");
                emit ScoutRewarded(scout, venueHash, SCOUT_REWARD);
            }
        }

        emit VenueVerified(venueHash, msg.sender, approved);
    }

    function trackPayment(
        address to,
        uint256 amount,
        string calldata memo
    ) external {
        emit PaymentTracked(msg.sender, to, amount, memo);
    }

    function setVerifierStatus(address verifier, bool authorized) external onlyOwner {
        authorizedVerifiers[verifier] = authorized;
        emit VerifierStatusUpdated(verifier, authorized);
    }

    function addVerifiersBatch(address[] calldata verifiers) external onlyOwner {
        for (uint i = 0; i < verifiers.length; i++) {
            authorizedVerifiers[verifiers[i]] = true;
            emit VerifierStatusUpdated(verifiers[i], true);
        }
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = pxpToken.balanceOf(address(this));
        require(pxpToken.transfer(owner(), balance), "Withdrawal failed");
    }

    function fundRewards(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(pxpToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }

    function getContractBalance() external view returns (uint256) {
        return pxpToken.balanceOf(address(this));
    }

    function isVenueVerified(bytes32 venueHash) external view returns (bool) {
        return venueVerificationCount[venueHash] >= MIN_VERIFICATIONS;
    }

    function getVenueVerificationInfo(bytes32 venueHash) external view returns (
        uint256 verificationCount,
        bool scoutPaid,
        bool isVerified
    ) {
        verificationCount = venueVerificationCount[venueHash];
        scoutPaid = venueVerificationPaid[venueHash];
        isVerified = verificationCount >= MIN_VERIFICATIONS;
    }

    function generateVenueHash(
        string calldata name,
        string calldata city,
        address scout
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(name, city, scout));
    }
}
```

---

### Step 5: Write Tests

**File:** `foundry-contracts/test/PXPToken.t.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/PXPToken.sol";

contract PXPTokenTest is Test {
    PXPToken public token;
    address public owner;
    address public user1;
    address public user2;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        token = new PXPToken();
    }

    function testInitialSupply() public {
        assertEq(token.totalSupply(), 1_000_000 * 10**18);
        assertEq(token.balanceOf(owner), 1_000_000 * 10**18);
    }

    function testTokenMetadata() public {
        assertEq(token.name(), "Piano eXPerience Token");
        assertEq(token.symbol(), "PXP");
        assertEq(token.decimals(), 18);
    }

    function testTransfer() public {
        token.transfer(user1, 1000 * 10**18);
        assertEq(token.balanceOf(user1), 1000 * 10**18);
    }

    function testMintOnlyOwner() public {
        token.mint(user1, 500 * 10**18);
        assertEq(token.balanceOf(user1), 500 * 10**18);

        // Non-owner cannot mint
        vm.prank(user1);
        vm.expectRevert();
        token.mint(user2, 100 * 10**18);
    }

    function testBurn() public {
        token.transfer(user1, 1000 * 10**18);

        vm.prank(user1);
        token.burn(500 * 10**18);

        assertEq(token.balanceOf(user1), 500 * 10**18);
        assertEq(token.totalSupply(), 1_000_000 * 10**18 - 500 * 10**18);
    }
}
```

**Run tests:**

```bash
forge test -vv
```

---

### Step 6: Create Deployment Script

**File:** `foundry-contracts/script/DeployPXP.s.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/PXPToken.sol";
import "../src/PXPRewards.sol";

contract DeployPXP is Script {
    function run() external {
        // Read private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy PXP Token
        PXPToken token = new PXPToken();
        console.log("PXP Token deployed at:", address(token));

        // 2. Deploy PXP Rewards Contract
        PXPRewards rewards = new PXPRewards(address(token));
        console.log("PXP Rewards deployed at:", address(rewards));

        // 3. Fund rewards contract with initial tokens (e.g., 100,000 PXP)
        uint256 fundAmount = 100_000 * 10**18;
        token.transfer(address(rewards), fundAmount);
        console.log("Funded rewards contract with:", fundAmount / 10**18, "PXP");

        // 4. Optional: Add initial verifiers
        // address[] memory initialVerifiers = new address[](1);
        // initialVerifiers[0] = 0xYourCuratorAddress;
        // rewards.addVerifiersBatch(initialVerifiers);

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("PXP Token:", address(token));
        console.log("PXP Rewards:", address(rewards));
        console.log("Initial Supply:", token.totalSupply() / 10**18, "PXP");
        console.log("Rewards Balance:", token.balanceOf(address(rewards)) / 10**18, "PXP");
    }
}
```

---

### Step 7: Set Up Environment Variables

**File:** `foundry-contracts/.env`

```bash
# Your private key (DO NOT COMMIT THIS FILE)
PRIVATE_KEY=0xyour_private_key_here

# Celo Alfajores RPC
ALFAJORES_RPC_URL=https://alfajores-forno.celo-testnet.org

# Optional: Celoscan API key for verification
CELOSCAN_API_KEY=your_celoscan_api_key

# Chain ID
CHAIN_ID=44787
```

**Important:** Add `.env` to `.gitignore`!

---

### Step 8: Deploy to Celo Alfajores

```bash
# Load environment variables
source .env

# Dry run (simulation)
forge script script/DeployPXP.s.sol:DeployPXP \
  --rpc-url $ALFAJORES_RPC_URL \
  --sender $(cast wallet address --private-key $PRIVATE_KEY)

# Actual deployment
forge script script/DeployPXP.s.sol:DeployPXP \
  --rpc-url $ALFAJORES_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  -vvvv
```

---

### Step 9: Verify Contracts on Celoscan

```bash
# Verify PXP Token
forge verify-contract \
  --chain-id 44787 \
  --compiler-version v0.8.19 \
  --num-of-optimizations 200 \
  <TOKEN_ADDRESS> \
  src/PXPToken.sol:PXPToken \
  --etherscan-api-key $CELOSCAN_API_KEY

# Verify PXP Rewards
forge verify-contract \
  --chain-id 44787 \
  --compiler-version v0.8.19 \
  --num-of-optimizations 200 \
  --constructor-args $(cast abi-encode "constructor(address)" <TOKEN_ADDRESS>) \
  <REWARDS_ADDRESS> \
  src/PXPRewards.sol:PXPRewards \
  --etherscan-api-key $CELOSCAN_API_KEY
```

---

### Step 10: Interact with Deployed Contracts

**Check token balance:**

```bash
cast call <TOKEN_ADDRESS> \
  "balanceOf(address)(uint256)" \
  <YOUR_ADDRESS> \
  --rpc-url $ALFAJORES_RPC_URL
```

**Transfer tokens:**

```bash
cast send <TOKEN_ADDRESS> \
  "transfer(address,uint256)" \
  <RECIPIENT_ADDRESS> \
  1000000000000000000 \
  --private-key $PRIVATE_KEY \
  --rpc-url $ALFAJORES_RPC_URL
```

**Add verifier to rewards contract:**

```bash
cast send <REWARDS_ADDRESS> \
  "setVerifierStatus(address,bool)" \
  <CURATOR_ADDRESS> \
  true \
  --private-key $PRIVATE_KEY \
  --rpc-url $ALFAJORES_RPC_URL
```

**Claim new user reward:**

```bash
cast send <REWARDS_ADDRESS> \
  "claimNewUserReward()" \
  --private-key $PRIVATE_KEY \
  --rpc-url $ALFAJORES_RPC_URL
```

---

### Step 11: Update Frontend Configuration

After deployment, update your Next.js app:

**File:** `.env.local`

```bash
# Add deployed contract addresses
NEXT_PUBLIC_PXP_TOKEN_ADDRESS=0x... # Your deployed token address
NEXT_PUBLIC_PXP_REWARDS_ADDRESS=0x... # Your deployed rewards address
```

**File:** `utils/rewards-contract.ts` - Update addresses:

```typescript
export const PXP_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_PXP_TOKEN_ADDRESS || '0x...'
export const PXP_REWARDS_ADDRESS = process.env.NEXT_PUBLIC_PXP_REWARDS_ADDRESS || '0x...'
```

---

## Foundry Commands Cheat Sheet

### Building

```bash
forge build                    # Compile contracts
forge build --sizes           # Show contract sizes
forge clean                   # Clean build artifacts
```

### Testing

```bash
forge test                    # Run all tests
forge test -vv               # Verbose output
forge test --match-test testTransfer  # Run specific test
forge test --gas-report      # Show gas usage
forge coverage               # Code coverage
```

### Deployment

```bash
forge create <CONTRACT>       # Deploy single contract
forge script <SCRIPT>         # Run deployment script
forge script --broadcast      # Execute on chain
```

### Verification

```bash
forge verify-contract         # Verify on block explorer
forge verify-check <GUID>     # Check verification status
```

### Chain Interaction

```bash
cast call <ADDRESS> "func()"  # Read-only call
cast send <ADDRESS> "func()"  # Write transaction
cast balance <ADDRESS>        # Get ETH balance
cast block-number            # Current block number
```

---

## Post-Deployment Checklist

- [ ] PXP Token deployed and verified
- [ ] PXP Rewards deployed and verified
- [ ] Rewards contract funded with initial PXP
- [ ] Initial curators/verifiers added
- [ ] Contract addresses updated in `.env.local`
- [ ] Frontend tested with new contracts
- [ ] Token visible in MetaMask (add custom token)
- [ ] Deployment addresses documented

---

## Security Considerations

1. **Private Key Safety**
   - Never commit `.env` file
   - Use hardware wallet for mainnet
   - Consider multi-sig for ownership

2. **Contract Verification**
   - Always verify on Celoscan
   - Makes contracts transparent and trustworthy

3. **Initial Funding**
   - Fund rewards contract adequately
   - Monitor balance for sustainability

4. **Access Control**
   - Only trusted addresses as verifiers
   - Owner can emergency withdraw

---

## Troubleshooting

**"Insufficient funds for gas"**

- Get CELO from [Alfajores Faucet](https://faucet.celo.org)

**"Nonce too high/low"**

```bash
cast nonce <YOUR_ADDRESS> --rpc-url $ALFAJORES_RPC_URL
```

**"Contract size exceeds limit"**

- Enable optimizer in `foundry.toml`
- Reduce contract complexity

**Verification fails**

- Double-check compiler version
- Ensure constructor args are correct
- Check Celoscan API key

---

## Additional Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [Celo Documentation](https://docs.celo.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Celoscan Explorer](https://alfajores.celoscan.io/)

---

## Next Steps

1. Deploy PXP Token and Rewards contracts
2. Test claiming rewards on testnet
3. Add token to MetaMask
4. Test venue submission → verification → reward flow
5. Document contract addresses
6. Plan mainnet deployment strategy

---

**Last Updated:** 2025-10-02
**Network:** Celo Alfajores Testnet
**Foundry Version:** 0.2.0+
