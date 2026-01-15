/**
 * Prisma Client Export
 * Central export point for Prisma client instance
 *
 * MIGRATION NOTE:
 * - Old pattern: import prisma from '@/lib/prisma' then prisma.user.findMany()
 * - New pattern: import { getDb } from '@/lib/prisma' then (await getDb()).user.findMany()
 *
 * The new pattern supports multi-database routing based on hostname.
 */

import { prisma } from '@/lib/database-simplified'
export { getDb, getDbForHost } from '@/lib/get-db'

export default prisma
