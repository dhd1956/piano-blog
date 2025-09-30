/**
 * Debug script to identify why venue submission reverts
 * Tests various conditions that might cause the revert
 */

const Web3 = require('web3')

const VENUE_REGISTRY_ADDRESS = '0x7AaafaF53A972Bd11f0912049C0268dAE492D175'
const CELO_TESTNET_RPC = 'https://alfajores-forno.celo-testnet.org'

// Test with blog owner address
const BLOG_OWNER_ADDRESS = '0x1673A1b7DDCF7a7850Df2577067d93897a1CE8E0'

// Extended ABI with more methods
const EXTENDED_ABI = [
  {
    inputs: [],
    name: 'venueCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
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
          { name: 'hasPiano', type: 'bool' },
          { name: 'verified', type: 'bool' },
          { name: 'submittedBy', type: 'address' },
          { name: 'timestamp', type: 'uint32' },
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
      { name: 'hasPiano', type: 'bool' },
    ],
    name: 'submitVenue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

async function debugRevert() {
  console.log('🔍 Debugging venue submission revert...')
  console.log('')

  try {
    const web3 = new Web3(CELO_TESTNET_RPC)
    const contract = new web3.eth.Contract(EXTENDED_ABI, VENUE_REGISTRY_ADDRESS)

    // Get current state
    const venueCount = await contract.methods.venueCount().call()
    const owner = await contract.methods.owner().call()

    console.log(`Current venue count: ${venueCount}`)
    console.log(`Contract owner: ${owner}`)
    console.log(`Blog owner address: ${BLOG_OWNER_ADDRESS}`)
    console.log(`Owner match: ${owner.toLowerCase() === BLOG_OWNER_ADDRESS.toLowerCase()}`)
    console.log('')

    // Check existing venues to see patterns
    console.log('📋 Existing venues:')
    for (let i = 0; i < Math.min(venueCount, 5); i++) {
      try {
        const venue = await contract.methods.getVenueById(i).call()
        console.log(`Venue ${i}:`, {
          name: venue.name,
          city: venue.city,
          hasPiano: venue.hasPiano,
          verified: venue.verified,
          submittedBy: venue.submittedBy,
        })
      } catch (e) {
        console.log(`Venue ${i}: Error reading venue`)
      }
    }
    console.log('')

    // Test different venue submissions
    const testCases = [
      {
        name: 'Unique Test Venue ' + Date.now(),
        city: 'Unique Test City',
        contactInfo: 'unique@test.com',
        hasPiano: true,
        description: 'Completely unique venue',
      },
      {
        name: '', // Empty name
        city: 'Test City',
        contactInfo: 'test@test.com',
        hasPiano: true,
        description: 'Empty name test',
      },
      {
        name: 'Test Name',
        city: '', // Empty city
        contactInfo: 'test@test.com',
        hasPiano: true,
        description: 'Empty city test',
      },
      {
        name: 'Test Name',
        city: 'Test City',
        contactInfo: '', // Empty contact
        hasPiano: true,
        description: 'Empty contact test',
      },
    ]

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i]
      console.log(`🧪 Test ${i + 1}: ${testCase.description}`)

      try {
        const gasEstimate = await contract.methods
          .submitVenue(testCase.name, testCase.city, testCase.contactInfo, testCase.hasPiano)
          .estimateGas({ from: BLOG_OWNER_ADDRESS })

        console.log(`✅ Gas estimate: ${gasEstimate}`)
      } catch (error) {
        console.log(`❌ Failed: ${error.message}`)

        // Try to get more specific error info
        try {
          await contract.methods
            .submitVenue(testCase.name, testCase.city, testCase.contactInfo, testCase.hasPiano)
            .call({ from: BLOG_OWNER_ADDRESS })
        } catch (callError) {
          console.log(`   Call error: ${callError.message}`)
        }
      }
      console.log('')
    }

    // Test with different from addresses
    console.log('👤 Testing with different sender addresses...')

    const testAddresses = [
      BLOG_OWNER_ADDRESS, // Blog owner
      '0x742d35Cc6634C0532925a3b8D39296c5bE1A49Ca', // Random address
      owner, // Contract owner (might be different from blog owner)
    ]

    for (const testAddress of testAddresses) {
      console.log(`Testing with address: ${testAddress}`)

      try {
        const gasEstimate = await contract.methods
          .submitVenue('Test Venue Address ' + Date.now(), 'Test City', 'test@example.com', true)
          .estimateGas({ from: testAddress })

        console.log(`✅ Success with ${testAddress}: ${gasEstimate}`)
      } catch (error) {
        console.log(`❌ Failed with ${testAddress}: ${error.message}`)
      }
    }
  } catch (error) {
    console.error('💥 Debug failed:', error.message)
  }
}

debugRevert()
  .then(() => console.log('\n🏁 Debug complete'))
  .catch((error) => console.error('\n💥 Debug error:', error.message))
