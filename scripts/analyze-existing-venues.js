/**
 * Analyze existing venues to understand submission patterns
 */

const Web3 = require('web3')

const VENUE_REGISTRY_ADDRESS = '0x7AaafaF53A972Bd11f0912049C0268dAE492D175'
const CELO_TESTNET_RPC = 'https://alfajores-forno.celo-testnet.org'

// Working READ_ABI
const READ_ABI = [
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
  {
    inputs: [],
    name: 'venueCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

// Simple submit ABI
const SUBMIT_ABI = [
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
]

async function analyzeExistingVenues() {
  console.log('🔍 Analyzing existing venues for patterns...')
  console.log('')

  const web3 = new Web3(CELO_TESTNET_RPC)
  const readContract = new web3.eth.Contract(READ_ABI, VENUE_REGISTRY_ADDRESS)
  const submitContract = new web3.eth.Contract(SUBMIT_ABI, VENUE_REGISTRY_ADDRESS)

  try {
    const count = await readContract.methods.venueCount().call()
    console.log(`📊 Total venues: ${count}`)
    console.log('')

    const venues = []

    // Get all existing venues
    for (let i = 0; i < count; i++) {
      try {
        const venue = await readContract.methods.getVenueById(i).call()
        venues.push({
          id: i,
          name: venue.name,
          city: venue.city,
          contactType: venue.contactType,
          ipfsHash: venue.ipfsHash,
          hasPiano: venue.hasPiano,
          submittedBy: venue.submittedBy,
          submissionDate: new Date(venue.submissionTimestamp * 1000).toISOString(),
        })

        console.log(`Venue ${i}:`)
        console.log(`  Name: "${venue.name}"`)
        console.log(`  City: "${venue.city}"`)
        console.log(`  Has Piano: ${venue.hasPiano}`)
        console.log(`  Contact Type: "${venue.contactType}"`)
        console.log(`  IPFS Hash: "${venue.ipfsHash}"`)
        console.log(`  Submitted By: ${venue.submittedBy}`)
        console.log(`  Date: ${new Date(venue.submissionTimestamp * 1000).toLocaleString()}`)
        console.log('')
      } catch (error) {
        console.log(`❌ Error reading venue ${i}: ${error.message}`)
      }
    }

    // Look for patterns
    console.log('🔍 Looking for submission patterns...')

    const cities = venues.map((v) => v.city).filter((c) => c)
    const names = venues.map((v) => v.name).filter((n) => n)
    const submitters = venues.map((v) => v.submittedBy)

    console.log('Cities used:', [...new Set(cities)])
    console.log('Unique submitters:', [...new Set(submitters)])
    console.log('')

    // Try submitting with a completely different pattern
    console.log('🧪 Testing submission with unique data...')

    const uniqueTest = {
      name: 'Unique Test ' + Math.random().toString(36).substring(7),
      city: 'UniqueCity' + Math.random().toString(36).substring(7),
      contactInfo: 'unique' + Date.now() + '@test.com',
      hasPiano: true,
    }

    console.log('Test data:', uniqueTest)

    const blogOwner = '0x1673A1b7DDCF7a7850Df2577067d93897a1CE8E0'

    try {
      const gasEstimate = await submitContract.methods
        .submitVenue(uniqueTest.name, uniqueTest.city, uniqueTest.contactInfo, uniqueTest.hasPiano)
        .estimateGas({ from: blogOwner })

      console.log('✅ Unique submission works! Gas:', gasEstimate)
    } catch (error) {
      console.error('❌ Unique submission failed:', error.message)

      // Get more details about the error
      try {
        const result = await submitContract.methods
          .submitVenue(
            uniqueTest.name,
            uniqueTest.city,
            uniqueTest.contactInfo,
            uniqueTest.hasPiano
          )
          .call({ from: blogOwner })

        console.log('Call result:', result)
      } catch (callError) {
        console.error('Call error:', callError.message)

        // Try to decode the revert reason
        if (callError.data) {
          console.log('Error data:', callError.data)
        }
      }
    }
  } catch (error) {
    console.error('💥 Analysis failed:', error.message)
  }
}

analyzeExistingVenues()
  .then(() => console.log('\n🏁 Analysis complete'))
  .catch((error) => console.error('\n💥 Analysis error:', error.message))
