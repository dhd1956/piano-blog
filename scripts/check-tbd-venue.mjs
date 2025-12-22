import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTBDVenue() {
  console.log('🔍 Searching for TBD venue...\n')

  const venue = await prisma.venue.findFirst({
    where: {
      OR: [
        { name: { contains: 'TBD', mode: 'insensitive' } },
        { name: { contains: 'Location Not Specified', mode: 'insensitive' } },
      ],
    },
  })

  if (!venue) {
    console.log('❌ Venue not found')
    await prisma.$disconnect()
    return
  }

  console.log('✅ Found venue:', venue.name)
  console.log('ID:', venue.id)
  console.log('\n📋 Full venue data:')
  console.log(JSON.stringify(venue, null, 2))

  // Check for potential issues
  console.log('\n⚠️  Potential issues:')

  if (!venue.city || venue.city.trim() === '') {
    console.log('  - Missing or empty city')
  }

  if (!venue.fullAddress || venue.fullAddress.trim() === '') {
    console.log('  - Missing or empty fullAddress')
  }

  if (!venue.name || venue.name.trim() === '') {
    console.log('  - Missing or empty name')
  }

  if (venue.operatingHours && typeof venue.operatingHours === 'string') {
    console.log('  - operatingHours is a string (should be JSON object)')
  }

  if (venue.jamGenres && typeof venue.jamGenres === 'string') {
    console.log('  - jamGenres is a string (should be array)')
  }

  if (venue.socialLinks && typeof venue.socialLinks === 'string') {
    console.log('  - socialLinks is a string (should be JSON object)')
  }

  await prisma.$disconnect()
}

checkTBDVenue().catch(console.error)
