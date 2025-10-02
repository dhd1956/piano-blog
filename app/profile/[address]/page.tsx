'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import UserProfileQRCard from '@/components/qr/UserProfileQRCard'
import { PrismaClient } from '@prisma/client'

interface UserProfile {
  walletAddress: string
  username?: string
  displayName?: string
  email?: string
  bio?: string
  avatar?: string
  location?: string
  profileSlug?: string
  title?: string
  skills?: string[]
  socialLinks?: any
  ensName?: string
  totalPXPEarned: number
  badges?: string[]
  publicProfile: boolean
  showPXPBalance: boolean
  qrCardStyle?: any
  createdAt: Date
  lastActive: Date
}

export default function ProfilePage() {
  const params = useParams()
  const address = params.address as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [venuesDiscovered, setVenuesDiscovered] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)

  useEffect(() => {
    loadProfile()
  }, [address])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch profile from API
      const response = await fetch(`/api/profile/${address}`)

      if (!response.ok) {
        throw new Error('Profile not found')
      }

      const data = await response.json()
      setProfile(data.profile)
      setVenuesDiscovered(data.venuesDiscovered || 0)
      setReviewCount(data.reviewCount || 0)

      // Check if this is the user's own profile
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_accounts',
        })
        if (accounts.length > 0) {
          setIsOwnProfile(accounts[0].toLowerCase() === data.profile.walletAddress.toLowerCase())
        }
      }
    } catch (err: any) {
      console.error('Error loading profile:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-red-900">Profile Not Found</h2>
          <p className="mb-4 text-red-800">{error || 'The requested profile does not exist.'}</p>
          <a
            href="/venues"
            className="inline-block rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Browse Venues
          </a>
        </div>
      </div>
    )
  }

  // Check privacy settings
  if (!profile.publicProfile && !isOwnProfile) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-yellow-900">Private Profile</h2>
          <p className="text-yellow-800">
            This profile is set to private and cannot be viewed publicly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Profile Header */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center md:flex-row md:items-start md:space-x-6">
          {/* Avatar */}
          <div className="mb-4 md:mb-0">
            {profile.avatar ? (
              <Image
                src={profile.avatar}
                alt={profile.displayName || profile.username || 'User avatar'}
                width={128}
                height={128}
                className="h-32 w-32 rounded-full border-4 border-blue-600 object-cover"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-gray-300 bg-gray-100 text-4xl text-gray-600">
                👤
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              {profile.displayName || profile.username || 'Anonymous User'}
            </h1>

            {profile.title && <p className="mb-2 text-lg text-gray-600">{profile.title}</p>}

            {profile.location && (
              <p className="mb-3 text-sm text-gray-500">📍 {profile.location}</p>
            )}

            {profile.ensName && (
              <p className="mb-2 font-mono text-sm text-blue-600">{profile.ensName}</p>
            )}

            <p className="mb-4 font-mono text-xs text-gray-400">
              {profile.walletAddress.substring(0, 6)}...
              {profile.walletAddress.substring(profile.walletAddress.length - 4)}
            </p>

            {profile.bio && <p className="mb-4 text-gray-700">{profile.bio}</p>}

            {/* Social Links */}
            {profile.socialLinks && (
              <div className="mb-4 flex flex-wrap justify-center gap-2 md:justify-start">
                {profile.socialLinks.twitter && (
                  <a
                    href={`https://twitter.com/${profile.socialLinks.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-blue-400 px-3 py-1 text-sm text-white hover:bg-blue-500"
                  >
                    🐦 Twitter
                  </a>
                )}
                {profile.socialLinks.github && (
                  <a
                    href={`https://github.com/${profile.socialLinks.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-gray-800 px-3 py-1 text-sm text-white hover:bg-gray-900"
                  >
                    💻 GitHub
                  </a>
                )}
                {profile.socialLinks.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${profile.socialLinks.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-blue-700 px-3 py-1 text-sm text-white hover:bg-blue-800"
                  >
                    💼 LinkedIn
                  </a>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-2 md:justify-start">
              <button
                onClick={() => setShowQRModal(true)}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                📱 Show QR Code
              </button>
              {isOwnProfile && (
                <button
                  onClick={() => (window.location.href = '/profile/settings')}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  ⚙️ Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* PXP Earned */}
        {(profile.showPXPBalance || isOwnProfile) && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
            <div className="mb-2 text-4xl font-bold text-blue-900">
              {profile.totalPXPEarned.toLocaleString()}
            </div>
            <div className="text-sm text-blue-700">PXP Earned</div>
          </div>
        )}

        {/* Venues Discovered */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <div className="mb-2 text-4xl font-bold text-green-900">{venuesDiscovered}</div>
          <div className="text-sm text-green-700">Venues Discovered</div>
        </div>

        {/* Reviews */}
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-6 text-center">
          <div className="mb-2 text-4xl font-bold text-purple-900">{reviewCount}</div>
          <div className="text-sm text-purple-700">Reviews Written</div>
        </div>
      </div>

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Skills & Interests</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {profile.badges && profile.badges.length > 0 && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">🏆 Achievements</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {profile.badges.map((badgeId) => {
              const badgeMap: Record<string, { name: string; icon: string; description: string }> =
                {
                  'first-venue': {
                    name: 'First Discovery',
                    icon: '🎯',
                    description: 'Discovered first venue',
                  },
                  'venue-scout': {
                    name: 'Venue Scout',
                    icon: '🔍',
                    description: 'Submitted 5+ venues',
                  },
                  curator: {
                    name: 'Curator',
                    icon: '✅',
                    description: 'Authorized verifier',
                  },
                  'pxp-earner': {
                    name: 'PXP Earner',
                    icon: '💎',
                    description: 'Earned 100+ PXP',
                  },
                  'community-contributor': {
                    name: 'Community Contributor',
                    icon: '🌟',
                    description: 'Active member',
                  },
                  'piano-enthusiast': {
                    name: 'Piano Enthusiast',
                    icon: '🎹',
                    description: 'Visited 10+ venues',
                  },
                  reviewer: {
                    name: 'Reviewer',
                    icon: '📝',
                    description: 'Left 5+ reviews',
                  },
                }

              const badge = badgeMap[badgeId] || {
                name: badgeId,
                icon: '🏆',
                description: 'Special achievement',
              }

              return (
                <div
                  key={badgeId}
                  className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center"
                >
                  <div className="mb-2 text-4xl">{badge.icon}</div>
                  <div className="font-medium text-yellow-900">{badge.name}</div>
                  <div className="text-xs text-yellow-700">{badge.description}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="max-h-screen w-full max-w-3xl overflow-y-auto rounded-lg bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900">Profile QR Code</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <UserProfileQRCard
                userData={{
                  walletAddress: profile.walletAddress,
                  username: profile.username,
                  displayName: profile.displayName,
                  bio: profile.bio,
                  title: profile.title,
                  location: profile.location,
                  skills: profile.skills,
                  socialLinks: profile.socialLinks,
                  badges: profile.badges,
                  totalPXPEarned: profile.totalPXPEarned,
                  venuesDiscovered: venuesDiscovered,
                  reviewCount: reviewCount,
                  profileSlug: profile.profileSlug,
                }}
                config={profile.qrCardStyle}
              />
            </div>

            <div className="border-t border-gray-200 p-4">
              <button
                onClick={() => setShowQRModal(false)}
                className="w-full rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
