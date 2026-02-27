import { createSiweMessage, generateSiweNonce } from 'viem/siwe'

// Implements Reown's SIWXMessage interface using viem's SIWE message builder.
// For embedded wallets (email/Google OTP), Reown signs this server-side so
// the user never sees a "Sign this message" prompt.
class SIWXMessageImpl {
  accountAddress: string
  chainId: string
  domain: string
  uri: string
  version: string
  nonce: string
  issuedAt: string
  statement: string

  constructor(fields: {
    accountAddress: string
    chainId: string
    domain: string
    uri: string
    version: string
    nonce: string
    issuedAt: string
    statement: string
  }) {
    Object.assign(this, fields)
  }

  toString() {
    return createSiweMessage({
      domain: this.domain,
      address: this.accountAddress as `0x${string}`,
      statement: this.statement,
      uri: this.uri,
      version: '1',
      chainId: Number(this.chainId.split(':')[1]),
      nonce: this.nonce,
      issuedAt: new Date(this.issuedAt),
    })
  }
}

export function buildSIWXConfig() {
  return {
    // Called during the OTP flow — builds the message Reown will auto-sign.
    async createMessage({ accountAddress, chainId }: { accountAddress: string; chainId: string }) {
      return new SIWXMessageImpl({
        accountAddress,
        chainId,
        domain: window.location.host,
        uri: window.location.origin,
        version: '1',
        nonce: generateSiweNonce(),
        issuedAt: new Date().toISOString(),
        statement: 'Sign in to GlobalPiano.Network',
      })
    },

    // Called after embedded wallet auto-signs — creates the backend session.
    // This replaces OAuthEmailCapture's call to /api/auth/embedded-login.
    async addSession(session: any) {
      const { accountAddress } = session.data
      await fetch('/api/auth/embedded-login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: accountAddress }),
      })
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('siwx_session', JSON.stringify(session))
      }
    },

    // Returns stored session so AppKit knows the user is already signed in
    // and skips the sign-in prompt on subsequent loads.
    async getSessions(chainId: string, address: string) {
      if (typeof window === 'undefined') return []
      const raw = sessionStorage.getItem('siwx_session')
      if (!raw) return []
      const s = JSON.parse(raw)
      const expired = s.data.expirationTime && new Date(s.data.expirationTime) < new Date()
      if (expired) {
        sessionStorage.removeItem('siwx_session')
        return []
      }
      if (s.data.accountAddress?.toLowerCase() !== address?.toLowerCase()) return []
      return [s]
    },

    async revokeSession() {
      sessionStorage.removeItem('siwx_session')
    },

    async setSessions(sessions: any[]) {
      if (sessions.length === 0) {
        sessionStorage.removeItem('siwx_session')
      } else {
        sessionStorage.setItem('siwx_session', JSON.stringify(sessions[0]))
      }
    },
  }
}
