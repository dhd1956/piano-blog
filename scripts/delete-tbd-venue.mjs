import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteTBDVenue() {
  try {
    console.log('🔍 Finding TBD venue...\n')

    const tbdVenue = await prisma.venue.findFirst({
      where: {
        OR: [{ slug: 'tbd-location' }, { name: 'TBD - Location Not Specified' }],
      },
      include: {
        events: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (!tbdVenue) {
      console.log('✅ TBD venue not found - nothing to delete!')
      return
    }

    console.log(`Found TBD venue (ID: ${tbdVenue.id})`)
    console.log(`Name: ${tbdVenue.name}`)
    console.log(`Slug: ${tbdVenue.slug}`)
    console.log(`Events using this venue: ${tbdVenue.events.length}\n`)

    if (tbdVenue.events.length > 0) {
      console.log('⚠️  WARNING: The following events are still linked to this venue:')
      tbdVenue.events.forEach((event) => {
        console.log(`   - ${event.title} (ID: ${event.id})`)
      })
      console.log('\n❌ Cannot delete venue - please reassign these events first!')
      console.log('   You can either:')
      console.log('   1. Delete these events')
      console.log('   2. Assign them to a different venue')
      return
    }

    // No events using it - safe to delete
    console.log('✅ No events linked to this venue - safe to delete\n')
    console.log('🗑️  Deleting TBD venue...')

    await prisma.venue.delete({
      where: { id: tbdVenue.id },
    })

    console.log('✅ Successfully deleted TBD venue!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

deleteTBDVenue().catch(console.error)
