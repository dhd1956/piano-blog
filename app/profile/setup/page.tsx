'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWallets } from '@privy-io/react-auth'
import { useAuth } from '@/context/AuthContext'

const TOTAL_STEPS = 4

const COLLAB_TYPES = [
  { value: 'LYRICS', label: 'Lyrics' },
  { value: 'MELODY', label: 'Melody' },
  { value: 'CHORDS', label: 'Chords' },
  { value: 'ARRANGEMENTS', label: 'Arrangements' },
  { value: 'CHARTS_SCORES', label: 'Charts & Scores' },
  { value: 'INSTRUMENT_PARTS', label: 'Instrument Parts' },
  { value: 'VOCALS', label: 'Vocals' },
  { value: 'PRODUCTION', label: 'Production' },
  { value: 'MIXING', label: 'Mixing' },
]

const SETUP_INSTRUMENTS = [
  'Piano (acoustic)',
  'Digital Piano / Keyboard',
  'Guitar',
  'Bass Guitar',
  'Violin / Strings',
  'Vocals',
  'Drums / Percussion',
  'Wind / Brass',
  'Other',
]

const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional']

const btnBase =
  'rounded-md px-6 py-2 text-sm font-semibold focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-800'
const btnPrimary = `${btnBase} bg-purple-600 text-white shadow-sm hover:bg-purple-700 disabled:opacity-50`
const btnSecondary = `${btnBase} border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600`
const chipBase = 'rounded-full px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer'
const chipActive = `${chipBase} bg-purple-600 text-white`
const chipInactive = `${chipBase} bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600`
const inputClass =
  'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:ring-purple-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100'
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300'

function emailToUsername(email: string | null): string {
  if (!email) return ''
  const local = email.split('@')[0]
  // Keep only allowed chars, clamp to 20
  return local.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20)
}

