/**
 * Database Access Helper - Hostname-based database selection
 *
 * USAGE:
 * ```typescript
 * import { getDb } from '@/lib/get-db'
 *
 * // In API routes or server components:
 * const db = await getDb()
 * const users = await db.user.findMany()
 * ```
 *
 * WHEN TO REMOVE (Vercel Pro upgrade):
 * 1. Set DATABASE_URL per domain in Vercel dashboard
 * 2. Simplify this function to: export async function getDb() { return prisma }
 * 3. Remove STAGING_DATABASE_URL and PRODUCTION_DATABASE_URL env vars
 */

import { headers } from 'next/headers'
import { getPrismaForHost, prisma, isMultiDatabaseEnabled } from './database-simplified'
import type { PrismaClient } from '@prisma/client'

/**
 * Get the appropriate database client for the current request
 *
 * This function reads the hostname from request headers and returns
 * the Prisma client configured for the correct database.
 *
 * Routing (when multi-database is enabled):
 * - localhost, *.vercel.app → Staging database
 * - globalpiano.network → Production database
 *
 * @returns PrismaClient for the appropriate database
 */
export async function getDb(): Promise<PrismaClient> {
  // If multi-database not configured, return default client
  if (!isMultiDatabaseEnabled()) {
    return prisma
  }

  try {
    const headersList = await headers()
    const hostname = headersList.get('host') || 'localhost'
    return getPrismaForHost(hostname)
  } catch (error) {
    // headers() can fail outside of request context (e.g., during build)
    // Fall back to default client
    console.warn('[getDb] Could not read headers, using default client:', error)
    return prisma
  }
}

/**
 * Get database client with explicit hostname
 * Use this when you already have the hostname (e.g., from middleware)
 *
 * @param hostname - The request hostname
 * @returns PrismaClient for the appropriate database
 */
export function getDbForHost(hostname: string): PrismaClient {
  if (!isMultiDatabaseEnabled()) {
    return prisma
  }
  return getPrismaForHost(hostname)
}
