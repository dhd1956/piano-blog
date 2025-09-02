/**
 * Try to enable submissions as contract owner
 */

const Web3 = require('web3')

const VENUE_REGISTRY_ADDRESS = '0x7AaafaF53A972Bd11f0912049C0268dAE492D175'
const CELO_TESTNET_RPC = 'https://alfajores-forno.celo-testnet.org'
const YOUR_ADDRESS = '0xe8985AEDF83E2a58fEf53B45db2d9556CD5F453A'

const OWNER_ABI = [
  {
    "inputs": [],
    "name": "enableSubmissions",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "max", "type": "uint256"}],
    "name": "setMaxVenues",
    "outputs": [],
    "stateMutability": "nonpayable", 
    "type": "function"
  },
  {
    "inputs": [],
    "name": "venueCount",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
]

async function enableSubmissions() {
  console.log('🔧 Attempting to enable submissions as owner...')
  console.log('')

  const web3 = new Web3(CELO_TESTNET_RPC)
  const contract = new web3.eth.Contract(OWNER_ABI, VENUE_REGISTRY_ADDRESS)

  try {
    // Check current venue count
    const count = await contract.methods.venueCount().call()
    console.log(`📊 Current venue count: ${count}`)

    // Try enableSubmissions with different parameter patterns
    const enablePatterns = [
      { name: 'No params', params: [] },
      { name: 'Boolean true', params: [true] },
      { name: 'Number 1', params: [1] }
    ]

    for (const pattern of enablePatterns) {
      try {
        console.log(`\n🧪 Testing enableSubmissions(${pattern.params.join(', ')})...`)
        
        // First try to estimate gas
        const gasEstimate = await contract.methods.enableSubmissions(...pattern.params).estimateGas({ from: YOUR_ADDRESS })
        console.log(`✅ ${pattern.name}: Gas estimate ${gasEstimate}`)
        console.log(`💡 This pattern works! You could call this function with MetaMask.`)
        
        return { success: true, method: 'enableSubmissions', params: pattern.params }
        
      } catch (error) {
        console.log(`❌ ${pattern.name}: ${error.message}`)
      }
    }

    // Try setMaxVenues to increase limit
    console.log(`\n🧪 Testing setMaxVenues(10)...`)
    try {
      const gasEstimate = await contract.methods.setMaxVenues(10).estimateGas({ from: YOUR_ADDRESS })
      console.log(`✅ setMaxVenues(10): Gas estimate ${gasEstimate}`)
      console.log(`💡 You can increase the venue limit!`)
      
      return { success: true, method: 'setMaxVenues', params: [10] }
      
    } catch (error) {
      console.log(`❌ setMaxVenues(10): ${error.message}`)
    }

    return { success: false, error: 'No working owner functions found' }
    
  } catch (error) {
    console.error('💥 Enable submissions failed:', error.message)
    return { success: false, error: error.message }
  }
}

enableSubmissions()
  .then((result) => {
    if (result.success) {
      console.log('\n🎉 SUCCESS! Found working owner function:')
      console.log(`Method: ${result.method}(${result.params.join(', ')})`)
      console.log('\n📱 Next steps:')
      console.log('1. Use MetaMask to call this function as the owner')
      console.log('2. Then try venue submission again')
      console.log('\n🔧 You can call this through the frontend or directly in MetaMask')
    } else {
      console.log('\n❌ Could not find working owner functions')
      console.log('The contract might need different parameters or have other restrictions')
    }
  })
  .catch(error => console.error('\n💥 Script error:', error.message))