const Web3 = require('web3')
const fs = require('fs')
const path = require('path')

// Configuration
const RPC_URL = 'https://alfajores-forno.celo-testnet.org'
const PRIVATE_KEY = process.env.PRIVATE_KEY // You'll need to set this

// Contract source (simplified for deployment)
const contractSource = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VenueRegistryV2 {
    struct Venue {
        string name;
        string city;
        string contactInfo;
        string contactType;
        bool hasPiano;
        bool hasJamSession;
        bool verified;
        uint8 venueType;
        address submittedBy;
        address verifiedBy;
        address lastUpdatedBy;
        uint32 submissionTimestamp;
        uint32 verificationTimestamp;
        uint32 lastUpdatedTimestamp;
        string ipfsHash;
        string curatorNotes;
    }
    
    mapping(uint256 => Venue) public venues;
    mapping(string => uint256[]) public venuesByCity;
    uint256 public venueCount;
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function submitVenue(
        string memory name,
        string memory city,
        string memory contactInfo,
        string memory contactType,
        bool hasPiano,
        bool hasJamSession,
        uint8 venueType,
        string memory ipfsHash
    ) external {
        require(bytes(name).length > 0, "Name required");
        require(bytes(city).length > 0, "City required");
        
        uint256 venueId = venueCount++;
        venues[venueId] = Venue({
            name: name,
            city: city,
            contactInfo: contactInfo,
            contactType: contactType,
            hasPiano: hasPiano,
            hasJamSession: hasJamSession,
            verified: false,
            venueType: venueType,
            submittedBy: msg.sender,
            verifiedBy: address(0),
            lastUpdatedBy: msg.sender,
            submissionTimestamp: uint32(block.timestamp),
            verificationTimestamp: 0,
            lastUpdatedTimestamp: uint32(block.timestamp),
            ipfsHash: ipfsHash,
            curatorNotes: ""
        });
        
        venuesByCity[city].push(venueId);
    }
    
    function updateVenue(
        uint256 venueId,
        string memory newName,
        string memory newContactInfo,
        string memory newContactType,
        string memory newIpfsHash
    ) external onlyOwner {
        require(venueId < venueCount, "Venue not found");
        
        Venue storage venue = venues[venueId];
        venue.name = newName;
        venue.contactInfo = newContactInfo;
        venue.contactType = newContactType;
        venue.ipfsHash = newIpfsHash;
        venue.lastUpdatedBy = msg.sender;
        venue.lastUpdatedTimestamp = uint32(block.timestamp);
    }
    
    function verifyVenue(uint256 venueId, bool approved, string memory notes) external onlyOwner {
        require(venueId < venueCount, "Venue not found");
        
        venues[venueId].verified = approved;
        venues[venueId].verifiedBy = msg.sender;
        venues[venueId].verificationTimestamp = uint32(block.timestamp);
        venues[venueId].curatorNotes = notes;
    }
    
    function getVenueById(uint256 venueId) external view returns (Venue memory) {
        require(venueId < venueCount, "Venue not found");
        return venues[venueId];
    }
    
    function getVenuesByCity(string memory city) external view returns (uint256[] memory) {
        return venuesByCity[city];
    }
}
`

async function deployContract() {
  try {
    console.log('🚀 Deploying VenueRegistryV2 to Celo Alfajores...\n')

    if (!PRIVATE_KEY) {
      console.error('❌ Please set PRIVATE_KEY environment variable')
      console.log('Export your MetaMask private key for the owner account:')
      console.log('PRIVATE_KEY=0x... node scripts/deploy-v2.js')
      return
    }

    const web3 = new Web3(RPC_URL)
    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)
    web3.eth.accounts.wallet.add(account)

    console.log('📍 Deploying from account:', account.address)
    console.log('🔗 Network: Celo Alfajores Testnet')

    // Check balance
    const balance = await web3.eth.getBalance(account.address)
    const balanceInCelo = web3.utils.fromWei(balance, 'ether')
    console.log('💰 Balance:', balanceInCelo, 'CELO')

    if (parseFloat(balanceInCelo) < 0.01) {
      console.error('❌ Insufficient CELO for deployment. Need at least 0.01 CELO')
      return
    }

    // For this demo, I'll provide the bytecode since we can't compile Solidity here
    console.log('⏳ Contract compilation would happen here...')
    console.log("📝 For now, you'll need to:")
    console.log('   1. Copy the contract to Remix IDE')
    console.log('   2. Compile and deploy manually')
    console.log('   3. Update the contract address in the config')

    console.log('\n📋 Next steps:')
    console.log('1. Go to https://remix.ethereum.org/')
    console.log('2. Create new file: VenueRegistryV2.sol')
    console.log('3. Paste the contract code')
    console.log('4. Compile with Solidity 0.8.19')
    console.log('5. Deploy to Celo Alfajores via MetaMask')
    console.log('6. Update VENUE_REGISTRY_ADDRESS in .env.local')
  } catch (error) {
    console.error('❌ Deployment failed:', error.message)
  }
}

// Save contract for Remix
fs.writeFileSync(
  path.join(__dirname, '..', 'contracts', 'VenueRegistryV2_Simple.sol'),
  contractSource
)

console.log('✅ Contract saved to contracts/VenueRegistryV2_Simple.sol')
console.log('📋 Ready for Remix deployment!')

deployContract()
