'use client'

/**
 * Event Edit Page
 * Allows event organizers to edit their events
 */

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useAuth } from '@/context/AuthContext'

interface Venue {
  id: number
  name: string
  city: string
  slug: string
}

const EVENT_TYPES = [
  { value: 'JAM_SESSION', label: '🎸 Jam Session' },
  { value: 'GIG', label: '🎤 Gig' },
  { value: 'CONCERT', label: '🎵 Concert' },
  { value: 'RECITAL', label: '🎹 Recital' },
  { value: 'OPEN_MIC', label: '🎙️ Open Mic' },
  { value: 'WORKSHOP', label: '📚 Workshop' },
  { value: 'MASTERCLASS', label: '🎓 Masterclass' },
  { value: 'REHEARSAL', label: '🎼 Rehearsal' },
  { value: 'MEETUP', label: '👥 Meetup' },
  { value: 'OTHER', label: '📌 Other' },
]

export default function EditEventPage() {
  // Require authentication to access this page
  const { isLoading: authLoading } = useRequireAuth()

  const router = useRouter()
  const params = useParams()
  const eventId = params?.id as string
  const { user: currentUserAuth, isAuthenticated } = useAuth()
  const walletAddress = currentUserAuth?.walletAddress || null
  const isConnected = isAuthenticated

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventType, setEventType] = useState('JAM_SESSION')
  const [venueId, setVenueId] = useState<number | null>(null)
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [maxAttendees, setMaxAttendees] = useState<number | null>(null)
  const [requireApproval, setRequireApproval] = useState(false)
  const [isFree, setIsFree] = useState(true)
  const [price, setPrice] = useState<number | null>(null)
  const [genres, setGenres] = useState<string[]>([])
  const [genreInput, setGenreInput] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [externalLink, setExternalLink] = useState('')
  const [streamingLink, setStreamingLink] = useState('')

  // UI state
  const [venues, setVenues] = useState<Venue[]>([])
  const [loadingVenues, setLoadingVenues] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  // Cancel event state
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  // Check for username session
  useEffect(() => {
    const checkSession = async () => {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const data = await response.json()
        if (data.user && data.user.username) {
          setUsername(data.user.username)
        }
      }
    }
    checkSession()
  }, [])

  // Load verified venues
  useEffect(() => {
    loadVenues()
  }, [])

  // Load existing event data
  useEffect(() => {
    if (eventId) {
      loadEvent()
    }
  }, [eventId])

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const loadVenues = async () => {
    try {
      setLoadingVenues(true)
      const response = await fetch('/api/venues?verified=true&limit=100')
      if (response.ok) {
        const data = await response.json()
        setVenues(data.venues || [])
      }
    } catch (err) {
      console.error('Error loading venues:', err)
    } finally {
      setLoadingVenues(false)
    }
  }

  const loadEvent = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/events/${eventId}`)
      if (!response.ok) {
        throw new Error('Failed to load event')
      }

      const data = await response.json()
      const event = data.event

      // Populate form fields
      setTitle(event.title || '')
      setDescription(event.description || '')
      setEventType(event.eventType || 'JAM_SESSION')
      setVenueId(event.venue?.id || null)
      setGenres(event.genres || [])
      setCoverImage(event.coverImage || '')
      setExternalLink(event.externalLink || '')
      setStreamingLink(event.streamingLink || '')
      setMaxAttendees(event.maxAttendees || null)
      setRequireApproval(event.requireApproval || false)
      setIsFree(event.isFree || true)
      setPrice(event.price || null)

      // Parse dates
      if (event.startDate) {
        const start = new Date(event.startDate)
        setStartDate(start.toISOString().split('T')[0])
        setStartTime(start.toTimeString().slice(0, 5))
      }
      if (event.endDate) {
        const end = new Date(event.endDate)
        setEndDate(end.toISOString().split('T')[0])
        setEndTime(end.toTimeString().slice(0, 5))
      }
    } catch (err: any) {
      console.error('Error loading event:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGenre = () => {
    if (genreInput.trim() && !genres.includes(genreInput.trim())) {
      setGenres([...genres, genreInput.trim()])
      setGenreInput('')
    }
  }

  const handleRemoveGenre = (genre: string) => {
    setGenres(genres.filter((g) => g !== genre))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      // Get requester address (wallet or username) for authorization
      const requesterAddress = walletAddress || username
      if (!requesterAddress) {
        setError('Please connect your wallet or sign in to edit this event')
        setSubmitting(false)
        return
      }

      // Validate dates
      if (!startDate || !startTime || !endDate || !endTime) {
        setError('Please provide start and end dates/times')
        setSubmitting(false)
        return
      }

      // Combine date and time
      const startDateTime = new Date(`${startDate}T${startTime}`)
      const endDateTime = new Date(`${endDate}T${endTime}`)

      if (startDateTime >= endDateTime) {
        setError('End date/time must be after start date/time')
        setSubmitting(false)
        return
      }

      // Validate venue selection
      if (!venueId) {
        setError('Please select a venue for this event')
        setSubmitting(false)
        return
      }

      // Prepare request body
      const requestBody = {
        requesterAddress,
        title,
        description,
        eventType,
        venueId, // Required - always set
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        maxAttendees,
        requireApproval,
        isFree,
        price: isFree ? null : price,
        genres,
        coverImage: coverImage || null,
        externalLink: externalLink || null,
        streamingLink: streamingLink || null,
      }

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update event')
      }

      const data = await response.json()
      router.push(`/events/${eventId}`)
    } catch (err: any) {
      console.error('Error updating event:', err)
      setError(err.message || 'Failed to update event')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelEvent = async () => {
    const requesterAddress = walletAddress || username
    if (!requesterAddress) return
    setIsCancelling(true)
    setCancelError(null)
    try {
      const params = new URLSearchParams({ requesterAddress })
      if (cancelReason) params.set('reason', cancelReason)
      const response = await fetch(`/api/events/${eventId}?${params}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel event')
      }
      router.push(`/events/${eventId}`)
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel event')
      setIsCancelling(false)
      setShowCancelConfirm(false)
    }
  }

  // Show loading state while fetching event
  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading event...</div>
      </div>
    )
  }

  if (!isConnected && !username) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Event</h1>
        <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">
          Please connect your wallet or sign in to create an event
        </p>
        <a
          href="/auth/login"
          className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Sign In
        </a>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Event</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Organize a jam session, gig, concert, or musical gathering
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Event Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
                placeholder="Summer Jazz Jam Session"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Event Type *
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
                placeholder="Describe your event..."
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Location</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Venue *
            </label>
            <select
              value={venueId || ''}
              onChange={(e) => setVenueId(e.target.value ? parseInt(e.target.value) : null)}
              required
              className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="">Select a venue...</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name} - {venue.city}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              All events must be associated with a registered venue.{' '}
              <a href="/venues" className="text-blue-600 hover:underline dark:text-blue-400">
                Browse venues
              </a>{' '}
              or{' '}
              <a href="/submit" className="text-blue-600 hover:underline dark:text-blue-400">
                submit a new venue
              </a>{' '}
              if yours isn't listed.
            </p>
          </div>
        </div>

        {/* Date & Time */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Date & Time</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                End Time *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Event Settings */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
            Event Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Max Attendees (optional)
              </label>
              <input
                type="number"
                value={maxAttendees || ''}
                onChange={(e) => setMaxAttendees(e.target.value ? parseInt(e.target.value) : null)}
                min="1"
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
                placeholder="Leave empty for unlimited"
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={requireApproval}
                  onChange={(e) => setRequireApproval(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Require organizer approval for RSVPs
                </span>
              </label>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Free event</span>
              </label>
            </div>

            {!isFree && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Price (USD)
                </label>
                <input
                  type="number"
                  value={price || ''}
                  onChange={(e) => setPrice(e.target.value ? parseFloat(e.target.value) : null)}
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="10.00"
                />
              </div>
            )}
          </div>
        </div>

        {/* Additional Details */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
            Additional Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Music Genres/Styles
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGenre())}
                  className="flex-1 rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="Jazz, Blues, Classical..."
                />
                <button
                  type="button"
                  onClick={handleAddGenre}
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <span
                    key={genre}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {genre}
                    <button
                      type="button"
                      onClick={() => handleRemoveGenre(genre)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cover Image URL (optional)
              </label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
                placeholder="https://example.com/event-image.jpg"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                External Event Link (optional)
              </label>
              <input
                type="url"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
                placeholder="https://eventbrite.com/..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Streaming Link (optional)
              </label>
              <input
                type="url"
                value={streamingLink}
                onChange={(e) => setStreamingLink(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
                placeholder="https://youtube.com/live/..."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 bg-white px-6 py-3 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Saving Changes...' : 'Update Event'}
          </button>
        </div>
      </form>

      {/* Cancel Event — BLOG_OWNER / CURATOR only */}
      {(currentUserAuth?.role === 'BLOG_OWNER' ||
        currentUserAuth?.role === 'CURATOR' ||
        currentUserAuth?.role === 'VALIDATOR') && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
          <h2 className="mb-1 text-lg font-semibold text-red-800 dark:text-red-300">
            Cancel Event
          </h2>
          <p className="mb-4 text-sm text-red-700 dark:text-red-400">
            Cancelling is permanent. All RSVPed attendees will be notified.
          </p>

          {cancelError && (
            <p className="mb-3 text-sm text-red-600 dark:text-red-400">{cancelError}</p>
          )}

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-red-800 dark:text-red-300">
              Reason for cancellation (optional)
            </label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Venue unavailable"
              className="w-full rounded-md border border-red-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none dark:border-red-800 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          {!showCancelConfirm ? (
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="rounded-md bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700"
            >
              Cancel Event
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-red-800 dark:text-red-300">
                Are you sure? This cannot be undone.
              </span>
              <button
                type="button"
                onClick={handleCancelEvent}
                disabled={isCancelling}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling…' : 'Yes, cancel it'}
              </button>
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="text-sm text-gray-600 hover:underline dark:text-gray-400"
              >
                Go back
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
