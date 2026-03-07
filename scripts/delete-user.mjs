/**
 * delete-user.mjs
 *
 * Cleanly removes or resets a user in the database.
 *
 * DELETE mode (default):
 *   Removes the user and all related rows with no orphans.
 *   Cascade relations (Session, VenueReview, VenueValidation, MusicianProfile,
 *   Event, EventSeries, EventRSVP, YouTubeVideo) are handled automatically by
 *   Prisma.  Non-cascade rows (GasSponsoredTransaction) and the self-referential
 *   referral link are handled explicitly.
 *
 * RESET mode (--reset):
 *   Zeros out all reward/activity state so the user can re-test the full
 *   onboarding flow from scratch, WITHOUT deleting the DB record or the wallet
 *   address.  This preserves the on-chain token balance while resetting the DB
 *   counters — avoiding duplicate PXP sends caused by delete-then-recreate.
 *   Clears: reward flags, totalCAVEarned, profileCompleted, sessions, RSVPs,
 *   reviews, validations, YouTube videos, gas transactions, musician profile.
 *   Keeps: walletAddress, email, username, displayName, referralCode, referredBy.
 *
 * Usage:
 *   node scripts/delete-user.mjs --email foo@example.com [--dry-run] [--confirm]
 *   node scripts/delete-user.mjs --wallet 0xABCD...     [--dry-run] [--confirm]
 *   node scripts/delete-user.mjs --username alice        [--dry-run] [--confirm]
 *   node scripts/delete-user.mjs --email foo@example.com --reset [--dry-run] [--confirm]
 *
 * Flags:
 *   --reset      Reset reward state instead of deleting the user.
 *   --dry-run    Show what would change without touching the database.
 *   --confirm    Skip the "are you sure?" prompt.
 *
 * Environment:
 *   DATABASE_URL must be set.  The script loads .env.local first, then .env,
 *   so the same env files used by Next.js work here too.
 */

import { PrismaClient } from '@prisma/client'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { createInterface } from 'readline'

// ---------------------------------------------------------------------------
// Load env files (.env.local wins over .env, matching Next.js behaviour)
// ---------------------------------------------------------------------------
for (const file of ['.env.local', '.env']) {
  const abs = resolve(process.cwd(), file)
  if (existsSync(abs)) {
    const { config } = await import('dotenv')
    config({ path: abs, override: false })
  }
}

// ---------------------------------------------------------------------------
// Parse CLI arguments
// ---------------------------------------------------------------------------
const args = process.argv.slice(2)
const flag = (name) => {
  const idx = args.indexOf(name)
  if (idx !== -1) return args[idx + 1] ?? true
  return undefined
}
const hasFlag = (name) => args.includes(name)

const byEmail = flag('--email')
const byWallet = flag('--wallet')
const byUsername = flag('--username')
const dryRun = hasFlag('--dry-run')
const confirmed = hasFlag('--confirm')
const resetMode = hasFlag('--reset')

