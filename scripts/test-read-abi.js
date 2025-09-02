/**
 * Test using the READ_ABI structure from utils/contract.ts
 */

const Web3 = require('web3')

const VENUE_REGISTRY_ADDRESS = '0x7AaafaF53A972Bd11f0912049C0268dAE492D175'
const CELO_TESTNET_RPC = 'https://alfajores-forno.celo-testnet.org'

// READ_ABI structure from utils/contract.ts  
const READ_ABI = [
  {
    "inputs": [{"name": "venueId", "type": "uint256"}],
    "name": "getVenueById",
    "outputs": [
      {
        "components": [
          {"name": "hasPiano", "type": "bool"},
          {"name": "hasJamSession", "type": "bool"},
          {"name": "verified", "type": "bool"},
          {"name": "venueType", "type": "uint8"},
          {"name": "submissionTimestamp", "type": "uint32"},
          {"name": "verificationTimestamp", "type": "uint32"},
          {"name": "submittedBy", "type": "address"},
          {"name": "name", "type": "string"},
          {"name": "city", "type": "string"},
          {"name": "contactType", "type": "string"},
          {"name": "ipfsHash", "type": "string"}
        ],
        "name": "",
        "type": "tuple"
      }
    ],
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
  }
]

async function testReadABI() {
  console.log('🧪 Testing READ_ABI structure...')
  console.log('')

  const web3 = new Web3(CELO_TESTNET_RPC)
  const contract = new web3.eth.Contract(READ_ABI, VENUE_REGISTRY_ADDRESS)

  try {
    // Test reading venues
    console.log('📖 Testing venue reading with READ_ABI structure...')
    const count = await contract.methods.venueCount().call()
    console.log(`✅ Venue count: ${count}`)

    if (count > 0) {
      console.log('\nReading first venue:')
      const venue = await contract.methods.getVenueById(0).call()
      
      console.log('✅ Venue 0 data:')
      console.log(`  Has Piano: ${venue.hasPiano}`)
      console.log(`  Has Jam Session: ${venue.hasJamSession}`)
      console.log(`  Verified: ${venue.verified}`)
      console.log(`  Venue Type: ${venue.venueType}`)
      console.log(`  Submission Timestamp: ${venue.submissionTimestamp}`)
      console.log(`  Verification Timestamp: ${venue.verificationTimestamp}`)
      console.log(`  Submitted By: ${venue.submittedBy}`)
      console.log(`  Name: "${venue.name}"`)
      console.log(`  City: "${venue.city}"`)
      console.log(`  Contact Type: "${venue.contactType}"`)
      console.log(`  IPFS Hash: "${venue.ipfsHash}"`)
    }

    return true
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

testReadABI()
  .then((success) => {
    if (success) {
      console.log('\n✅ READ_ABI structure works!')
    } else {
      console.log('\n❌ READ_ABI structure failed.')
    }
  })
  .catch(error => console.error('\n💥 Test error:', error.message))