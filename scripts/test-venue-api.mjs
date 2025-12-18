/**
 * Test Venue API Endpoint
 * Tests the /api/venues/[id] endpoint to verify it works correctly
 */

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function testVenueAPI() {
  try {
    console.log('🧪 Testing Venue API logic...\n')

    // Get a verified venue
    const venue = await prisma.venue.findFirst({
      where: { verified: true },
      select: {
        id: true,
        name: true,
        city: true,
        description: true,
        address: true,
        hasPiano: true,
        hasJamSession: true,
        verified: true,
        venueType: true,
        contactType: true,
        contactInfo: true,
        submittedBy: true,
        verifiedBy: true,
        createdAt: true,
        updatedAt: true,
        verifiedAt: true,
        curatorNotes: true,
        phone: true,
        website: true,
        pianoType: true,
        pianoCondition: true,
        pianoBrand: true,
        lastTuned: true,
        jamSchedule: true,
        jamFrequency: true,
        jamGenres: true,
        operatingHours: true,
        wheelchairAccessible: true,
        parkingAvailable: true,
        publicTransportNear: true,
        specialNotes: true,
        rejectedAt: true,
        rejectedBy: true,
        rejectionReason: true,
      },
    })

    if (!venue) {
      console.log('❌ No verified venues found in database')
      return
    }

    console.log('✅ Found verified venue:')
    console.log(`   ID: ${venue.id}`)
    console.log(`   Name: ${venue.name}`)
    console.log(`   City: ${venue.city}`)
    console.log(`   Verified: ${venue.verified}`)
    console.log('')

    // Simulate the API response transformation
    console.log('🔄 Testing data transformation (as API would do)...\n')

    const apiResponse = {
      venue: {
        id: venue.id,
        name: venue.name,
        city: venue.city,
        fullAddress: venue.address || '',
        hasPiano: venue.hasPiano,
        hasJamSession: venue.hasJamSession || false,
        verified: venue.verified,
        venueType: venue.venueType || 0,
        contactType: venue.contactType || 'email',
        contactInfo: venue.contactInfo || '',
        submittedBy: venue.submittedBy,
        verifiedBy: venue.verifiedBy || '',
        createdAt: venue.createdAt,
        updatedAt: venue.updatedAt,
        verifiedAt: venue.verifiedAt,
        description: venue.description || '',
        phone: venue.phone || '',
        website: venue.website || '',
        pianoType: venue.pianoType,
        pianoCondition: venue.pianoCondition,
        pianoBrand: venue.pianoBrand,
        lastTuned: venue.lastTuned,
        jamSchedule: venue.jamSchedule,
        jamFrequency: venue.jamFrequency,
        jamGenres: venue.jamGenres || [],
        operatingHours: venue.operatingHours,
        wheelchairAccessible: venue.wheelchairAccessible || false,
        parkingAvailable: venue.parkingAvailable || false,
        publicTransportNear: venue.publicTransportNear || false,
        specialNotes: venue.specialNotes,
        curatorNotes: venue.curatorNotes || '',
        rejectedAt: venue.rejectedAt,
        rejectedBy: venue.rejectedBy,
        rejectionReason: venue.rejectionReason,
      },
      timestamp: new Date().toISOString(),
    }

    console.log('✅ API Response would be:')
    console.log(JSON.stringify(apiResponse, null, 2))
    console.log('')

    // Check for potential issues
    console.log('🔍 Checking for potential issues...\n')

    const issues = []

    if (!venue.description && !venue.phone && !venue.website) {
      issues.push('⚠️  No extended data (description/phone/website)')
    }

    if (venue.createdAt === null || venue.createdAt === undefined) {
      issues.push('❌ Missing createdAt timestamp')
    }

    if (venue.updatedAt === null || venue.updatedAt === undefined) {
      issues.push('❌ Missing updatedAt timestamp')
    }

    if (issues.length > 0) {
      console.log('Issues found:')
      issues.forEach((issue) => console.log(`  ${issue}`))
    } else {
      console.log('✅ No issues found - API should work correctly!')
    }
  } catch (error) {
    console.error('❌ Error testing API:', error)
    console.error('Stack trace:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testVenueAPI()
