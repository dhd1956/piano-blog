import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteUser() {
  const email = 'mal.davies14@gmail.com'

  console.log('🗑️  Deleting user:', email)
  console.log('='.repeat(60))

  // 1. Find the user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      walletAddress: true,
      createdAt: true,
    },
  })

  if (!user) {
    console.log('❌ User not found with email:', email)
    await prisma.$disconnect()
    return
  }

  console.log('\n📋 User details:')
  console.log('   ID:', user.id)
  console.log('   Email:', user.email)
  console.log('   Username:', user.username)
  console.log('   Display Name:', user.displayName)
  console.log('   Wallet:', user.walletAddress || 'None')
  console.log('   Created:', user.createdAt)

  // 2. Delete the user
  console.log('\n🗑️  Deleting user...')

  try {
    await prisma.user.delete({
      where: { id: user.id },
    })

    console.log('✅ User deleted successfully!')
    console.log('\n💡 The user can now sign up again with:', email)
  } catch (error) {
    console.error('❌ Failed to delete user:', error.message)

    if (error.code === 'P2003') {
      console.log('\n⚠️  This user has related records that need to be deleted first.')
      console.log("   Run this query to see what's blocking deletion:")
      console.log('   SELECT * FROM your_related_table WHERE userId = ' + user.id)
    }
  }

  await prisma.$disconnect()
  console.log('\n' + '='.repeat(60))
}

deleteUser().catch(console.error)
