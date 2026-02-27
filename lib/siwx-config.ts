import { createSiweMessage, generateSiweNonce } from 'viem/siwe'
import type { SIWXConfig, SIWXMessage, SIWXSession } from '@reown/appkit-controllers'
import type { CaipNetworkId } from '@reown/appkit-common'

// Implements Reown's SIWXMessage interface using viem's SIWE message builder.
// For embedded wallets (email/Google OTP), Reown signs this server-side so
// the user never sees a "Sign this message" prompt.
class SIWXMessageImpl implements SIWXMessage {
  accountAddress: string
  chainId: CaipNetworkId
  domain: string
  uri: string
  version: string
  nonce: string
  issuedAt: string
  statement: string

  constructor(fields: {
    accountAddress: string
    chainId: CaipNetworkId
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
    // Reown calls toString() with '<<AccountAddress>>' as a placeholder before
    // the real address is known. viem rejects it, crashing authConnectorAuthenticate.
    // Use zero address as a stand-in; this serializedMessage is replaced by the
    // embedded wallet's signed result (SIWXUtil.js line 267).
    const address = this.accountAddress.startsWith('0x')
      ? (this.accountAddress as `0x${string}`)
      : '0x0000000000000000000000000000000000000000'

    return createSiweMessage({
      domain: this.domain,
      address,
      statement: this.statement,
      uri: this.uri,
      version: '1',
      // CaipNetworkId is "namespace:chainId" e.g. "eip155:11142220"
      chainId: Number(this.chainId.split(':')[1]),
      nonce: this.nonce,
      issuedAt: new Date(this.issuedAt),
    })
  }
}

export function buildSIWXConfig(): SIWXConfig {
  return {
    // Called during the OTP flow — builds the message Reown will auto-sign.
    async createMessage(input: SIWXMessage.Input): Promise<SIWXMessage> {
      return new SIWXMessageImpl({
        accountAddress: input.accountAddress,
        chainId: input.chainId,
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
    async addSession(session: SIWXSession): Promise<void> {
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
    async getSessions(_chainId: CaipNetworkId, address: string): Promise<SIWXSession[]> {
      if (typeof window === 'undefined') return []
      const raw = sessionStorage.getItem('siwx_session')
      if (!raw) return []
      const s: SIWXSession = JSON.parse(raw)
      const expired = s.data.expirationTime && new Date(s.data.expirationTime) < new Date()
      if (expired) {
        sessionStorage.removeItem('siwx_session')
        return []
      }
      if (s.data.accountAddress?.toLowerCase() !== address?.toLowerCase()) return []
      return [s]
    },

    async revokeSession(_chainId: CaipNetworkId, _address: string): Promise<void> {
      sessionStorage.removeItem('siwx_session')
    },

    async setSessions(sessions: SIWXSession[]): Promise<void> {
      if (sessions.length === 0) {
        sessionStorage.removeItem('siwx_session')
      } else {
        sessionStorage.setItem('siwx_session', JSON.stringify(sessions[0]))
      }
    },
  }
}
