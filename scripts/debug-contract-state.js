/**
 * Debug the contract state to understand why submissions are failing
 */

const Web3 = require('web3')

const VENUE_REGISTRY_ADDRESS = '0x7AaafaF53A972Bd11f0912049C0268dAE492D175'
const CELO_TESTNET_RPC = 'https://alfajores-forno.celo-testnet.org'
const YOUR_ADDRESS = '0xe8985AEDF83E2a58fEf53B45db2d9556CD5F453A'

// Test different possible contract states
const TEST_ABIS = [
  {
    name: 'Basic submitVenue',
    abi: [
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
    ],
  },
  {
    name: 'Check paused state',
    abi: [
      {
        inputs: [],
        name: 'paused',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
  },
  {
    name: 'Check owner',
    abi: [
      {
        inputs: [],
        name: 'owner',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
  },
  {
    name: 'Check submission enabled',
    abi: [
      {
        inputs: [],
        name: 'submissionsEnabled',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
  },
]

async function debugContractState() {
  console.log('🔍 Debugging contract state...')
  console.log('')

  const web3 = new Web3(CELO_TESTNET_RPC)

  // Test different contract state checks
  for (const test of TEST_ABIS) {
    try {
      const contract = new web3.eth.Contract(test.abi, VENUE_REGISTRY_ADDRESS)
      const methodName = test.abi[0].name

      if (methodName === 'submitVenue') {
        // Test with minimal valid data
        console.log(`🧪 Testing ${test.name}...`)

        try {
          await contract.methods
            .submitVenue('Test', 'Test', 'test@test.com', true)
            .call({ from: YOUR_ADDRESS })

          console.log(`✅ ${test.name}: Call succeeded`)
        } catch (error) {
          console.log(`❌ ${test.name}: ${error.message}`)
        }
      } else {
        // Test state reading methods
        console.log(`🔍 Checking ${test.name}...`)

        try {
          const result = await contract.methods[methodName]().call()
          console.log(`✅ ${test.name}: ${result}`)
        } catch (error) {
          console.log(`❌ ${test.name}: Method not found`)
        }
      }
    } catch (error) {
      console.log(`❌ ${test.name}: Contract error`)
    }
  }

  console.log('\n🔍 Testing edge cases...')

  // Test with different data patterns that existing venues use
  const existingPatterns = [
    { name: 'Single Word', city: 'SingleCity', contact: 'email@test.com', piano: true },
    { name: '', city: 'TestCity', contact: 'test@test.com', piano: true }, // Empty name
    { name: 'Test Name', city: '', contact: 'test@test.com', piano: true }, // Empty city
    { name: 'Test Name', city: 'TestCity', contact: '', piano: true }, // Empty contact
  ]

  const contract = new web3.eth.Contract(TEST_ABIS[0].abi, VENUE_REGISTRY_ADDRESS)

  for (let i = 0; i < existingPatterns.length; i++) {
    const pattern = existingPatterns[i]
    console.log(`\nTest ${i + 1}: ${pattern.name || '[empty]'} in ${pattern.city || '[empty]'}`)

    try {
      await contract.methods
        .submitVenue(pattern.name, pattern.city, pattern.contact, pattern.piano)
        .call({ from: YOUR_ADDRESS })

      console.log(`✅ Pattern ${i + 1}: Would succeed`)
    } catch (error) {
      console.log(`❌ Pattern ${i + 1}: ${error.message}`)
    }
  }
}

debugContractState()
  .then(() => {
    console.log('\n🏁 Contract state debugging complete')
    console.log('\n💡 Summary:')
    console.log(
      '- If all tests fail with "execution reverted", the contract has validation logic preventing all submissions'
    )
    console.log('- If some patterns work, we can identify what data format is required')
    console.log('- If paused/owner checks show issues, that explains the blocking')
  })
  .catch((error) => console.error('\n💥 Debug error:', error.message))
