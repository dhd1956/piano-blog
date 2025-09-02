# VenueRegistry_Fixed Contract Deployment Guide

## Step-by-Step Deployment Instructions

### 1. Open Remix IDE
Go to [https://remix.ethereum.org/](https://remix.ethereum.org/)

### 2. Create New Contract File
1. In the file explorer, click "Create New File"
2. Name it `VenueRegistry_Fixed.sol`
3. Copy and paste the following contract code:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VenueRegistry {
    struct Venue {
        string name;
        string city;
        string contactInfo;
        bool hasPiano;
        bool verified;
        address submittedBy;
        uint32 timestamp;
    }
    
    mapping(uint256 => Venue) public venues;
    uint256 public venueCount;
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    // Simple 4-parameter submitVenue to match expected ABI
    function submitVenue(
        string calldata name,
        string calldata city,
        string calldata contactInfo,
        bool hasPiano
    ) external {
        require(bytes(name).length > 0, "Name required");
        require(bytes(city).length > 0, "City required");
        
        venues[venueCount] = Venue({
            name: name,
            city: city,
            contactInfo: contactInfo,
            hasPiano: hasPiano,
            verified: false,
            submittedBy: msg.sender,
            timestamp: uint32(block.timestamp)
        });
        
        venueCount++;
    }
    
    function updateVenue(
        uint256 venueId,
        string calldata newName,
        string calldata newContactInfo
    ) external onlyOwner {
        require(venueId < venueCount, "Venue not found");
        
        venues[venueId].name = newName;
        venues[venueId].contactInfo = newContactInfo;
        venues[venueId].timestamp = uint32(block.timestamp);
    }
    
    function verifyVenue(uint256 venueId, bool approved) external onlyOwner {
        require(venueId < venueCount, "Venue not found");
        venues[venueId].verified = approved;
    }
    
    function getVenueById(uint256 venueId) external view returns (Venue memory) {
        require(venueId < venueCount, "Venue not found");
        return venues[venueId];
    }
}
```

### 3. Compile the Contract
1. Go to the "Solidity Compiler" tab (📄 icon)
2. Select compiler version `0.8.19` or higher
3. Click "Compile VenueRegistry_Fixed.sol"
4. Ensure compilation succeeds with no errors

### 4. Connect to Celo Alfajores Network
1. Open MetaMask
2. Add Celo Alfajores network if not already added:
   - Network Name: `Celo Alfajores Testnet`
   - RPC URL: `https://alfajores-forno.celo-testnet.org`
   - Chain ID: `44787`
   - Currency Symbol: `CELO`
   - Block Explorer: `https://alfajores.celoscan.io/`
3. Get testnet CELO from [https://faucet.celo.org/](https://faucet.celo.org/)

### 5. Deploy the Contract
1. Go to "Deploy & Run Transactions" tab (🚀 icon)
2. Set Environment to "Injected Provider - MetaMask"
3. Ensure you're connected to Celo Alfajores
4. Select "VenueRegistry" contract from dropdown
5. Click "Deploy"
6. Confirm transaction in MetaMask
7. Wait for deployment confirmation

### 6. Copy Contract Information
Once deployed:
1. **Copy the contract address** from the deployed contracts section
2. **Copy the ABI** from the compilation artifacts:
   - Go to `contracts/VenueRegistry_Fixed.sol/VenueRegistry.sol` in file explorer
   - Copy the entire ABI array from the JSON

### 7. Update Your Project
1. Replace the old contract address `0x7AaafaF53A972Bd11f0912049C0268dAE492D175` 
2. Update the ABI in your frontend files
3. Test the new contract

## Expected Results

After deployment, you should have:
- ✅ A fresh, working contract
- ✅ Contract address on Celo Alfajores
- ✅ Clean venue submission functionality
- ✅ No data corruption issues

## Files to Update After Deployment

1. `CLAUDE.md` - Update contract address
2. Frontend contract utilities - Update address and ABI
3. Any hardcoded contract references

## Verification

Test the deployed contract by:
1. Calling `venueCount()` - should return 0
2. Calling `owner()` - should return your MetaMask address
3. Try submitting a test venue through your frontend

---

**Important**: Save your new contract address! You'll need it to update your frontend application.