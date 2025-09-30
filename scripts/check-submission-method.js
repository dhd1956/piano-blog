/**
 * Check if submitVenue method exists and what parameters it expects
 */

const Web3 = require('web3')

const VENUE_REGISTRY_ADDRESS = '0x7AaafaF53A972Bd11f0912049C0268dAE492D175'
const CELO_TESTNET_RPC = 'https://alfajores-forno.celo-testnet.org'

// Test different submitVenue signatures
const SUBMISSION_ABIS = [
  // Current signature: (string, string, string, bool)
  {
    name: 'current',
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
    params: ['Test Venue', 'Test City', 'test@example.com', true],
  },

  // IPFS-based: might need IPFS hash
  {
    name: 'withIPFS',
    abi: [
      {
        inputs: [
          { name: 'name', type: 'string' },
          { name: 'city', type: 'string' },
          { name: 'contactType', type: 'string' },
          { name: 'ipfsHash', type: 'string' },
          { name: 'hasPiano', type: 'bool' },
        ],
        name: 'submitVenue',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ],
    params: ['Test Venue', 'Test City', 'email', 'QmTestHash123', true],
  },

  // Extended version: with more fields
  {
    name: 'extended',
    abi: [
      {
        inputs: [
          { name: 'name', type: 'string' },
          { name: 'city', type: 'string' },
          { name: 'contactInfo', type: 'string' },
          { name: 'hasPiano', type: 'bool' },
          { name: 'hasJamSession', type: 'bool' },
          { name: 'venueType', type: 'uint8' },
        ],
        name: 'submitVenue',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ],
    params: ['Test Venue', 'Test City', 'test@example.com', true, false, 1],
  },

  // Payable version: might require payment
  {
    name: 'payable',
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
        stateMutability: 'payable',
        type: 'function',
      },
    ],
    params: ['Test Venue', 'Test City', 'test@example.com', true],
  },
]

async function checkSubmissionMethods() {
  console.log('🔍 Checking submitVenue method signatures...')
  console.log('')

  const web3 = new Web3(CELO_TESTNET_RPC)

  // Use contract owner for testing
  const ownerAddress = '0xe8985AEDF83E2a58fEf53B45db2d9556CD5F453A'

  for (const test of SUBMISSION_ABIS) {
    console.log(`🧪 Testing ${test.name} signature...`)

    const contract = new web3.eth.Contract(
      [
        {
          inputs: [],
          name: 'venueCount',
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        },
        ...test.abi,
      ],
      VENUE_REGISTRY_ADDRESS
    )

    try {
      // Test gas estimation with method
      const gasEstimate = await contract.methods.submitVenue(...test.params).estimateGas({
        from: ownerAddress,
        ...(test.name === 'payable' ? { value: web3.utils.toWei('0.01', 'ether') } : {}),
      })

      console.log(`✅ ${test.name} signature works! Gas estimate: ${gasEstimate}`)
      console.log(`   Parameters: ${JSON.stringify(test.params)}`)

      // If we get here, this signature works
      return test
    } catch (error) {
      console.log(`❌ ${test.name} signature failed: ${error.message.substring(0, 80)}...`)

      // Try to get more specific error info
      try {
        await contract.methods.submitVenue(...test.params).call({ from: ownerAddress })
      } catch (callError) {
        if (callError.message.includes('revert')) {
          console.log(`   (Method exists but reverts: ${callError.message.substring(0, 50)}...)`)
        }
      }
    }

    console.log('')
  }

  console.log('❌ No working submitVenue signature found')
  return null
}

// Also check if contract might be paused or have access controls
async function checkAccessControls() {
  console.log('\n🔒 Checking access controls...')

  const web3 = new Web3(CELO_TESTNET_RPC)
  const ownerAddress = '0xe8985AEDF83E2a58fEf53B45db2d9556CD5F453A'

  const accessControlTests = [
    { name: 'paused', method: 'paused', returns: 'bool' },
    { name: 'submissionsPaused', method: 'submissionsPaused', returns: 'bool' },
    { name: 'onlyOwner', method: 'onlyOwnerSubmissions', returns: 'bool' },
    { name: 'submissionFee', method: 'submissionFee', returns: 'uint256' },
    { name: 'minSubmissionFee', method: 'minSubmissionFee', returns: 'uint256' },
  ]

  for (const test of accessControlTests) {
    try {
      const testAbi = [
        {
          inputs: [],
          name: test.method,
          outputs: [{ name: '', type: test.returns }],
          stateMutability: 'view',
          type: 'function',
        },
      ]

      const contract = new web3.eth.Contract(testAbi, VENUE_REGISTRY_ADDRESS)
      const result = await contract.methods[test.method]().call()

      console.log(`✅ ${test.name}: ${result}`)
    } catch (error) {
      console.log(`❌ ${test.name}: not found`)
    }
  }
}

async function runAllChecks() {
  const workingMethod = await checkSubmissionMethods()

  if (!workingMethod) {
    await checkAccessControls()

    // Final suggestion
    console.log('\n💡 Suggestions:')
    console.log('1. The contract might require the exact deployer address to submit')
    console.log('2. There might be a submission fee required')
    console.log('3. The contract might be in a paused state')
    console.log('4. The ABI might be missing required fields')
    console.log('5. Check the actual contract source code for submission requirements')
  }
}

runAllChecks()
  .then(() => console.log('\n🏁 Check complete'))
  .catch((error) => console.error('\n💥 Check error:', error.message))
