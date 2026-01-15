import { NextResponse } from 'next/server'
import { detectEnvironment, getEnvironmentConfig, getDatabaseIdentifier } from '@/lib/env-config'

/**
 * Diagnostic endpoint to check environment detection
 * Public endpoint - no auth required
 */
export async function GET() {
  const env = detectEnvironment()
  const config = getEnvironmentConfig()
  const dbIdentifier = getDatabaseIdentifier()

  return NextResponse.json({
    environment: env,
    config,
    dbIdentifier,
    serverInfo: {
      VERCEL_ENV: process.env.VERCEL_ENV,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NODE_ENV: process.env.NODE_ENV,
    },
    envVarsConfigured: {
      hasReownProjectId: !!process.env.NEXT_PUBLIC_REOWN_PROJECT_ID,
      reownProjectIdValue: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID
        ? `${process.env.NEXT_PUBLIC_REOWN_PROJECT_ID.slice(0, 8)}...`
        : 'NOT SET',
      hasPaymasterUrl: !!process.env.NEXT_PUBLIC_PAYMASTER_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
    },
  })
}
