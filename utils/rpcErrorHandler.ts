// RPC Error Handler for Web3 interactions
export function handleRPCError(error: any, context: string = 'RPC call') {
  console.error(`RPC Error in ${context}:`, error)
  
  // Don't throw errors for common RPC issues, just log them
  if (error.message?.includes('Invalid JSON RPC response')) {
    console.warn(`${context}: RPC endpoint temporarily unavailable`)
    return null
  }
  
  if (error.message?.includes('execution reverted')) {
    console.warn(`${context}: Contract execution reverted (expected for some calls)`)
    return null
  }
  
  if (error.message?.includes('network')) {
    console.warn(`${context}: Network connectivity issue`)
    return null
  }
  
  // For other errors, log but don't break the app
  console.warn(`${context}: ${error.message}`)
  return null
}

// Wrapper for safe contract calls
export async function safeContractCall<T>(
  contractCall: () => Promise<T>,
  defaultValue: T,
  context: string = 'Contract call'
): Promise<T> {
  try {
    return await contractCall()
  } catch (error) {
    handleRPCError(error, context)
    return defaultValue
  }
}

// Safe Web3 provider setup with fallback
export function createSafeWeb3Provider(rpcUrl: string): any {
  try {
    const Web3 = require('web3')
    return new Web3(new Web3.providers.HttpProvider(rpcUrl))
  } catch (error) {
    console.error('Failed to create Web3 provider:', error)
    return null
  }
}