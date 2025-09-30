/**
 * Analyze the actual deployed contract to understand its structure
 */

const Web3 = require('web3')

const VENUE_REGISTRY_ADDRESS = '0x7AaafaF53A972Bd11f0912049C0268dAE492D175'
const CELO_TESTNET_RPC = 'https://alfajores-forno.celo-testnet.org'

// Try different ABI structures based on what might be deployed
const POSSIBLE_ABIS = {
  // Current ABI (what we're using)
  current: [
    {
      inputs: [{ name: 'venueId', type: 'uint256' }],
      name: 'getVenueById',
      outputs: [
        {
          components: [
            { name: 'name', type: 'string' },
            { name: 'city', type: 'string' },
            { name: 'contactInfo', type: 'string' },
            { name: 'hasPiano', type: 'bool' },
            { name: 'verified', type: 'bool' },
            { name: 'submittedBy', type: 'address' },
            { name: 'timestamp', type: 'uint32' },
          ],
          name: '',
          type: 'tuple',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ],

  // Alternative: IPFS-based structure (from the contract comments)
  ipfsBased: [
    {
      inputs: [{ name: 'venueId', type: 'uint256' }],
      name: 'getVenueById',
      outputs: [
        {
          components: [
            { name: 'hasPiano', type: 'bool' },
            { name: 'hasJamSession', type: 'bool' },
            { name: 'verified', type: 'bool' },
            { name: 'venueType', type: 'uint8' },
            { name: 'submissionTimestamp', type: 'uint32' },
            { name: 'verificationTimestamp', type: 'uint32' },
            { name: 'submittedBy', type: 'address' },
            { name: 'name', type: 'string' },
            { name: 'city', type: 'string' },
            { name: 'contactType', type: 'string' },
            { name: 'ipfsHash', type: 'string' },
          ],
          name: '',
          type: 'tuple',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ],

  // Simple structure - just return individual values
  simple: [
    {
      inputs: [{ name: 'venueId', type: 'uint256' }],
      name: 'venues',
      outputs: [
        { name: 'name', type: 'string' },
        { name: 'city', type: 'string' },
        { name: 'verified', type: 'bool' },
        { name: 'submittedBy', type: 'address' },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ],
}

// Common methods that should exist
const COMMON_ABI = [
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
]

async function analyzeContract() {
  console.log('🔬 Analyzing deployed contract structure...')
  console.log('')

  try {
    const web3 = new Web3(CELO_TESTNET_RPC)

    // Test which getVenueById structure works
    console.log('🧪 Testing different getVenueById structures...')

    for (const [name, abi] of Object.entries(POSSIBLE_ABIS)) {
      console.log(`\nTesting ${name} ABI structure:`)

      try {
        const testAbi = [...COMMON_ABI, ...abi]
        const contract = new web3.eth.Contract(testAbi, VENUE_REGISTRY_ADDRESS)

        // Try to read venue 0
        const venue = await contract.methods.getVenueById(0).call()
        console.log(`✅ ${name} ABI works!`)
        console.log('Venue 0 data:', venue)

        // If this works, it's probably the right structure
        return { name, abi: testAbi, venue }
      } catch (error) {
        console.log(`❌ ${name} ABI failed: ${error.message.substring(0, 100)}...`)
      }
    }

    // Try alternative method names
    console.log('\n🔍 Trying alternative method names...')

    const alternativeNames = ['venues', 'getVenue', 'venueDetails', 'getVenueInfo']

    for (const methodName of alternativeNames) {
      try {
        const testAbi = [
          ...COMMON_ABI,
          {
            inputs: [{ name: 'venueId', type: 'uint256' }],
            name: methodName,
            outputs: [{ name: '', type: 'string' }], // Try simple string return
            stateMutability: 'view',
            type: 'function',
          },
        ]

        const contract = new web3.eth.Contract(testAbi, VENUE_REGISTRY_ADDRESS)
        const result = await contract.methods[methodName](0).call()

        console.log(`✅ Method '${methodName}' exists and returned:`, result)
      } catch (error) {
        console.log(`❌ Method '${methodName}' failed`)
      }
    }

    // Check if there are any public mappings or arrays we can access directly
    console.log('\n🗂️  Testing direct storage access...')

    const storageTests = [
      { name: 'venues mapping', method: 'venues', params: [0] },
      { name: 'venueList array', method: 'venueList', params: [0] },
      { name: 'submissions mapping', method: 'submissions', params: [0] },
    ]

    for (const test of storageTests) {
      try {
        const testAbi = [
          {
            inputs: [{ name: 'index', type: 'uint256' }],
            name: test.method,
            outputs: [{ name: '', type: 'string' }],
            stateMutability: 'view',
            type: 'function',
          },
        ]

        const contract = new web3.eth.Contract(testAbi, VENUE_REGISTRY_ADDRESS)
        const result = await contract.methods[test.method](...test.params).call()

        console.log(`✅ ${test.name} accessible:`, result)
      } catch (error) {
        console.log(`❌ ${test.name} not accessible`)
      }
    }
  } catch (error) {
    console.error('💥 Analysis failed:', error.message)
  }
}

analyzeContract()
  .then(() => console.log('\n🏁 Contract analysis complete'))
  .catch((error) => console.error('\n💥 Analysis error:', error.message))
