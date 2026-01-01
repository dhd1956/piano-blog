/**
 * Seed PXP Configuration Values
 * Populates initial database-tracked PXP rewards
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const initialPXPConfig = [
  // Onboarding Rewards
  {
    key: 'wallet_connection',
    value: 100,
    label: 'Onboarding: Welcome Reward',
    description: 'PXP earned when connecting wallet for the first time',
    category: 'onboarding',
    enabled: true,
  },

  // Referral Rewards
  {
    key: 'referral_profile_created',
    value: 50,
    label: 'Referral: Profile Created',
    description: 'PXP earned when referred user completes their profile',
    category: 'referral',
    enabled: true,
  },
  {
    key: 'referral_first_event',
    value: 100,
    label: 'Referral: First Event Attendance',
    description: 'PXP earned when referred user attends their first event',
    category: 'referral',
    enabled: true,
  },
  {
    key: 'referral_max_per_user',
    value: 250,
    label: 'Referral: Maximum Per User',
    description: 'Maximum PXP that can be earned from referrals (cap)',
    category: 'referral',
    enabled: true,
  },

  // YouTube Video Rewards
  {
    key: 'youtube_upload',
    value: 100,
    label: 'YouTube: Upload Video',
    description: 'PXP earned for uploading a performance video to an event',
    category: 'youtube',
    enabled: true,
  },
  {
    key: 'youtube_upload_organizer',
    value: 50,
    label: 'YouTube: Upload Bonus (Organizer)',
    description: 'PXP earned by event organizer when someone uploads video of their event',
    category: 'youtube',
    enabled: true,
  },
  {
    key: 'youtube_100_views',
    value: 10,
    label: 'YouTube: 100 Views',
    description: 'PXP earned when video reaches 100 views',
    category: 'youtube',
    enabled: true,
  },
  {
    key: 'youtube_1000_views',
    value: 50,
    label: 'YouTube: 1,000 Views',
    description: 'PXP earned when video reaches 1,000 views',
    category: 'youtube',
    enabled: true,
  },
  {
    key: 'youtube_10000_views',
    value: 100,
    label: 'YouTube: 10,000 Views',
    description: 'PXP earned when video reaches 10,000 views',
    category: 'youtube',
    enabled: true,
  },
  {
    key: 'youtube_100000_views',
    value: 250,
    label: 'YouTube: 100,000 Views',
    description: 'PXP earned when video reaches 100,000 views',
    category: 'youtube',
    enabled: true,
  },

  // Event Participation
  {
    key: 'event_host',
    value: 75,
    label: 'Event: Host Event',
    description: 'PXP earned for hosting/organizing an event',
    category: 'event',
    enabled: true,
  },
  {
    key: 'event_perform',
    value: 50,
    label: 'Event: Perform at Event',
    description: 'PXP earned for performing at an event',
    category: 'event',
    enabled: true,
  },
  {
    key: 'event_attend',
    value: 25,
    label: 'Event: Attend Event',
    description: 'PXP earned for attending an event',
    category: 'event',
    enabled: true,
  },

  // Community Contributions
  {
    key: 'venue_review',
    value: 15,
    label: 'Venue: Write Review',
    description: 'PXP earned for writing a detailed venue review',
    category: 'community',
    enabled: true,
  },
  {
    key: 'venue_photo',
    value: 10,
    label: 'Venue: Upload Photo',
    description: 'PXP earned for uploading a verified venue photo',
    category: 'community',
    enabled: true,
  },
  {
    key: 'profile_complete',
    value: 30,
    label: 'Profile: Complete Profile',
    description: 'PXP earned for completing full musician profile',
    category: 'community',
    enabled: true,
  },
]

async function main() {
  console.log('Seeding PXP configuration...')

  for (const config of initialPXPConfig) {
    const result = await prisma.pXPConfig.upsert({
      where: { key: config.key },
      create: config,
      update: {
        // Only update if values changed - preserve custom admin changes
        ...config,
        updatedBy: 'seed-script',
      },
    })
    console.log(`✓ ${result.label}: ${result.value} PXP`)
  }

  console.log(`\n✅ Seeded ${initialPXPConfig.length} PXP configuration entries`)
}

main()
  .catch((e) => {
    console.error('Error seeding PXP config:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
