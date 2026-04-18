'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

interface Event {
  id: number
  title: string
  startDate: string
  venue: {
    name: string
  }
}

interface YouTubeUploadFormProps {
  onSuccess?: (video: any) => void
  onError?: (error: string) => void
}

export default function YouTubeUploadForm({ onSuccess, onError }: YouTubeUploadFormProps) {
  const { user, isAuthenticated } = useAuth()
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [eventSearch, setEventSearch] = useState('')
  const [eventDateFilter, setEventDateFilter] = useState<'30' | '90' | '365' | 'all'>('all')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const filteredEvents = events.filter((event) => {
    const searchMatch =
      eventSearch.trim() === '' ||
      event.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
      event.venue.name.toLowerCase().includes(eventSearch.toLowerCase())

    if (!searchMatch) return false

    if (eventDateFilter === 'all') return true
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - Number(eventDateFilter))
    return new Date(event.startDate) >= cutoff
  })

  // Fetch user's events on mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchUserEvents()
    }
  }, [isAuthenticated, user?.id])

  const fetchUserEvents = async () => {
    try {
      setLoadingEvents(true)
      // Fetch events user has RSVPed to or organized (recent + upcoming)
      const response = await fetch(`/api/events?userId=${user?.id}&includeOrganized=true&limit=50`)
      const data = await response.json()

      if (response.ok && data.events) {
        // Sort by date descending (most recent first)
        const sortedEvents = data.events.sort(
          (a: Event, b: Event) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        )
        setEvents(sortedEvents)

        // Auto-select most recent event if available
        if (sortedEvents.length > 0) {
          setSelectedEventId(sortedEvents[0].id)
        }
      }
    } catch (err) {
      console.error('Failed to fetch events:', err)
    } finally {
      setLoadingEvents(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate authentication
    if (!isAuthenticated || !user) {
      setError('Please sign in to submit videos')
      if (onError) onError('Please sign in to submit videos')
      return
    }

    // Validate event selection
    if (!selectedEventId) {
      setError('Please select which event this performance is from')
      if (onError) onError('Please select which event this performance is from')
      return
    }

    // Validate YouTube URL
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube video URL')
      if (onError) onError('Please enter a YouTube video URL')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/content/youtube/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          youtubeUrl: youtubeUrl.trim(),
          eventId: selectedEventId,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccess(result.message || 'Video submitted successfully!')
        setYoutubeUrl('') // Clear form

        if (onSuccess) onSuccess(result.video)
      } else {
        const errorMessage = result.error || 'Failed to submit video'
        setError(errorMessage)
        if (onError) onError(errorMessage)
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit video. Please try again.'
      setError(errorMessage)
      if (onError) onError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Submit Performance Video
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Share your piano performance from an event and earn PXP rewards
        </p>
      </div>

      {/* PXP Rewards Info */}
      <div className="mb-6 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 p-4 dark:from-yellow-900/20 dark:to-amber-900/20">
        <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
              clipRule="evenodd"
            />
          </svg>
          PXP Rewards
        </h4>
        <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>
              <strong>100 PXP</strong> - Performer (you) for submitting
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>
              <strong>50 PXP</strong> - Event organizer bonus
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>
              <strong>150 PXP</strong> - When video reaches 1,000 views
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>
              <strong>200 PXP</strong> - When video reaches 10,000 views
            </span>
          </li>
        </ul>
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-500">
          Total potential: <strong>450 PXP</strong> (~$4.50 USD) per video + bonus for organizer
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Event Selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Which Event? *
          </label>
          {loadingEvents ? (
            <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
              <svg className="h-4 w-4 animate-spin text-gray-500" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-400">Loading events...</span>
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  placeholder="Search by title or venue…"
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  disabled={isSubmitting}
                />
                <select
                  value={eventDateFilter}
                  onChange={(e) =>
                    setEventDateFilter(e.target.value as '30' | '90' | '365' | 'all')
                  }
                  className="rounded-lg border border-gray-300 px-2 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  disabled={isSubmitting}
                >
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                  <option value="all">All time</option>
                </select>
              </div>
              <select
                value={selectedEventId || ''}
                onChange={(e) => setSelectedEventId(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 transition-colors focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                disabled={isSubmitting}
                size={Math.min(filteredEvents.length + 1, 6)}
              >
                <option value="">Select an event…</option>
                {filteredEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} @ {event.venue.name} — {formatEventDate(event.startDate)}
                  </option>
                ))}
              </select>
              {filteredEvents.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  No events match your filters.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                No events found. Please RSVP to or create an event first to submit performance
                videos.
              </p>
              <Link
                href="/events"
                className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Browse Events →
              </Link>
            </div>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Select the event where this performance took place
          </p>
        </div>

        {/* YouTube URL Input */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            YouTube Video URL *
          </label>
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
            className={`w-full rounded-lg border px-3 py-2 text-gray-900 transition-colors focus:ring-2 dark:bg-gray-700 dark:text-gray-100 ${
              error
                ? 'border-red-500 focus:ring-red-500 dark:border-red-600'
                : 'border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-400'
            }`}
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Accepted formats: youtube.com/watch?v=... or youtu.be/...
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-300">❌ {error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
            <p className="text-sm text-green-800 dark:text-green-300">✅ {success}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !isAuthenticated || events.length === 0}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Submitting...
            </span>
          ) : (
            'Submit Performance Video'
          )}
        </button>

        {!isAuthenticated && (
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Please sign in to submit videos
          </p>
        )}
      </form>

      {/* Guidelines */}
      <div className="mt-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
        <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">Guidelines</h4>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <li>• Video must be from a performance at the selected event</li>
          <li>• Must feature piano performance (original or covers)</li>
          <li>• You must be the channel owner or have permission</li>
          <li>• Video should be publicly accessible on YouTube</li>
          <li>• Each video can only be submitted once</li>
          <li>• View count milestones are tracked automatically</li>
        </ul>
      </div>
    </div>
  )
}
