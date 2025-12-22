import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUser() {
  const email = 'mal.davies14@gmail.com'

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      passwordHash: true,
      isActive: true,
      createdAt: true,
    },
  })

  if (!user) {
    console.log('❌ User NOT found with email:', email)
  } else {
    console.log('✅ User found:')
    console.log('  ID:', user.id)
    console.log('  Email:', user.email)
    console.log('  Username:', user.username)
    console.log('  Display Name:', user.displayName)
    console.log('  Has Password:', user.passwordHash ? '✅ Yes' : '❌ No')
    console.log('  Active:', user.isActive ? '✅ Yes' : '❌ No')
    console.log('  Created:', user.createdAt)

    if (!user.passwordHash) {
      console.log('\n⚠️  This user has no password set!')
      console.log('   They likely signed up with Google/Wallet only.')
      console.log('   They need to set a password first before using forgot password.')
    }
  }

  await prisma.$disconnect()
}

checkUser().catch(console.error)
