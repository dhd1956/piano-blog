'use client'

import { useState, useEffect } from 'react'

export type UserType = 'web3' | 'qr' | 'unknown'
export type PaymentMethod = 'web3' | 'qr' | 'phone'

export interface WalletCapabilities {
  hasMetaMask: boolean
  hasWalletConnect: boolean
  hasValora: boolean
  hasCoinbaseWallet: boolean
  supportsCamera: boolean
  supportsClipboard: boolean
  supportsShare: boolean
  isMobile: boolean
}

export interface HybridWalletState {
  userType: UserType
  preferredPaymentMethod: PaymentMethod
  capabilities: WalletCapabilities
  isLoading: boolean
  hasDetected: boolean
}

/**
 * Hook for detecting user capabilities and providing progressive enhancement
 * Determines if user is Web3-native or should use QR code flows
 */
export function useHybridWallet() {
  const [state, setState] = useState<HybridWalletState>({
    userType: 'unknown',
    preferredPaymentMethod: 'qr',
    capabilities: {
      hasMetaMask: false,
      hasWalletConnect: false,
      hasValora: false,
      hasCoinbaseWallet: false,
      supportsCamera: false,
      supportsClipboard: false,
      supportsShare: false,
      isMobile: false,
    },
    isLoading: true,
    hasDetected: false,
  })

  // Wallet connection state
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Detect capabilities on mount and check existing connection
  useEffect(() => {
    detectCapabilities()
    checkExistingConnection()
  }, [])

  // Check for existing wallet connection
  const checkExistingConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          setWalletAddress(accounts[0])
          setIsConnected(true)
        }
      } catch (error) {
        console.error('Error checking existing connection:', error)
      }
    }
  }

  // Connect to wallet
  const connectWallet = async () => {
    setConnectionError(null)

    if (typeof window === 'undefined' || !window.ethereum) {
      setConnectionError('No Web3 wallet detected. Please install MetaMask or another Web3 wallet.')
      return
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (accounts.length > 0) {
        setWalletAddress(accounts[0])
        setIsConnected(true)
        console.log('Wallet connected:', accounts[0])
      } else {
        setConnectionError('No accounts found. Please check your wallet.')
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error)
      setConnectionError(error.message || 'Failed to connect wallet')
    }
  }

  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletAddress(null)
    setIsConnected(false)
    setConnectionError(null)
  }

  const detectCapabilities = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }))

      const capabilities: WalletCapabilities = {
        // Web3 wallet detection
        hasMetaMask: Boolean(typeof window !== 'undefined' && window.ethereum?.isMetaMask),
        hasWalletConnect: Boolean(
          typeof window !== 'undefined' && window.ethereum?.isWalletConnect
        ),
        hasValora: Boolean(typeof window !== 'undefined' && window.ethereum?.isValora),
        hasCoinbaseWallet: Boolean(
          typeof window !== 'undefined' && window.ethereum?.isCoinbaseWallet
        ),

        // Device capabilities
        supportsCamera: await checkCameraSupport(),
        supportsClipboard: checkClipboardSupport(),
        supportsShare: checkShareSupport(),
        isMobile: checkMobileDevice(),
      }

      // Determine user type based on capabilities
      const userType = determineUserType(capabilities)

      // Set preferred payment method
      const preferredPaymentMethod = determinePreferredPaymentMethod(capabilities, userType)

      setState({
        userType,
        preferredPaymentMethod,
        capabilities,
        isLoading: false,
        hasDetected: true,
      })
    } catch (error) {
      console.error('Error detecting capabilities:', error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        hasDetected: true,
        userType: 'qr', // Default to QR mode on error
      }))
    }
  }

  const checkCameraSupport = async (): Promise<boolean> => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return false
      }

      // Check if camera permissions can be requested
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((track) => track.stop())
      return true
    } catch {
      return false
    }
  }

  const checkClipboardSupport = (): boolean => {
    return typeof navigator !== 'undefined' && Boolean(navigator.clipboard?.writeText)
  }

  const checkShareSupport = (): boolean => {
    return typeof navigator !== 'undefined' && Boolean(navigator.share)
  }

  const checkMobileDevice = (): boolean => {
    if (typeof window === 'undefined') return false

    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
    )
  }

  const determineUserType = (capabilities: WalletCapabilities): UserType => {
    // If user has Web3 wallets, they're likely Web3-native
    if (
      capabilities.hasMetaMask ||
      capabilities.hasWalletConnect ||
      capabilities.hasValora ||
      capabilities.hasCoinbaseWallet
    ) {
      return 'web3'
    }

    // Otherwise, they'll use QR codes
    return 'qr'
  }

  const determinePreferredPaymentMethod = (
    capabilities: WalletCapabilities,
    userType: UserType
  ): PaymentMethod => {
    // Web3 users prefer Web3 transactions
    if (userType === 'web3') return 'web3'

    // Mobile users without Web3 prefer QR codes
    if (capabilities.isMobile && capabilities.supportsCamera) return 'qr'

    // Default to QR for maximum compatibility
    return 'qr'
  }

  // Helper functions for progressive enhancement
  const shouldShowWeb3Features = (): boolean => {
    return state.userType === 'web3' && !state.isLoading
  }

  const shouldShowQRFeatures = (): boolean => {
    return state.userType === 'qr' || state.capabilities.isMobile
  }

  const shouldShowQRScanner = (): boolean => {
    return state.capabilities.supportsCamera && state.capabilities.isMobile
  }

  const getRecommendedFlow = (): 'web3' | 'qr' | 'hybrid' => {
    if (state.userType === 'web3') return 'web3'
    if (state.userType === 'qr') return 'qr'
    return 'hybrid'
  }

  const getOnboardingMessage = (): string => {
    if (state.userType === 'web3') {
      return 'Great! We detected your Web3 wallet. You can use advanced features like direct transactions.'
    }

    if (state.capabilities.isMobile) {
      return 'Perfect for mobile! Use QR codes to send and receive PXP payments easily.'
    }

    return 'Welcome! You can use QR codes for payments or connect a Web3 wallet for advanced features.'
  }

  const upgradeToWeb3 = () => {
    // Guide user to install MetaMask or connect existing wallet
    if (state.capabilities.isMobile) {
      // Suggest mobile wallets with multiple options
      const currentHost = typeof window !== 'undefined' ? window.location.host : ''
      const metamaskLink = `https://metamask.app.link/dapp/${currentHost}`
      const valoraLink = `https://valoraapp.com/`

      // Show a selection of mobile wallets
      if (confirm('Choose a wallet app:\n\nOK - MetaMask Mobile\nCancel - Valora (Celo native)')) {
        window.open(metamaskLink, '_blank')
      } else {
        window.open(valoraLink, '_blank')
      }
    } else {
      // Suggest desktop wallet installation with multiple options
      if (confirm('Choose a wallet for desktop:\n\nOK - MetaMask\nCancel - Coinbase Wallet')) {
        window.open('https://metamask.io/', '_blank')
      } else {
        window.open('https://www.coinbase.com/wallet', '_blank')
      }
    }
  }

  // Enhanced capability checks
  const getPlatformRecommendations = () => {
    const recs = []

    if (state.capabilities.isMobile) {
      recs.push('Mobile QR scanning available')
      if (state.capabilities.supportsCamera) {
        recs.push('Camera access detected')
      }
      if (state.capabilities.supportsShare) {
        recs.push('Native sharing supported')
      }
    }

    if (state.userType === 'web3') {
      recs.push('Web3 wallet detected')
      if (state.capabilities.hasMetaMask) recs.push('MetaMask available')
      if (state.capabilities.hasValora) recs.push('Valora available')
      if (state.capabilities.hasCoinbaseWallet) recs.push('Coinbase Wallet available')
    } else {
      recs.push('QR code payments recommended')
    }

    return recs
  }

  // Generate smart payment method suggestion
  const getSmartPaymentSuggestion = (amount?: string) => {
    const suggestions = []

    if (state.userType === 'web3') {
      suggestions.push({
        method: 'web3' as const,
        title: 'Direct Web3 Payment',
        description: 'Pay instantly with your connected wallet',
        priority: 1,
      })
    }

    if (state.capabilities.isMobile && state.capabilities.supportsCamera) {
      suggestions.push({
        method: 'qr_scan' as const,
        title: 'Scan QR Code',
        description: 'Use your phone camera to scan payment codes',
        priority: state.userType === 'qr' ? 1 : 2,
      })
    }

    suggestions.push({
      method: 'qr_display' as const,
      title: 'Show QR Code',
      description: 'Display QR code for others to scan',
      priority: 3,
    })

    return suggestions.sort((a, b) => a.priority - b.priority)
  }

  // Force re-detection (useful after wallet installation)
  const refreshDetection = () => {
    detectCapabilities()
  }

  return {
    ...state,

    // Wallet connection state
    walletAddress,
    isConnected,
    connectionError,

    // Helper functions
    shouldShowWeb3Features,
    shouldShowQRFeatures,
    shouldShowQRScanner,
    getRecommendedFlow,
    getOnboardingMessage,
    getPlatformRecommendations,
    getSmartPaymentSuggestion,

    // Actions
    upgradeToWeb3,
    refreshDetection,
    connectWallet,
    disconnectWallet,
    checkExistingConnection,

    // Capability checks
    canUseWeb3: shouldShowWeb3Features(),
    canUseQR: shouldShowQRFeatures(),
    canScanQR: shouldShowQRScanner(),

    // UI suggestions
    recommendedUI: getRecommendedFlow(),
    onboardingMessage: getOnboardingMessage(),
    platformRecommendations: getPlatformRecommendations(),
    smartPaymentSuggestions: getSmartPaymentSuggestion(),
  }
}

