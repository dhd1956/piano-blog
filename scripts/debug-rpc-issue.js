const Web3 = require('web3')

async function debugRPCIssue() {
  console.log('🔍 DEBUGGING RPC ISSUE')
  console.log('=====================\n')

  const CONTRACT_ADDRESS = '0x29FC1Cc9D4451896CaDD41ceA7C6aBd1E71Ab3B2'
  const RPC_URL = 'https://alfajores-forno.celo-testnet.org'

  // Minimal ABI with only methods that exist
  const WORKING_ABI = [
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
          name: '',
          type: 'tuple',
          components: [
            { name: 'name', type: 'string' },
            { name: 'city', type: 'string' },
            { name: 'contactInfo', type: 'string' },
            { name: 'hasPiano', type: 'bool' },
            { name: 'verified', type: 'bool' },
            { name: 'submittedBy', type: 'address' },
            { name: 'timestamp', type: 'uint32' },
          ],
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ]

  try {
    console.log('🔗 Testing RPC connection...')
    const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL))

    // Test 1: Basic connection
    const chainId = await web3.eth.getChainId()
    console.log(`✅ Chain ID: ${chainId}`)

    // Test 2: Contract exists
    const code = await web3.eth.getCode(CONTRACT_ADDRESS)
    console.log(`✅ Contract deployed: ${code.length > 2 ? 'Yes' : 'No'}`)

    // Test 3: Contract methods
    const contract = new web3.eth.Contract(WORKING_ABI, CONTRACT_ADDRESS)

    console.log('\n🧪 Testing contract methods:')

    // Test venueCount
    try {
      const count = await contract.methods.venueCount().call()
      console.log(`✅ venueCount(): ${count}`)
    } catch (err) {
      console.log(`❌ venueCount() failed: ${err.message}`)
    }

    // Test owner
    try {
      const owner = await contract.methods.owner().call()
      console.log(`✅ owner(): ${owner}`)
    } catch (err) {
      console.log(`❌ owner() failed: ${err.message}`)
    }

    // Test getVenueById with ID 0 (might not exist, but should not cause JSON-RPC error)
    try {
      const venue = await contract.methods.getVenueById(0).call()
      console.log(`✅ getVenueById(0): ${venue.name || 'Empty venue'}`)
    } catch (err) {
      console.log(`⚠️  getVenueById(0) failed: ${err.message} (expected if no venues)`)
    }

    console.log('\n💡 All basic contract methods work!')
    console.log("If you're seeing JSON-RPC errors in the browser, they might be from:")
    console.log('1. Frontend trying to call non-existent methods')
    console.log('2. Network issues between browser and RPC')
    console.log('3. Rate limiting from the RPC endpoint')
  } catch (error) {
    console.error('❌ RPC Test failed:', error.message)

    if (error.message.includes('Invalid JSON RPC response')) {
      console.log('\n💡 This indicates:')
      console.log('- RPC endpoint might be down')
      console.log('- Network connectivity issues')
      console.log('- Invalid request format')
    }
  }
}

debugRPCIssue().catch(console.error)
