import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkPXP() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        walletAddress: true,
        totalCAVEarned: true,
        hasClaimedNewUserReward: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    console.log('Recent users and their PXP:\n')
    users.forEach((user) => {
      const displayName = user.username || user.walletAddress?.slice(0, 10) + '...'
      console.log(`User: ${displayName}`)
      console.log(`  Total PXP: ${user.totalCAVEarned}`)
      console.log(`  Claimed Welcome Reward: ${user.hasClaimedNewUserReward}\n`)
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPXP()
