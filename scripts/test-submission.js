/**
 * Test script to simulate venue submission and identify the JSON-RPC error
 * Run with: node scripts/test-submission.js
 */

const Web3 = require('web3')

const VENUE_REGISTRY_ADDRESS = '0x7AaafaF53A972Bd11f0912049C0268dAE492D175'
const CELO_TESTNET_RPC = 'https://alfajores-forno.celo-testnet.org'

// Test address (we'll use this to simulate from parameter)
const TEST_ADDRESS = '0x1673A1b7DDCF7a7850Df2577067d93897a1CE8E0'

// Full ABI for testing submission
const VENUE_REGISTRY_ABI = [
  {
    inputs: [],
    name: 'venueCount',
    outputs: [{ name: '', type: 'uint256' }],
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

async function testSubmission() {
  console.log('🧪 Testing venue submission call...')
  console.log('')

  try {
    const web3 = new Web3(CELO_TESTNET_RPC)
    const contract = new web3.eth.Contract(VENUE_REGISTRY_ABI, VENUE_REGISTRY_ADDRESS)

    const testVenue = {
      name: 'Test Piano Venue',
      city: 'Test City',
      contactInfo: 'test@example.com',
      hasPiano: true,
    }

    console.log('Test Venue Data:', testVenue)
    console.log('')

    // Test if method exists
    console.log('🔍 Testing submitVenue method availability...')

    try {
      // This should succeed if method exists
      await contract.methods
        .submitVenue(testVenue.name, testVenue.city, testVenue.contactInfo, testVenue.hasPiano)
        .estimateGas({ from: TEST_ADDRESS })

      console.log('✅ submitVenue method exists and gas estimation works')
    } catch (gasError) {
      console.error('❌ Gas estimation failed:')
      console.error('Error Code:', gasError.code)
      console.error('Error Message:', gasError.message)

      if (gasError.data) {
        console.error('Error Data:', gasError.data)
      }

      // Check if it's a method signature issue
      if (gasError.message.includes('execution reverted')) {
        console.log(
          '\n💡 This might be a contract logic issue (revert), not a method signature problem'
        )
      } else if (gasError.message.includes('method') || gasError.message.includes('function')) {
        console.log('\n💡 This might be an ABI/method signature mismatch')
      }

      throw gasError
    }

    // If gas estimation works, try to get more details
    console.log('\n📋 Contract method details:')
    console.log(
      'Method signature:',
      contract.methods
        .submitVenue(testVenue.name, testVenue.city, testVenue.contactInfo, testVenue.hasPiano)
        .encodeABI()
    )
  } catch (error) {
    console.error('\n💥 Test submission failed:')
    console.error('Error type:', error.constructor.name)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)

    if (error.data) {
      console.error('Error data:', error.data)
    }

    // Provide debugging hints
    console.log('\n🔧 Debugging hints:')
    if (error.code === -32000) {
      console.log('- Error -32000 usually means insufficient gas or funds')
    } else if (error.code === -32602) {
      console.log('- Error -32602 means invalid method parameters')
    } else if (error.code === -32601) {
      console.log('- Error -32601 means method not found')
    } else if (error.message.includes('revert')) {
      console.log('- Contract execution reverted - check contract logic/conditions')
    }
  }
}

// Test reading methods first
async function testBasicReads() {
  console.log('📖 Testing basic read operations...')

  try {
    const web3 = new Web3(CELO_TESTNET_RPC)
    const contract = new web3.eth.Contract(VENUE_REGISTRY_ABI, VENUE_REGISTRY_ADDRESS)

    const count = await contract.methods.venueCount().call()
    console.log(`✅ Current venue count: ${count}`)

    return true
  } catch (error) {
    console.error('❌ Basic read failed:', error.message)
    return false
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive contract tests...\n')

  // Test basic reads first
  const readsWork = await testBasicReads()

  if (!readsWork) {
    console.log('❌ Basic reads failed, skipping submission test')
    return
  }

  console.log('')

  // Test submission
  await testSubmission()
}

// Run all tests
runAllTests()
  .then(() => {
    console.log('\n✅ All tests completed')
  })
  .catch((error) => {
    console.error('\n💥 Tests failed:', error.message)
  })
