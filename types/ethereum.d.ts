// Type declarations for MetaMask and Ethereum providers

interface Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>
    on?: (eventName: string, handler: (...args: any[]) => void) => void
    removeListener?: (eventName: string, handler: (...args: any[]) => void) => void
    isMetaMask?: boolean
    chainId?: string
  }
}

declare global {
  interface Window {
    ethereum?: Window['ethereum']
  }
}

export {}