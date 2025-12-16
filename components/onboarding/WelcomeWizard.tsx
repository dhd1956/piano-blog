'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface WelcomeWizardProps {
  user: {
    id: number
    displayName?: string | null
    username?: string | null
    avatar?: string | null
    onboardingCompleted: boolean
    onboardingStep?: number | null
  }
}

const INTERESTS = [
  { id: 'discover-venues', label: 'Discover piano venues in my area', icon: '🗺️' },
  { id: 'submit-venues', label: 'Submit venues I know about', icon: '📝' },
  { id: 'attend-events', label: 'Attend jam sessions and events', icon: '🎵' },
  { id: 'connect-musicians', label: 'Connect with other musicians', icon: '🤝' },
  { id: 'share-music', label: 'Share my music and performances', icon: '🎹' },
]

export default function WelcomeWizard({ user }: WelcomeWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // Form state
  const [displayName, setDisplayName] = useState(user.displayName || '')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [isMusician, setIsMusician] = useState<boolean | null>(null)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Show wizard if onboarding not completed
    if (!user.onboardingCompleted) {
      setIsVisible(true)
      // Resume from last step if available
      if (user.onboardingStep) {
        setCurrentStep(user.onboardingStep)
      }
    }
  }, [user.onboardingCompleted, user.onboardingStep])

  const handleClose = async () => {
    setIsClosing(true)
    // Save current step
    await saveProgress(currentStep, false)
    setTimeout(() => {
      setIsVisible(false)
      setIsClosing(false)
    }, 300)
  }

  const saveProgress = async (step: number, completed: boolean) => {
    try {
      await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          step,
          completed,
          interests: selectedInterests,
        }),
      })
    } catch (error) {
      console.error('Error saving onboarding progress:', error)
    }
  }

  const handleNext = async () => {
    if (currentStep < 4) {
      await saveProgress(currentStep + 1, false)
      setCurrentStep(currentStep + 1)
    }
  }

  const handleSkip = async () => {
    if (currentStep === 2) {
      // Skip profile setup
      setCurrentStep(3)
    } else {
      await handleComplete()
    }
  }

  const handleComplete = async () => {
    setIsSaving(true)
    try {
      // Save profile data
      if (displayName || location || bio || isMusician !== null) {
        await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: displayName || undefined,
            location: location || undefined,
            bio: bio || undefined,
          }),
        })

        // Create musician profile if selected
        if (isMusician) {
          await fetch('/api/user/musician-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
            }),
          })
        }
      }

      // Save interests and mark onboarding complete
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          interests: selectedInterests,
        }),
      })

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      setIsSaving(false)
    }
  }

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId) ? prev.filter((id) => id !== interestId) : [...prev, interestId]
    )
  }

  if (!isVisible) return null

  const displayUserName = displayName || user.displayName || user.username || 'there'

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
      onKeyDown={(e) => e.key === 'Escape' && handleClose()}
      role="presentation"
    >
      <div
        className={`relative w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl transition-transform dark:bg-gray-800 ${
          isClosing ? 'scale-95' : 'scale-100'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Close onboarding wizard"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Progress indicator */}
        <div className="mb-8 flex justify-center gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-2 w-12 rounded-full transition-colors ${
                step <= currentStep ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {currentStep === 1 && (
          <div className="text-center">
            <div className="mb-6 text-6xl">🎹</div>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
              Welcome to Piano Blog!
            </h2>
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">
              Hi {displayUserName}! You've successfully created your account. Let's get you started!
            </p>
            <button
              onClick={handleNext}
              className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Profile Setup */}
        {currentStep === 2 && (
          <div>
            <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
              Complete Your Profile
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Help others discover you and connect with the community.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should we call you?"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Location (optional)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Toronto, Canada"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bio (optional)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your piano journey..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Are you a musician?
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsMusician(true)}
                    className={`flex-1 rounded-lg border-2 px-4 py-2 transition-colors ${
                      isMusician === true
                        ? 'border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100'
                        : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                    }`}
                  >
                    Yes - I play piano/music
                  </button>
                  <button
                    onClick={() => setIsMusician(false)}
                    className={`flex-1 rounded-lg border-2 px-4 py-2 transition-colors ${
                      isMusician === false
                        ? 'border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100'
                        : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                    }`}
                  >
                    No - I'm here to discover venues
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={handleSkip}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Interests */}
        {currentStep === 3 && (
          <div>
            <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
              What brings you here?
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Select all that apply - this helps us personalize your experience.
            </p>

            <div className="space-y-3">
              {INTERESTS.map((interest) => (
                <button
                  key={interest.id}
                  onClick={() => toggleInterest(interest.id)}
                  className={`flex w-full items-center gap-4 rounded-lg border-2 p-4 text-left transition-colors ${
                    selectedInterests.includes(interest.id)
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                  }`}
                >
                  <span className="text-2xl">{interest.icon}</span>
                  <span className="flex-1 font-medium text-gray-900 dark:text-white">
                    {interest.label}
                  </span>
                  {selectedInterests.includes(interest.id) && (
                    <svg
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Platform Tour */}
        {currentStep === 4 && (
          <div>
            <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Quick Tour</h2>
            <p className="mb-8 text-gray-600 dark:text-gray-300">
              Let me show you what you can do here:
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <span className="text-2xl">🗺️</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Venues</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Browse and submit piano-friendly venues in your area
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <span className="text-2xl">🎵</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Events</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Find and RSVP to jam sessions, concerts, and meetups
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <span className="text-2xl">👤</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Profile</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Build your musician profile and connect with the community
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <span className="text-2xl">🎁</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Rewards</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Earn PXP tokens for your contributions to the platform
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setCurrentStep(3)}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ← Back
              </button>
              <button
                onClick={handleComplete}
                disabled={isSaving}
                className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSaving ? 'Saving...' : 'Start Exploring!'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
