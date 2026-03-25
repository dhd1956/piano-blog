/**
 * PXP Reward Distribution System
 * Helper functions to award PXP for various user actions.
 * All rewards trigger a real on-chain ERC-20 transfer from the hot wallet;
 * DB totalPXPEarned is only incremented after on-chain confirmation.
 */

import { getDb } from '@/lib/get-db'
import { sendPXPReward } from '@/lib/send-pxp-reward'

/**
 * Get PXP configuration value by key
 */
async function getPXPConfig(key: string): Promise<number> {
  const db = await getDb()
  const config = await db.pXPConfig.findUnique({
    where: { key },
    select: { value: true, enabled: true },
  })

  if (!config || !config.enabled) {
    return 0
  }

  return config.value
}

/**
 * Award PXP to a user and update their total in DB.
 * Only called after on-chain transfer has been confirmed.
 */
async function awardPXP(
  userId: number,
  amount: number,
  reason: string
): Promise<{ success: boolean; newTotal: number }> {
  if (amount <= 0) {
    return { success: false, newTotal: 0 }
  }

  const db = await getDb()
  const user = await db.user.update({
    where: { id: userId },
    data: {
      totalPXPEarned: { increment: amount },
    },
    select: { totalPXPEarned: true, username: true },
  })

  console.log(`✓ Awarded ${amount} PXP to ${user.username} for: ${reason}`)

  return {
    success: true,
    newTotal: user.totalPXPEarned,
  }
}

/**
 * Award referral PXP when referred user completes their profile
 */
export async function awardReferralProfileCompleted(userId: number): Promise<{
  success: boolean
  pxpAwarded: number
  referrerUsername?: string
}> {
  try {
    const db = await getDb()
    // Get user with referrer info
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        referredBy: true,
        profileCompleted: true,
        referredByUser: {
          select: {
            id: true,
            username: true,
            displayName: true,
            walletAddress: true,
            referralPXPEarned: true,
          },
        },
      },
    })

    // Check if user was referred and hasn't already received this reward
    if (!user?.referredBy || !user.referredByUser || user.profileCompleted) {
      return { success: false, pxpAwarded: 0 }
    }

    // Get reward amount from config
    const pxpAmount = await getPXPConfig('referral_profile_created')
    if (pxpAmount === 0) {
      return { success: false, pxpAwarded: 0 }
    }

    // Check referral cap
    const maxPerUser = await getPXPConfig('referral_max_per_user')
    if (user.referredByUser.referralPXPEarned >= maxPerUser) {
      console.log(
        `Referral cap reached for ${user.referredByUser.username} (${user.referredByUser.referralPXPEarned}/${maxPerUser} PXP)`
      )
      return { success: false, pxpAwarded: 0 }
    }

    // Send on-chain transfer to referrer
    const referrerAddress = user.referredByUser.walletAddress
    if (!referrerAddress) {
      console.warn(
        `[awardReferralProfileCompleted] Referrer ${user.referredByUser.username} has no wallet address, skipping`
      )
      return { success: false, pxpAwarded: 0 }
    }

    const transfer = await sendPXPReward(
      referrerAddress,
      pxpAmount,
      `Referral bonus: ${user.username} completed profile`
    )

    if (!transfer.success) {
      console.error(
        `[awardReferralProfileCompleted] On-chain transfer failed for referrer ${user.referredByUser.username}: ${transfer.error}`
      )
      return { success: false, pxpAwarded: 0 }
    }

    // Award PXP to referrer in DB (after on-chain confirmation)
    await db.user.update({
      where: { id: user.referredByUser.id },
      data: {
        totalPXPEarned: { increment: pxpAmount },
        referralPXPEarned: { increment: pxpAmount },
      },
    })

    console.log(
      `✓ Awarded ${pxpAmount} PXP to ${user.referredByUser.username} for referring ${user.username} (profile completed)`
    )

    return {
      success: true,
      pxpAwarded: pxpAmount,
      referrerUsername: user.referredByUser.username ?? undefined,
    }
  } catch (error) {
    console.error('Error awarding referral PXP for profile completion:', error)
    return { success: false, pxpAwarded: 0 }
  }
}

/**
 * Award referral PXP when referred user attends their first event
 */
