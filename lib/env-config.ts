/**
 * Environment detection and configuration
 * Detects environment based on hostname and VERCEL_ENV
 */

export type Environment = 'development' | 'staging' | 'production'

/**
 * Detect current environment based on hostname
 * Works on both client and server (using headers on server)
 */
export function detectEnvironment(): Environment {
  // Client-side: Check hostname from window
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname

    if (hostname === 'globalpiano.network' || hostname === 'www.globalpiano.network') {
      return 'production'
    }

    if (hostname.includes('vercel.app') || hostname.includes('piano-blog')) {
      return 'staging'
    }

    // localhost, 127.0.0.1, or any other
    return 'development'
  }

  // Server-side: Infer from VERCEL_ENV and common patterns
  const vercelEnv = process.env.VERCEL_ENV

  // Development environment (local)
  if (!vercelEnv || vercelEnv === 'development') {
    return 'development'
  }

  // Preview deployments (PR previews) - treat as staging
  if (vercelEnv === 'preview') {
    return 'staging'
  }

  // Production environment - default to production
  // Note: Both piano-blog.vercel.app and globalpiano.network run in production env
  // Client-side detection will properly distinguish them
  // For server-side API routes, check request headers to determine the actual domain
  return 'production'
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  const env = detectEnvironment()

  return {
    environment: env,
    isDevelopment: env === 'development',
    isStaging: env === 'staging',
    isProduction: env === 'production',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  }
}

/**
 * Get database identifier for logging/debugging
 * (Never log actual connection strings!)
 */
export function getDatabaseIdentifier(): string {
  const env = detectEnvironment()

  switch (env) {
    case 'production':
      return 'production-db'
    case 'staging':
      return 'dev-staging-shared-db'
    case 'development':
      return 'dev-staging-shared-db'
    default:
      return 'unknown-db'
  }
}
