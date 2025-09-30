/**
 * Blockchain Event Processing API - Simplified Architecture
 * Handles event processing and status monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSyncStatus, runEventProcessingJob, triggerManualSync } from '@/lib/blockchain-sync'

export async function GET(request: NextRequest) {
  try {
    const eventStatus = await getSyncStatus()

    return NextResponse.json({
      status: 'success',
      data: eventStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Event processing status API error:', error)

    return NextResponse.json(
      {
        error: 'Failed to get event processing status',
        message: error.message,
      },
      {
        status: 500,
      }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'trigger') {
      // Manual event processing trigger
      triggerManualSync()
        .then(() => console.log('Manual event processing completed'))
        .catch((error) => console.error('Manual event processing failed:', error))

      return NextResponse.json({
        message: 'Manual event processing triggered. Check status for progress.',
        action: 'triggered',
      })
    } else if (action === 'status') {
      // Get detailed status
      const eventStatus = await getSyncStatus()

      return NextResponse.json({
        status: 'success',
        data: eventStatus,
      })
    } else {
      return NextResponse.json(
        {
          error: 'Invalid action',
          supportedActions: ['trigger', 'status'],
        },
        {
          status: 400,
        }
      )
    }
  } catch (error: any) {
    console.error('Event processing API error:', error)

    return NextResponse.json(
      {
        error: 'Event processing operation failed',
        message: error.message,
      },
      {
        status: 500,
      }
    )
  }
}
