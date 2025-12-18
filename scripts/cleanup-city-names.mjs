/**
 * City Name Cleanup Script
 * Trims leading/trailing spaces from all venue city names
 * Run with: node scripts/cleanup-city-names.mjs
 */

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function cleanupCityNames() {
  try {
    console.log('🔍 Finding venues with city name issues...\n')

    // Get all venues
    const allVenues = await prisma.venue.findMany({
      select: {
        id: true,
        name: true,
        city: true,
      },
    })

    let updated = 0
    const cityIssues = []

    for (const venue of allVenues) {
      const trimmedCity = venue.city.trim()

      if (trimmedCity !== venue.city) {
        // Has leading/trailing spaces
        cityIssues.push({
          venue,
          issue: 'trailing/leading spaces',
          before: `"${venue.city}"`,
          after: `"${trimmedCity}"`,
        })

        await prisma.venue.update({
          where: { id: venue.id },
          data: { city: trimmedCity },
        })
        updated++
      }
    }

    // Display results
    if (cityIssues.length > 0) {
      console.log('📋 Issues Found and Fixed:\n')
      cityIssues.forEach(({ venue, issue, before, after }) => {
        console.log(`  ✅ ${venue.name}`)
        console.log(`     Issue: ${issue}`)
        console.log(`     Before: ${before}`)
        console.log(`     After:  ${after}\n`)
      })
    }

    // Show city statistics
    const cityGroups = {}
    for (const venue of allVenues) {
      const city = venue.city.trim()
      if (!cityGroups[city]) {
        cityGroups[city] = []
      }
      cityGroups[city].push(venue.name)
    }

    console.log('📊 City Statistics:\n')
    Object.entries(cityGroups)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([city, venues]) => {
        console.log(`  ${city}: ${venues.length} venue(s)`)
        venues.forEach((name) => console.log(`    - ${name}`))
        console.log()
      })

    console.log(`\n✨ Summary: Updated ${updated} venue(s)`)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupCityNames()