export async function awardReferralFirstEvent(userId: number): Promise<{
  success: boolean
  pxpAwarded: number
  referrerUsername?: string
}> {
  try {
    const db = await getDb()
    // Get user with referrer info and check if this is their first event
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        referredBy: true,
        referredByUser: {
          select: {
            id: true,
            username: true,
            displayName: true,
            walletAddress: true,
            referralPXPEarned: true,
          },
        },
        rsvps: {
          select: { id: true },
          take: 1,
        },
      },
    })

    // Check if user was referred and if this is their first event
    if (!user?.referredBy || !user.referredByUser || user.rsvps.length > 1) {
      return { success: false, pxpAwarded: 0 }
    }

    // Get reward amount from config
    const pxpAmount = await getPXPConfig('referral_first_event')
    if (pxpAmount === 0) {
      return { success: false, pxpAwarded: 0 }
    }

    // Check referral cap
    const maxPerUser = await getPXPConfig('referral_max_per_user')
    if (user.referredByUser.referralPXPEarned >= maxPerUser) {
      console.log(
        `Referral cap reached for ${user.referredByUser.username} (${user.referredByUser.referralPXPEarned}/${maxPerUser} PXP)`
      )
      return { success: false, pxpAwarded: 0 }
    }

    // Send on-chain transfer to referrer
    const referrerAddress = user.referredByUser.walletAddress
    if (!referrerAddress) {
      console.warn(
        `[awardReferralFirstEvent] Referrer ${user.referredByUser.username} has no wallet address, skipping`
      )
      return { success: false, pxpAwarded: 0 }
    }

    const transfer = await sendPXPReward(
      referrerAddress,
      pxpAmount,
      `Referral bonus: ${user.username} attended first event`
    )

    if (!transfer.success) {
      console.error(
        `[awardReferralFirstEvent] On-chain transfer failed for referrer ${user.referredByUser.username}: ${transfer.error}`
      )
      return { success: false, pxpAwarded: 0 }
    }

    // Award PXP to referrer in DB (after on-chain confirmation)
    await db.user.update({
      where: { id: user.referredByUser.id },
      data: {
        totalPXPEarned: { increment: pxpAmount },
        referralPXPEarned: { increment: pxpAmount },
      },
    })

    console.log(
      `✓ Awarded ${pxpAmount} PXP to ${user.referredByUser.username} for referring ${user.username} (first event)`
    )

    return {
      success: true,
      pxpAwarded: pxpAmount,
      referrerUsername: user.referredByUser.username ?? undefined,
    }
  } catch (error) {
    console.error('Error awarding referral PXP for first event:', error)
    return { success: false, pxpAwarded: 0 }
  }
}

/**
 * Award PXP for completing profile
 */
export async function awardProfileCompletion(
  userId: number,
  walletAddress: string
): Promise<{
  success: boolean
  pxpAwarded: number
}> {
  try {
    const pxpAmount = await getPXPConfig('profile_complete')
    if (pxpAmount === 0) {
      return { success: false, pxpAwarded: 0 }
    }

    const transfer = await sendPXPReward(walletAddress, pxpAmount, 'Profile completion')
    if (!transfer.success) {
      console.error(`[awardProfileCompletion] On-chain transfer failed: ${transfer.error}`)
      return { success: false, pxpAwarded: 0 }
    }

    const result = await awardPXP(userId, pxpAmount, 'Profile completion')

    return {
      success: result.success,
      pxpAwarded: pxpAmount,
    }
  } catch (error) {
    console.error('Error awarding profile completion PXP:', error)
    return { success: false, pxpAwarded: 0 }
  }
}

/**
 * Award PXP for hosting an event
 */
export async function awardEventHost(
  userId: number,
  eventId: number,
  walletAddress: string
): Promise<{
  success: boolean
  pxpAwarded: number
}> {
  try {
    const pxpAmount = await getPXPConfig('event_host')
    if (pxpAmount === 0) {
      return { success: false, pxpAwarded: 0 }
    }

    const transfer = await sendPXPReward(walletAddress, pxpAmount, `Hosting event ${eventId}`)
    if (!transfer.success) {
      console.error(`[awardEventHost] On-chain transfer failed: ${transfer.error}`)
      return { success: false, pxpAwarded: 0 }
    }

    const result = await awardPXP(userId, pxpAmount, `Hosting event ${eventId}`)

    return {
      success: result.success,
      pxpAwarded: pxpAmount,
    }
  } catch (error) {
    console.error('Error awarding event host PXP:', error)
    return { success: false, pxpAwarded: 0 }
  }
}

/**
 * Award PXP for attending an event
 */
