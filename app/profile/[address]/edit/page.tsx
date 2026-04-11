'use client'

/**
 * Profile Edit Page
 * WPB-109 through WPB-114: Musician Profile Epic
 * Allows users to edit their profile including musician-specific fields
 */

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

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
}

export default function ProfileEditPage() {
  const params = useParams()
  const router = useRouter()
  const address = params.address as string
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isBlogOwner, setIsBlogOwner] = useState(false)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [alreadyEarnedPXP, setAlreadyEarnedPXP] = useState(false)

  // Auto-scroll to top when error or success message appears
  useEffect(() => {
    if (error || success) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [error, success])

  // User profile fields
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [title, setTitle] = useState('')

  // Musician profile fields (WPB-109 through WPB-114)
  const [instruments, setInstruments] = useState<string[]>([])
  const [otherInstrument, setOtherInstrument] = useState('')

  const [musicalStyles, setMusicalStyles] = useState<string[]>([])
  const [newStyle, setNewStyle] = useState('')

  const [genres, setGenres] = useState<string[]>([])
  const [newGenre, setNewGenre] = useState('')

  const [experienceLevel, setExperienceLevel] = useState<string>('')
  const [yearsPlaying, setYearsPlaying] = useState<number | ''>('')

  const [availableForGigs, setAvailableForGigs] = useState(false)
  const [availableForCollab, setAvailableForCollab] = useState(false)
  const [availabilityNotes, setAvailabilityNotes] = useState('')

  const [recordingLinks, setRecordingLinks] = useState<string[]>([])
  const [newRecordingLink, setNewRecordingLink] = useState('')

  const [youtubeHandle, setYoutubeHandle] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [soundcloudHandle, setSoundcloudHandle] = useState('')

  const [repertoire, setRepertoire] = useState<string[]>([])
  const [newRepertoireItem, setNewRepertoireItem] = useState('')

  const [influences, setInfluences] = useState<string[]>([])
  const [newInfluence, setNewInfluence] = useState('')

  const [hasDraft, setHasDraft] = useState(false)
  const draftKey = `profile_draft_${address}`

  // Auto-save draft to localStorage whenever fields change
  useEffect(() => {
    if (loading) return
    const draft = {
      displayName,
      email,
      bio,
      location,
      title,
      instruments,
      musicalStyles,
      genres,
      experienceLevel,
      yearsPlaying,
      availableForGigs,
      availableForCollab,
      availabilityNotes,
      recordingLinks,
      repertoire,
      influences,
      youtubeHandle,
      instagramHandle,
      soundcloudHandle,
    }
    localStorage.setItem(draftKey, JSON.stringify(draft))
  }, [
    displayName,
    email,
    bio,
    location,
    title,
    instruments,
    musicalStyles,
    genres,
    experienceLevel,
    yearsPlaying,
    availableForGigs,
    availableForCollab,
    availabilityNotes,
    recordingLinks,
    repertoire,
    influences,
    youtubeHandle,
    instagramHandle,
    soundcloudHandle,
    loading,
    draftKey,
  ])

  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem(draftKey)
      if (!raw) return
      const d = JSON.parse(raw)
      if (d.displayName !== undefined) setDisplayName(d.displayName)
      if (d.email !== undefined) setEmail(d.email)
      if (d.bio !== undefined) setBio(d.bio)
      if (d.location !== undefined) setLocation(d.location)
      if (d.title !== undefined) setTitle(d.title)
      if (d.instruments) setInstruments(d.instruments)
      if (d.musicalStyles) setMusicalStyles(d.musicalStyles)
      if (d.genres) setGenres(d.genres)
      if (d.experienceLevel !== undefined) setExperienceLevel(d.experienceLevel)
      if (d.yearsPlaying !== undefined) setYearsPlaying(d.yearsPlaying)
      if (d.availableForGigs !== undefined) setAvailableForGigs(d.availableForGigs)
      if (d.availableForCollab !== undefined) setAvailableForCollab(d.availableForCollab)
      if (d.availabilityNotes !== undefined) setAvailabilityNotes(d.availabilityNotes)
      if (d.recordingLinks) setRecordingLinks(d.recordingLinks)
      if (d.repertoire) setRepertoire(d.repertoire)
      if (d.influences) setInfluences(d.influences)
      if (d.youtubeHandle !== undefined) setYoutubeHandle(d.youtubeHandle)
      if (d.instagramHandle !== undefined) setInstagramHandle(d.instagramHandle)
      if (d.soundcloudHandle !== undefined) setSoundcloudHandle(d.soundcloudHandle)
      setHasDraft(false)
    } catch {
      // ignore parse errors
    }
  }

  const discardDraft = () => {
    localStorage.removeItem(draftKey)
    setHasDraft(false)
  }

  useEffect(() => {
    if (authLoading) return
    loadProfile()
    // Check for a saved draft before loading
    if (localStorage.getItem(draftKey)) setHasDraft(true)
  }, [address, currentUser, authLoading])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/profile/${address}`)

      if (!response.ok) {
        throw new Error('Profile not found')
      }

      const data = await response.json()

      // Load user profile fields
      setDisplayName(data.profile.displayName || '')
      setEmail(data.profile.email || '')
      setBio(data.profile.bio || '')
      setLocation(data.profile.location || '')
      setTitle(data.profile.title || '')
      setAlreadyEarnedPXP(data.profile.profileCompleted || false)

      // Load musician profile fields if they exist
      if (data.musicianProfile) {
        setInstruments(data.musicianProfile.instruments || [])
        setMusicalStyles(data.musicianProfile.musicalStyles || [])
        setGenres(data.musicianProfile.genres || [])
        setExperienceLevel(data.musicianProfile.experienceLevel || '')
        setYearsPlaying(data.musicianProfile.yearsPlaying || '')
        setAvailableForGigs(data.musicianProfile.availableForGigs || false)
        setAvailableForCollab(data.musicianProfile.availableForCollab || false)
        setAvailabilityNotes(data.musicianProfile.availabilityNotes || '')
        setRecordingLinks(data.musicianProfile.recordingLinks || [])
        setRepertoire(data.musicianProfile.repertoire || [])
        setInfluences(data.musicianProfile.influences || [])

        // Load social media handles
        if (data.musicianProfile.socialMedia) {
          setYoutubeHandle(data.musicianProfile.socialMedia.youtube || '')
          setInstagramHandle(data.musicianProfile.socialMedia.instagram || '')
          setSoundcloudHandle(data.musicianProfile.socialMedia.soundcloud || '')
        }
      }

      // Check if user is blog owner or profile owner using session auth
      if (currentUser) {
        const blogOwner = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS?.toLowerCase()

        // Check if user is blog owner (via wallet address or role)
        const isBlogOwnerCheck =
          currentUser.walletAddress?.toLowerCase() === blogOwner ||
          currentUser.role === 'BLOG_OWNER'

        // Check if user is profile owner (via ID, username, or wallet)
        const isOwnProfileCheck =
          currentUser.id === data.profile.id ||
          (currentUser.username &&
            data.profile.username &&
            currentUser.username.toLowerCase() === data.profile.username.toLowerCase()) ||
          (currentUser.walletAddress &&
            data.profile.walletAddress &&
            currentUser.walletAddress.toLowerCase() === data.profile.walletAddress.toLowerCase())

        setIsBlogOwner(isBlogOwnerCheck)
        setIsOwnProfile(isOwnProfileCheck)
      }
    } catch (err: any) {
      console.error('Error loading profile:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      // Check authentication and get requester identifier
      if (!isAuthenticated || !currentUser) {
        setError('You must be logged in to edit your profile')
        setSaving(false)
        return
      }

      // Use wallet address if available, otherwise use username or user ID
      const requesterAddress =
        currentUser.walletAddress || currentUser.username || String(currentUser.id)

      // Determine if profile is complete (for PXP rewards)
      // Base requirements for all users:
      // - Display name, Bio (20+ chars), Location, Title
      // Musicians additionally need at least one instrument
      const hasBaseProfile =
        displayName.trim().length > 0 &&
        bio.trim().length >= 20 &&
        location.trim().length > 0 &&
        title.trim().length > 0
      const isMusician = instruments.length > 0
      const isProfileComplete = isMusician
        ? hasBaseProfile && instruments.length > 0
        : hasBaseProfile

      const response = await fetch(`/api/profile/${address}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterAddress,
          // User profile fields
          displayName,
          email,
          bio,
          location,
          title,
          profileCompleted: isProfileComplete, // Trigger PXP rewards if newly complete
          // Musician profile fields
          musicianProfile: {
            instruments,
            musicalStyles,
            genres,
            experienceLevel: experienceLevel || null,
            yearsPlaying: yearsPlaying || null,
            availableForGigs,
            availableForCollab,
            availabilityNotes,
            recordingLinks,
            socialMedia: {
              youtube: youtubeHandle,
              instagram: instagramHandle,
              soundcloud: soundcloudHandle,
            },
            repertoire,
            influences,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()

        // Handle email conflict (status 409)
        if (response.status === 409 && errorData.suggestMerge) {
          throw new Error(
            `${errorData.error}. This email belongs to wallet ${errorData.existingAccount.walletAddress.slice(0, 6)}...${errorData.existingAccount.walletAddress.slice(-4)}. If you own both accounts, visit your profile to merge them.`
          )
        }

        throw new Error(errorData.error || 'Failed to save profile')
      }

      setSuccess(true)
      if (isProfileComplete) setAlreadyEarnedPXP(true)
      localStorage.removeItem(draftKey)

      // Redirect back to profile after 1 second
      setTimeout(() => {
        router.push(`/profile/${address}`)
      }, 1000)
    } catch (err: any) {
      console.error('Error saving profile:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this profile? This action cannot be undone and will delete:\n\n• User profile\n• Musician profile\n• All reviews\n• All sessions\n\nType "DELETE" to confirm.'
      )
    ) {
      return
    }

    const confirmText = prompt('Please type DELETE to confirm:')
    if (confirmText !== 'DELETE') {
      alert('Delete cancelled. You must type DELETE exactly.')
      return
    }

    try {
      setDeleting(true)
      setError(null)

      // Check authentication and get requester identifier
      if (!isAuthenticated || !currentUser) {
        setError('You must be logged in to delete a profile')
        setDeleting(false)
        return
      }

      // Use wallet address if available, otherwise use username or user ID
      const requesterAddress =
        currentUser.walletAddress || currentUser.username || String(currentUser.id)

      const response = await fetch(`/api/profile/${address}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterAddress }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete profile')
      }

      alert('Profile deleted successfully')
      router.push('/musicians')
    } catch (err: any) {
      console.error('Error deleting profile:', err)
      setError(err.message)
      alert(`Failed to delete profile: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  const PRESET_INSTRUMENTS = [
    'Piano (acoustic)',
    'Digital Piano / Keyboard',
    'Organ / Hammond',
    'Synthesizer',
    'Guitar (acoustic)',
    'Guitar (electric)',
    'Bass Guitar',
    'Violin',
    'Viola',
    'Cello',
    'Double Bass',
    'Ukulele',
    'Harp',
    'Flute',
    'Clarinet',
    'Saxophone',
    'Trumpet',
    'Trombone',
    'Drums / Percussion',
    'Vocals',
  ]

  const toggleInstrument = (instrument: string) => {
    setInstruments((prev) =>
      prev.includes(instrument) ? prev.filter((i) => i !== instrument) : [...prev, instrument]
    )
  }

  const addOtherInstrument = () => {
    const trimmed = otherInstrument.trim()
    if (trimmed && !instruments.includes(trimmed)) {
      setInstruments((prev) => [...prev, trimmed])
      setOtherInstrument('')
    }
  }

  // Helper functions for array fields

  const addStyle = () => {
    if (newStyle && !musicalStyles.includes(newStyle)) {
      setMusicalStyles([...musicalStyles, newStyle])
      setNewStyle('')
    }
  }

  const removeStyle = (style: string) => {
    setMusicalStyles(musicalStyles.filter((s) => s !== style))
  }

  const addGenre = () => {
    if (newGenre && !genres.includes(newGenre)) {
      setGenres([...genres, newGenre])
      setNewGenre('')
    }
  }

  const removeGenre = (genre: string) => {
    setGenres(genres.filter((g) => g !== genre))
  }

  const addRecordingLink = () => {
    if (newRecordingLink && !recordingLinks.includes(newRecordingLink)) {
      setRecordingLinks([...recordingLinks, newRecordingLink])
      setNewRecordingLink('')
    }
  }

  const removeRecordingLink = (link: string) => {
    setRecordingLinks(recordingLinks.filter((l) => l !== link))
  }

  const addRepertoireItem = () => {
    if (newRepertoireItem && !repertoire.includes(newRepertoireItem)) {
      setRepertoire([...repertoire, newRepertoireItem])
      setNewRepertoireItem('')
    }
  }

  const removeRepertoireItem = (item: string) => {
    setRepertoire(repertoire.filter((r) => r !== item))
  }

  const addInfluence = () => {
    const trimmed = newInfluence.trim()
    if (trimmed && !influences.includes(trimmed)) {
      setInfluences([...influences, trimmed])
      setNewInfluence('')
    }
  }

  const removeInfluence = (item: string) => {
    setInfluences(influences.filter((i) => i !== item))
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

  // Calculate profile completion percentage
  // Musicians need instruments; observers/non-musicians don't
  const baseChecks = [
    { name: 'Display Name', complete: displayName.trim().length > 0 },
    { name: 'Bio (20+ characters)', complete: bio.trim().length >= 20 },
    { name: 'Location', complete: location.trim().length > 0 },
    { name: 'Title/Role', complete: title.trim().length > 0 },
  ]
  const completionChecks =
    instruments.length > 0
      ? [...baseChecks, { name: 'At least one instrument', complete: instruments.length > 0 }]
      : baseChecks
  const completedCount = completionChecks.filter((check) => check.complete).length
  const completionPercentage = Math.round((completedCount / completionChecks.length) * 100)
  const isProfileComplete = completionPercentage === 100

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
        <p className="text-gray-600">Update your profile and musician information</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          Profile saved successfully! Redirecting...
        </div>
      )}

      {/* Draft restore banner */}
      {hasDraft && !success && (
        <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/20">
          <p className="mb-2 font-medium text-yellow-900 dark:text-yellow-200">
            📝 You have unsaved changes from a previous session.
          </p>
          <div className="flex gap-3">
            <button
              onClick={restoreDraft}
              className="rounded-lg bg-yellow-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-yellow-700"
            >
              Restore my draft
            </button>
            <button
              onClick={discardDraft}
              className="text-sm text-yellow-700 hover:underline dark:text-yellow-400"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Profile Completion Indicator */}
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-700 dark:bg-blue-900/20">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300">
            Profile Completion {completionPercentage}%
          </h3>
          {isProfileComplete && (
            <span className="rounded-full bg-green-600 px-3 py-1 text-sm font-semibold text-white">
              {alreadyEarnedPXP ? 'Profile complete ✓' : 'Complete! Earn 30 PXP on save'}
            </span>
          )}
        </div>

        <div className="mb-3 h-2 w-full rounded-full bg-blue-200 dark:bg-blue-800">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all dark:bg-blue-400"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        <div className="text-sm text-blue-800 dark:text-blue-400">
          <p className="mb-2 font-medium">To earn referral PXP rewards, complete:</p>
          <ul className="space-y-1">
            {completionChecks.map((check) => (
              <li key={check.name} className="flex items-center gap-2">
                <span className={check.complete ? 'text-green-600' : 'text-gray-400'}>
                  {check.complete ? '✓' : '○'}
                </span>
                {check.name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-8">
        {/* Basic Profile Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="Your display name"
              />
              <p className="mt-1 text-xs text-gray-500">
                This is how your name will appear on your profile and posts
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="your.email@example.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                Your email is private and used to recognize you across login methods
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Title/Role</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="e.g., Professional Jazz Pianist"
              />
              <p className="mt-1 text-xs text-gray-500">{title.length}/100 characters</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={500}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="Tell us about yourself..."
              />
              <p className="mt-1 text-xs text-gray-500">
                {bio.length}/500 characters
                {bio.length < 20 && (
                  <span className="ml-2 text-orange-500">(minimum 20 required)</span>
                )}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="City, Country"
              />
            </div>
          </div>
        </div>

        {/* WPB-109: Instruments */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Instruments</h2>
          <p className="mb-4 text-sm text-gray-600">Select all instruments you play.</p>

          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PRESET_INSTRUMENTS.map((instrument) => (
              <label
                key={instrument}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={instruments.includes(instrument)}
                  onChange={() => toggleInstrument(instrument)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">{instrument}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={otherInstrument}
              onChange={(e) => setOtherInstrument(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addOtherInstrument()}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Other instrument…"
            />
            <button
              onClick={addOtherInstrument}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Add
            </button>
          </div>

          {instruments.filter((i) => !PRESET_INSTRUMENTS.includes(i)).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {instruments
                .filter((i) => !PRESET_INSTRUMENTS.includes(i))
                .map((instrument) => (
                  <span
                    key={instrument}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                  >
                    {instrument}
                    <button
                      onClick={() => setInstruments((prev) => prev.filter((i) => i !== instrument))}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* WPB-110: Musical Styles & Genres */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Musical Styles & Genres</h2>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">Styles</label>
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={newStyle}
                onChange={(e) => setNewStyle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addStyle()}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="Add a style (e.g., Jazz, Classical)"
              />
              <button
                onClick={addStyle}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {musicalStyles.map((style) => (
                <span
                  key={style}
                  className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800"
                >
                  {style}
                  <button
                    onClick={() => removeStyle(style)}
                    className="text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Genres</label>
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addGenre()}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="Add a genre (e.g., Bebop, Hard Bop)"
              />
              <button
                onClick={addGenre}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <span
                  key={genre}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-800"
                >
                  {genre}
                  <button
                    onClick={() => removeGenre(genre)}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* WPB-111: Experience Level */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Experience</h2>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">Experience Level</label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select level...</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Professional">Professional</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Years Playing</label>
            <input
              type="number"
              value={yearsPlaying}
              onChange={(e) => setYearsPlaying(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="How many years have you been playing?"
              min="0"
            />
          </div>
        </div>

        {/* WPB-112: Availability */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Availability</h2>

          <div className="mb-4 space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={availableForGigs}
                onChange={(e) => setAvailableForGigs(e.target.checked)}
                className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-gray-700">Available for Paid Gigs</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={availableForCollab}
                onChange={(e) => setAvailableForCollab(e.target.checked)}
                className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-gray-700">Available for collaborations</span>
            </label>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Availability Notes (optional)
            </label>
            <textarea
              value={availabilityNotes}
              onChange={(e) => setAvailabilityNotes(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="e.g., Available weekends, prefer evening gigs..."
            />
            <p className="mt-1 text-xs text-gray-500">{availabilityNotes.length}/500 characters</p>
          </div>
        </div>

        {/* WPB-113: Performance Portfolio */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Performance Portfolio</h2>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">Recording Links</label>
            <div className="mb-4 flex gap-2">
              <input
                type="url"
                value={newRecordingLink}
                onChange={(e) => setNewRecordingLink(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addRecordingLink()}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="Add a recording link (YouTube, SoundCloud, etc.)"
              />
              <button
                onClick={addRecordingLink}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {recordingLinks.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-md border border-gray-200 p-2"
                >
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 truncate text-sm text-blue-600 hover:underline"
                  >
                    {link}
                  </a>
                  <button
                    onClick={() => removeRecordingLink(link)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Social Media</h3>

            <div>
              <label className="mb-1 block text-xs text-gray-600">YouTube</label>
              <input
                type="text"
                value={youtubeHandle}
                onChange={(e) => setYoutubeHandle(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="YouTube channel URL or handle"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">Instagram</label>
              <input
                type="text"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="Instagram username"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">SoundCloud</label>
              <input
                type="text"
                value={soundcloudHandle}
                onChange={(e) => setSoundcloudHandle(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="SoundCloud profile URL"
              />
            </div>
          </div>
        </div>

        {/* WPB-114: Repertoire */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Repertoire</h2>
          <p className="mb-4 text-sm text-gray-600">Songs and pieces you know</p>

          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newRepertoireItem}
              onChange={(e) => setNewRepertoireItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addRepertoireItem()}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="Add a song or piece (e.g., Autumn Leaves)"
            />
            <button
              onClick={addRepertoireItem}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {repertoire.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
              >
                {item}
                <button
                  onClick={() => removeRepertoireItem(item)}
                  className="text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Influences */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Influences</h2>
          <p className="mb-4 text-sm text-gray-600">Artists or bands that inspire your playing</p>

          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newInfluence}
              onChange={(e) => setNewInfluence(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addInfluence()}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="e.g. Bill Evans, Keith Jarrett, Radiohead"
            />
            <button
              onClick={addInfluence}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {influences.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800"
              >
                {item}
                <button
                  onClick={() => removeInfluence(item)}
                  className="text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving || deleting || authLoading}
              className="flex-1 rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : authLoading ? 'Loading...' : 'Save Profile'}
            </button>
            <button
              onClick={() => router.push(`/profile/${address}`)}
              disabled={saving || deleting}
              className="rounded-md border border-gray-300 bg-white px-6 py-3 text-gray-700 hover:bg-gray-50 disabled:bg-gray-100"
            >
              Cancel
            </button>
          </div>

          {/* Delete Button - Only visible to blog owner editing someone else's profile */}
          {isBlogOwner && !isOwnProfile && (
            <div className="border-t border-red-200 pt-4">
              <button
                onClick={handleDelete}
                disabled={saving || deleting}
                className="w-full rounded-md border-2 border-red-600 bg-white px-6 py-3 font-semibold text-red-600 hover:bg-red-50 disabled:border-gray-300 disabled:text-gray-400"
              >
                {deleting ? 'Deleting...' : '🗑️ Delete Profile (Blog Owner Only)'}
              </button>
              <p className="mt-2 text-center text-xs text-red-600">
                ⚠️ This will permanently delete the user profile, musician profile, reviews, and
                sessions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