export default function ProfileSetupPage() {
  const router = useRouter()
  const { wallets } = useWallets()
  const address = wallets[0]?.address
  const { isAuthenticated, isLoading, user } = useAuth()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    username: emailToUsername(user?.email ?? null),
    displayName: '',
    bio: '',
    location: '',
  })

  const [musicianData, setMusicianData] = useState({
    collaborationTypes: [] as string[],
    instruments: [] as string[],
    experienceLevel: '',
    yearsPlaying: '',
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Pre-fill username from email once user data loads, but only if still empty
  useEffect(() => {
    if (user?.email && !formData.username) {
      setFormData((prev) => ({ ...prev, username: emailToUsername(user.email) }))
    }
  }, [user?.email]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const toggleCollabType = (value: string) => {
    setMusicianData((prev) => ({
      ...prev,
      collaborationTypes: prev.collaborationTypes.includes(value)
        ? prev.collaborationTypes.filter((t) => t !== value)
        : [...prev.collaborationTypes, value],
    }))
  }

  const toggleInstrument = (instrument: string) => {
    setMusicianData((prev) => ({
      ...prev,
      instruments: prev.instruments.includes(instrument)
        ? prev.instruments.filter((i) => i !== instrument)
        : [...prev.instruments, instrument],
    }))
  }

  const validateUsername = (): boolean => {
    if (!formData.username.trim()) {
      setError('Username is required')
      return false
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      setError('Username must be 3-20 characters (letters, numbers, underscore only)')
      return false
    }
    return true
  }

  const advance = () => {
    setError('')
    setStep((s) => s + 1)
  }

  const handleSubmit = async (includeMusicianProfile: boolean) => {
    setLoading(true)
    setError('')

    try {
      const hasMusicianData =
        musicianData.collaborationTypes.length > 0 ||
        musicianData.instruments.length > 0 ||
        !!musicianData.experienceLevel

      const body: Record<string, unknown> = {
        requesterAddress: address,
        ...formData,
        profileCompleted: true,
      }

      if (includeMusicianProfile && hasMusicianData) {
        const years = parseInt(musicianData.yearsPlaying)
        body.musicianProfile = {
          collaborationTypes: musicianData.collaborationTypes,
          instruments: musicianData.instruments,
          experienceLevel: musicianData.experienceLevel || undefined,
          yearsPlaying: !isNaN(years) && years >= 0 ? years : undefined,
        }
      }

      const response = await fetch(`/api/profile/${address}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      router.push('/profile')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated && !isLoading) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            🎵 Welcome to Global Piano Network!
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Let&apos;s set up your profile (Step {step} of {TOTAL_STEPS})
          </p>
        </div>

        {/* Progress bar */}
        <div className="overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-2 rounded-full bg-purple-600 transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        {/* Card */}
        <div className="rounded-lg bg-white p-8 shadow-sm dark:bg-gray-800">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Step 1: Username */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Choose your username
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  This is how other musicians will find you
                </p>
              </div>
              <div>
                <label htmlFor="username" className={labelClass}>
                  Username *
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="pianoplayer123"
                  className={inputClass}
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  3-20 characters, letters, numbers, and underscore only
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => validateUsername() && advance()}
                  disabled={!formData.username.trim()}
                  className={btnPrimary}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Display Name & Location */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Tell us about yourself
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Help other musicians get to know you
                </p>
              </div>
              <div>
                <label htmlFor="displayName" className={labelClass}>
                  Display Name (optional)
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="John Smith"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="location" className={labelClass}>
                  Location (optional)
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Aurora, ON"
                  className={inputClass}
                />
              </div>
              <div className="flex justify-between gap-3">
                <button
                  onClick={() => {
                    setStep(1)
                    setError('')
                  }}
                  className={btnSecondary}
                >
                  Back
                </button>
                <div className="flex gap-3">
                  <button onClick={advance} className={btnSecondary}>
                    Skip
                  </button>
                  <button onClick={advance} className={btnPrimary}>
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Bio */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Write a short bio
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Share your musical journey or interests (optional)
                </p>
              </div>
              <div>
                <label htmlFor="bio" className={labelClass}>
                  Bio (optional)
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Jazz pianist with 10 years of experience. Love collaborating on new projects!"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formData.bio.length}/500 characters
                </p>
              </div>
              <div className="flex justify-between gap-3">
                <button
                  onClick={() => {
                    setStep(2)
                    setError('')
                  }}
                  className={btnSecondary}
                >
                  Back
                </button>
                <div className="flex gap-3">
                  <button onClick={advance} className={btnSecondary}>
                    Skip
                  </button>
                  <button onClick={advance} className={btnPrimary}>
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Musician profile */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Your musical role
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  What do you do? Selecting anything here adds you to the Musicians Directory and
                  earns you <span className="font-semibold text-purple-600">+25 PXP</span>. You can
                  fill in more detail from your profile later.
                </p>
              </div>

              {/* Collaboration types */}
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  What do you do?{' '}
                  <span className="font-normal text-gray-500">(select all that apply)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {COLLAB_TYPES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleCollabType(value)}
                      className={
                        musicianData.collaborationTypes.includes(value) ? chipActive : chipInactive
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instruments */}
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Instruments <span className="font-normal text-gray-500">(optional)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {SETUP_INSTRUMENTS.map((inst) => (
                    <button
                      key={inst}
                      type="button"
                      onClick={() => toggleInstrument(inst)}
                      className={
                        musicianData.instruments.includes(inst) ? chipActive : chipInactive
                      }
                    >
                      {inst}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience level + Years playing */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="experienceLevel" className={labelClass}>
                    Experience level <span className="font-normal text-gray-500">(optional)</span>
                  </label>
                  <select
                    id="experienceLevel"
                    value={musicianData.experienceLevel}
                    onChange={(e) =>
                      setMusicianData((prev) => ({ ...prev, experienceLevel: e.target.value }))
                    }
                    className={inputClass}
                  >
                    <option value="">Select level</option>
                    {EXPERIENCE_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="yearsPlaying" className={labelClass}>
                    Years playing <span className="font-normal text-gray-500">(optional)</span>
                  </label>
                  <input
                    type="number"
                    id="yearsPlaying"
                    min={0}
                    max={80}
                    value={musicianData.yearsPlaying}
                    onChange={(e) =>
                      setMusicianData((prev) => ({ ...prev, yearsPlaying: e.target.value }))
                    }
                    placeholder="e.g. 10"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex justify-between gap-3">
                <button
                  onClick={() => {
                    setStep(3)
                    setError('')
                  }}
                  className={btnSecondary}
                >
                  Back
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={loading}
                    className={btnSecondary}
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => handleSubmit(true)}
                    disabled={loading}
                    className={btnPrimary}
                  >
                    {loading ? 'Saving...' : 'Finish Setup'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          You can always update your profile later in settings
        </p>
      </div>
    </div>
  )
}
