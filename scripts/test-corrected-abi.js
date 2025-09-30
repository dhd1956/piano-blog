/**
 * Test the corrected ABI with the deployed contract
 */

const Web3 = require('web3')

const VENUE_REGISTRY_ADDRESS = '0x7AaafaF53A972Bd11f0912049C0268dAE492D175'
const CELO_TESTNET_RPC = 'https://alfajores-forno.celo-testnet.org'

// Corrected ABI based on deployed contract
const CORRECTED_ABI = [
  {
    inputs: [],
    name: 'venueCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'venueId', type: 'uint256' }],
    name: 'getVenueById',
    outputs: [
      {
        components: [
          { name: 'name', type: 'string' },
          { name: 'city', type: 'string' },
          { name: 'contactInfo', type: 'string' },
          { name: 'contactType', type: 'string' },
          { name: 'hasPiano', type: 'bool' },
          { name: 'hasJamSession', type: 'bool' },
          { name: 'verified', type: 'bool' },
          { name: 'venueType', type: 'uint8' },
          { name: 'submittedBy', type: 'address' },
          { name: 'verifiedBy', type: 'address' },
          { name: 'lastUpdatedBy', type: 'address' },
          { name: 'submissionTimestamp', type: 'uint32' },
          { name: 'verificationTimestamp', type: 'uint32' },
          { name: 'lastUpdatedTimestamp', type: 'uint32' },
          { name: 'ipfsHash', type: 'string' },
          { name: 'curatorNotes', type: 'string' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'city', type: 'string' },
      { name: 'contactInfo', type: 'string' },
      { name: 'contactType', type: 'string' },
      { name: 'hasPiano', type: 'bool' },
      { name: 'hasJamSession', type: 'bool' },
      { name: 'venueType', type: 'uint8' },
      { name: 'ipfsHash', type: 'string' },
    ],
    name: 'submitVenue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

async function testCorrectedABI() {
  console.log('🧪 Testing corrected ABI...')
  console.log('')

  const web3 = new Web3(CELO_TESTNET_RPC)
  const contract = new web3.eth.Contract(CORRECTED_ABI, VENUE_REGISTRY_ADDRESS)

  try {
    // Test reading venues with new structure
    console.log('📖 Testing venue reading...')
    const count = await contract.methods.venueCount().call()
    console.log(`✅ Venue count: ${count}`)

    if (count > 0) {
      console.log('\nReading first venue with corrected structure:')
      const venue = await contract.methods.getVenueById(0).call()

      console.log('✅ Venue 0 data:')
      console.log(`  Name: "${venue.name}"`)
      console.log(`  City: "${venue.city}"`)
      console.log(`  Contact: "${venue.contactInfo}"`)
      console.log(`  Contact Type: "${venue.contactType}"`)
      console.log(`  Has Piano: ${venue.hasPiano}`)
      console.log(`  Has Jam Session: ${venue.hasJamSession}`)
      console.log(`  Verified: ${venue.verified}`)
      console.log(`  Venue Type: ${venue.venueType}`)
      console.log(`  Submitted By: ${venue.submittedBy}`)
      console.log(`  IPFS Hash: "${venue.ipfsHash}"`)
    }

    // Test submission with corrected parameters
    console.log('\n🚀 Testing venue submission...')

    const testVenue = {
      name: 'Test Piano Venue ' + Date.now(),
      city: 'Test City',
      contactInfo: 'test@example.com',
      contactType: 'email',
      hasPiano: true,
      hasJamSession: false,
      venueType: 1,
      ipfsHash: '',
    }

    const testAddress = '0xe8985AEDF83E2a58fEf53B45db2d9556CD5F453A' // Contract owner

    const gasEstimate = await contract.methods
      .submitVenue(
        testVenue.name,
        testVenue.city,
        testVenue.contactInfo,
        testVenue.contactType,
        testVenue.hasPiano,
        testVenue.hasJamSession,
        testVenue.venueType,
        testVenue.ipfsHash
      )
      .estimateGas({ from: testAddress })

    console.log('✅ Gas estimation successful:', gasEstimate)
    console.log('✅ Contract methods are working with corrected ABI!')

    return true
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

testCorrectedABI()
  .then((success) => {
    if (success) {
      console.log('\n🎉 ABI correction successful! The contract should now work.')
    } else {
      console.log('\n💥 ABI correction failed - more debugging needed.')
    }
  })
  .catch((error) => console.error('\n💥 Test error:', error.message))
