'use client'

import { useCallback } from 'react'
import { useWeb3 } from '@/components/web3/WorkingWeb3Provider'
import { 
  createFullContract, 
  createReadOnlyContract,
  VENUE_REGISTRY_ABI,
  VENUE_REGISTRY_ADDRESS,
  CELO_TESTNET_RPC,
  estimateGas,
  getCurrentGasPrice,
  GAS_ESTIMATES 
} from '@/utils/contract'
import { IPFSService } from '@/utils/ipfs'
import Web3 from 'web3'

export interface ContractInteractionOptions {
  gasLimit?: number
  gasPrice?: string
  confirmations?: number
  onTransactionHash?: (hash: string) => void
  onConfirmation?: (confirmationNumber: number, receipt: any) => void
}

export interface VenueData {
  name: string
  city: string
  contactInfo: string
  hasPiano: boolean
  description?: string  // For UI only - not sent to contract
  address?: string     // For UI only - not sent to contract
}

export function useWallet() {
  const {
    status,
    isConnected,
    walletAddress,
    isOnCorrectNetwork,
    web3,
    connect,
    disconnect,
    switchNetwork,
    refreshConnection,
    error,
    isBlogOwner,
    isAuthorizedCurator
  } = useWeb3()

  // Get read-only contract (doesn't require wallet connection)
  const getReadOnlyContract = useCallback(() => {
    const web3 = new Web3(CELO_TESTNET_RPC)
    return createReadOnlyContract(web3)
  }, [])

  // Get connected contract (requires wallet connection)
  const getConnectedContract = useCallback(() => {
    if (!web3 || !isConnected) {
      throw new Error('Wallet not connected')
    }
    console.log('🔗 Creating connected contract with web3:', !!web3, 'connected:', isConnected)
    console.log('🔗 Web3 provider:', web3.currentProvider)
    const contract = createFullContract(web3)
    console.log('📋 Contract created at address:', contract.options.address)
    return contract
  }, [web3, isConnected])

  // Ensure wallet is connected and on correct network
  const ensureConnection = useCallback(async (): Promise<boolean> => {
    console.log('🔧 [ensureConnection] Starting connection check...')
    console.log('🔧 [ensureConnection] Initial state:', { isConnected, isOnCorrectNetwork })

    if (!isConnected) {
      console.log('🔧 [ensureConnection] Not connected, attempting to connect...')
      const connected = await connect()
      console.log('🔧 [ensureConnection] Connect result:', connected)
      if (!connected) {
        console.error('❌ [ensureConnection] Failed to connect wallet')
        return false
      }
    } else {
      console.log('✅ [ensureConnection] Already connected')
    }

    if (!isOnCorrectNetwork) {
      console.log('🔧 [ensureConnection] Wrong network, attempting to switch...')
      const switched = await switchNetwork()
      console.log('🔧 [ensureConnection] Network switch result:', switched)
      if (!switched) {
        console.error('❌ [ensureConnection] Failed to switch network')
        return false
      }
    } else {
      console.log('✅ [ensureConnection] On correct network')
    }

    console.log('✅ [ensureConnection] All checks passed')
    return true
  }, [isConnected, isOnCorrectNetwork, connect, switchNetwork])

  // Submit venue to blockchain
  const submitVenue = useCallback(async (
    venueData: VenueData,
    options: ContractInteractionOptions = {}
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
    try {
      console.log('🚀 Starting venue submission:', {
        name: venueData.name,
        city: venueData.city,
        hasPiano: venueData.hasPiano,
        walletAddress: walletAddress
      })

      // Ensure wallet is connected and on correct network
      if (!(await ensureConnection())) {
        return { success: false, error: 'Wallet connection failed' }
      }

      if (!walletAddress) {
        return { success: false, error: 'No wallet address available' }
      }

      const contract = getConnectedContract()
      console.log('📋 Contract created:', contract.options.address)

      // Validate required fields  
      if (!venueData.name || !venueData.city || !venueData.contactInfo) {
        return { success: false, error: 'Missing required venue information' }
      }

      console.log('📋 Venue submission data:', {
        name: venueData.name,
        city: venueData.city,
        contactInfo: venueData.contactInfo,
        hasPiano: venueData.hasPiano
      })

      // Test if contract exists and has the method
      try {
        const testCall = await contract.methods.submitVenue.estimateGas
        console.log('✅ Contract method exists')
      } catch (testError) {
        console.error('❌ Contract method test failed:', testError)
        return { success: false, error: 'Contract method not found. Please check the contract address and ABI.' }
      }

      // Estimate gas with all 8 parameters for V3 contract
      console.log('⛽ Estimating gas...')
      const gasEstimate = await estimateGas(
        contract,
        'submitVenue',
        [
          venueData.name,
          venueData.city, 
          venueData.contactInfo,
          'email', // contactType - default to email
          '', // ipfsHash - empty for initial submission
          venueData.hasPiano,
          false, // hasJamSession - default to false  
          0 // venueType - default to 0 (Cafe)
        ],
        walletAddress
      )
      console.log('⛽ Gas estimate:', gasEstimate)

      // Get current gas price
      const gasPrice = options.gasPrice || await getCurrentGasPrice(web3!)
      console.log('💰 Gas price:', gasPrice)

      // Submit transaction with simple 4 parameters (matches deploy.js ABI)
      console.log('🚀 About to send transaction with params:', {
        from: walletAddress,
        gas: options.gasLimit || gasEstimate,
        gasPrice: gasPrice,
        contractAddress: contract.options.address
      })
      
      // Try minimal transaction approach
      if (!window.ethereum) {
        throw new Error('MetaMask not available')
      }
      
      console.log('🔧 Network test - current chainId:', await window.ethereum.request({ method: 'eth_chainId' }))
      console.log('🔧 Network test - current accounts:', await window.ethereum.request({ method: 'eth_accounts' }))
      
      // Try a simple test transaction first - just estimateGas without sending
      const directWeb3 = new Web3(window.ethereum)
      const directContract = createFullContract(directWeb3)
      
      console.log('🔧 Testing gas estimation with direct web3...')
      const testGas = await directContract.methods.submitVenue(
        venueData.name,
        venueData.city,
        venueData.contactInfo,
        'email', // contactType - default to email
        '', // ipfsHash - empty for initial submission
        venueData.hasPiano,
        false, // hasJamSession - default to false
        0 // venueType - default to 0 (Cafe)
      ).estimateGas({ from: walletAddress })
      
      console.log('✅ Gas estimation successful:', testGas)
      
      // Try transaction with minimal settings (let MetaMask handle gas)
      console.log('🚀 Sending transaction with minimal settings...')
      const tx = await directContract.methods.submitVenue(
        venueData.name,
        venueData.city,
        venueData.contactInfo,
        'email', // contactType - default to email
        '', // ipfsHash - empty for now
        venueData.hasPiano,
        false, // hasJamSession - default to false
        0 // venueType - default to 0 (Cafe)
      ).send({
        from: walletAddress
        // Let MetaMask handle gas estimation and pricing
      })
      
      console.log('✅ Transaction successful:', tx)

      // Call callbacks if provided
      if (options.onTransactionHash && tx.transactionHash) {
        options.onTransactionHash(tx.transactionHash)
      }

      return {
        success: true,
        transactionHash: tx.transactionHash
      }

    } catch (error: any) {
      console.error('Error submitting venue:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        data: error.data,
        stack: error.stack
      })
      
      let errorMessage = 'Transaction failed'
      
      if (error.code === 4001) {
        errorMessage = 'Transaction rejected by user'
      } else if (error.code === -32603) {
        errorMessage = `JSON-RPC error: ${error.message || 'Internal error'}`
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient CELO for gas fees. Please add more CELO to your wallet.'
      } else if (error.message?.includes('nonce')) {
        errorMessage = 'Transaction nonce error. Please try again.'
      } else if (error.message?.includes('gas')) {
        errorMessage = 'Gas estimation failed. The transaction might not be valid.'
      } else if (error.message?.includes('execution reverted')) {
        errorMessage = `Contract rejected transaction: ${error.message}`
      } else if (error.message) {
        errorMessage = `Transaction failed: ${error.message}`
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }, [ensureConnection, walletAddress, getConnectedContract, web3])

  // Update venue information (curator only)
  const updateVenue = useCallback(async (
    venueId: number,
    newName: string,
    newContactInfo: string,
    options: ContractInteractionOptions = {}
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
    try {
      // Check permissions
      if (!isBlogOwner && !isAuthorizedCurator) {
        return { success: false, error: 'Not authorized to update venues' }
      }

      // Ensure wallet is connected and on correct network
      if (!(await ensureConnection())) {
        return { success: false, error: 'Wallet connection failed' }
      }

      if (!walletAddress) {
        return { success: false, error: 'No wallet address available' }
      }

      const contract = getConnectedContract()

      // Validate inputs
      if (!newName || !newContactInfo) {
        return { success: false, error: 'Name and contact info are required' }
      }

      // Gas estimation and pricing handled by MetaMask

      // Submit transaction (let MetaMask handle gas)
      const tx = await contract.methods.updateVenue(
        venueId,
        newName,
        newContactInfo
      ).send({
        from: walletAddress
        // Let MetaMask handle gas estimation and pricing
      })

      // Call callbacks if provided
      if (options.onTransactionHash && tx.transactionHash) {
        options.onTransactionHash(tx.transactionHash)
      }

      return {
        success: true,
        transactionHash: tx.transactionHash
      }

    } catch (error: any) {
      console.error('Error updating venue:', error)
      return {
        success: false,
        error: error.message || 'Transaction failed'
      }
    }
  }, [ensureConnection, walletAddress, getConnectedContract, web3, isBlogOwner, isAuthorizedCurator])

  // Update venue with IPFS metadata storage
  const updateVenueWithMetadata = useCallback(async (
    venueId: number,
    basicUpdates: { name?: string; contactInfo?: string },
    extendedUpdates: any,
    options: ContractInteractionOptions = {}
  ): Promise<{ success: boolean; transactionHash?: string; ipfsHash?: string; error?: string }> => {
    try {
      // Check permissions
      if (!isBlogOwner && !isAuthorizedCurator) {
        return { success: false, error: 'Not authorized to update venues' }
      }

      // Ensure wallet is connected and on correct network
      if (!(await ensureConnection())) {
        return { success: false, error: 'Wallet connection failed' }
      }

      if (!walletAddress) {
        return { success: false, error: 'No wallet address available' }
      }

      console.log('🔄 Starting venue update with IPFS metadata...')

      // First, get current venue data to retrieve existing IPFS hash
      const contract = getReadOnlyContract()
      const venue = await contract.methods.getVenueById(venueId).call()
      
      const currentVenue = {
        id: venueId,
        name: venue.name,
        city: venue.city,
        contactInfo: venue.contactInfo,
        ipfsHash: venue.ipfsHash || '',
      }
      let newIpfsHash = currentVenue.ipfsHash || ''

      // Upload extended metadata to IPFS if there are extended updates
      if (extendedUpdates && Object.keys(extendedUpdates).length > 0) {
        console.log('📤 Uploading extended metadata to IPFS...')
        const ipfsResult = await IPFSService.updateMetadata(
          currentVenue.ipfsHash || '',
          extendedUpdates,
          venueId,
          walletAddress
        )

        if (!ipfsResult.success) {
          return { success: false, error: `IPFS upload failed: ${ipfsResult.error}` }
        }

        newIpfsHash = ipfsResult.ipfsHash!
        console.log('✅ IPFS metadata updated:', newIpfsHash)
      }

      // Update venue on blockchain with IPFS hash
      let transactionHash = ''
      const needsBlockchainUpdate = basicUpdates.name || basicUpdates.contactInfo || newIpfsHash !== currentVenue.ipfsHash
      
      if (needsBlockchainUpdate) {
        console.log('⛓️ Updating venue with IPFS hash on blockchain...')
        const contract = getConnectedContract()

        // Use the enhanced updateVenueWithIPFS function
        const tx = await contract.methods.updateVenueWithIPFS(
          venueId,
          basicUpdates.name || currentVenue.name,
          basicUpdates.contactInfo || currentVenue.contactInfo,
          newIpfsHash
        ).send({
          from: walletAddress
          // Let MetaMask handle gas estimation and pricing
        })

        transactionHash = tx.transactionHash
        console.log('✅ Venue and IPFS hash updated on blockchain:', transactionHash)
        console.log('✅ New IPFS hash stored on-chain:', newIpfsHash)
      }

      // Call callbacks if provided
      if (options.onTransactionHash && transactionHash) {
        options.onTransactionHash(transactionHash)
      }

      return {
        success: true,
        transactionHash: transactionHash || undefined,
        ipfsHash: newIpfsHash || undefined
      }

    } catch (error: any) {
      console.error('❌ Error updating venue with metadata:', error)
      return {
        success: false,
        error: error.message || 'Transaction failed'
      }
    }
  }, [ensureConnection, walletAddress, getConnectedContract, web3, isBlogOwner, isAuthorizedCurator, getReadOnlyContract])

  // Verify venue (curator only)
  const verifyVenue = useCallback(async (
    venueId: number,
    approved: boolean,
    curatorNotes?: string,
    options: ContractInteractionOptions = {}
  ): Promise<{ success: boolean; transactionHash?: string; ipfsHash?: string; error?: string }> => {
    console.log('🔧 [verifyVenue] Starting verification process...')
    console.log('🔧 [verifyVenue] Input params:', { 
      venueId, 
      approved, 
      hasCuratorNotes: !!curatorNotes?.trim(),
      curatorNotesLength: curatorNotes?.length || 0
    })
    
    try {
      // Check permissions
      console.log('🔧 [verifyVenue] Checking permissions:', { isBlogOwner, isAuthorizedCurator })
      if (!isBlogOwner && !isAuthorizedCurator) {
        console.error('❌ [verifyVenue] Permission denied')
        return { success: false, error: 'Not authorized to verify venues' }
      }

      // Check current connection state before calling ensureConnection
      console.log('🔧 [verifyVenue] Current connection state:', { 
        isConnected, 
        isOnCorrectNetwork,
        hasWalletAddress: !!walletAddress,
        walletAddress: walletAddress ? `${walletAddress.substring(0, 8)}...` : 'none'
      })

      // Ensure wallet is connected and on correct network
      console.log('🔧 [verifyVenue] Calling ensureConnection...')
      const connectionResult = await ensureConnection()
      console.log('🔧 [verifyVenue] ensureConnection result:', connectionResult)
      
      if (!connectionResult) {
        console.error('❌ [verifyVenue] ensureConnection failed')
        return { success: false, error: 'Wallet connection failed. Please ensure MetaMask is unlocked and on the correct network.' }
      }

      if (!walletAddress) {
        console.error('❌ [verifyVenue] No wallet address after connection')
        return { success: false, error: 'No wallet address available after connection' }
      }

      console.log('✅ [verifyVenue] Connection checks passed')

      const contract = getConnectedContract()

      // Store curator notes (temporary local storage until contract supports IPFS)
      let ipfsUpdateResult: any = null
      if (curatorNotes && curatorNotes.trim()) {
        console.log('🔧 [verifyVenue] Saving curator notes...')
        
        try {
          const curatorMetadata = {
            verificationNotes: curatorNotes.trim(),
            verifiedBy: walletAddress,
            verificationDate: new Date().toISOString(),
            verificationStatus: approved ? 'approved' : 'rejected'
          }
          console.log('🔧 [verifyVenue] Curator metadata prepared:', { 
            notesLength: curatorMetadata.verificationNotes.length,
            verifiedBy: curatorMetadata.verifiedBy.substring(0, 8) + '...',
            status: curatorMetadata.verificationStatus
          })

          // TEMPORARY: Store in localStorage until contract supports IPFS
          const storageKey = `curator_notes_${venueId}`
          const existingNotes = localStorage.getItem(storageKey)
          let allNotes = []
          
          if (existingNotes) {
            allNotes = JSON.parse(existingNotes)
          }
          
          allNotes.push(curatorMetadata)
          localStorage.setItem(storageKey, JSON.stringify(allNotes))
          
          console.log('✅ [verifyVenue] Curator notes saved to local storage')
          ipfsUpdateResult = { 
            success: true, 
            ipfsHash: 'local-storage-' + Date.now() 
          }
        } catch (storageError) {
          console.error('❌ [verifyVenue] Storage save error:', storageError)
          ipfsUpdateResult = { success: false, error: 'Failed to save curator notes' }
        }
      } else {
        console.log('ℹ️ [verifyVenue] No curator notes to save')
      }

      // Submit blockchain verification transaction (let MetaMask handle gas)
      console.log('🔧 [verifyVenue] Starting blockchain transaction...')
      console.log('🔧 [verifyVenue] Transaction params:', { venueId, approved, from: walletAddress.substring(0, 8) + '...' })
      
      const tx = await contract.methods.verifyVenue(
        venueId,
        approved
      ).send({
        from: walletAddress
        // Let MetaMask handle gas estimation and pricing
      })
      
      console.log('✅ [verifyVenue] Blockchain transaction completed:', {
        hash: tx.transactionHash?.substring(0, 12) + '...',
        blockNumber: tx.blockNumber,
        gasUsed: tx.gasUsed
      })

      // Call callbacks if provided
      if (options.onTransactionHash && tx.transactionHash) {
        options.onTransactionHash(tx.transactionHash)
      }

      return {
        success: true,
        transactionHash: tx.transactionHash,
        ipfsHash: ipfsUpdateResult?.ipfsHash
      }

    } catch (error: any) {
      console.error('Error verifying venue:', error)
      return {
        success: false,
        error: error.message || 'Transaction failed'
      }
    }
  }, [ensureConnection, walletAddress, getConnectedContract, web3, isBlogOwner, isAuthorizedCurator, updateVenueWithMetadata])

  // Get venue by ID (read-only, no wallet required)
  const getVenueById = useCallback(async (venueId: number) => {
    try {
      const contract = getReadOnlyContract()
      console.log('🔗 Contract address being used:', contract.options.address)
      const venue = await contract.methods.getVenueById(venueId).call()
      console.log('🔍 Raw venue data from contract:', venue)
      console.log('🔍 Raw venue data structure:')
      console.log('  - Array length:', venue.length)
      console.log('  - venue[0] (name):', venue[0])
      console.log('  - venue[1] (city):', venue[1])
      console.log('  - venue[2] (contactInfo):', venue[2])
      console.log('  - venue[3] (hasPiano):', venue[3])
      console.log('  - venue[4] (verified):', venue[4])
      console.log('  - venue[5] (submittedBy):', venue[5])
      console.log('  - venue[6] (timestamp):', venue[6])
      console.log('🔍 Accessing via properties:')
      console.log('  - venue.name:', venue.name || venue[0])
      console.log('  - venue.hasPiano:', venue.hasPiano || venue[3])
      console.log('  - venue.verified:', venue.verified || venue[4])
      console.log('🔍 Timestamp value:', venue.timestamp || venue[6], 'Type:', typeof (venue.timestamp || venue[6]))
      
      // The deployed V3 contract structure: [name, city, contactInfo, contactType, ipfsHash, submittedBy, timestamp, hasPiano, hasJamSession, verified, venueType]
      let hasPiano = venue.hasPiano !== undefined ? venue.hasPiano : venue[7]
      let hasJamSession = venue.hasJamSession !== undefined ? venue.hasJamSession : venue[8]
      let verified = venue.verified !== undefined ? venue.verified : venue[9]
      
      // Check for updated piano status in localStorage (temporary until contract supports it)
      const pianoStorageKey = `venue_piano_${venueId}`
      const storedPianoUpdate = localStorage.getItem(pianoStorageKey)
      console.log('🔧 [getVenueById] Checking localStorage for piano status:', {
        venueId,
        key: pianoStorageKey,
        hasStoredData: !!storedPianoUpdate,
        storedData: storedPianoUpdate
      })
      
      if (storedPianoUpdate) {
        try {
          const pianoUpdate = JSON.parse(storedPianoUpdate)
          const originalHasPiano = hasPiano
          hasPiano = pianoUpdate.hasPiano
          console.log('🔧 [getVenueById] Piano status overridden from localStorage:', { 
            venueId, 
            contractValue: originalHasPiano, 
            localStorageValue: hasPiano,
            storedUpdate: pianoUpdate
          })
        } catch (error) {
          console.warn('⚠️ Failed to parse stored piano status for venue', venueId, error)
        }
      } else {
        console.log('🔧 [getVenueById] No localStorage override for venue', venueId)
      }

      // V3 contract now supports hasJamSession directly, no need for localStorage override
      
      const parsedVenue = {
        id: venueId,
        name: venue.name || venue[0],
        city: venue.city || venue[1], 
        contactInfo: venue.contactInfo || venue[2],
        contactType: venue.contactType || venue[3] || 'email',
        ipfsHash: venue.ipfsHash || venue[4] || '',
        hasPiano: hasPiano,
        hasJamSession: hasJamSession,
        verified: verified,
        venueType: venue.venueType || venue[10] || 0,
        submittedBy: venue.submittedBy || venue[5],
        timestamp: Number(venue.timestamp || venue[6]),
        submissionDate: Number(venue.timestamp || venue[6]) > 0 
          ? new Date(Number(venue.timestamp || venue[6]) * 1000) 
          : new Date() // Fallback to current date if timestamp is 0
      }
      
      console.log('🔍 Parsed venue data:', parsedVenue)
      return {
        success: true,
        venue: parsedVenue
      }
    } catch (error: any) {
      console.error('Error getting venue:', error)
      return {
        success: false,
        error: error.message || 'Failed to load venue'
      }
    }
  }, [getReadOnlyContract])

  // Get total venue count (read-only, no wallet required)
  const getVenueCount = useCallback(async (): Promise<{ success: boolean; count?: number; error?: string }> => {
    try {
      const contract = getReadOnlyContract()
      const count = await contract.methods.venueCount().call()
      return {
        success: true,
        count: Number(count)
      }
    } catch (error: any) {
      console.error('Error getting venue count:', error)
      return {
        success: false,
        error: error.message || 'Failed to load venue count'
      }
    }
  }, [getReadOnlyContract])

  // Get all venues (read-only, no wallet required)
  const getAllVenues = useCallback(async (): Promise<{ success: boolean; venues?: any[]; error?: string }> => {
    try {
      const { success, count, error } = await getVenueCount()
      if (!success || !count) {
        return { success: false, error: error || 'No venues found' }
      }

      const contract = getReadOnlyContract()
      const venues: any[] = []

      for (let i = 0; i < count; i++) {
        try {
          const venue = await contract.methods.getVenueById(i).call()
          
          // V3 contract structure: [name, city, contactInfo, contactType, ipfsHash, submittedBy, timestamp, hasPiano, hasJamSession, verified, venueType]
          let hasPiano = venue.hasPiano !== undefined ? venue.hasPiano : venue[7]
          let hasJamSession = venue.hasJamSession !== undefined ? venue.hasJamSession : venue[8] 
          let verified = venue.verified !== undefined ? venue.verified : venue[9]
          
          const pianoStorageKey = `venue_piano_${i}`
          const storedPianoUpdate = localStorage.getItem(pianoStorageKey)
          if (storedPianoUpdate) {
            try {
              const pianoUpdate = JSON.parse(storedPianoUpdate)
              hasPiano = pianoUpdate.hasPiano
            } catch (error) {
              // Ignore parsing errors
            }
          }

          // V3 contract supports hasJamSession directly
          
          venues.push({
            id: i,
            name: venue.name || venue[0],
            city: venue.city || venue[1],
            contactInfo: venue.contactInfo || venue[2],
            contactType: venue.contactType || venue[3] || 'email',
            ipfsHash: venue.ipfsHash || venue[4] || '',
            hasPiano: hasPiano,
            hasJamSession: hasJamSession,
            verified: verified,
            venueType: venue.venueType || venue[10] || 0,
            submittedBy: venue.submittedBy || venue[5],
            timestamp: Number(venue.timestamp || venue[6]),
            submissionDate: Number(venue.timestamp || venue[6]) > 0 
              ? new Date(Number(venue.timestamp || venue[6]) * 1000) 
              : new Date() // Fallback to current date if timestamp is 0
          })
        } catch (venueError) {
          console.error(`Error loading venue ${i}:`, venueError)
          // Continue with other venues
        }
      }

      return {
        success: true,
        venues
      }
    } catch (error: any) {
      console.error('Error getting all venues:', error)
      return {
        success: false,
        error: error.message || 'Failed to load venues'
      }
    }
  }, [getVenueCount, getReadOnlyContract])

  // Get curator notes (temporary localStorage until contract supports IPFS)
  const getCuratorNotes = useCallback(async (venueId: number): Promise<{ success: boolean; notes?: any; error?: string }> => {
    try {
      console.log('🔧 [getCuratorNotes] Getting curator notes for venue ID:', venueId)
      
      // TEMPORARY: Get from localStorage until contract supports IPFS
      const storageKey = `curator_notes_${venueId}`
      const storedNotes = localStorage.getItem(storageKey)
      
      if (!storedNotes) {
        console.log('ℹ️ [getCuratorNotes] No curator notes found in localStorage')
        return { success: true, notes: null }
      }

      const allNotes = JSON.parse(storedNotes)
      console.log('🔧 [getCuratorNotes] Found', allNotes.length, 'curator notes in localStorage')
      
      // Return the most recent note for now
      const latestNote = allNotes[allNotes.length - 1]
      console.log('🔧 [getCuratorNotes] Returning latest note:', {
        status: latestNote.verificationStatus,
        notesLength: latestNote.verificationNotes.length,
        verifiedBy: latestNote.verifiedBy.substring(0, 8) + '...'
      })

      return {
        success: true,
        notes: latestNote
      }
    } catch (error: any) {
      console.error('Error fetching curator notes:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch curator notes'
      }
    }
  }, [])

  // Check if user is contract owner
  const isContractOwner = useCallback(async (): Promise<boolean> => {
    if (!walletAddress) return false
    
    try {
      const contract = getReadOnlyContract()
      const owner = await contract.methods.owner().call()
      return owner.toLowerCase() === walletAddress.toLowerCase()
    } catch (error) {
      console.error('Error checking contract owner:', error)
      return false
    }
  }, [walletAddress, getReadOnlyContract])

  return {
    // Connection state
    status,
    isConnected,
    walletAddress,
    isOnCorrectNetwork,
    error,
    
    // Permissions
    isBlogOwner,
    isAuthorizedCurator,
    hasAnyPermissions: isBlogOwner || isAuthorizedCurator,
    
    // Connection methods
    connect,
    disconnect,
    switchNetwork,
    refreshConnection,
    ensureConnection,
    
    // Contract interaction methods
    submitVenue,
    updateVenue,
    updateVenueWithMetadata,
    verifyVenue,
    
    // Read methods (no wallet required)
    getVenueById,
    getVenueCount,
    getAllVenues,
    getCuratorNotes,
    isContractOwner,
    
    // Utility methods
    getReadOnlyContract,
    getConnectedContract: isConnected ? getConnectedContract : undefined
  }
}