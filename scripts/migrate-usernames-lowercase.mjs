/**
 * Username Lowercase Migration Script
 *
 * Problem: Case-insensitive username feature was added on Dec 31, 2025,
 * but existing users with mixed-case usernames were not migrated.
 * This causes login failures because the login form normalizes to lowercase,
 * but the database still has the original case.
 *
 * Solution: Normalize all usernames to lowercase in the database.
 *
 * Usage: node scripts/migrate-usernames-lowercase.mjs
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Starting username lowercase migration...\n')

  try {
    // Find all users with usernames
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        walletAddress: true,
      },
      where: {
        username: {
          not: null,
        },
      },
    })

    console.log(`📊 Found ${users.length} total users with usernames\n`)

    // Filter users with mixed-case usernames
    const mixedCaseUsers = users.filter(
      (u) => u.username && u.username !== u.username.toLowerCase()
    )

    if (mixedCaseUsers.length === 0) {
      console.log('✅ All usernames are already lowercase. No migration needed.')
      return
    }

    console.log(`🔧 Found ${mixedCaseUsers.length} users with mixed-case usernames:\n`)

    // Display users that will be migrated
    mixedCaseUsers.forEach((user) => {
      console.log(`  • ID ${user.id}: "${user.username}" → "${user.username.toLowerCase()}"`)
      if (user.email) console.log(`    Email: ${user.email}`)
      if (user.walletAddress) console.log(`    Wallet: ${user.walletAddress}`)
    })

    console.log('\n⚠️  WARNING: This will update usernames in the database.')
    console.log('   Users will still be able to log in with any case variation.\n')

    // Check for potential conflicts
    const lowercaseUsernames = mixedCaseUsers.map((u) => u.username.toLowerCase())
    const existingLowercaseUsernames = users
      .filter((u) => u.username === u.username.toLowerCase())
      .map((u) => u.username)

    const conflicts = lowercaseUsernames.filter((name) => existingLowercaseUsernames.includes(name))

    if (conflicts.length > 0) {
      console.error('❌ ERROR: Username conflicts detected!')
      console.error('   The following usernames already exist in lowercase:')
      conflicts.forEach((name) => console.error(`   • ${name}`))
      console.error('\n   Cannot proceed with migration. Manual resolution required.')
      process.exit(1)
    }

    // Perform migration
    console.log('🚀 Starting migration...\n')

    let successCount = 0
    let errorCount = 0

    for (const user of mixedCaseUsers) {
      const oldUsername = user.username
      const newUsername = user.username.toLowerCase()

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { username: newUsername },
        })

        console.log(`  ✅ Migrated: "${oldUsername}" → "${newUsername}" (ID: ${user.id})`)
        successCount++
      } catch (error) {
        console.error(`  ❌ Failed: "${oldUsername}" (ID: ${user.id})`)
        console.error(`     Error: ${error.message}`)
        errorCount++
      }
    }

    console.log(`\n📈 Migration Summary:`)
    console.log(`   • Successfully migrated: ${successCount} users`)
    console.log(`   • Failed: ${errorCount} users`)

    if (errorCount === 0) {
      console.log('\n✅ Migration completed successfully!')
      console.log('   All users can now log in with any case variation of their username.')
    } else {
      console.log('\n⚠️  Migration completed with errors.')
      console.log('   Please review the failed migrations above.')
    }
  } catch (error) {
    console.error('\n❌ Migration failed with error:')
    console.error(error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
