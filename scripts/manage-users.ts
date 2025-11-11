/**
 * User Management Utility Script
 * Helps view and delete users from the database
 * Run with: npx tsx scripts/manage-users.ts [command] [args]
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listRecentUsers(limit = 10) {
  console.log(`\nFetching ${limit} most recent users...\n`)

  const users = await prisma.user.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      email: true,
      walletAddress: true,
      role: true,
      createdAt: true,
      isActive: true,
    },
  })

  console.table(users)
  console.log(`\nTotal users found: ${users.length}`)
}

async function findUserByEmail(email: string) {
  console.log(`\nSearching for user with email: ${email}\n`)

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      musicianProfile: true,
      reviews: true,
    },
  })

  if (!user) {
    console.log('❌ User not found')
    return null
  }

  console.log('✅ User found:')
  console.log(JSON.stringify(user, null, 2))
  return user
}

async function deleteUserByEmail(email: string) {
  console.log(`\nAttempting to delete user with email: ${email}`)

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    console.log('❌ User not found')
    return
  }

  console.log('\nUser details:')
  console.log(`- ID: ${user.id}`)
  console.log(`- Username: ${user.username || 'N/A'}`)
  console.log(`- Email: ${user.email || 'N/A'}`)
  console.log(`- Wallet: ${user.walletAddress || 'N/A'}`)
  console.log(`- Created: ${user.createdAt}`)

  // Delete musician profile first (if exists)
  const musicianProfile = await prisma.musicianProfile.findUnique({
    where: { userId: user.id },
  })

  if (musicianProfile) {
    await prisma.musicianProfile.delete({
      where: { userId: user.id },
    })
    console.log('✅ Deleted musician profile')
  }

  // Delete reviews
  const reviewCount = await prisma.review.deleteMany({
    where: { userId: user.id },
  })
  if (reviewCount.count > 0) {
    console.log(`✅ Deleted ${reviewCount.count} reviews`)
  }

  // Delete sessions
  const sessionCount = await prisma.session.deleteMany({
    where: { userId: user.id },
  })
  if (sessionCount.count > 0) {
    console.log(`✅ Deleted ${sessionCount.count} sessions`)
  }

  // Delete user
  await prisma.user.delete({
    where: { email },
  })

  console.log('✅ User deleted successfully')
}

async function deleteUserById(id: number) {
  console.log(`\nAttempting to delete user with ID: ${id}`)

  const user = await prisma.user.findUnique({
    where: { id },
  })

  if (!user) {
    console.log('❌ User not found')
    return
  }

  console.log('\nUser details:')
  console.log(`- ID: ${user.id}`)
  console.log(`- Username: ${user.username || 'N/A'}`)
  console.log(`- Email: ${user.email || 'N/A'}`)
  console.log(`- Wallet: ${user.walletAddress || 'N/A'}`)

  // Delete musician profile first (if exists)
  const musicianProfile = await prisma.musicianProfile.findUnique({
    where: { userId: user.id },
  })

  if (musicianProfile) {
    await prisma.musicianProfile.delete({
      where: { userId: user.id },
    })
    console.log('✅ Deleted musician profile')
  }

  // Delete reviews
  const reviewCount = await prisma.review.deleteMany({
    where: { userId: user.id },
  })
  if (reviewCount.count > 0) {
    console.log(`✅ Deleted ${reviewCount.count} reviews`)
  }

  // Delete sessions
  const sessionCount = await prisma.session.deleteMany({
    where: { userId: user.id },
  })
  if (sessionCount.count > 0) {
    console.log(`✅ Deleted ${sessionCount.count} sessions`)
  }

  // Delete user
  await prisma.user.delete({
    where: { id },
  })

  console.log('✅ User deleted successfully')
}

async function main() {
  const command = process.argv[2]
  const arg = process.argv[3]

  try {
    switch (command) {
      case 'list':
        await listRecentUsers(arg ? parseInt(arg) : 10)
        break

      case 'find':
        if (!arg) {
          console.error('❌ Please provide an email address')
          process.exit(1)
        }
        await findUserByEmail(arg)
        break

      case 'delete-email':
        if (!arg) {
          console.error('❌ Please provide an email address')
          process.exit(1)
        }
        await deleteUserByEmail(arg)
        break

      case 'delete-id':
        if (!arg) {
          console.error('❌ Please provide a user ID')
          process.exit(1)
        }
        await deleteUserById(parseInt(arg))
        break

      default:
        console.log('User Management Utility')
        console.log('\nUsage:')
        console.log('  npx tsx scripts/manage-users.ts list [limit]')
        console.log('  npx tsx scripts/manage-users.ts find <email>')
        console.log('  npx tsx scripts/manage-users.ts delete-email <email>')
        console.log('  npx tsx scripts/manage-users.ts delete-id <id>')
        console.log('\nExamples:')
        console.log('  npx tsx scripts/manage-users.ts list 20')
        console.log('  npx tsx scripts/manage-users.ts find user@example.com')
        console.log('  npx tsx scripts/manage-users.ts delete-email orphan@example.com')
        console.log('  npx tsx scripts/manage-users.ts delete-id 123')
    }
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
