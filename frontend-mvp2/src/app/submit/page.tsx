'use client'

import { useState, useEffect } from 'react'
import { newKit } from '@celo/contractkit'
import Web3 from 'web3'

// Your deployed contract addresses
const VENUE_REGISTRY_ADDRESS = '0x7AaafaF53A972Bd11f0912049C0268dAE492D175'
const CELO_TESTNET_RPC = 'https://alfajores-forno.celo-testnet.org'

// Minimal ABI for venue submission
const VENUE_REGISTRY_ABI = [
  {
    "inputs": [
      {
        "components": [
          {"name": "hasPiano", "type": "bool"},
          {"name": "hasJamSession", "type": "bool"},
          {"name": "verified", "type": "bool"},
          {"name": "venueType", "type": "uint8"},
          {"name": "submissionTimestamp", "type": "uint32"},
          {"name": "verificationTimestamp", "type": "uint32"},
          {"name": "submittedBy", "type": "address"},
          {"name": "name", "type": "string"},
          {"name": "city", "type": "string"},
          {"name": "contactType", "type": "string"},
          {"name": "ipfsHash", "type": "string"}
        ],
        "name": "venue",
        "type": "tuple"
      }
    ],
    "name": "submitVenue",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "venueCount",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
]

interface VenueFormData {
  name: string
  city: string
  contactType: string
  contactInfo: string
  hasPiano: boolean
  hasJamSession: boolean
  venueType: number
  description: string
  address: string
}

export default function SubmitVenue() {
  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    city: 'Toronto',
    contactType: 'email',
    contactInfo: '',
    hasPiano: true,
    hasJamSession: false,
    venueType: 0,
    description: '',
    address: ''
  })

  const [walletAddress, setWalletAddress] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<string>('')
  const [venueCount, setVenueCount] = useState<number>(0)

  // Connect wallet function
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        })
        
        if (accounts.length > 0) {
          setWalletAddress(accounts[0])
          setIsConnected(true)
          
          // Check if on Celo testnet
          const chainId = await window.ethereum.request({ method: 'eth_chainId' })
          if (chainId !== '0xaef3') { // 44787 in hex
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xaef3' }]
              })
            } catch (error: any) {
              if (error.code === 4902) {
                // Add Celo Alfajores network
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0xaef3',
                    chainName: 'Celo Alfajores Testnet',
                    nativeCurrency: {
                      name: 'CELO',
                      symbol: 'CELO',
                      decimals: 18
                    },
                    rpcUrls: [CELO_TESTNET_RPC],
                    blockExplorerUrls: ['https://explorer.celo.org/alfajores/']
                  }]
                })
              }
            }
          }
          
          // Get current venue count
          await fetchVenueCount()
        }
      } else {
        alert('Please install MetaMask!')
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      setSubmitStatus('Failed to connect wallet')
    }
  }

  // Fetch current venue count
  const fetchVenueCount = async () => {
    try {
      const kit = newKit(CELO_TESTNET_RPC)
      const contract = new kit.web3.eth.Contract(VENUE_REGISTRY_ABI, VENUE_REGISTRY_ADDRESS)
      const count = await contract.methods.venueCount().call()
      setVenueCount(Number(count))
    } catch (error) {
      console.error('Error fetching venue count:', error)
    }
  }

  // Create simple IPFS hash simulation (in production, upload to actual IPFS)
  const createIPFSHash = (data: any): string => {
    // Simulate IPFS hash - in production, upload to IPFS and return real hash
    const jsonString = JSON.stringify(data)
    return `QmTest${Date.now()}${Math.random().toString(36).substr(2, 9)}`
  }

  // Submit venue function
  const submitVenue = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('Submitting venue...')

    try {
      // Create detailed venue data for IPFS
      const detailedVenueData = {
        venueDetails: {
          fullName: formData.name,
          description: formData.description,
          fullAddress: formData.address,
          city: formData.city,
          contactInfo: formData.contactInfo,
          contactType: formData.contactType
        },
        musicalInfo: {
          hasPiano: formData.hasPiano,
          hasJamSession: formData.hasJamSession,
          pianoType: 'To be verified',
          pianoCondition: 'To be assessed'
        },
        submissionInfo: {
          submittedBy: walletAddress,
          submissionDate: new Date().toISOString(),
          verified: false
        }
      }

      // Create IPFS hash (simulated)
      const ipfsHash = createIPFSHash(detailedVenueData)

      // Prepare venue struct for smart contract
      const venueStruct = {
        hasPiano: formData.hasPiano,
        hasJamSession: formData.hasJamSession,
        verified: false,
        venueType: formData.venueType,
        submissionTimestamp: 0, // Contract will set this
        verificationTimestamp: 0,
        submittedBy: '0x0000000000000000000000000000000000000000', // Contract will set this
        name: formData.name.substring(0, 64), // Enforce max length
        city: formData.city.substring(0, 32),
        contactType: formData.contactType,
        ipfsHash: ipfsHash
      }

      // Submit to blockchain using MetaMask directly
      // Submit to blockchain using MetaMask provider
      if (!window.ethereum) {
        throw new Error('MetaMask not found')
      }

      // Ensure we're on the correct network (Celo Alfajores)
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      if (chainId !== '0xaef3') { // 44787 in hex
        throw new Error('Please switch to Celo Alfajores testnet')
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      // Create Web3 instance with MetaMask provider
      const web3 = new Web3(window.ethereum)

      // Verify the connection
      const isConnected = await web3.eth.net.isListening()
      if (!isConnected) {
        throw new Error('Web3 provider not connected')
      }

      const contract = new web3.eth.Contract(VENUE_REGISTRY_ABI, VENUE_REGISTRY_ADDRESS)

      const tx = await contract.methods.submitVenue(venueStruct).send({
        from: walletAddress,
        gas: 300000,
        gasPrice: await web3.eth.getGasPrice()
      })

      setSubmitStatus(`✅ Venue submitted successfully! Transaction: ${tx.transactionHash}`)
      
      // Reset form
      setFormData({
        name: '',
        city: 'Toronto',
        contactType: 'email',
        contactInfo: '',
        hasPiano: true,
        hasJamSession: false,
        venueType: 0,
        description: '',
        address: ''
      })
      
      // Update venue count
      setTimeout(fetchVenueCount, 2000)
      
    } catch (error: any) {
      console.error('Error submitting venue:', error)
      setSubmitStatus(`❌ Error submitting venue: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load venue count on component mount
  useEffect(() => {
    fetchVenueCount()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎹 Submit a Piano Venue
          </h1>
          <p className="text-gray-600">
            Found a venue with a piano? Help build our community by submitting it for verification.
          </p>
          <p className="text-sm text-blue-600 mt-2">
            Current venues in database: {venueCount} | Reward: 1 TCoin per verified venue
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          {!isConnected ? (
            <div>
              <p className="text-blue-800 mb-3">Connect your wallet to submit venues and earn TCoin rewards</p>
              <button
                onClick={connectWallet}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Connect MetaMask Wallet
              </button>
            </div>
          ) : (
            <div className="text-green-800">
              ✅ Connected: {walletAddress.substring(0, 8)}...{walletAddress.substring(-6)}
            </div>
          )}
        </div>

        {/* Venue Submission Form */}
        <form onSubmit={submitVenue} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue Name *
              </label>
              <input
                type="text"
                required
                maxLength={64}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Jazz Room Toronto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                required
                maxLength={32}
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Toronto"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="456 Queen Street West, Toronto, ON"
            />
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Type
              </label>
              <select
                value={formData.contactType}
                onChange={(e) => setFormData({...formData, contactType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="website">Website</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Information
              </label>
              <input
                type="text"
                value={formData.contactInfo}
                onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="manager@venue.com"
              />
            </div>
          </div>

          {/* Venue Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Venue Type
            </label>
            <select
              value={formData.venueType}
              onChange={(e) => setFormData({...formData, venueType: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Cafe</option>
              <option value={1}>Restaurant</option>
              <option value={2}>Bar</option>
              <option value={3}>Club</option>
              <option value={4}>Community Center</option>
            </select>
          </div>

          {/* Piano & Jam Options */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.hasPiano}
                onChange={(e) => setFormData({...formData, hasPiano: e.target.checked})}
                className="mr-3 h-4 w-4 text-blue-600"
              />
              <label className="text-sm font-medium text-gray-700">
                Has Piano Available
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.hasJamSession}
                onChange={(e) => setFormData({...formData, hasJamSession: e.target.checked})}
                className="mr-3 h-4 w-4 text-blue-600"
              />
              <label className="text-sm font-medium text-gray-700">
                Hosts Jam Sessions
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description / Notes
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about this venue, the piano, atmosphere, etc..."
            />
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={!isConnected || isSubmitting}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Venue for Verification'}
            </button>
          </div>

          {/* Status Message */}
          {submitStatus && (
            <div className={`p-4 rounded-lg ${submitStatus.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {submitStatus}
            </div>
          )}
        </form>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">How it works:</h3>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Submit venue details through this form</li>
            <li>2. Our curator visits and verifies the venue</li>
            <li>3. If approved, you receive 1 TCoin reward</li>
            <li>4. Venue becomes available to the community</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
