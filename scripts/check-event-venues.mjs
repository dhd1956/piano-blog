/**
 * Check Event Venue Status
 * Assesses how many events have null venueId before migration
 */

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkEventVenues() {
  try {
    console.log('🔍 Checking Event Venue Status...\n')

    // Count events without venue
    const eventsWithoutVenue = await prisma.event.count({
      where: { venueId: null },
    })

    // Count total events
    const totalEvents = await prisma.event.count()

    // Count events with venue
    const eventsWithVenue = totalEvents - eventsWithoutVenue

    console.log('📊 Summary:')
    console.log(`   Total Events: ${totalEvents}`)
    console.log(`   Events WITH venue: ${eventsWithVenue}`)
    console.log(`   Events WITHOUT venue: ${eventsWithoutVenue}`)
    console.log('')

    if (eventsWithoutVenue > 0) {
      console.log('📋 Events without venue (details):')
      console.log('─'.repeat(80))

      const eventsDetails = await prisma.event.findMany({
        where: { venueId: null },
        select: {
          id: true,
          title: true,
          customLocation: true,
          address: true,
          startDate: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      eventsDetails.forEach((event) => {
        console.log(`\nEvent ID: ${event.id}`)
        console.log(`  Title: ${event.title}`)
        console.log(`  Custom Location: ${event.customLocation || '(none)'}`)
        console.log(`  Address: ${event.address || '(none)'}`)
        console.log(`  Start Date: ${event.startDate}`)
        console.log(`  Created: ${event.createdAt}`)
      })

      console.log('\n' + '─'.repeat(80))
      console.log('\n⚠️  Migration Required!')
      console.log(
        '   These events need to be migrated to have venue associations before making venueId required.'
      )
    } else {
      console.log('✅ All events already have venue associations!')
      console.log('   No data migration needed - can proceed directly to schema update.')
    }
  } catch (error) {
    console.error('❌ Error checking event venues:', error)
    console.error('Stack trace:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

checkEventVenues()
