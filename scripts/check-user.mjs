/**
 * Check User Account Script
 * Displays user information and verifies password
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function checkUser() {
  try {
    const username = 'daved'
    const testPassword = process.argv[2]

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

    console.log(`\n✅ User found:`)
    console.log(`  ID: ${user.id}`)
    console.log(`  Username: ${user.username}`)
    console.log(`  Email: ${user.email}`)
    console.log(`  Display Name: ${user.displayName || 'N/A'}`)
    console.log(`  Has Password Hash: ${user.passwordHash ? 'Yes' : 'No'}`)
    console.log(`  Is Active: ${user.isActive}`)
    console.log(`  Email Verified: ${user.emailVerified}`)
    console.log(`  Role: ${user.role}`)
    console.log(`  Created: ${user.createdAt}`)
    console.log(`  Updated: ${user.updatedAt}`)

    if (testPassword && user.passwordHash) {
      console.log(`\n🔐 Testing password...`)
      const isValid = await bcrypt.compare(testPassword, user.passwordHash)
      console.log(`  Password "${testPassword}": ${isValid ? '✅ VALID' : '❌ INVALID'}`)

      if (!isValid) {
        console.log(`\n  Hash in database: ${user.passwordHash.substring(0, 30)}...`)
      }
    } else if (testPassword && !user.passwordHash) {
      console.log(`\n⚠️  User has no password hash set!`)
    }

    // Check sessions
    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      select: { id: true, expiresAt: true, createdAt: true },
    })
    console.log(`\n📊 Active sessions: ${sessions.length}`)
    if (sessions.length > 0) {
      sessions.forEach((session, i) => {
        console.log(`  ${i + 1}. Created: ${session.createdAt}, Expires: ${session.expiresAt}`)
      })
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
