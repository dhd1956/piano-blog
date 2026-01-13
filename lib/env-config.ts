/**
 * Environment detection and configuration
 * Detects environment based on hostname and VERCEL_ENV
 */

export type Environment = 'development' | 'staging' | 'production'

/**
 * Detect current environment based on hostname
 */
export function detectEnvironment(): Environment {
  // Server-side: Check VERCEL_ENV first (most reliable on Vercel)
  if (typeof window === 'undefined') {
    const vercelEnv = process.env.VERCEL_ENV
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

    // VERCEL_ENV can be: production, preview, development
    if (vercelEnv === 'production' && appUrl.includes('globalpiano.network')) {
      return 'production'
    }

    if (vercelEnv === 'production' && appUrl.includes('vercel.app')) {
      return 'staging'
    }

    // Default to development for localhost
    return 'development'
  }

  // Client-side: Check hostname
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
