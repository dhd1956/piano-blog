'use client'

import { useState, useEffect } from 'react'
import { getEnvironmentConfig } from '@/lib/env-config'

export default function EnvironmentBadge() {
  const [config, setConfig] = useState<ReturnType<typeof getEnvironmentConfig> | null>(null)

  useEffect(() => {
    setConfig(getEnvironmentConfig())
  }, [])

  if (!config || config.isProduction) {
    return null // Hide in production
  }

  const bgColor = config.isDevelopment ? 'bg-green-500' : 'bg-yellow-500'
  const label = config.isDevelopment ? 'LOCAL' : 'STAGING'

  return (
    <div
      className={`fixed right-4 bottom-4 ${bgColor} z-50 rounded-full px-3 py-1 text-xs font-bold text-white shadow-lg`}
    >
      {label}
    </div>
  )
}
