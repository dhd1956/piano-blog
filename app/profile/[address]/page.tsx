'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { useWallets } from '@privy-io/react-auth'
import { useAuth } from '@/context/AuthContext'
import UserProfileQRCard from '@/components/qr/UserProfileQRCard'
import ProfileSetupBanner from '@/components/profile/ProfileSetupBanner'
import AccountMergeDialog from '@/components/profile/AccountMergeDialog'
import WelcomeRewardBanner from '@/components/rewards/WelcomeRewardBanner'
import YouTubeUploadForm from '@/components/content/YouTubeUploadForm'
import YouTubeVideoGallery from '@/components/content/YouTubeVideoGallery'
import YouTubeChannelVerification from '@/components/content/YouTubeChannelVerification'
import TipButton from '@/components/tips/TipButton'
import CollabRequestButton from '@/components/profile/CollabRequestButton'

interface UserProfile {
  id: number
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

interface MusicianProfile {
  instruments: string[]
  musicalStyles: string[]
  genres: string[]
  experienceLevel: string | null
  yearsPlaying: number | null
  availableForGigs: boolean
  availableForCollab: boolean
  availabilityNotes: string | null
  recordingLinks: string[]
  socialMedia: any
  repertoire: string[]
  influences: string[]
  collaborationTypes: string[]
}

const COLLAB_TYPE_LABELS: Record<string, string> = {
  LYRICS: 'Lyrics writing',
  MELODY: 'Melody composition',
  CHORDS: 'Chord progressions',
  ARRANGEMENTS: 'Arrangements',
  CHARTS_SCORES: 'Charts & scores',
  INSTRUMENT_PARTS: 'Instrument parts',
  VOCALS: 'Vocals',
  PRODUCTION: 'Production',
  MIXING: 'Mixing',
}

export default function ProfilePage() {
  const params = useParams()
  const address = params.address as string
  const { wallets } = useWallets()
  const connectedAddress = wallets[0]?.address
  const { user: currentUser, isAuthenticated } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [musicianProfile, setMusicianProfile] = useState<MusicianProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showYouTubeSection, setShowYouTubeSection] = useState(false)
  const [hasYouTubeContent, setHasYouTubeContent] = useState(false)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [venuesDiscovered, setVenuesDiscovered] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [showMergeDialog, setShowMergeDialog] = useState(false)
  const [existingAccount, setExistingAccount] = useState<any>(null)

  useEffect(() => {
    loadProfile()
  }, [address, connectedAddress, currentUser, isAuthenticated])

  const checkForPotentialMerge = async (email: string, walletAddress: string) => {
    try {
      const response = await fetch(
        `/api/profile/merge?email=${encodeURIComponent(email)}&walletAddress=${encodeURIComponent(walletAddress)}`
      )

      if (!response.ok) return

      const data = await response.json()

      if (data.hasPotentialMerge && data.existingAccount) {
        setExistingAccount(data.existingAccount)
        setShowMergeDialog(true)
      }
    } catch (error) {
      console.error('Error checking for potential merge:', error)
    }
  }

  const handleMergeComplete = () => {
    setShowMergeDialog(false)
    setExistingAccount(null)
    // Reload profile to show merged data
    loadProfile()
  }

  const handleMergeDecline = () => {
    setShowMergeDialog(false)
    setExistingAccount(null)
    // User declined merge, keep accounts separate
  }

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
      setMusicianProfile(data.musicianProfile || null)
      setVenuesDiscovered(data.venuesDiscovered || 0)
      setReviewCount(data.reviewCount || 0)

      // Check whether this profile has any YouTube videos
      if (data.profile?.id) {
        fetch(`/api/content/youtube/submit?userId=${data.profile.id}&limit=1`, {
          credentials: 'include',
        })
          .then((r) => r.json())
          .then((d) => setHasYouTubeContent((d.videos?.length ?? 0) > 0))
          .catch(() => {})
      }

