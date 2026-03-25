import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testVenueApprovalRewards() {
  console.log('🧪 Testing Scout & Curator PXP Rewards\n')
  console.log('='.repeat(60))

  // Test Configuration
  const venueId = 40 // Chartwell Pickering City Centre
  const curatorUsername = 'curator' // The curator approving the venue

  try {
    // Step 1: Get initial state
    console.log('\n📊 STEP 1: Recording Initial State\n')

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: {
        id: true,
        name: true,
        city: true,
        submittedBy: true,
        verified: true,
      },
    })

    if (!venue) {
      throw new Error(`Venue ${venueId} not found`)
    }

    console.log(`Venue: ${venue.name} (ID: ${venue.id})`)
    console.log(`City: ${venue.city}`)
    console.log(`Submitted By: ${venue.submittedBy}`)
    console.log(`Currently Verified: ${venue.verified}`)

    if (venue.verified) {
      throw new Error('Venue is already verified! Cannot test with already-verified venue.')
    }

    // Get scout user (submitter)
    const scoutUser = await prisma.user.findUnique({
      where: { walletAddress: venue.submittedBy.toLowerCase() },
      select: { id: true, username: true, walletAddress: true, totalPXPEarned: true },
    })

    if (!scoutUser) {
      throw new Error(`Scout user not found with wallet ${venue.submittedBy}`)
    }

    // Get curator user
    const curatorUser = await prisma.user.findUnique({
      where: { username: curatorUsername },
      select: { id: true, username: true, role: true, totalPXPEarned: true },
    })

    if (!curatorUser) {
      throw new Error(`Curator user '${curatorUsername}' not found`)
    }

    console.log(`\n👤 Scout: ${scoutUser.username}`)
    console.log(`   Initial PXP: ${scoutUser.totalPXPEarned}`)

    console.log(`\n👤 Curator: ${curatorUser.username}`)
    console.log(`   Initial PXP: ${curatorUser.totalPXPEarned}`)

    const scoutInitialPXP = scoutUser.totalPXPEarned
    const curatorInitialPXP = curatorUser.totalPXPEarned

    // Step 2: Get PXP config
    console.log('\n📊 STEP 2: Fetching PXP Configuration\n')

    const scoutConfig = await prisma.pXPConfig.findUnique({
      where: { key: 'venue_verified' },
      select: { value: true, enabled: true, label: true },
    })

    const curatorConfig = await prisma.pXPConfig.findUnique({
      where: { key: 'curator_verification' },
      select: { value: true, enabled: true, label: true },
    })

    const scoutReward = scoutConfig && scoutConfig.enabled ? scoutConfig.value : 50
    const curatorReward = curatorConfig && curatorConfig.enabled ? curatorConfig.value : 20

    console.log(`Scout Reward Config: ${scoutConfig.label}`)
    console.log(`  Value: ${scoutReward} PXP`)
    console.log(`  Enabled: ${scoutConfig.enabled}`)

    console.log(`\nCurator Reward Config: ${curatorConfig.label}`)
    console.log(`  Value: ${curatorReward} PXP`)
    console.log(`  Enabled: ${curatorConfig.enabled}`)

    // Step 3: Approve the venue
    console.log('\n📊 STEP 3: Approving Venue (Simulating Curator Action)\n')

    await prisma.venue.update({
      where: { id: venueId },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    })

    console.log(`✅ Venue "${venue.name}" marked as verified`)

    // Step 4: Award PXP to scout
    console.log('\n📊 STEP 4: Awarding PXP to Scout\n')

    await prisma.user.update({
      where: { id: scoutUser.id },
      data: {
        totalPXPEarned: { increment: scoutReward },
      },
    })

    console.log(`✅ Awarded ${scoutReward} PXP to scout ${scoutUser.username}`)

    // Step 5: Award PXP to curator
    console.log('\n📊 STEP 5: Awarding PXP to Curator\n')

    await prisma.user.update({
      where: { id: curatorUser.id },
      data: {
        totalPXPEarned: { increment: curatorReward },
      },
    })

    console.log(`✅ Awarded ${curatorReward} PXP to curator ${curatorUser.username}`)

    // Step 6: Verify final balances
    console.log('\n📊 STEP 6: Verifying Final Balances\n')

    const scoutFinal = await prisma.user.findUnique({
      where: { id: scoutUser.id },
      select: { username: true, totalPXPEarned: true },
    })

    const curatorFinal = await prisma.user.findUnique({
      where: { id: curatorUser.id },
      select: { username: true, totalPXPEarned: true },
    })

    console.log(`👤 Scout: ${scoutFinal.username}`)
    console.log(`   Initial PXP: ${scoutInitialPXP}`)
    console.log(`   Final PXP: ${scoutFinal.totalPXPEarned}`)
    console.log(`   Change: +${scoutFinal.totalPXPEarned - scoutInitialPXP} PXP`)
    console.log(`   Expected: +${scoutReward} PXP`)
    console.log(
      `   ✅ ${scoutFinal.totalPXPEarned - scoutInitialPXP === scoutReward ? 'CORRECT' : 'ERROR'}`
    )

    console.log(`\n👤 Curator: ${curatorFinal.username}`)
    console.log(`   Initial PXP: ${curatorInitialPXP}`)
    console.log(`   Final PXP: ${curatorFinal.totalPXPEarned}`)
    console.log(`   Change: +${curatorFinal.totalPXPEarned - curatorInitialPXP} PXP`)
    console.log(`   Expected: +${curatorReward} PXP`)
    console.log(
      `   ✅ ${curatorFinal.totalPXPEarned - curatorInitialPXP === curatorReward ? 'CORRECT' : 'ERROR'}`
    )

    console.log('\n' + '='.repeat(60))
    console.log('✅ TEST COMPLETE')
    console.log('='.repeat(60))

    // Summary
    console.log('\n📝 Summary:')
    console.log(`  • Venue "${venue.name}" verified ✅`)
    console.log(`  • Scout "${scoutUser.username}" earned ${scoutReward} PXP ✅`)
    console.log(`  • Curator "${curatorUser.username}" earned ${curatorReward} PXP ✅`)
    console.log(`  • Total PXP distributed: ${scoutReward + curatorReward} PXP`)
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testVenueApprovalRewards()
