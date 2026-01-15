import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkPendingVenues() {
  console.log('📋 Checking pending venues...\n')

  const pendingVenues = await prisma.venue.findMany({
    where: {
      verified: false,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      city: true,
      submittedBy: true,
      createdAt: true,
      verified: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  console.log(`Found ${pendingVenues.length} pending venues:\n`)

  if (pendingVenues.length === 0) {
    console.log('No pending venues found. Will need to create a test venue.\n')
  } else {
    pendingVenues.forEach((venue) => {
      console.log(`ID: ${venue.id}`)
      console.log(`  Name: ${venue.name}`)
      console.log(`  City: ${venue.city}`)
      console.log(`  Submitted By: ${venue.submittedBy || 'unknown'}`)
      console.log(`  Created: ${venue.createdAt.toISOString()}`)
      console.log(`  Verified: ${venue.verified}`)
      console.log()
    })
  }

  // Also check recent verified venues to see the pattern
  const recentVerified = await prisma.venue.findMany({
    where: {
      verified: true,
    },
    select: {
      id: true,
      name: true,
      city: true,
      submittedBy: true,
      verifiedAt: true,
    },
    orderBy: { verifiedAt: 'desc' },
    take: 3,
  })

  console.log(`\n📊 Recent verified venues (for reference): ${recentVerified.length}`)
  recentVerified.forEach((venue) => {
    console.log(`  - ${venue.name} (ID: ${venue.id}, Verified: ${venue.verifiedAt?.toISOString()})`)
  })
}

checkPendingVenues()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
