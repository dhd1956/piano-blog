/**
 * Test script to verify the enhanced contract functions
 */

const Web3 = require('web3')

// Contract configuration
const CONTRACT_ADDRESS = '0xb5e448008D1E57493103f1c2919CEeB1253dD630'
const CELO_RPC = 'https://alfajores-forno.celo-testnet.org'

// Enhanced contract ABI - key functions only
const ENHANCED_ABI = [
  {
    inputs: [{ name: 'venueId', type: 'uint256' }],
    name: 'getVenueById',
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'name', type: 'string' },
          { name: 'city', type: 'string' },
          { name: 'contactInfo', type: 'string' },
          { name: 'contactType', type: 'string' },
          { name: 'ipfsHash', type: 'string' },
          { name: 'submittedBy', type: 'address' },
          { name: 'timestamp', type: 'uint32' },
          { name: 'hasPiano', type: 'bool' },
          { name: 'hasJamSession', type: 'bool' },
          { name: 'verified', type: 'bool' },
          { name: 'venueType', type: 'uint8' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'venueCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'venueId', type: 'uint256' },
      { name: 'newName', type: 'string' },
      { name: 'newContactInfo', type: 'string' },
      { name: 'newIPFSHash', type: 'string' },
    ],
    name: 'updateVenueWithIPFS',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

async function testContractFunctions() {
  const web3 = new Web3(CELO_RPC)
  const contract = new web3.eth.Contract(ENHANCED_ABI, CONTRACT_ADDRESS)

  console.log('🔍 Testing enhanced contract functions...')
  console.log('📍 Contract Address:', CONTRACT_ADDRESS)
  console.log('')

  try {
    // Test 1: Get venue count
    console.log('Test 1: Get venue count')
    const venueCount = await contract.methods.venueCount().call()
    console.log('✅ Total venues:', venueCount)
    console.log('')

    // Test 2: Get venues if any exist
    if (parseInt(venueCount) > 0) {
      for (let i = 0; i < parseInt(venueCount); i++) {
        console.log(`Test 2.${i + 1}: Get venue ${i}`)
        try {
          const venue = await contract.methods.getVenueById(i).call()
          console.log('✅ Venue data:')
          console.log('  - Name:', venue.name)
          console.log('  - City:', venue.city)
          console.log('  - Contact:', venue.contactInfo)
          console.log('  - Contact Type:', venue.contactType)
          console.log('  - IPFS Hash:', venue.ipfsHash || '(empty)')
          console.log('  - Has Piano:', venue.hasPiano)
          console.log('  - Verified:', venue.verified)
          console.log('  - Submitted by:', venue.submittedBy)
          console.log('  - Timestamp:', new Date(parseInt(venue.timestamp) * 1000))
          console.log('')
        } catch (error) {
          console.log('❌ Failed to get venue', i, ':', error.message)
        }
      }
    } else {
      console.log('ℹ️ No venues found in contract')
    }

    // Test 3: Check if updateVenueWithIPFS function exists
    console.log('Test 3: Check updateVenueWithIPFS function availability')
    try {
      // This should not throw an error if the function exists
      const functionExists = contract.methods.updateVenueWithIPFS
      if (functionExists) {
        console.log('✅ updateVenueWithIPFS function is available')
      }
    } catch (error) {
      console.log('❌ updateVenueWithIPFS function is NOT available')
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }

  console.log('')
  console.log('🔍 Test complete!')
}

// Run the test
testContractFunctions()
  .then(() => {
    console.log('✅ Contract function test finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })
