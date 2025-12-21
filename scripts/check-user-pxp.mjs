import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkUser() {
  try {
    // Find user by username "daved"
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: 'daved' }, { displayName: 'Blog Owner' }],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        walletAddress: true,
        totalCAVEarned: true,
        hasClaimedNewUserReward: true,
      },
    })

    if (user) {
      console.log('Your account:')
      console.log(`  Username: ${user.username}`)
      console.log(`  Display Name: ${user.displayName}`)
      console.log(`  Wallet: ${user.walletAddress}`)
      console.log(`  Total PXP: ${user.totalCAVEarned}`)
      console.log(`  Claimed Welcome Reward: ${user.hasClaimedNewUserReward}`)
    } else {
      console.log('User not found')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
