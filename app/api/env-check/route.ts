import { NextRequest, NextResponse } from 'next/server'
import { getDatabaseIdentifier } from '@/lib/env-config'

/**
 * Diagnostic endpoint to check environment detection
 * Public endpoint - no auth required
 */
export async function GET(request: NextRequest) {
  // Detect environment from request hostname
  const hostname = request.headers.get('host') || ''

  let environment: 'development' | 'staging' | 'production' = 'production'
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    environment = 'development'
  } else if (hostname.includes('vercel.app') || hostname.includes('piano-blog')) {
    environment = 'staging'
  } else if (hostname.includes('globalpiano.network')) {
    environment = 'production'
  }

  const dbIdentifier = getDatabaseIdentifier()

  return NextResponse.json({
    environment,
    hostname,
    config: {
      environment,
      isDevelopment: environment === 'development',
      isStaging: environment === 'staging',
      isProduction: environment === 'production',
      appUrl: `https://${hostname}`,
    },
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
