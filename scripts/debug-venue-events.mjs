/**
 * Debug Venue Events
 * Checks why events aren't showing on venue detail pages
 */

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function debugVenueEvents() {
  try {
    console.log('🔍 Debugging Venue Events Display...\n')

    // Get Tranzac venue
    const tranzac = await prisma.venue.findFirst({
      where: {
        name: { contains: 'Tranzac', mode: 'insensitive' },
      },
    })

    if (!tranzac) {
      console.log('❌ Tranzac venue not found')
      return
    }

    console.log('✓ Tranzac Venue:')
    console.log(`  ID: ${tranzac.id}`)
    console.log(`  Name: ${tranzac.name}`)
    console.log(`  Slug: ${tranzac.slug}`)
    console.log('')

    // Get all events for Tranzac
    const events = await prisma.event.findMany({
      where: { venueId: tranzac.id },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        status: true,
        venueId: true,
        createdAt: true,
      },
      orderBy: { startDate: 'asc' },
    })

    console.log(`✓ Events linked to Tranzac (venueId: ${tranzac.id}):`)
    console.log(`  Total: ${events.length}`)
    console.log('')

    if (events.length > 0) {
      events.forEach((event) => {
        console.log(`  Event ID: ${event.id}`)
        console.log(`    Title: ${event.title}`)
        console.log(`    Start: ${event.startDate}`)
        console.log(`    End: ${event.endDate}`)
        console.log(`    Status: ${event.status}`)
        console.log(`    Venue ID: ${event.venueId}`)
        console.log(`    Created: ${event.createdAt}`)
        console.log('')
      })

      // Check date filtering (30 days ago + upcoming)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const filtered = events.filter((event) => {
        const eventDate = new Date(event.startDate)
        return eventDate >= thirtyDaysAgo
      })

      console.log(`✓ Events after date filter (>= 30 days ago):`)
      console.log(`  Count: ${filtered.length}`)
      if (filtered.length > 0) {
        filtered.forEach((e) => {
          console.log(`    - ${e.title} (${e.startDate})`)
        })
      } else {
        console.log('    (none - all events are older than 30 days)')
      }
      console.log('')
    } else {
      console.log('  ❌ No events found linked to Tranzac')
      console.log('')
      console.log('  Checking for events with other venueIds:')

      const allEvents = await prisma.event.findMany({
        select: {
          id: true,
          title: true,
          venueId: true,
          venue: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      console.log(`  Total events in database: ${allEvents.length}`)
      allEvents.forEach((e) => {
        console.log(`    Event ${e.id}: "${e.title}" → Venue ${e.venueId} (${e.venue.name})`)
      })
    }
  } catch (error) {
    console.error('❌ Error:', error)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

debugVenueEvents()
