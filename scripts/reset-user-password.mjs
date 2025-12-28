/**
 * Reset User Password Script
 * Directly updates a user's password in the database
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetPassword() {
  try {
    const username = 'daved'
    const newPassword = process.argv[2]

    if (!newPassword) {
      console.error('❌ Error: Please provide a new password')
      console.log('Usage: node scripts/reset-user-password.mjs "your-new-password"')
      process.exit(1)
    }

    if (newPassword.length < 8) {
      console.error('❌ Error: Password must be at least 8 characters long')
      process.exit(1)
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: username }, { email: 'davedavies@ymail.com' }],
      },
    })

    if (!user) {
      console.error(`❌ Error: User '${username}' not found`)
      process.exit(1)
    }

    console.log(`\nFound user:`)
    console.log(`  ID: ${user.id}`)
    console.log(`  Username: ${user.username}`)
    console.log(`  Email: ${user.email}`)
    console.log(`  Display Name: ${user.displayName || 'N/A'}`)

    // Hash the new password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(newPassword, salt)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
        updatedAt: new Date(),
      },
    })

    // Invalidate all existing sessions for security
    const deletedSessions = await prisma.session.deleteMany({
      where: { userId: user.id },
    })

    console.log(`\n✅ Password reset successful!`)
    console.log(`  Sessions invalidated: ${deletedSessions.count}`)
    console.log(`\nYou can now log in with:`)
    console.log(`  Username: ${user.username}`)
    console.log(`  Password: [the password you just set]`)
  } catch (error) {
    console.error('❌ Error resetting password:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetPassword()