      // Check if this is the user's own profile OR if user is blog owner (admin)
      // Support both session-based auth (username/email) and wallet-based auth
      if (isAuthenticated && currentUser) {
        const blogOwner = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS?.toLowerCase()

        // Check ownership via multiple methods:
        // 1. Session user ID matches profile user ID
        // 2. Session username matches profile username (case-insensitive)
        // 3. Session wallet matches profile wallet (case-insensitive)
        // 4. User is the blog owner (admin access)
        const isProfileOwner =
          currentUser.id === data.profile.id ||
          (currentUser.username &&
            data.profile.username &&
            currentUser.username.toLowerCase() === data.profile.username.toLowerCase()) ||
          (currentUser.walletAddress &&
            data.profile.walletAddress &&
            currentUser.walletAddress.toLowerCase() === data.profile.walletAddress.toLowerCase())

        const isBlogOwner =
          currentUser.walletAddress?.toLowerCase() === blogOwner ||
          connectedAddress?.toLowerCase() === blogOwner

        // Allow editing if it's own profile OR if user is blog owner
        setIsOwnProfile(isProfileOwner || isBlogOwner)

        // Check for potential account merge
        // Only check if viewing own profile and user has email
        if (isProfileOwner && data.profile.email && currentUser.walletAddress) {
          checkForPotentialMerge(data.profile.email, currentUser.walletAddress)
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
      {/* Welcome Reward Banner (only show on own profile) - shows even without wallet, prompts to link if needed */}
      {isOwnProfile && <WelcomeRewardBanner userAddress={profile.walletAddress || undefined} />}

      {/* Account Merge Dialog */}
      {showMergeDialog && existingAccount && connectedAddress && (
        <AccountMergeDialog
          existingAccount={existingAccount}
          newWalletAddress={connectedAddress}
          onMerge={handleMergeComplete}
          onDecline={handleMergeDecline}
        />
      )}

      {/* Profile Header */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center md:flex-row md:items-start md:space-x-6">
          {/* Avatar */}
          <div className="mb-4 md:mb-0">
            {profile.avatar ? (
              <Image
                src={profile.avatar}
                alt={
                  profile.displayName ||
                  profile.username ||
                  `User ${profile.walletAddress?.slice(2, 8)}`
                }
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
              {profile.displayName ||
                profile.username ||
                `User ${profile.walletAddress?.slice(2, 8)}`}
            </h1>

            {profile.title && <p className="mb-2 text-lg text-gray-600">{profile.title}</p>}

            {profile.location && (
              <p className="mb-3 text-sm text-gray-500">📍 {profile.location}</p>
            )}

            {profile.ensName && (
              <p className="mb-2 font-mono text-sm text-blue-600">{profile.ensName}</p>
            )}

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
              {profile.walletAddress && (
                <TipButton
                  recipientAddress={profile.walletAddress}
                  recipientName={profile.displayName || profile.username}
                />
              )}
              {profile.walletAddress && (
                <CollabRequestButton
                  recipientAddress={profile.walletAddress}
                  recipientId={profile.id}
                  recipientName={profile.displayName || profile.username}
                />
              )}
              {isOwnProfile && (
                <button
                  onClick={() => (window.location.href = `/profile/${address}/edit`)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  ⚙️ Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Setup Banner - Only show on own profile if incomplete */}
      {isOwnProfile && profile.walletAddress && (
        <ProfileSetupBanner
          walletAddress={profile.walletAddress}
          hasDisplayName={!!profile.displayName}
          hasUsername={!!profile.username}
          hasEmail={!!profile.email}
        />
      )}

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
          <div className="mb-2 text-4xl font-bold text-green-900">
            {venuesDiscovered.toLocaleString()}
          </div>
          <div className="text-sm text-green-700">Venues Discovered</div>
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

      {/* Musician Profile Section */}
      {musicianProfile && (
        <>
          {/* Instruments - WPB-109 */}
          {musicianProfile.instruments && musicianProfile.instruments.length > 0 && (
            <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">🎹 Instruments</h2>
              <div className="flex flex-wrap gap-2">
                {musicianProfile.instruments.map((instrument) => (
                  <span
                    key={instrument}
                    className="rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800"
                  >
                    {instrument}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Musical Styles & Genres - WPB-110 */}
          {((musicianProfile.musicalStyles && musicianProfile.musicalStyles.length > 0) ||
            (musicianProfile.genres && musicianProfile.genres.length > 0)) && (
            <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">🎵 Musical Style</h2>

              {musicianProfile.musicalStyles && musicianProfile.musicalStyles.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">Styles</h3>
                  <div className="flex flex-wrap gap-2">
                    {musicianProfile.musicalStyles.map((style) => (
                      <span
                        key={style}
                        className="rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-800"
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {musicianProfile.genres && musicianProfile.genres.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {musicianProfile.genres.map((genre) => (
                      <span
                        key={genre}
                        className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-800"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Experience Level - WPB-111 */}
          {(musicianProfile.experienceLevel || musicianProfile.yearsPlaying) && (
            <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">📊 Experience</h2>
              <div className="space-y-3">
                {musicianProfile.experienceLevel && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">Level:</span>
                    <span className="rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-800">
                      {musicianProfile.experienceLevel}
                    </span>
                  </div>
                )}
                {musicianProfile.yearsPlaying && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">Playing for:</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {musicianProfile.yearsPlaying} years
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Availability - WPB-112 */}
          {(musicianProfile.availableForGigs ||
            musicianProfile.availableForCollab ||
            musicianProfile.availabilityNotes) && (
            <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">📅 Availability</h2>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  {musicianProfile.availableForGigs && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
                      <span className="text-green-600">✓</span>
                      Available for Paid Gigs
                    </span>
                  )}
                  {musicianProfile.availableForCollab && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
                      <span className="text-blue-600">✓</span>
                      Available for Collaborations
                    </span>
                  )}
                </div>
                {musicianProfile.availabilityNotes && (
                  <div className="mt-3 rounded-md bg-gray-50 p-3">
                    <p className="text-sm text-gray-700">{musicianProfile.availabilityNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Performance Portfolio - WPB-113 */}
          {((musicianProfile.recordingLinks && musicianProfile.recordingLinks.length > 0) ||
            (musicianProfile.socialMedia &&
              Object.keys(musicianProfile.socialMedia).some(
                (key) => musicianProfile.socialMedia[key]
              ))) && (
            <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">🎥 Performance Portfolio</h2>

              {musicianProfile.recordingLinks && musicianProfile.recordingLinks.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">Recordings</h3>
                  <div className="space-y-2">
                    {musicianProfile.recordingLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {musicianProfile.socialMedia &&
                Object.keys(musicianProfile.socialMedia).some(
                  (key) => musicianProfile.socialMedia[key]
                ) && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">Social Media</h3>
                    <div className="flex flex-wrap gap-2">
                      {musicianProfile.socialMedia.youtube && (
                        <a
                          href={musicianProfile.socialMedia.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-200"
                        >
                          📺 YouTube
                        </a>
                      )}
                      {musicianProfile.socialMedia.instagram && (
                        <a
                          href={`https://instagram.com/${musicianProfile.socialMedia.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-pink-100 px-3 py-2 text-sm font-medium text-pink-800 hover:bg-pink-200"
                        >
                          📷 Instagram
                        </a>
                      )}
                      {musicianProfile.socialMedia.soundcloud && (
                        <a
                          href={musicianProfile.socialMedia.soundcloud}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-3 py-2 text-sm font-medium text-orange-800 hover:bg-orange-200"
                        >
                          🎧 SoundCloud
                        </a>
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Repertoire - WPB-114 */}
          {musicianProfile.repertoire && musicianProfile.repertoire.length > 0 && (
            <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">📝 Repertoire</h2>
              <div className="flex flex-wrap gap-2">
                {musicianProfile.repertoire.map((song) => (
                  <span
                    key={song}
                    className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800"
                  >
                    {song}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Influences */}
          {musicianProfile.influences && musicianProfile.influences.length > 0 && (
            <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">🎵 Influences</h2>
              <div className="flex flex-wrap gap-2">
                {musicianProfile.influences.map((artist) => (
                  <span
                    key={artist}
                    className="rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-800"
                  >
                    {artist}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Collaboration Types */}
          {musicianProfile.collaborationTypes && musicianProfile.collaborationTypes.length > 0 && (
            <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">🤝 Collaboration Offerings</h2>
              <div className="flex flex-wrap gap-2">
                {musicianProfile.collaborationTypes.map((type) => (
                  <span
                    key={type}
                    className="rounded-full bg-teal-100 px-4 py-2 text-sm font-medium text-teal-800"
                  >
                    {COLLAB_TYPE_LABELS[type] || type}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* YouTube Videos Section — only shown when there are videos, or own profile with content */}
      {hasYouTubeContent && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white shadow-sm">
          <button
            onClick={() => setShowYouTubeSection((v) => !v)}
            className="flex w-full items-center justify-between p-6 text-left"
            aria-expanded={showYouTubeSection}
          >
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                <span className="text-3xl">🎬</span>
                YouTube Videos
              </h2>
              <p className="mt-1 text-sm text-gray-600">Piano performances and PXP rewards</p>
            </div>
            <span className="ml-4 text-xl text-gray-400">{showYouTubeSection ? '▲' : '▼'}</span>
          </button>

          {showYouTubeSection && (
            <div className="border-t border-gray-200 p-6">
              {isOwnProfile && (
                <div className="mb-6">
                  <YouTubeChannelVerification />
                </div>
              )}
              {isOwnProfile && (
                <div className="mb-8">
                  <YouTubeUploadForm
                    onSuccess={(video) => {
                      console.log('Video submitted:', video)
                    }}
                    onError={(error) => {
                      console.error('Video submission error:', error)
                    }}
                  />
                </div>
              )}
              <YouTubeVideoGallery userId={profile.id} limit={20} />
            </div>
          )}
        </div>
      )}

      {/* Own profile with no videos yet — small discoverable prompt */}
      {!hasYouTubeContent && isOwnProfile && (
        <div className="mb-8 rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center">
          <p className="text-sm text-gray-500">
            🎬{' '}
            <button
              onClick={() => {
                setHasYouTubeContent(true)
                setShowYouTubeSection(true)
              }}
              className="text-blue-600 underline hover:text-blue-700"
            >
              Submit a YouTube performance video
            </button>{' '}
            to earn PXP rewards
          </p>
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
