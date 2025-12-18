import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function testVenueFix() {
  try {
    const venue = await prisma.venue.findFirst({
      where: { verified: true },
    })

    if (!venue) {
      console.log('No venues found')
      return
    }

    console.log('✅ Found venue:', venue.name)
    console.log('   ID:', venue.id)
    console.log('   City:', venue.city)
    console.log('   Verified:', venue.verified)
    console.log('   Has verifiedBy field:', 'verifiedBy' in venue ? 'YES (ERROR!)' : 'NO (correct)')
    console.log('')
    console.log('✅ Fix should work - verifiedBy field not accessed from database')
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testVenueFix()
