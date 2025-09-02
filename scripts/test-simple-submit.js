/**
 * Test the simple 4-parameter submitVenue from deploy.js
 */

const Web3 = require('web3')

const VENUE_REGISTRY_ADDRESS = '0x7AaafaF53A972Bd11f0912049C0268dAE492D175'
const CELO_TESTNET_RPC = 'https://alfajores-forno.celo-testnet.org'

// Simple ABI from deploy.js
const SIMPLE_ABI = [
  {
    "inputs": [],
    "name": "venueCount",
    "outputs": [{"name": "", "type": "uint256"}],
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
  }
]

async function testSimpleSubmit() {
  console.log('🧪 Testing simple 4-parameter submitVenue...')
  console.log('')

  const web3 = new Web3(CELO_TESTNET_RPC)
  const contract = new web3.eth.Contract(SIMPLE_ABI, VENUE_REGISTRY_ADDRESS)

  const testVenue = {
    name: "Test Simple Venue " + Date.now(),
    city: "Test City",
    contactInfo: "test@example.com",
    hasPiano: true
  }

  // Test with the blog owner address (since we know they successfully submitted)
  const blogOwnerAddress = '0x1673A1b7DDCF7a7850Df2577067d93897a1CE8E0'
  
  try {
    console.log('📝 Test venue data:', testVenue)
    console.log('👤 From address:', blogOwnerAddress)
    console.log('')

    const gasEstimate = await contract.methods.submitVenue(
      testVenue.name,
      testVenue.city,
      testVenue.contactInfo,
      testVenue.hasPiano
    ).estimateGas({ from: blogOwnerAddress })
    
    console.log('✅ Gas estimation successful:', gasEstimate)
    console.log('✅ Simple 4-parameter submitVenue works!')
    
    return true
    
  } catch (error) {
    console.error('❌ Simple submit test failed:', error.message)
    
    // Try with contract owner too
    try {
      console.log('\n🔄 Trying with contract owner...')
      const contractOwner = '0xe8985AEDF83E2a58fEf53B45db2d9556CD5F453A'
      
      const gasEstimate2 = await contract.methods.submitVenue(
        testVenue.name,
        testVenue.city,
        testVenue.contactInfo,
        testVenue.hasPiano
      ).estimateGas({ from: contractOwner })
      
      console.log('✅ Contract owner gas estimation successful:', gasEstimate2)
      return true
      
    } catch (ownerError) {
      console.error('❌ Contract owner test also failed:', ownerError.message)
      return false
    }
  }
}

testSimpleSubmit()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Found the correct submitVenue signature!')
      console.log('The deployed contract uses: submitVenue(name, city, contactInfo, hasPiano)')
    } else {
      console.log('\n💥 Still no luck with submitVenue.')
    }
  })
  .catch(error => console.error('\n💥 Test error:', error.message))