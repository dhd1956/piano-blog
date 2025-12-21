import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function setUserRole() {
  const [, , walletAddress, role] = process.argv

  if (!walletAddress || !role) {
    console.error('❌ Usage: node scripts/set-user-role.mjs <wallet-address> <role>')
    console.error('   Roles: BLOG_OWNER, CURATOR, VALIDATOR, SCOUT')
    console.error('\n   Example:')
    console.error('   node scripts/set-user-role.mjs 0x1234...5678 CURATOR')
    process.exit(1)
  }

  if (!Object.values(UserRole).includes(role)) {
    console.error(`❌ Invalid role: ${role}`)
    console.error('   Valid roles:', Object.values(UserRole).join(', '))
    process.exit(1)
  }

  const normalizedAddress = walletAddress.toLowerCase()

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    })

    if (!existingUser) {
      console.error(`❌ User not found: ${walletAddress}`)
      console.error('   Create user first or use create-test-users.mjs')
      process.exit(1)
    }

    // Update user role
    const user = await prisma.user.update({
      where: { walletAddress: normalizedAddress },
      data: {
        role: role,
        isAuthorizedVerifier: role === UserRole.CURATOR || role === UserRole.BLOG_OWNER,
      },
    })

    console.log(`✅ Successfully updated user role!`)
    console.log(`   User: ${user.username || user.walletAddress}`)
    console.log(`   New Role: ${role}`)
    console.log(`   Authorized Verifier: ${user.isAuthorizedVerifier}`)
  } catch (error) {
    console.error('❌ Error updating user role:', error.message)
    process.exit(1)
  }
}

setUserRole()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
