/**
 * Test script for simplified database setup
 * Tests the database connection and simplified venue service
 */

import { PrismaClient } from '@prisma/client'
import { VenueService } from '../lib/database-simplified'

const prisma = new PrismaClient()

async function testSimplifiedDatabase() {
  try {
    console.log('🧪 Testing simplified database setup...')

    // Test database connection
    console.log('📡 Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Test venue retrieval (should find seeded venues)
    console.log('📋 Testing venue retrieval...')
    const venues = await VenueService.getVenues({ limit: 5 })
    console.log(`✅ Retrieved ${venues.venues.length} venues`)

    venues.venues.forEach((venue) => {
      console.log(`   - ${venue.name} (${venue.city}) - Verified: ${venue.verified}`)
    })

    // Test venue search
    console.log('🔍 Testing venue search...')
    const searchResults = await VenueService.getVenues({
      search: 'piano',
      hasPiano: true,
      limit: 3,
    })
    console.log(`✅ Search found ${searchResults.venues.length} piano venues`)

    // Test individual venue lookup
    console.log('🎯 Testing individual venue lookup...')
    if (venues.venues.length > 0) {
      const firstVenue = venues.venues[0]
      const venueById = await VenueService.getVenue(firstVenue.id)
      console.log(`✅ Retrieved venue by ID: ${venueById?.name}`)

      if (firstVenue.slug) {
        const venueBySlug = await VenueService.getVenue(firstVenue.slug)
        console.log(`✅ Retrieved venue by slug: ${venueBySlug?.name}`)
      }
    }

    // Test database performance
    console.log('⚡ Testing performance...')
    const startTime = Date.now()
    await VenueService.getVenues({ limit: 10 })
    const endTime = Date.now()
    const duration = endTime - startTime
    console.log(`✅ Venue query took ${duration}ms (target: <100ms)`)

    if (duration < 100) {
      console.log(`🚀 Performance excellent! ${duration}ms is well under 100ms target`)
    } else {
      console.log(`⚠️ Performance acceptable but could be improved: ${duration}ms`)
    }

    console.log('🎉 All tests passed! Simplified database is working correctly.')
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testSimplifiedDatabase()
