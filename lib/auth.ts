/**
 * Authentication Library
 * Handles password hashing, JWT token generation, and user authentication
 */

import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { prisma } from './database-simplified'
import { UserRole } from '@prisma/client'

// JWT configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)
const JWT_EXPIRATION = '7d' // 7 days

export interface AuthUser {
  id: number
  username: string | null
  walletAddress: string | null
  role: UserRole
  email: string | null
  displayName: string | null
}

export interface SessionPayload {
  userId: number
  username: string | null
  walletAddress: string | null
  role: UserRole
  exp: number
  [key: string]: any // Add index signature for JWT compatibility
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate a JWT token for a user
 */
export async function generateToken(user: AuthUser): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    username: user.username,
    walletAddress: user.walletAddress,
    role: user.role,
  } as SessionPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(JWT_SECRET)

  return token
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    return verified.payload as SessionPayload
  } catch (error) {
    return null
  }
}

/**
 * Authenticate user with username and password
 */
export async function authenticateUser(
  username: string,
  password: string
): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        walletAddress: true,
        passwordHash: true,
        role: true,
        email: true,
        displayName: true,
        isActive: true,
      },
    })

    if (!user || !user.passwordHash || !user.isActive) {
      return null
    }

    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return null
    }

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    })

    return {
      id: user.id,
      username: user.username,
      walletAddress: user.walletAddress,
      role: user.role,
      email: user.email,
      displayName: user.displayName,
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        walletAddress: true,
        role: true,
        email: true,
        displayName: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) {
      return null
    }

    return {
      id: user.id,
      username: user.username,
      walletAddress: user.walletAddress,
      role: user.role,
      email: user.email,
      displayName: user.displayName,
    }
  } catch (error) {
    console.error('Get user error:', error)
    return null
  }
}

/**
 * Get user by wallet address (for Web3 authentication)
 */
export async function getUserByWallet(walletAddress: string): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
      select: {
        id: true,
        username: true,
        walletAddress: true,
        role: true,
        email: true,
        displayName: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) {
      return null
    }

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    })

    return {
      id: user.id,
      username: user.username,
      walletAddress: user.walletAddress,
      role: user.role,
      email: user.email,
      displayName: user.displayName,
    }
  } catch (error) {
    console.error('Get user by wallet error:', error)
    return null
  }
}

/**
 * Create or update user from wallet address (for anonymous scouts)
 */
export async function upsertWalletUser(walletAddress: string): Promise<AuthUser> {
  const normalizedAddress = walletAddress.toLowerCase()

  const user = await prisma.user.upsert({
    where: { walletAddress: normalizedAddress },
    update: { lastActive: new Date() },
    create: {
      walletAddress: normalizedAddress,
      role: UserRole.SCOUT,
      isActive: true,
    },
    select: {
      id: true,
      username: true,
      walletAddress: true,
      role: true,
      email: true,
      displayName: true,
    },
  })

  return {
    id: user.id,
    username: user.username,
    walletAddress: user.walletAddress,
    role: user.role,
    email: user.email,
    displayName: user.displayName,
  }
}

/**
 * Store session in database
 */
export async function createSession(userId: number, token: string, expiresAt: Date): Promise<void> {
  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })
}

/**
 * Delete session from database
 */
export async function deleteSession(token: string): Promise<void> {
  await prisma.session.delete({
    where: { token },
  })
}

/**
 * Check if session exists and is valid
 */
export async function isSessionValid(token: string): Promise<boolean> {
  const session = await prisma.session.findUnique({
    where: { token },
  })

  if (!session) {
    return false
  }

  if (session.expiresAt < new Date()) {
    // Clean up expired session
    await deleteSession(token)
    return false
  }

  return true
}

/**
 * Generate a cryptographically secure email verification token
 */
export function generateVerificationToken(): string {
  // Generate 32 random bytes and convert to hex string
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Create email verification token for user
 */
export async function createEmailVerificationToken(userId: number): Promise<string> {
  const token = generateVerificationToken()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour expiration

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationToken: token,
      emailVerificationExpiry: expiresAt,
    },
  })

  return token
}

/**
 * Verify email verification token and mark email as verified
 */
export async function verifyEmailToken(token: string): Promise<{
  success: boolean
  message: string
  user?: AuthUser
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
      select: {
        id: true,
        username: true,
        walletAddress: true,
        role: true,
        email: true,
        displayName: true,
        emailVerified: true,
        emailVerificationExpiry: true,
      },
    })

    if (!user) {
      return { success: false, message: 'Invalid verification token' }
    }

    if (user.emailVerified) {
      return { success: false, message: 'Email already verified' }
    }

    if (!user.emailVerificationExpiry || user.emailVerificationExpiry < new Date()) {
      return { success: false, message: 'Verification token has expired' }
    }

    // Mark email as verified and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    })

    return {
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user.id,
        username: user.username,
        walletAddress: user.walletAddress,
        role: user.role,
        email: user.email,
        displayName: user.displayName,
      },
    }
  } catch (error) {
    console.error('Email verification error:', error)
    return { success: false, message: 'An error occurred during verification' }
  }
}
