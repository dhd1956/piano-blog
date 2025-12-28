/**
 * Verify User Email Script
 * Marks a user's email as verified
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyEmail() {
  try {
    const username = 'daved'

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: username }, { email: 'davedavies@ymail.com' }],
      },
    })

    if (!user) {
      console.error(`❌ User '${username}' not found`)
      process.exit(1)
    }

    console.log(`\nFound user:`)
    console.log(`  ID: ${user.id}`)
    console.log(`  Username: ${user.username}`)
    console.log(`  Email: ${user.email}`)
    console.log(`  Email Verified: ${user.emailVerified}`)

    if (user.emailVerified) {
      console.log(`\n✅ Email is already verified!`)
      process.exit(0)
    }

    // Verify email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        updatedAt: new Date(),
      },
    })

    console.log(`\n✅ Email verified successfully!`)
    console.log(`\nYou can now log in without email verification.`)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyEmail()
