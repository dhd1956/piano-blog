/**
 * Test script to verify if the enhanced contract is deployed
 * Tests for new functions that don't exist in the old contract
 */

const Web3 = require('web3')

// Contract configuration
const CONTRACT_ADDRESS = '0xb5e448008D1E57493103f1c2919CEeB1253dD630'
const CELO_RPC = 'https://alfajores-forno.celo-testnet.org'

// Test ABI with new functions
const TEST_ABI = [
  {
    "inputs": [{"name": "curator", "type": "address"}],
    "name": "isCurator",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "venueId", "type": "uint256"},
      {"name": "newIPFSHash", "type": "string"}
    ],
    "name": "updateIPFSHash",
    "outputs": [],
    "stateMutability": "nonpayable",
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

async function testEnhancedContract() {
  const web3 = new Web3(CELO_RPC)
  const contract = new web3.eth.Contract(TEST_ABI, CONTRACT_ADDRESS)
  
  console.log('🔍 Testing enhanced contract functions...')
  console.log('📍 Contract Address:', CONTRACT_ADDRESS)
  console.log('')
  
  try {
    // Test 1: Check if isCurator function exists (new function)
    console.log('Test 1: isCurator function')
    try {
      const testAddress = '0xe8985AEDF83E2a58fEf53B45db2d9556CD5F453A'
      const result = await contract.methods.isCurator(testAddress).call()
      console.log('✅ isCurator function exists! Result:', result)
    } catch (error) {
      console.log('❌ isCurator function does NOT exist')
      console.log('Error:', error.message.substring(0, 100))
    }
    
    console.log('')
    
    // Test 2: Check contract owner (should work on both versions)
    console.log('Test 2: Contract owner')
    try {
      const owner = await contract.methods.owner().call()
      console.log('✅ Contract owner:', owner)
    } catch (error) {
      console.log('❌ Failed to get contract owner')
      console.log('Error:', error.message.substring(0, 100))
    }
    
    console.log('')
    
    // Test 3: Check if contract has expected functions by examining contract code
    console.log('Test 3: Contract bytecode analysis')
    try {
      const code = await web3.eth.getCode(CONTRACT_ADDRESS)
      const codeSize = code.length
      console.log('📊 Contract bytecode size:', codeSize, 'characters')
      
      // The enhanced contract should be larger than the simple one
      if (codeSize > 10000) {
        console.log('✅ Contract size suggests enhanced version (larger bytecode)')
      } else {
        console.log('⚠️ Contract size suggests simple version (smaller bytecode)')
      }
    } catch (error) {
      console.log('❌ Failed to get contract bytecode')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
  
  console.log('')
  console.log('🔍 Test complete!')
}

// Run the test
testEnhancedContract()
  .then(() => {
    console.log('✅ Enhanced contract test finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })