import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'

/**
 * API Route: Record PXP tip to database
 * POST /api/tips
 *
 * Body: {
 *   fromAddress: string,
 *   toAddress: string,
 *   amount: number,
 *   transactionHash: string,
 *   message?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromAddress, toAddress, amount, transactionHash, message } = body

    // Validate required fields
    if (!fromAddress || !toAddress || !amount || !transactionHash) {
      return NextResponse.json(
        { error: 'Missing required fields: fromAddress, toAddress, amount, transactionHash' },
        { status: 400 }
      )
    }

    // Validate amount is positive
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
    }

    // Validate addresses are valid ethereum addresses
    const addressRegex = /^0x[a-fA-F0-9]{40}$/
    if (!addressRegex.test(fromAddress) || !addressRegex.test(toAddress)) {
      return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 })
    }

    const db = await getDb()

    // Check if transaction already recorded
    const existingPayment = await db.pXPPayment.findUnique({
      where: { transactionHash },
    })

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Transaction already recorded', payment: existingPayment },
        { status: 409 }
      )
    }

    // Record the tip payment
    const payment = await db.pXPPayment.create({
      data: {
        fromAddress: fromAddress.toLowerCase(),
        toAddress: toAddress.toLowerCase(),
        amount,
        transactionHash,
        blockTimestamp: new Date(),
        status: 'CONFIRMED',
        paymentType: 'tip',
        memo: message || null,
        paymentMethod: 'web3',
      },
    })

    // Update recipient's total PXP earned and create notification
    const recipient = await db.user.findUnique({
      where: { walletAddress: toAddress.toLowerCase() },
      select: { id: true },
    })

    if (recipient) {
      await db.user.update({
        where: { id: recipient.id },
        data: { totalPXPEarned: { increment: amount } },
      })

      const senderLabel = fromAddress
        ? `${fromAddress.slice(0, 6)}…${fromAddress.slice(-4)}`
        : 'Someone'

      await db.notification.create({
        data: {
          userId: recipient.id,
          type: 'REWARD_EARNED',
          title: 'You received a tip!',
          message: message
            ? `${senderLabel} sent you ${amount} PXP — "${message}"`
            : `${senderLabel} sent you ${amount} PXP`,
          pxpAmount: amount,
        },
      })
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        transactionHash: payment.transactionHash,
        createdAt: payment.createdAt,
      },
    })
  } catch (error: any) {
    console.error('Error recording tip:', error)
    return NextResponse.json({ error: error.message || 'Failed to record tip' }, { status: 500 })
  }
}
