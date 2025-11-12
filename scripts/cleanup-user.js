#!/usr/bin/env node
/**
 * Script to clean up a user profile and all associated data
 * Usage: node scripts/cleanup-user.js <username-or-address>
 *
 * This script will:
 * 1. Find the user by username, wallet address, or display name
 * 2. Delete associated musician profile, reviews, and sessions
 * 3. Delete the user account
 *
 * WARNING: This action cannot be undone!
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function cleanup(identifier) {
  try {
    console.log(`🔍 Searching for user: ${identifier}`)

    // Find user by username, wallet address, or display name
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: identifier, mode: 'insensitive' } },
          { walletAddress: { equals: identifier, mode: 'insensitive' } },
          { displayName: { equals: identifier, mode: 'insensitive' } },
        ],
      },
      include: {
        musicianProfile: true,
        reviews: true,
        sessions: true,
      },
    })

    if (!user) {
      console.log('❌ User not found')
      process.exit(1)
    }

    console.log('✅ Found user:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Username: ${user.username || 'N/A'}`)
    console.log(`   Display Name: ${user.displayName || 'N/A'}`)
    console.log(`   Wallet: ${user.walletAddress || 'N/A'}`)
    console.log(`   Email: ${user.email || 'N/A'}`)
    console.log(`   Created: ${user.createdAt}`)
    console.log('')
    console.log('📊 Associated data:')
    console.log(`   Musician Profile: ${user.musicianProfile ? 'Yes' : 'No'}`)
    console.log(`   Reviews: ${user.reviews.length}`)
    console.log(`   Sessions: ${user.sessions.length}`)
    console.log('')

    // Confirm deletion
    console.log('⚠️  WARNING: About to delete this user and all associated data!')
    console.log('   This action cannot be undone.')
    console.log('')
    console.log('   To proceed, set CONFIRM_DELETE=yes as an environment variable')

    if (process.env.CONFIRM_DELETE !== 'yes') {
      console.log('❌ Deletion cancelled (CONFIRM_DELETE not set)')
      process.exit(0)
    }

    console.log('🗑️  Deleting user data...')

    // Delete associated records first
    if (user.musicianProfile) {
      await prisma.musicianProfile.delete({ where: { id: user.musicianProfile.id } })
      console.log('   ✓ Deleted musician profile')
    }

    if (user.sessions.length > 0) {
      await prisma.session.deleteMany({ where: { userId: user.id } })
      console.log(`   ✓ Deleted ${user.sessions.length} session(s)`)
    }

    if (user.reviews.length > 0) {
      await prisma.venueReview.deleteMany({ where: { userId: user.id } })
      console.log(`   ✓ Deleted ${user.reviews.length} review(s)`)
    }

    // Delete user
    await prisma.user.delete({ where: { id: user.id } })
    console.log('   ✓ Deleted user account')
    console.log('')
    console.log('✅ User cleanup completed successfully')
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Get identifier from command line
const identifier = process.argv[2]

if (!identifier) {
  console.log('Usage: node scripts/cleanup-user.js <username-or-address>')
  console.log('Example: node scripts/cleanup-user.js MalDav')
  console.log('Example: CONFIRM_DELETE=yes node scripts/cleanup-user.js MalDav')
  process.exit(1)
}

cleanup(identifier)
