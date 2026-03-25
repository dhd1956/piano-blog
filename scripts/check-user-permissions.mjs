import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkPermissions() {
  const [, , walletAddress] = process.argv

  if (!walletAddress) {
    console.error('❌ Usage: node scripts/check-user-permissions.mjs <wallet-address>')
    console.error('\n   Example:')
    console.error('   node scripts/check-user-permissions.mjs 0x1234...5678')
    process.exit(1)
  }

  try {
    const normalizedAddress = walletAddress.toLowerCase()

    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      select: {
        id: true,
        username: true,
        displayName: true,
        walletAddress: true,
        email: true,
        role: true,
        isAuthorizedVerifier: true,
        totalPXPEarned: true,
        createdAt: true,
      },
    })

    if (!user) {
      console.log('❌ User not found in database')
      console.log(`   Address: ${walletAddress}`)
      console.log('\n   ℹ️  This user will default to SCOUT role when connecting')
      return
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗')
    console.log('║                    USER INFORMATION                        ║')
    console.log('╚════════════════════════════════════════════════════════════╝')
    console.log('')
    console.log(`   👤 Username:        ${user.username || 'Not set'}`)
    console.log(`   📝 Display Name:    ${user.displayName || 'Not set'}`)
    console.log(`   📧 Email:           ${user.email || 'Not set'}`)
    console.log(`   💼 Wallet:          ${user.walletAddress}`)
    console.log(`   🎭 Role:            ${user.role}`)
    console.log(`   ✓  Authorized:      ${user.isAuthorizedVerifier ? 'Yes' : 'No'}`)
    console.log(`   🪙 PXP Balance:     ${user.totalPXPEarned || 0}`)
    console.log(`   📅 Created:         ${user.createdAt.toLocaleDateString()}`)

    console.log('\n╔════════════════════════════════════════════════════════════╗')
    console.log('║                      PERMISSIONS                           ║')
    console.log('╚════════════════════════════════════════════════════════════╝')
    console.log('')

    const isBlogOwner = user.role === 'BLOG_OWNER'
    const isCurator = user.role === 'CURATOR' || user.role === 'BLOG_OWNER'
    const isValidator = user.role === 'VALIDATOR' || user.role === 'BLOG_OWNER'
    const isScout = user.role === 'SCOUT'

    console.log(`   Blog Owner:          ${isBlogOwner ? '✅ YES' : '❌ NO'}`)
    console.log(`   Curator:             ${isCurator ? '✅ YES' : '❌ NO'}`)
    console.log(`   Validator:           ${isValidator ? '✅ YES' : '❌ NO'}`)
    console.log(`   Scout:               ${isScout ? '✅ YES' : '❌ NO'}`)

    console.log('\n╔════════════════════════════════════════════════════════════╗')
    console.log('║                    WHAT CAN THIS USER DO?                  ║')
    console.log('╚════════════════════════════════════════════════════════════╝')
    console.log('')

    console.log(`   Create Events:       ${isCurator ? '✅ YES' : '❌ NO'}`)
    console.log(`   Edit Venues:         ${isCurator ? '✅ YES' : '❌ NO'}`)
    console.log(`   Validate Venues:     ${isValidator ? '✅ YES' : '❌ NO'}`)
    console.log(`   Submit Venues:       ✅ YES (all users)`)
    console.log(`   RSVP to Events:      ✅ YES (all users)`)
    console.log(`   Refer Users:         ✅ YES (all users)`)
    console.log(`   Manage Curators:     ${isBlogOwner ? '✅ YES' : '❌ NO'}`)
    console.log(`   Delete Venues:       ${isBlogOwner ? '✅ YES' : '❌ NO'}`)
    console.log(`   Access /curator:     ${isCurator ? '✅ YES' : '❌ NO'}`)
    console.log(`   Access /admin:       ${isBlogOwner ? '✅ YES' : '❌ NO'}`)

    console.log('\n╔════════════════════════════════════════════════════════════╗')
    console.log('║                    API PERMISSIONS                         ║')
    console.log('╚════════════════════════════════════════════════════════════╝')
    console.log('')

    console.log(`   GET  /api/events:              ✅ YES`)
    console.log(`   POST /api/events:              ${isCurator ? '✅ YES' : '❌ NO'}`)
    console.log(`   GET  /api/venues:              ✅ YES`)
    console.log(`   POST /api/venues:              ✅ YES (all users)`)
    console.log(`   PUT  /api/venues/[id]:         ${isCurator ? '✅ YES' : '❌ NO'}`)
    console.log(`   DELETE /api/venues/[id]:       ${isBlogOwner ? '✅ YES' : '❌ NO'}`)
    console.log(`   GET  /api/admin/curators:      ${isBlogOwner ? '✅ YES' : '❌ NO'}`)
    console.log(`   POST /api/admin/curators:      ${isBlogOwner ? '✅ YES' : '❌ NO'}`)
    console.log('')
  } catch (error) {
    console.error('❌ Error checking permissions:', error.message)
    process.exit(1)
  }
}

checkPermissions()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
