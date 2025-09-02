'use client'

import { useState, useEffect } from 'react'

export default function DebugPage() {
  const [status, setStatus] = useState('Testing...')
  const [contractInfo, setContractInfo] = useState<any>(null)

  useEffect(() => {
    async function testContract() {
      try {
        setStatus('Importing Web3...')
        const Web3 = (await import('web3')).default
        
        setStatus('Creating Web3 instance...')
        const web3 = new Web3('https://alfajores-forno.celo-testnet.org')
        
        setStatus('Testing chain connection...')
        const chainId = await web3.eth.getChainId()
        
        setStatus('Testing contract...')
        const contract = new web3.eth.Contract([
          {
            "inputs": [],
            "name": "venueCount",
            "outputs": [{"name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [],
            "name": "owner", 
            "outputs": [{"name": "", "type": "address"}],
            "stateMutability": "view",
            "type": "function"
          }
        ], '0x29FC1Cc9D4451896CaDD41ceA7C6aBd1E71Ab3B2')
        
        const venueCount = await contract.methods.venueCount().call()
        const owner = await contract.methods.owner().call()
        
        setContractInfo({
          chainId,
          venueCount,
          owner,
          contractAddress: '0x29FC1Cc9D4451896CaDD41ceA7C6aBd1E71Ab3B2'
        })
        
        setStatus('✅ All tests passed!')
        
      } catch (error: any) {
        setStatus(`❌ Error: ${error.message}`)
        console.error('Debug test failed:', error)
      }
    }

    testContract()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Contract Debug Page</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Status</h2>
        <p className="font-mono text-sm">{status}</p>
      </div>
      
      {contractInfo && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-green-800">Contract Info</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Chain ID:</strong> {contractInfo.chainId}</p>
            <p><strong>Contract:</strong> {contractInfo.contractAddress}</p>
            <p><strong>Owner:</strong> {contractInfo.owner}</p>
            <p><strong>Venue Count:</strong> {contractInfo.venueCount}</p>
          </div>
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <p>This page tests the contract directly without the Web3Provider context.</p>
        <p>If this works but the main site doesn't, the issue is in the Web3Provider.</p>
      </div>
    </div>
  )
}