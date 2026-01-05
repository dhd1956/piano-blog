/**
 * Migrate Event Venues
 * Creates venues from custom locations and links events to them
 */

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function migrateEventVenues() {
  try {
    console.log('🔄 Starting Event Venue Migration...\n')

    // Step 1: Get events without venues
    const eventsWithoutVenue = await prisma.event.findMany({
      where: { venueId: null },
      select: {
        id: true,
        title: true,
        customLocation: true,
        address: true,
      },
    })

    console.log(`Found ${eventsWithoutVenue.length} events without venues\n`)

    if (eventsWithoutVenue.length === 0) {
      console.log('✅ No migration needed - all events already have venues!')
      return
    }

    // Step 2: TBD fallback venue creation removed
    // Events without venues should be handled differently or deleted
    // If you need a fallback, create it manually and update this script
    console.log('⚠️  Note: TBD fallback venue not created automatically\n')
    console.log('   Events without valid venues will need manual attention\n')

    // Step 3: For events with custom locations, try to find matching venues or create them
    const venuesCreated = []
    const eventsSkipped = []

    for (const event of eventsWithoutVenue) {
      let venueId = null // No default fallback venue

      if (event.customLocation) {
        // Try to find existing venue with this name
        const existingVenue = await prisma.venue.findFirst({
          where: {
            OR: [
              { name: { equals: event.customLocation, mode: 'insensitive' } },
              { slug: event.customLocation.toLowerCase().replace(/\s+/g, '-') },
            ],
          },
        })

        if (existingVenue) {
          console.log(`Found existing venue "${existingVenue.name}" for event "${event.title}"`)
          venueId = existingVenue.id
        } else {
          // Create new venue from custom location
          const slug = event.customLocation.toLowerCase().replace(/\s+/g, '-')
          const newVenue = await prisma.venue.create({
            data: {
              name: event.customLocation,
              city: 'Unknown',
              contactInfo: 'migrated@pianoblog.local',
              contactType: 'email',
              address: event.address || '',
              slug: `${slug}-${event.id}`, // Add event ID to ensure uniqueness
              hasPiano: false,
              hasJamSession: false,
              venueType: 0,
              verified: true,
              description: 'Migrated from custom event location',
              submittedBy: 'system-migration',
            },
          })
          console.log(`Created new venue "${newVenue.name}" (ID: ${newVenue.id})`)
          venuesCreated.push(newVenue)
          venueId = newVenue.id
        }
      } else {
        // No custom location - check if event title suggests a venue
        // Special case: "Tranzac happening" -> link to Tranzac venue
        if (event.title.toLowerCase().includes('tranzac')) {
          const tranzacVenue = await prisma.venue.findFirst({
            where: {
              name: { contains: 'Tranzac', mode: 'insensitive' },
            },
          })

          if (tranzacVenue) {
            console.log(`Linking event "${event.title}" to Tranzac venue`)
            venueId = tranzacVenue.id
          }
        }
      }

      // Step 4: Update event with venueId (or skip if no venue found)
      if (venueId) {
        await prisma.event.update({
          where: { id: event.id },
          data: { venueId },
        })
        console.log(`✅ Updated event "${event.title}" with venue ID ${venueId}`)
      } else {
        console.log(`⚠️  Skipped event "${event.title}" - no venue information available`)
        eventsSkipped.push(event)
      }
    }

    console.log('\n' + '─'.repeat(80))
    console.log('\n📊 Migration Summary:')
    console.log(`   Events processed: ${eventsWithoutVenue.length}`)
    console.log(`   Events migrated: ${eventsWithoutVenue.length - eventsSkipped.length}`)
    console.log(`   Events skipped: ${eventsSkipped.length}`)
    console.log(`   New venues created: ${venuesCreated.length}`)

    // Step 5: Verify migration
    const remainingNullVenues = await prisma.event.count({
      where: { venueId: null },
    })

    if (remainingNullVenues === 0) {
      console.log('\n✅ Migration successful! All events now have venues.')
    } else {
      console.log(`\n⚠️  Warning: ${remainingNullVenues} events still have null venueId`)
    }
  } catch (error) {
    console.error('❌ Error during migration:', error)
    console.error('Stack trace:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

migrateEventVenues()
