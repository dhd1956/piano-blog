'use client'

/**
 * Public Venue Snapshot — no login required.
 * Linked from QR codes on venue cards/posters.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface VenueSnapshot {
  id: number
  name: string
  city: string
  fullAddress: string | null
  description: string | null
  venueType: string | null
  hasPiano: boolean
  pianoType: string | null
  hasJamSession: boolean
  verified: boolean
  slug: string | null
}

export default function VenuePreviewPage() {
  const params = useParams()
  const venueId = params.id as string
  const [venue, setVenue] = useState<VenueSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!venueId) return
    fetch(`/api/venues/${venueId}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true)
          setLoading(false)
          return null
        }
        return r.json()
      })
      .then((data) => {
        if (data) setVenue(data.venue)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [venueId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  if (notFound || !venue) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-6 dark:bg-gray-900">
        <p className="text-lg text-gray-600 dark:text-gray-400">Venue not found.</p>
        <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">
          Explore Global Piano Network →
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header CTA */}
      <div className="bg-blue-600 px-4 py-3 text-center text-sm text-white">
        Discover piano venues, events &amp; musicians —{' '}
        <Link href="/" className="font-semibold underline">
          Explore Global Piano Network
        </Link>
      </div>

      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Venue card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-md dark:bg-gray-800">
          {/* Top stripe */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white">{venue.name}</h1>
                <p className="mt-1 text-blue-100">{venue.city}</p>
              </div>
              <span className="mt-1 shrink-0 text-3xl">🎹</span>
            </div>
          </div>

          <div className="space-y-5 px-6 py-6">
            {venue.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                ✓ Verified venue
              </span>
            )}

            {venue.fullAddress && (
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Address
                </p>
                <p className="mt-1 text-gray-800 dark:text-gray-200">{venue.fullAddress}</p>
              </div>
            )}

            {venue.hasPiano && (
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Piano
                </p>
                <p className="mt-1 text-gray-800 dark:text-gray-200">
                  {venue.pianoType || 'Yes — piano available'}
                </p>
              </div>
            )}

            {venue.hasJamSession && (
              <div className="rounded-lg bg-purple-50 px-4 py-3 dark:bg-purple-950">
                <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  🎸 Regular jam sessions hosted here
                </p>
              </div>
            )}

            {venue.description && (
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  About
                </p>
                <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {venue.description}
                </p>
              </div>
            )}
          </div>

          {/* Footer CTAs */}
          <div className="border-t border-gray-100 px-6 py-4 dark:border-gray-700">
            <a
              href={`/auth/login?redirect=/venueDetails/${venue.id}`}
              className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white hover:bg-blue-700"
            >
              Sign in to see full details &amp; events
            </a>
            <Link
              href="/"
              className="mt-3 block text-center text-sm text-gray-500 hover:underline dark:text-gray-400"
            >
              New here? Explore Global Piano Network →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