export async function awardEventAttendance(
  userId: number,
  eventId: number,
  walletAddress: string
): Promise<{
  success: boolean
  pxpAwarded: number
}> {
  try {
    const pxpAmount = await getPXPConfig('event_attend')
    if (pxpAmount === 0) {
      return { success: false, pxpAwarded: 0 }
    }

    const transfer = await sendPXPReward(walletAddress, pxpAmount, `Attending event ${eventId}`)
    if (!transfer.success) {
      console.error(`[awardEventAttendance] On-chain transfer failed: ${transfer.error}`)
      return { success: false, pxpAwarded: 0 }
    }

    const result = await awardPXP(userId, pxpAmount, `Attending event ${eventId}`)

    return {
      success: result.success,
      pxpAwarded: pxpAmount,
    }
  } catch (error) {
    console.error('Error awarding event attendance PXP:', error)
    return { success: false, pxpAwarded: 0 }
  }
}

/**
 * Award PXP bonus for completing a musician profile (instruments + experience level set).
 * Separate from the base profile completion reward — musicians earn both.
 */
export async function awardMusicianProfileCompletion(
  userId: number,
  walletAddress: string
): Promise<{
  success: boolean
  pxpAwarded: number
}> {
  try {
    const db = await getDb()

    // Check not already awarded
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { musicianProfileCompleted: true },
    })

    if (user?.musicianProfileCompleted) {
      return { success: false, pxpAwarded: 0 }
    }

    const pxpAmount = await getPXPConfig('musician_profile_complete')
    if (pxpAmount === 0) {
      return { success: false, pxpAwarded: 0 }
    }

    const transfer = await sendPXPReward(walletAddress, pxpAmount, 'Musician profile completion')
    if (!transfer.success) {
      console.error(`[awardMusicianProfileCompletion] On-chain transfer failed: ${transfer.error}`)
      return { success: false, pxpAwarded: 0 }
    }

    await db.user.update({
      where: { id: userId },
      data: {
        totalPXPEarned: { increment: pxpAmount },
        musicianProfileCompleted: true,
        musicianProfileCompletedAt: new Date(),
      },
    })

    console.log(`✓ Awarded ${pxpAmount} PXP to user ${userId} for: Musician profile completion`)

    return { success: true, pxpAwarded: pxpAmount }
  } catch (error) {
    console.error('Error awarding musician profile completion PXP:', error)
    return { success: false, pxpAwarded: 0 }
  }
}

/**
 * Award PXP for performing at an event.
 * Called by the performers endpoint after organizer marks an RSVP as a performer.
 */
export async function awardEventPerform(
  userId: number,
  eventId: number,
  walletAddress: string
): Promise<{
  success: boolean
  pxpAwarded: number
}> {
  try {
    const pxpAmount = await getPXPConfig('event_perform')
    if (pxpAmount === 0) {
      return { success: false, pxpAwarded: 0 }
    }

    const transfer = await sendPXPReward(walletAddress, pxpAmount, `Performing at event ${eventId}`)
    if (!transfer.success) {
      console.error(`[awardEventPerform] On-chain transfer failed: ${transfer.error}`)
      return { success: false, pxpAwarded: 0 }
    }

    const result = await awardPXP(userId, pxpAmount, `Performing at event ${eventId}`)

    return {
      success: result.success,
      pxpAwarded: pxpAmount,
    }
  } catch (error) {
    console.error('Error awarding event perform PXP:', error)
    return { success: false, pxpAwarded: 0 }
  }
}

/**
 * Award PXP for writing a venue review
 */
export async function awardVenueReview(
  userId: number,
  venueId: number,
  walletAddress: string
): Promise<{
  success: boolean
  pxpAwarded: number
}> {
  try {
    const pxpAmount = await getPXPConfig('venue_review')
    if (pxpAmount === 0) {
      return { success: false, pxpAwarded: 0 }
    }

    const transfer = await sendPXPReward(
      walletAddress,
      pxpAmount,
      `Venue review for venue ${venueId}`
    )
    if (!transfer.success) {
      console.error(`[awardVenueReview] On-chain transfer failed: ${transfer.error}`)
      return { success: false, pxpAwarded: 0 }
    }

    const result = await awardPXP(userId, pxpAmount, `Venue review for venue ${venueId}`)

    return {
      success: result.success,
      pxpAwarded: pxpAmount,
    }
  } catch (error) {
    console.error('Error awarding venue review PXP:', error)
    return { success: false, pxpAwarded: 0 }
  }
}
