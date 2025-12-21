import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestUsers() {
  console.log('🔧 Creating test users for role-based access control testing...\n')

  const testUsers = [
    {
      walletAddress: '0x1111111111111111111111111111111111111111',
      username: 'test-scout',
      displayName: 'Test Scout',
      role: UserRole.SCOUT,
      isAuthorizedVerifier: false,
      publicProfile: true,
    },
    {
      walletAddress: '0x2222222222222222222222222222222222222222',
      username: 'test-curator',
      displayName: 'Test Curator',
      role: UserRole.CURATOR,
      isAuthorizedVerifier: true,
      publicProfile: true,
    },
    {
      walletAddress: '0x3333333333333333333333333333333333333333',
      username: 'test-validator',
      displayName: 'Test Validator',
      role: UserRole.VALIDATOR,
      isAuthorizedVerifier: false,
      publicProfile: true,
    },
  ]

  console.log('Creating/updating test users:\n')

  for (const userData of testUsers) {
    try {
      const user = await prisma.user.upsert({
        where: { walletAddress: userData.walletAddress },
        update: {
          role: userData.role,
          isAuthorizedVerifier: userData.isAuthorizedVerifier,
          displayName: userData.displayName,
          publicProfile: userData.publicProfile,
        },
        create: userData,
      })

      console.log(`✅ ${user.role.padEnd(10)} | ${user.username.padEnd(15)} | ${user.walletAddress}`)
    } catch (error) {
      console.error(`❌ Failed to create ${userData.username}:`, error.message)
    }
  }

  console.log('\n📊 Current user role distribution:\n')

  const roleStats = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
  })

  roleStats.forEach((stat) => {
    const count = stat._count.toString().padStart(3)
    console.log(`   ${stat.role.padEnd(12)} : ${count} users`)
  })

  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║                    TEST USER CREDENTIALS                   ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log('   To use these test accounts in MetaMask:')
  console.log('   1. Open MetaMask → Account menu → Import account')
  console.log('   2. Enter the wallet address from above')
  console.log('   3. Connect to your Piano Blog app')
  console.log('')
  console.log('   ⚠️  These are PUBLIC test addresses - DO NOT send real funds!')
  console.log('')
  console.log('   Test Scout:     0x1111111111111111111111111111111111111111')
  console.log('   Test Curator:   0x2222222222222222222222222222222222222222')
  console.log('   Test Validator: 0x3333333333333333333333333333333333333333')
  console.log('')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║                    NEXT STEPS                              ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log('   1. Check permissions:')
  console.log('      node scripts/check-user-permissions.mjs 0x1111...')
  console.log('')
  console.log('   2. Change a user role:')
  console.log('      node scripts/set-user-role.mjs 0x1111... CURATOR')
  console.log('')
  console.log('   3. Test in the app:')
  console.log('      - Switch to test account in MetaMask')
  console.log('      - Click "Switch" button in the app')
  console.log('      - Verify role-based permissions work correctly')
  console.log('')
}

createTestUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