/**
 * Hook for managing user preferences for payment methods
 */
export function usePaymentPreferences() {
  const [preferences, setPreferences] = useState({
    preferredMethod: 'auto' as 'web3' | 'qr' | 'phone' | 'auto',
    autoDetectMethod: true,
    showQRByDefault: false,
    rememberChoice: true,
  })

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pxp-payment-preferences')
      if (saved) {
        setPreferences((prev) => ({ ...prev, ...JSON.parse(saved) }))
      }
    } catch (error) {
      console.warn('Failed to load payment preferences:', error)
    }
  }, [])

  // Save preferences to localStorage
  const updatePreferences = (updates: Partial<typeof preferences>) => {
    const newPreferences = { ...preferences, ...updates }
    setPreferences(newPreferences)

    if (newPreferences.rememberChoice) {
      try {
        localStorage.setItem('pxp-payment-preferences', JSON.stringify(newPreferences))
      } catch (error) {
        console.warn('Failed to save payment preferences:', error)
      }
    }
  }

  return {
    preferences,
    updatePreferences,
    resetPreferences: () => {
      setPreferences({
        preferredMethod: 'auto',
        autoDetectMethod: true,
        showQRByDefault: false,
        rememberChoice: true,
      })
      localStorage.removeItem('pxp-payment-preferences')
    },
  }
}
