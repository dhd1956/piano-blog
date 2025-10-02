/**
 * Simplified Blockchain Event Processing
 * Only processes events from the PXP Rewards contract for venue verification and payments
 */

import Web3 from 'web3'
import { BlockchainEventService, prisma } from './database-simplified'
import { PXP_REWARDS_ADDRESS, PXP_REWARDS_ABI, CELO_TESTNET_RPC } from '@/utils/rewards-contract'

export class BlockchainEventProcessor {
  private web3: Web3
  private contract: any
  private isProcessing = false

  constructor() {
    this.web3 = new Web3(CELO_TESTNET_RPC)
    this.contract = new this.web3.eth.Contract(PXP_REWARDS_ABI as any, PXP_REWARDS_ADDRESS)
  }

  /**
   * Process blockchain events - should be called periodically
   */
  async processEvents() {
    if (this.isProcessing) {
      console.log('⏳ Event processing already in progress, skipping...')
      return
    }

    this.isProcessing = true
    console.log('🔄 Processing blockchain events...')

    try {
      // Process pending blockchain events
      await BlockchainEventService.processPendingEvents()

      console.log('✅ Event processing completed successfully')
    } catch (error) {
      console.error('❌ Event processing failed:', error)
      throw error
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Listen for new blockchain events (real-time processing)
   */
  async listenForEvents() {
    console.log('👂 Starting to listen for PXP Rewards contract events...')

    try {
      // Listen for VenueVerified events
      this.contract.events
        .VenueVerified({
          fromBlock: 'latest',
        })
        .on('data', async (event: any) => {
          console.log('🏛️ VenueVerified event detected:', event.returnValues)
          await this.processVenueVerifiedEvent(event)
        })
        .on('error', console.error)

      // Listen for payment events
      this.contract.events
        .PaymentTracked({
          fromBlock: 'latest',
        })
        .on('data', async (event: any) => {
          console.log('💰 PaymentTracked event detected:', event.returnValues)
          await this.processPaymentEvent(event)
        })
        .on('error', console.error)

      // Listen for reward events
      this.contract.events
        .NewUserRewarded({
          fromBlock: 'latest',
        })
        .on('data', async (event: any) => {
          console.log('🎉 NewUserRewarded event detected:', event.returnValues)
          await this.processNewUserRewardEvent(event)
        })
        .on('error', console.error)

      console.log('✅ Event listeners started successfully')
    } catch (error) {
      console.error('❌ Failed to start event listeners:', error)
      throw error
    }
  }

  /**
   * Process VenueVerified event
   */
  private async processVenueVerifiedEvent(event: any) {
    const { venueHash, verifier, approved } = event.returnValues

    await BlockchainEventService.recordEvent({
      eventType: 'VenueVerified',
      contractAddress: CAV_REWARDS_ADDRESS,
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      blockTimestamp: new Date(), // Would be derived from block in production
      eventData: { venueHash, verifier, approved },
    })
  }

  /**
   * Process PaymentTracked event
   */
  private async processPaymentEvent(event: any) {
    const { from, to, amount, memo } = event.returnValues

    await BlockchainEventService.recordEvent({
      eventType: 'PaymentTracked',
      contractAddress: CAV_REWARDS_ADDRESS,
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      blockTimestamp: new Date(), // Would be derived from block in production
      eventData: { from, to, amount, memo },
    })
  }

  /**
   * Process NewUserRewarded event
   */
  private async processNewUserRewardEvent(event: any) {
    const { user, amount } = event.returnValues

    await BlockchainEventService.recordEvent({
      eventType: 'NewUserRewarded',
      contractAddress: CAV_REWARDS_ADDRESS,
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      blockTimestamp: new Date(), // Would be derived from block in production
      eventData: { user, amount },
    })
  }

  /**
   * Get event processing statistics
   */
  async getEventStats() {
    const events = await prisma.blockchainEvent.groupBy({
      by: ['eventType', 'processed'],
      _count: true,
    })

    const stats = {
      totalEvents: 0,
      processedEvents: 0,
      pendingEvents: 0,
      eventTypes: {} as Record<string, number>,
    }

    events.forEach(({ eventType, processed, _count }) => {
      stats.totalEvents += _count
      if (processed) {
        stats.processedEvents += _count
      } else {
        stats.pendingEvents += _count
      }
      stats.eventTypes[eventType] = (stats.eventTypes[eventType] || 0) + _count
    })

    return stats
  }
}

// Singleton instance
export const eventProcessor = new BlockchainEventProcessor()

/**
 * Background event processing job - should be called by a cron job or similar
 */
export async function runEventProcessingJob() {
  console.log('🔄 Starting scheduled blockchain event processing job...')

  try {
    await eventProcessor.processEvents()

    const stats = await eventProcessor.getEventStats()
    console.log('📊 Event processing statistics:', stats)
  } catch (error) {
    console.error('❌ Event processing job failed:', error)
  }
}

/**
 * Manual trigger for event processing - useful for admin interface
 */
export async function triggerManualSync() {
  return eventProcessor.processEvents()
}

/**
 * Get current event processing status for dashboard
 */
export async function getSyncStatus() {
  const stats = await eventProcessor.getEventStats()

  return {
    stats,
    isProcessing: eventProcessor['isProcessing'], // Access private property for status
  }
}

// Legacy exports for compatibility
export const syncService = eventProcessor
export const runSyncJob = runEventProcessingJob
