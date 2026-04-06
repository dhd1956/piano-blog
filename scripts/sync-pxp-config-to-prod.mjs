/**
 * Copies all PXPConfig rows from staging → production.
 * Safe to run multiple times — uses upsert (skips rows already matching).
 *
 * Usage:
 *   node scripts/sync-pxp-config-to-prod.mjs
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'

// Load .env.local manually (Next.js does this automatically, Node scripts don't)
const envPath = resolve(process.cwd(), '.env.local')
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '')
}

const staging = new PrismaClient({
  datasources: {
    db: {
      url: process.env.STAGING_DATABASE_URL,
    },
  },
})

const production = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PRODUCTION_DATABASE_URL,
    },
  },
})

async function main() {
  const rows = await staging.pXPConfig.findMany()
  console.log(`Found ${rows.length} PXPConfig rows on staging`)

  let upserted = 0
  for (const row of rows) {
    await production.pXPConfig.upsert({
      where: { key: row.key },
      create: {
        key: row.key,
        value: row.value,
        label: row.label,
        description: row.description,
        category: row.category,
        enabled: row.enabled,
        updatedBy: 'sync-script',
      },
      update: {
        value: row.value,
        label: row.label,
        description: row.description,
        category: row.category,
        enabled: row.enabled,
        updatedBy: 'sync-script',
      },
    })
    console.log(`  ✓ ${row.key}: ${row.value} PXP`)
    upserted++
  }

  console.log(`\n✅ Synced ${upserted} rows to production`)
}

main()
  .catch((e) => {
    console.error('❌ Sync failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await staging.$disconnect()
    await production.$disconnect()
  })
