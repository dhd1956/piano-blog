import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function fixTorontoSpace() {
  try {
    // Find ALL venues to see the city values
    const allVenues = await prisma.venue.findMany({
      where: {
        city: {
          contains: 'Toronto',
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        city: true,
      },
    })

    console.log('All Toronto venues:')
    allVenues.forEach((v) => {
      console.log(`  ID ${v.id}: ${v.name}`)
      console.log(`    City: "${v.city}" (length: ${v.city.length})`)
      console.log(`    Has trailing space: ${v.city !== v.city.trim()}`)
    })

    // Update all to trim spaces
    let updated = 0
    for (const venue of allVenues) {
      const trimmedCity = venue.city.trim()
      if (trimmedCity !== venue.city) {
        await prisma.venue.update({
          where: { id: venue.id },
          data: { city: trimmedCity },
        })
        console.log(`\n✅ Updated ${venue.name}: "${venue.city}" → "${trimmedCity}"`)
        updated++
      }
    }

    console.log(`\n📊 Summary: Updated ${updated} venue(s)`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixTorontoSpace()
