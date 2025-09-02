const Web3 = require('web3');

// Contract ABI and bytecode (you'll need to get this from Remix compilation)
const contractABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{"name": "venueId", "type": "uint256"}],
    "name": "getVenueById",
    "outputs": [{"name": "", "type": "tuple", "components": [
      {"name": "name", "type": "string"},
      {"name": "city", "type": "string"},
      {"name": "contactInfo", "type": "string"},
      {"name": "hasPiano", "type": "bool"},
      {"name": "verified", "type": "bool"},
      {"name": "submittedBy", "type": "address"},
      {"name": "timestamp", "type": "uint32"}
    ]}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "venueCount",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "name", "type": "string"},
      {"name": "city", "type": "string"},
      {"name": "contactInfo", "type": "string"},
      {"name": "hasPiano", "type": "bool"}
    ],
    "name": "submitVenue",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "venueId", "type": "uint256"},
      {"name": "newName", "type": "string"},
      {"name": "newContactInfo", "type": "string"}
    ],
    "name": "updateVenue",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "venueId", "type": "uint256"},
      {"name": "approved", "type": "bool"}
    ],
    "name": "verifyVenue",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

console.log('Instructions:');
console.log('1. Compile VenueRegistry.sol in Remix');
console.log('2. Copy the "bytecode" from compilation artifacts');
console.log('3. Add your private key to deploy');
console.log('4. Run: node deploy.js');