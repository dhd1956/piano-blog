'use client'

import { useState, useEffect } from 'react'
import { getEnvironmentConfig } from '@/lib/env-config'

export default function EnvironmentBadge() {
  const [config, setConfig] = useState<ReturnType<typeof getEnvironmentConfig> | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const detectedConfig = getEnvironmentConfig()
    setConfig(detectedConfig)

    // Debug logging
    if (typeof window !== 'undefined') {
      console.log('[EnvironmentBadge] Detected environment:', detectedConfig.environment)
      console.log('[EnvironmentBadge] Hostname:', window.location.hostname)
    }
  }, [])

  // Don't render until mounted (prevents hydration issues)
  if (!mounted || !config) {
    return null
  }

  // Hide in production
  if (config.isProduction) {
    return null
  }

  const bgColor = config.isDevelopment ? 'bg-green-500' : 'bg-yellow-500'
  const label = config.isDevelopment ? 'LOCAL' : 'STAGING'

  return (
    <div
      className={`fixed right-4 bottom-4 ${bgColor} z-50 rounded-full px-3 py-1 text-xs font-bold text-white shadow-lg`}
      role="status"
      aria-label={`Environment: ${label}`}
    >
      {label}
    </div>
  )
}
