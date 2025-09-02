const Web3 = require('web3')

async function testRPCEndpoints() {
  console.log('🌐 TESTING CELO RPC ENDPOINTS')
  console.log('==============================\n')

  const CONTRACT_ADDRESS = '0x29FC1Cc9D4451896CaDD41ceA7C6aBd1E71Ab3B2'
  
  const endpoints = [
    'https://alfajores-forno.celo-testnet.org',
    'https://celo-alfajores.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    'https://celo-alfajores.infura.io/v3/demo'
  ]

  const venueCountABI = [{
    "inputs": [],
    "name": "venueCount",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }]

  for (let i = 0; i < endpoints.length; i++) {
    const rpc = endpoints[i]
    console.log(`🧪 Testing RPC ${i + 1}: ${rpc.substring(0, 50)}...`)
    
    try {
      const web3 = new Web3(new Web3.providers.HttpProvider(rpc))
      
      // Test 1: Basic connectivity
      const chainId = await web3.eth.getChainId()
      console.log(`   ✅ Chain ID: ${chainId} (${chainId === 44787 ? 'Correct' : 'Wrong'})`)
      
      // Test 2: Contract call
      const contract = new web3.eth.Contract(venueCountABI, CONTRACT_ADDRESS)
      const venueCount = await contract.methods.venueCount().call()
      console.log(`   ✅ Venue count: ${venueCount}`)
      
      // Test 3: Response time
      const start = Date.now()
      await web3.eth.getBlockNumber()
      const responseTime = Date.now() - start
      console.log(`   ✅ Response time: ${responseTime}ms`)
      
      console.log(`   🎯 RPC ${i + 1} is WORKING!\n`)
      
    } catch (error) {
      console.log(`   ❌ RPC ${i + 1} FAILED: ${error.message}\n`)
    }
  }
  
  console.log('💡 Use the working RPC endpoints in your frontend!')
}

testRPCEndpoints().catch(console.error)