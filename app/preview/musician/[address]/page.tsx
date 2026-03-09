'use client'

/**
 * Public Musician Snapshot — no login required.
 * Linked from QR codes on musician profile cards.
 */

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface MusicianSnapshot {
  id: number
  displayName: string | null
  username: string | null
  bio: string | null
  avatar: string | null
  location: string | null
  title: string | null
  badges: string[]
  totalPXPEarned: number
  publicProfile: boolean
  profileSlug: string | null
  walletAddress: string | null
}

interface MusicianProfile {
  instruments: string[]
  musicalStyles: string[]
  experienceLevel: string | null
  availableForGigs: boolean
  availableForCollab: boolean
}

const BADGE_LABELS: Record<string, string> = {
  'first-venue': '🏛️ Venue Scout',
  'venue-scout': '🔍 Scout',
  curator: '✓ Curator',
  'pxp-earner': '⭐ PXP Earner',
  'community-contributor': '🤝 Contributor',
  'piano-enthusiast': '🎹 Enthusiast',
  reviewer: '📝 Reviewer',
}

export default function MusicianPreviewPage() {
  const params = useParams()
  const address = params.address as string
  const [profile, setProfile] = useState<MusicianSnapshot | null>(null)
  const [musicianProfile, setMusicianProfile] = useState<MusicianProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!address) return
    fetch(`/api/profile/${address}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true)
          setLoading(false)
          return null
        }
        return r.json()
      })
      .then((data) => {
        if (data) {
          setProfile(data.profile)
          setMusicianProfile(data.musicianProfile)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [address])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-6 dark:bg-gray-900">
        <p className="text-lg text-gray-600 dark:text-gray-400">Profile not found.</p>
        <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">
          Explore Global Piano Network →
        </Link>
      </div>
    )
  }

  if (!profile.publicProfile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-6 dark:bg-gray-900">
        <p className="text-2xl">🔒</p>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Private profile</p>
        <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">
          Explore Global Piano Network →
        </Link>
      </div>
    )
  }

  const displayName = profile.displayName || profile.username || 'Musician'
  const profileRef = profile.profileSlug || profile.walletAddress || address

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
        <div className="overflow-hidden rounded-2xl bg-white shadow-md dark:bg-gray-800">
          {/* Top stripe */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6">
            <div className="flex items-center gap-4">
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt={displayName}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-white"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl ring-2 ring-white">
                  🎹
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">{displayName}</h1>
                {profile.title && <p className="mt-0.5 text-indigo-100">{profile.title}</p>}
                {profile.location && (
                  <p className="mt-0.5 text-sm text-indigo-200">📍 {profile.location}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5 px-6 py-6">
            {/* Badges */}
            {profile.badges?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.badges.map((b) => (
                  <span
                    key={b}
                    className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  >
                    {BADGE_LABELS[b] || b}
                  </span>
                ))}
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  About
                </p>
                <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {profile.bio.length > 200 ? `${profile.bio.slice(0, 200)}…` : profile.bio}
                </p>
              </div>
            )}

            {/* Instruments */}
            {(musicianProfile?.instruments?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Instruments
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {musicianProfile?.instruments.map((i) => (
                    <span
                      key={i}
                      className="rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                    >
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Styles */}
            {(musicianProfile?.musicalStyles?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Styles
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {musicianProfile?.musicalStyles.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Availability */}
            {(musicianProfile?.availableForGigs || musicianProfile?.availableForCollab) && (
              <div className="rounded-lg bg-green-50 px-4 py-3 dark:bg-green-950">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {musicianProfile.availableForGigs && musicianProfile.availableForCollab
                    ? '✅ Available for gigs & collaborations'
                    : musicianProfile.availableForGigs
                      ? '✅ Available for gigs'
                      : '✅ Open to collaborations'}
                </p>
              </div>
            )}

            {/* PXP */}
            {profile.totalPXPEarned > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-700">
                <span className="text-lg">⭐</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>{profile.totalPXPEarned}</strong> PXP earned
                </p>
              </div>
            )}
          </div>

          {/* Footer CTAs */}
          <div className="border-t border-gray-100 px-6 py-4 dark:border-gray-700">
            <Link
              href={`/auth/login?redirect=/profile/${profileRef}`}
              className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white hover:bg-blue-700"
            >
              Sign in to view full profile
            </Link>
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
