/**
 * get-hot-wallet.mjs
 *
 * Usage:
 *   node get-hot-wallet.mjs
 *     → generates a fresh wallet (new address + private key)
 *
 *   PRIVATE_KEY=<your-key> node get-hot-wallet.mjs
 *     → derives the address from the given key so you can verify it matches
 *       the expected hot wallet (0xe8985AEDF83E2a58fEf53B45db2d9556CD5F453A)
 */

import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts'

const raw = process.env.PRIVATE_KEY?.trim().replace(/^["']|["']$/g, '')

if (raw) {
  // Verify mode — show the address for the given key
  const key = raw.startsWith('0x') ? raw : '0x' + raw
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
    console.error('❌  Key is not a valid 32-byte hex private key (need 0x + 64 hex chars, got', key.length, 'chars)')
    process.exit(1)
  }
  const account = privateKeyToAccount(key)
  console.log('\n✅  Private key is valid')
  console.log('   Address :', account.address)
  console.log('   Expected: 0xe8985AEDF83E2a58fEf53B45db2d9556CD5F453A')
  console.log('   Match   :', account.address.toLowerCase() === '0xe8985aedf83e2a58fef53b45db2d9556cd5f453a' ? '✅ YES' : '❌ NO')
} else {
  // Generate mode — create a brand-new wallet
  const privateKey = generatePrivateKey()
  const account = privateKeyToAccount(privateKey)
  console.log('\n🔑  New hot wallet generated')
  console.log('   Address    :', account.address)
  console.log('   Private key:', privateKey)
  console.log('\n   ⚠️  Save the private key somewhere safe — it cannot be recovered.')
  console.log('   Set PRIVATE_KEY =', privateKey.slice(2), '  (without 0x) in Vercel.')
  console.log('   Then send PXP tokens to', account.address)
}
