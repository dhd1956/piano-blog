import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkWalletOwner() {
  const walletAddress = '0xe8985aedf83e2a58fef53b45db2d9556cd5f453a'

  console.log(`🔍 Looking for user with wallet: ${walletAddress}\n`)

  const user = await prisma.user.findUnique({
    where: { walletAddress: walletAddress.toLowerCase() },
    select: {
      id: true,
      username: true,
      displayName: true,
      walletAddress: true,
      role: true,
      totalCAVEarned: true,
    },
  })

  if (user) {
    console.log('✅ Found user:')
    console.log(`  Username: ${user.username}`)
    console.log(`  Display Name: ${user.displayName || 'none'}`)
    console.log(`  Role: ${user.role}`)
    console.log(`  Current PXP: ${user.totalCAVEarned}`)
    console.log(`  Wallet: ${user.walletAddress}`)
  } else {
    console.log('❌ No user found with this wallet address')
  }
}

checkWalletOwner()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