if (!byEmail && !byWallet && !byUsername) {
  console.error(
    'Usage: node scripts/delete-user.mjs --email <email> | --wallet <address> | --username <username> [--reset] [--dry-run] [--confirm]'
  )
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const prisma = new PrismaClient()

function prompt(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function run() {
  // 1. Find the user
  const where = byEmail
    ? { email: byEmail.toLowerCase() }
    : byWallet
      ? { walletAddress: byWallet.toLowerCase() }
      : { username: byUsername.toLowerCase() }

  const user = await prisma.user.findUnique({
    where,
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      walletAddress: true,
      role: true,
      referralCode: true,
      createdAt: true,
      _count: {
        select: {
          sessions: true,
          reviews: true,
          validations: true,
          organizedEvents: true,
          organizedSeries: true,
          rsvps: true,
          youtubeVideos: true,
        },
      },
    },
  })

  if (!user) {
    console.error('User not found:', byEmail ?? byWallet ?? byUsername)
    await prisma.$disconnect()
    process.exit(1)
  }

  // Count non-cascade rows manually
  const gasCount = await prisma.gasSponsoredTransaction.count({ where: { userId: user.id } })
  const referralCount = user.referralCode
    ? await prisma.user.count({ where: { referredBy: user.referralCode } })
    : 0

  // 2. Print summary
  console.log('\n' + '='.repeat(60))
  if (dryRun) {
    console.log(`  DRY RUN — no changes will be made  [${resetMode ? 'RESET' : 'DELETE'} mode]`)
  } else {
    console.log(resetMode ? '  USER RESET SUMMARY' : '  USER DELETION SUMMARY')
  }
  console.log('='.repeat(60))
  console.log(`  ID           : ${user.id}`)
  console.log(`  Email        : ${user.email ?? '(none)'}`)
  console.log(`  Username     : ${user.username ?? '(none)'}`)
  console.log(`  Display name : ${user.displayName ?? '(none)'}`)
  console.log(`  Wallet       : ${user.walletAddress ?? '(none)'}`)
  console.log(`  Role         : ${user.role}`)
  console.log(`  Created      : ${user.createdAt.toISOString()}`)

  if (resetMode) {
    console.log('\n  Reward fields that will be zeroed:')
    console.log('    hasClaimedNewUserReward → false')
    console.log('    totalCAVEarned          → 0')
    console.log('    profileCompleted        → false')
    console.log('    profileCompletedAt      → null')
    console.log('    firstPXPEarnedAt        → null')
    console.log('    referralPXPEarned       → 0')
    console.log('\n  Related records that will be deleted:')
    console.log(`    Sessions              : ${user._count.sessions}`)
    console.log(`    Venue reviews         : ${user._count.reviews}`)
    console.log(`    Venue validations     : ${user._count.validations}`)
    console.log(`    RSVPs (as attendee)   : ${user._count.rsvps}`)
    console.log(`    YouTube videos        : ${user._count.youtubeVideos}`)
    console.log(`    Gas sponsored txs     : ${gasCount}`)
    console.log('\n  Kept: walletAddress, email, username, displayName, referralCode, referredBy')
    console.log('  Note: on-chain PXP balance is unaffected.')
  } else {
    console.log('\n  Records that will be deleted:')
    console.log(`    Sessions              : ${user._count.sessions}`)
    console.log(`    Venue reviews         : ${user._count.reviews}`)
    console.log(`    Venue validations     : ${user._count.validations}`)
    console.log(
      `    Organised events      : ${user._count.organizedEvents}  (+ their RSVPs & YouTube videos)`
    )
    console.log(`    Organised event series: ${user._count.organizedSeries}`)
    console.log(`    RSVPs (as attendee)   : ${user._count.rsvps}`)
    console.log(`    YouTube videos        : ${user._count.youtubeVideos}`)
    console.log(`    Gas sponsored txs     : ${gasCount}  (manual delete)`)
    console.log(
      `    Referred users        : ${referralCount}  (referredBy will be nulled, NOT deleted)`
    )
  }
  console.log('='.repeat(60) + '\n')

  if (dryRun) {
    console.log(`Dry run complete. Re-run without --dry-run to ${resetMode ? 'reset' : 'delete'}.`)
    await prisma.$disconnect()
    return
  }

  // 3. Confirm
  if (!confirmed) {
    const action = resetMode
      ? `reset reward state for user ${user.id}`
      : `permanently delete user ${user.id}`
    const answer = await prompt(`Type "yes" to ${action}: `)
    if (answer.trim().toLowerCase() !== 'yes') {
      console.log('Aborted.')
      await prisma.$disconnect()
      return
    }
  }

  if (resetMode) {
    // 4. RESET — zero reward state, delete activity records, keep the user row
    await prisma.$transaction(async (tx) => {
      // Delete sessions so the user has to re-login
      if (user._count.sessions > 0) {
        await tx.session.deleteMany({ where: { userId: user.id } })
        console.log(`  Deleted ${user._count.sessions} session(s)`)
      }

      // Delete RSVPs
      if (user._count.rsvps > 0) {
        await tx.eventRSVP.deleteMany({ where: { userId: user.id } })
        console.log(`  Deleted ${user._count.rsvps} RSVP(s)`)
      }

      // Delete venue reviews
      if (user._count.reviews > 0) {
        await tx.venueReview.deleteMany({ where: { userId: user.id } })
        console.log(`  Deleted ${user._count.reviews} venue review(s)`)
      }

      // Delete venue validations
      if (user._count.validations > 0) {
        await tx.venueValidation.deleteMany({ where: { userId: user.id } })
        console.log(`  Deleted ${user._count.validations} venue validation(s)`)
      }

      // Delete YouTube videos
      if (user._count.youtubeVideos > 0) {
        await tx.youTubeVideo.deleteMany({ where: { userId: user.id } })
        console.log(`  Deleted ${user._count.youtubeVideos} YouTube video(s)`)
      }

      // Delete gas sponsored transactions (no cascade)
      if (gasCount > 0) {
        await tx.gasSponsoredTransaction.deleteMany({ where: { userId: user.id } })
        console.log(`  Deleted ${gasCount} gas sponsored transaction(s)`)
      }

      // Delete musician profile (cascade would handle it on delete, do it manually here)
      await tx.musicianProfile.deleteMany({ where: { userId: user.id } })

      // Zero out reward state on the user record
      await tx.user.update({
        where: { id: user.id },
        data: {
          hasClaimedNewUserReward: false,
          totalCAVEarned: 0,
          profileCompleted: false,
          profileCompletedAt: null,
          firstPXPEarnedAt: null,
          referralPXPEarned: 0,
        },
      })
      console.log(`  Reset reward state for user ${user.id}`)
    })

    console.log('\nDone. Reward state reset. Wallet address and profile identity preserved.')
  } else {
    // 4. DELETE inside a transaction
    await prisma.$transaction(async (tx) => {
      // 4a. Null out referredBy for users referred by this account
      if (referralCount > 0) {
        await tx.user.updateMany({
          where: { referredBy: user.referralCode },
          data: { referredBy: null },
        })
        console.log(`  Nulled referredBy for ${referralCount} referred user(s)`)
      }

      // 4b. Delete GasSponsoredTransaction rows (no Prisma cascade)
      if (gasCount > 0) {
        await tx.gasSponsoredTransaction.deleteMany({ where: { userId: user.id } })
        console.log(`  Deleted ${gasCount} gas sponsored transaction(s)`)
      }

      // 4c. Delete the user — all cascade relations handled by Prisma/DB
      await tx.user.delete({ where: { id: user.id } })
      console.log(`  Deleted user ${user.id}`)
    })

    console.log('\nDone. User and all related rows removed.')
  }
  await prisma.$disconnect()
}

run().catch(async (err) => {
  console.error('Error:', err.message)
  await prisma.$disconnect()
  process.exit(1)
})
