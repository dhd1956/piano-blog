/**
 * Test script to retrieve IPFS data for the venue
 */

const fetch = require('node-fetch')

const IPFS_HASH = 'bafkreietrpo72cwrs27r7u3h5lzj5bkbza7ddqrji47t6pnowwurimva6q'
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs'
const IPFS_GATEWAY = 'https://ipfs.io/ipfs'

async function testIPFSData() {
  console.log('🔍 Testing IPFS data retrieval...')
  console.log('📍 IPFS Hash:', IPFS_HASH)
  console.log('')
  
  // Try Pinata gateway first
  console.log('Test 1: Pinata Gateway')
  try {
    const pinataUrl = `${PINATA_GATEWAY}/${IPFS_HASH}`
    console.log('🌐 URL:', pinataUrl)
    
    const response = await fetch(pinataUrl, {
      headers: { 'Accept': 'application/json' },
      timeout: 10000
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Pinata gateway success!')
      console.log('📄 IPFS Data:')
      console.log(JSON.stringify(data, null, 2))
    } else {
      console.log('❌ Pinata gateway failed:', response.status, response.statusText)
    }
  } catch (error) {
    console.log('❌ Pinata gateway error:', error.message.substring(0, 100))
  }
  
  console.log('')
  
  // Try public IPFS gateway
  console.log('Test 2: Public IPFS Gateway')
  try {
    const ipfsUrl = `${IPFS_GATEWAY}/${IPFS_HASH}`
    console.log('🌐 URL:', ipfsUrl)
    
    const response = await fetch(ipfsUrl, {
      headers: { 'Accept': 'application/json' },
      timeout: 15000
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Public gateway success!')
      console.log('📄 IPFS Data:')
      console.log(JSON.stringify(data, null, 2))
    } else {
      console.log('❌ Public gateway failed:', response.status, response.statusText)
    }
  } catch (error) {
    console.log('❌ Public gateway error:', error.message.substring(0, 100))
  }
  
  console.log('')
  console.log('🔍 IPFS test complete!')
}

// Run the test
testIPFSData()
  .then(() => {
    console.log('✅ IPFS data test finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ IPFS test failed:', error)
    process.exit(1)
  })