/**
 * Test script to validate the VenueRegistry contract deployment
 * Run with: node scripts/test-contract.js
 */

const Web3 = require('web3')

const VENUE_REGISTRY_ADDRESS = '0x7AaafaF53A972Bd11f0912049C0268dAE492D175'
const CELO_TESTNET_RPC = 'https://alfajores-forno.celo-testnet.org'

// Minimal ABI to test contract existence
const TEST_ABI = [
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

async function testContract() {
  console.log('🔍 Testing VenueRegistry contract...')
  console.log(`Contract Address: ${VENUE_REGISTRY_ADDRESS}`)
  console.log(`RPC Endpoint: ${CELO_TESTNET_RPC}`)
  console.log('')

  try {
    // Initialize Web3 with Celo testnet RPC
    const web3 = new Web3(CELO_TESTNET_RPC)
    
    console.log('✅ Web3 connection established')
    
    // Check network
    const chainId = await web3.eth.getChainId()
    console.log(`Network Chain ID: ${chainId} (Expected: 44787)`)
    
    if (chainId !== 44787) {
      throw new Error(`Wrong network! Expected Celo Alfajores (44787), got ${chainId}`)
    }
    
    // Get latest block to confirm RPC is working
    const latestBlock = await web3.eth.getBlockNumber()
    console.log(`Latest Block: ${latestBlock}`)
    
    // Check if contract address has code
    const code = await web3.eth.getCode(VENUE_REGISTRY_ADDRESS)
    console.log(`Contract Code Length: ${code.length} bytes`)
    
    if (code === '0x' || code.length <= 3) {
      throw new Error('No contract code found at address! Contract may not be deployed.')
    }
    
    // Create contract instance
    const contract = new web3.eth.Contract(TEST_ABI, VENUE_REGISTRY_ADDRESS)
    console.log('✅ Contract instance created')
    
    // Test venueCount method
    console.log('\n📊 Testing contract methods...')
    const venueCount = await contract.methods.venueCount().call()
    console.log(`Venue Count: ${venueCount}`)
    
    // Test owner method
    const owner = await contract.methods.owner().call()
    console.log(`Contract Owner: ${owner}`)
    
    console.log('\n✅ Contract validation successful!')
    console.log('The contract is properly deployed and accessible.')
    
  } catch (error) {
    console.error('\n❌ Contract validation failed:')
    console.error(error.message)
    
    if (error.message.includes('revert')) {
      console.error('Contract call reverted - check contract ABI or method signature')
    } else if (error.message.includes('network')) {
      console.error('Network connection issue - check RPC endpoint')
    } else if (error.message.includes('code')) {
      console.error('Contract not deployed at the given address')
    }
    
    return false
  }
}

// Run the test
testContract()
  .then(() => {
    console.log('\n🎉 Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message)
    process.exit(1)
  })