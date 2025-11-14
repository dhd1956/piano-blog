const Web3 = require('web3')

async function testDetailedSubmission() {
  console.log('🧪 DETAILED CONTRACT SUBMISSION TEST')
  console.log('=====================================\n')

  // Contract details
  const CONTRACT_ADDRESS = '0xE892deea65135f06596bD882eAa9994BC05674d7'
  const RPC_URL = 'https://alfajores-forno.celo-testnet.org'

  // Correct ABI for VenueRegistry_Fixed.sol contract
  const CONTRACT_ABI = [
    {
      inputs: [],
      stateMutability: 'nonpayable',
      type: 'constructor',
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
    {
      inputs: [
        { name: 'venueId', type: 'uint256' },
        { name: 'newName', type: 'string' },
        { name: 'newContactInfo', type: 'string' },
      ],
      name: 'updateVenue',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { name: 'venueId', type: 'uint256' },
        { name: 'approved', type: 'bool' },
      ],
      name: 'verifyVenue',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ]

  try {
    // Setup provider and contract (read-only)
    console.log('🔗 Connecting to Celo Alfajores...')
    const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL))
    const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS)

    // Test 1: Read current state
    console.log('\n📊 CURRENT CONTRACT STATE:')
    const venueCount = await contract.methods.venueCount().call()
    console.log(`   Current venue count: ${venueCount}`)

    // Check contract owner
    try {
      const owner = await contract.methods.owner().call()
      console.log(`   Contract owner: ${owner}`)
    } catch (err) {
      console.log(`   ❌ Error reading owner: ${err.message}`)
    }

    // Read existing venues to understand data patterns
    console.log('\n📋 EXISTING VENUES:')
    for (let i = 1; i <= venueCount; i++) {
      try {
        const venue = await contract.methods.getVenueById(i).call()
        console.log(`   Venue ${i}:`)
        console.log(`     Name: "${venue.name}"`)
        console.log(`     City: "${venue.city}"`)
        console.log(`     Contact: "${venue.contactInfo}"`)
        console.log(`     Has Piano: ${venue.hasPiano}`)
        console.log(`     Verified: ${venue.verified}`)
        console.log(`     Submitted by: ${venue.submittedBy}`)
        console.log(`     Timestamp: ${venue.timestamp}`)
        console.log(`     ---`)
      } catch (err) {
        console.log(`   ❌ Error reading venue ${i}:`, err.message)
      }
    }

    // Test 2: Attempt submission simulation (will fail without private key, but shows error)
    console.log('\n🧪 SUBMISSION SIMULATION:')

    const testVenues = [
      {
        name: 'Test Venue 1',
        city: 'Toronto',
        contactInfo: 'test@example.com',
        hasPiano: true,
      },
      {
        name: 'Unique Test Venue',
        city: 'Montreal',
        contactInfo: 'contact@unique.com',
        hasPiano: true,
      },
      {
        name: 'The Governer', // Duplicate name
        city: 'Aurora', // Duplicate city combination
        contactInfo: 'duplicate@test.com',
        hasPiano: true,
      },
    ]

    for (let i = 0; i < testVenues.length; i++) {
      const venue = testVenues[i]
      console.log(`\n   Test ${i + 1}: "${venue.name}" in ${venue.city}`)

      try {
        // Try to estimate gas (this might reveal validation errors)
        console.log(`     🧪 Testing gas estimation...`)
        const gasEstimate = await contract.methods
          .submitVenue(venue.name, venue.city, venue.contactInfo, venue.hasPiano)
          .estimateGas({ from: '0x0000000000000000000000000000000000000000' })

        console.log(`     ✅ Gas estimation succeeded: ${gasEstimate}`)
        console.log(`     💡 This means the contract would accept this submission`)
      } catch (err) {
        console.log(`     ❌ Gas estimation failed:`, err.message)

        // Try to decode the error
        if (err.data) {
          console.log(`     🔍 Raw error data:`, err.data)
        }

        // Check for common error patterns
        if (err.message.includes('revert')) {
          console.log(`     🚫 Contract explicitly rejected this submission`)
          if (err.message.includes('duplicate') || err.message.includes('already exists')) {
            console.log(`     💡 Likely cause: Duplicate venue name/city combination`)
          } else if (err.message.includes('access') || err.message.includes('owner')) {
            console.log(`     💡 Likely cause: Access control restriction`)
          } else if (err.message.includes('empty') || err.message.includes('required')) {
            console.log(`     💡 Likely cause: Missing required field`)
          }
        }
      }
    }

    console.log('\n💡 NEXT STEPS:')
    console.log('   1. The gas estimation errors above show validation constraints')
    console.log('   2. If no gas errors, the contract accepts submissions')
    console.log('   3. Actual submission would need MetaMask/wallet connection')
    console.log('   4. Check frontend wallet connection and transaction handling')
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.data) {
      console.log('🔍 Error data:', error.data)
    }
  }
}

testDetailedSubmission().catch(console.error)
