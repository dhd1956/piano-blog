/**
 * Check for owner-only functions that might control submissions
 */

const Web3 = require('web3')

const VENUE_REGISTRY_ADDRESS = '0x7AaafaF53A972Bd11f0912049C0268dAE492D175'
const CELO_TESTNET_RPC = 'https://alfajores-forno.celo-testnet.org'
const YOUR_ADDRESS = '0xe8985AEDF83E2a58fEf53B45db2d9556CD5F453A'

// Test possible owner functions
const OWNER_FUNCTIONS = [
  {
    name: 'enableSubmissions',
    abi: [{
      "inputs": [],
      "name": "enableSubmissions",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }]
  },
  {
    name: 'setMaxVenues',
    abi: [{
      "inputs": [{"name": "max", "type": "uint256"}],
      "name": "setMaxVenues", 
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }]
  },
  {
    name: 'maxVenues',
    abi: [{
      "inputs": [],
      "name": "maxVenues",
      "outputs": [{"name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }]
  },
  {
    name: 'submissionDeadline',
    abi: [{
      "inputs": [],
      "name": "submissionDeadline", 
      "outputs": [{"name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }]
  }
]

async function checkOwnerFunctions() {
  console.log('🔍 Checking for owner functions...')
  console.log('')

  const web3 = new Web3(CELO_TESTNET_RPC)

  for (const func of OWNER_FUNCTIONS) {
    try {
      const contract = new web3.eth.Contract(func.abi, VENUE_REGISTRY_ADDRESS)
      const methodName = func.abi[0].name
      
      console.log(`🔍 Testing ${func.name}...`)
      
      if (func.abi[0].stateMutability === 'view') {
        // Read-only function
        try {
          const result = await contract.methods[methodName]().call()
          console.log(`✅ ${func.name}: ${result}`)
          
          if (func.name === 'maxVenues' && result <= 3) {
            console.log(`🚨 FOUND ISSUE: maxVenues is ${result}, current count is 3!`)
          }
          
        } catch (error) {
          console.log(`❌ ${func.name}: Not found`)
        }
        
      } else {
        // Write function - just test if it exists
        try {
          await contract.methods[methodName](...(func.abi[0].inputs.map(() => 0))).estimateGas({ from: YOUR_ADDRESS })
          console.log(`✅ ${func.name}: Available (owner function)`)
          
        } catch (error) {
          if (error.message.includes('execution reverted')) {
            console.log(`⚠️ ${func.name}: Exists but reverted (might need different params)`)
          } else {
            console.log(`❌ ${func.name}: Not found`)
          }
        }
      }
      
    } catch (error) {
      console.log(`❌ ${func.name}: Error testing`)
    }
  }

  // Check current timestamp vs any deadlines
  console.log('\n⏰ Time check:')
  console.log(`Current timestamp: ${Math.floor(Date.now() / 1000)}`)
  console.log(`Current date: ${new Date().toISOString()}`)
}

checkOwnerFunctions()
  .then(() => console.log('\n🏁 Owner function check complete'))
  .catch(error => console.error('\n💥 Check error:', error.message))