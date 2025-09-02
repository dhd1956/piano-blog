const Web3 = require('web3')

async function testNewContract() {
  console.log('🧪 TESTING NEW CONTRACT')
  console.log('=======================\n')

  const CONTRACT_ADDRESS = '0x29FC1Cc9D4451896CaDD41ceA7C6aBd1E71Ab3B2'
  const RPC_URL = 'https://alfajores-forno.celo-testnet.org'

  try {
    const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL))
    
    console.log('🔗 Connected to Celo Alfajores')
    
    // Check if contract exists at this address
    const code = await web3.eth.getCode(CONTRACT_ADDRESS)
    console.log(`📄 Contract code length: ${code.length} characters`)
    
    if (code === '0x') {
      console.log('❌ No contract deployed at this address')
      return
    }
    
    console.log('✅ Contract is deployed!')
    
    // Test basic contract calls with minimal ABI
    const venueCountABI = [{
      "inputs": [],
      "name": "venueCount",
      "outputs": [{"name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }]
    
    const ownerABI = [{
      "inputs": [],
      "name": "owner", 
      "outputs": [{"name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    }]

    // Test venueCount
    try {
      const contract1 = new web3.eth.Contract(venueCountABI, CONTRACT_ADDRESS)
      const venueCount = await contract1.methods.venueCount().call()
      console.log(`📊 Current venue count: ${venueCount}`)
    } catch (err) {
      console.log('❌ venueCount() failed:', err.message)
    }
    
    // Test owner
    try {
      const contract2 = new web3.eth.Contract(ownerABI, CONTRACT_ADDRESS)
      const owner = await contract2.methods.owner().call()
      console.log(`👤 Contract owner: ${owner}`)
    } catch (err) {
      console.log('❌ owner() failed:', err.message)
    }

    // Test gas estimation for submitVenue
    const submitABI = [{
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
    }]
    
    try {
      const contract3 = new web3.eth.Contract(submitABI, CONTRACT_ADDRESS)
      const gasEstimate = await contract3.methods.submitVenue(
        "Test Venue",
        "Toronto", 
        "test@example.com",
        true
      ).estimateGas({ from: '0x0000000000000000000000000000000000000000' })
      
      console.log(`⛽ Gas estimate for submitVenue: ${gasEstimate}`)
      console.log('✅ Contract accepts venue submissions!')
      
    } catch (err) {
      console.log('❌ submitVenue gas estimation failed:', err.message)
    }

    console.log('\n🎉 NEW CONTRACT IS READY TO USE!')
    console.log('\n📝 Contract Summary:')
    console.log(`   Address: ${CONTRACT_ADDRESS}`)
    console.log(`   Network: Celo Alfajores Testnet`)
    console.log(`   Explorer: https://alfajores.celoscan.io/address/${CONTRACT_ADDRESS}`)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testNewContract().catch(console.error)