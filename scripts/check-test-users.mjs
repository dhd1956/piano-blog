import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUsers() {
  console.log('📋 Checking existing users...\n')

  const users = await prisma.user.findMany({
    where: {
      username: { not: null },
    },
    select: {
      id: true,
      username: true,
      walletAddress: true,
      role: true,
      totalPXPEarned: true,
      displayName: true,
    },
    orderBy: { id: 'asc' },
    take: 10,
  })

  console.log(`Found ${users.length} users:\n`)
  users.forEach((user) => {
    console.log(`ID: ${user.id}`)
    console.log(`  Username: ${user.username}`)
    console.log(`  Role: ${user.role}`)
    console.log(`  PXP: ${user.totalPXPEarned}`)
    console.log(`  Wallet: ${user.walletAddress || 'none'}`)
    console.log()
  })

  // Check for curator users
  const curators = users.filter((u) => u.role === 'CURATOR' || u.role === 'BLOG_OWNER')
  console.log(`👥 Curators/Admins: ${curators.length}`)
  curators.forEach((c) => console.log(`  - ${c.username} (${c.role})`))

  // Check for scout users
  const scouts = users.filter((u) => u.role === 'SCOUT')
  console.log(`\n🔍 Scouts: ${scouts.length}`)
  scouts.forEach((s) => console.log(`  - ${s.username} (${s.totalPXPEarned} PXP)`))
}

checkUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
