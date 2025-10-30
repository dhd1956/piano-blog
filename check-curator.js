const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function checkCurator() {
  try {
    const curator = await prisma.user.findUnique({
      where: { username: 'curator' },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        role: true,
        isActive: true,
      },
    })

    if (!curator) {
      console.log('❌ Curator user NOT found in database')
      return
    }

    console.log('✅ Curator user found:')
    console.log('   ID:', curator.id)
    console.log('   Username:', curator.username)
    console.log('   Role:', curator.role)
    console.log('   Active:', curator.isActive)
    console.log('   Has password hash:', !!curator.passwordHash)

    // Test password
    if (curator.passwordHash) {
      const isValid = await bcrypt.compare('curator123', curator.passwordHash)
      console.log('   Password "curator123" matches:', isValid ? '✅ YES' : '❌ NO')
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkCurator()
