'use client'

/**
 * Event Detail Page
 * Shows event details with RSVP functionality
 */

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useAuth } from '@/context/AuthContext'
import YouTubeVideoGallery from '@/components/content/YouTubeVideoGallery'
import EventQRCard from '@/components/qr/EventQRCard'

interface Organizer {
  id: number
  displayName: string | null
  username: string | null
  avatar: string | null
  profileSlug: string | null
  walletAddress: string | null
}

interface Venue {
  id: number
  name: string
  city: string
  address: string | null
  slug: string
  latitude: number | null
  longitude: number | null
  hasPiano: boolean
  pianoType: string | null
}

interface User {
  id: number
  displayName: string | null
  username: string | null
  avatar: string | null
  profileSlug: string | null
}

interface RSVP {
  id: number
  status: string
  attendeeCount: number
  notes: string | null
  user: User
  createdAt: string
}

interface EventSeries {
  id: number
  title: string
  recurrencePattern: string
  recurrenceConfig: any
  status: string
}

interface Event {
  id: number
  title: string
  description: string
  eventType: string
  startDate: string
  endDate: string
  timezone: string
  address: string | null
  maxAttendees: number | null
  requireApproval: boolean
  isFree: boolean
  price: number | null
  coverImage: string | null
  genres: string[]
  tags: string[]
  externalLink: string | null
  streamingLink: string | null
  status: string
  organizer: Organizer
  venue: Venue
  rsvps: RSVP[]
  // Series fields
  seriesId: number | null
  series: EventSeries | null
  seriesOccurrence: number | null
  isSeriesException: boolean
}

interface EventStats {
  totalAttendees: number
  spotsRemaining: number | null
  isFull: boolean
  confirmedCount: number
  pendingCount: number
  maybeCount: number
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  JAM_SESSION: '🎸 Jam Session',
  GIG: '🎤 Gig',
  CONCERT: '🎵 Concert',
  RECITAL: '🎹 Recital',
  OPEN_MIC: '🎙️ Open Mic',
  WORKSHOP: '📚 Workshop',
  MASTERCLASS: '🎓 Masterclass',
  REHEARSAL: '🎼 Rehearsal',
  MEETUP: '👥 Meetup',
  OTHER: '📌 Event',
}

const RECURRENCE_LABELS: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  WEEKDAYS: 'Weekdays',
}

export default function EventDetailPage() {
  // Require authentication to access this page
  const { isLoading: authLoading } = useRequireAuth()

  const params = useParams()
  const eventId = params?.id as string
  const { user: currentUserAuth, isAuthenticated } = useAuth()
  const walletAddress = currentUserAuth?.walletAddress || null
  const isConnected = isAuthenticated

  const [event, setEvent] = useState<Event | null>(null)
  const [stats, setStats] = useState<EventStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRSVP, setUserRSVP] = useState<RSVP | null>(null)
  const [rsvpStatus, setRsvpStatus] = useState<string>('CONFIRMED')
  const [attendeeCount, setAttendeeCount] = useState(1)
  const [rsvpNotes, setRsvpNotes] = useState('')
  const [submittingRSVP, setSubmittingRSVP] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  const [showQRModal, setShowQRModal] = useState(false)

  // Cancel event state
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  // Sync auth user into local state
  useEffect(() => {
    if (currentUserAuth) {
      setUsername(currentUserAuth.username || null)
      setCurrentUserId(currentUserAuth.id)
    }
  }, [currentUserAuth])

  useEffect(() => {
    if (eventId) {
      loadEvent()
    }
  }, [eventId])

  useEffect(() => {
    // Find user's RSVP
    if (event && currentUserId) {
      const myRSVP = event.rsvps.find((rsvp) => rsvp.user.id === currentUserId)
      setUserRSVP(myRSVP || null)
      if (myRSVP) {
        setRsvpStatus(myRSVP.status)
        setAttendeeCount(myRSVP.attendeeCount)
        setRsvpNotes(myRSVP.notes || '')
      }
    }
  }, [event, currentUserId])

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

  const loadEvent = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/events/${eventId}`)

      if (!response.ok) {
        throw new Error('Failed to load event')
      }

      const data = await response.json()
      setEvent(data.event)
      setStats(data.stats)
    } catch (err: any) {
      console.error('Error loading event:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRSVP = async () => {
    try {
      setSubmittingRSVP(true)
      setError(null)

      const userAddress = walletAddress || username
      if (!userAddress) {
        setError('Please connect your wallet or sign in to RSVP')
        return
      }

      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress,
          status: rsvpStatus,
          attendeeCount,
          notes: rsvpNotes || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to RSVP')
      }

      await loadEvent() // Reload to get updated RSVPs
    } catch (err: any) {
      console.error('Error submitting RSVP:', err)
      setError(err.message)
    } finally {
      setSubmittingRSVP(false)
    }
  }

  const handleCancelRSVP = async () => {
    try {
      setSubmittingRSVP(true)
      setError(null)

      const userAddress = walletAddress || username
      if (!userAddress) return

      const response = await fetch(
        `/api/events/${eventId}/rsvp?userAddress=${encodeURIComponent(userAddress)}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel RSVP')
      }

      setUserRSVP(null)
      setRsvpStatus('CONFIRMED')
      setAttendeeCount(1)
      setRsvpNotes('')
      await loadEvent()
    } catch (err: any) {
      console.error('Error cancelling RSVP:', err)
      setError(err.message)
    } finally {
      setSubmittingRSVP(false)
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
      const res = await fetch(`/api/events/${eventId}?${params.toString()}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to cancel event')
      await loadEvent()
      setShowCancelConfirm(false)
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel event')
      setShowCancelConfirm(false)
    } finally {
      setIsCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading event...</div>
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950">
          <h2 className="mb-4 text-2xl font-bold text-red-900 dark:text-red-100">Error</h2>
          <p className="mb-4 text-red-800 dark:text-red-200">{error}</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/events" className="text-blue-600 hover:underline dark:text-blue-400">
              ← Back to Events
            </Link>
            <span className="text-gray-400">|</span>
            <Link
              href="/venues"
              className="text-sm text-gray-600 hover:underline dark:text-gray-400"
            >
              Browse Venues
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return null
  }

  const eventTypeLabel = EVENT_TYPE_LABELS[event.eventType] || '📌 Event'
  const organizerName =
    event.organizer.displayName || event.organizer.username || 'Anonymous Organizer'
  const location = event.venue.name // Venue is always required now

  // Check if current user is the organizer (by user ID or wallet address)
  const isOrganizer =
    currentUserId === event.organizer.id ||
    (walletAddress &&
      event.organizer.walletAddress &&
      walletAddress.toLowerCase() === event.organizer.walletAddress.toLowerCase())

  const canCancel =
    event.status !== 'CANCELLED' &&
    (currentUserAuth?.role === 'BLOG_OWNER' ||
      currentUserAuth?.role === 'CURATOR' ||
      currentUserAuth?.role === 'VALIDATOR')

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Back Link and Edit Button */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/venueDetails/${event.venue.id}`}
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Back to {event.venue.name}
          </Link>
          <span className="text-gray-400">|</span>
          <Link href="/events" className="text-sm text-gray-600 hover:underline dark:text-gray-400">
            All Events
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQRModal(true)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            📱 Share QR
          </button>
          {isOrganizer && event.status !== 'CANCELLED' && (
            <Link
              href={`/events/${eventId}/edit`}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              ⚙️ Edit Event
            </Link>
          )}
        </div>
      </div>

      {/* Cover Image */}
      {event.coverImage && (
        <div className="relative mb-6 h-64 w-full overflow-hidden rounded-lg md:h-96">
          <Image src={event.coverImage} alt={event.title} fill className="object-cover" />
        </div>
      )}

      {/* Event Type Badge */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="inline-block rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          {eventTypeLabel}
        </span>
        {event.series && (
          <Link
            href={`/events/series/${event.seriesId}`}
            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 transition-colors hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {RECURRENCE_LABELS[event.series.recurrencePattern] || 'Recurring'} Series
            {event.seriesOccurrence && ` (#${event.seriesOccurrence})`}
          </Link>
        )}
        {event.isSeriesException && (
          <span className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Edited
          </span>
        )}
        {event.status === 'CANCELLED' && (
          <span className="inline-block rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
            Cancelled
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100">{event.title}</h1>

      {/* Main Info Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* Left Column - Details */}
        <div className="space-y-6">
          {/* Date & Time */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">
              📅 Date & Time
            </h2>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p>
                <strong>Start:</strong> {formatDate(event.startDate)} at{' '}
                {formatTime(event.startDate)}
              </p>
              <p>
                <strong>End:</strong> {formatDate(event.endDate)} at {formatTime(event.endDate)}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">📍 Location</h2>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p className="font-medium">{location}</p>
              {event.venue && event.venue.city && <p>{event.venue.city}</p>}
              {event.address && <p className="text-sm">{event.address}</p>}
              {event.venue && (
                <Link
                  href={`/venueDetails/${event.venue.id}`}
                  className="inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  View Venue Details →
                </Link>
              )}
            </div>
          </div>

          {/* Organizer */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">
              👤 Organizer
            </h2>
            <div className="flex items-center gap-3">
              {event.organizer.avatar ? (
                <Image
                  src={event.organizer.avatar}
                  alt={organizerName}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-300 text-xl dark:bg-gray-600">
                  👤
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{organizerName}</p>
                {event.organizer.profileSlug && (
                  <Link
                    href={`/profile/${event.organizer.profileSlug}`}
                    className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    View Profile →
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">
                📊 Attendance
              </h2>
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <p>
                  <strong>{stats.confirmedCount}</strong> confirmed
                </p>
                {stats.pendingCount > 0 && (
                  <p>
                    <strong>{stats.pendingCount}</strong> pending approval
                  </p>
                )}
                {stats.maybeCount > 0 && (
                  <p>
                    <strong>{stats.maybeCount}</strong> maybe
                  </p>
                )}
                {event.maxAttendees && (
                  <p>
                    <strong>{stats.spotsRemaining}</strong> spots remaining
                  </p>
                )}
                {stats.isFull && (
                  <p className="text-red-600 dark:text-red-400">
                    <strong>Event is full</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Who's Coming */}
          {event.rsvps.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">
                Who's Coming
              </h2>
              <div className="space-y-2">
                {event.rsvps
                  .filter((r) => isOrganizer || r.status === 'CONFIRMED' || r.status === 'MAYBE')
                  .map((rsvp) => (
                    <div key={rsvp.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {rsvp.user.avatar ? (
                          <Image
                            src={rsvp.user.avatar}
                            alt={rsvp.user.displayName || rsvp.user.username || 'User'}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-sm dark:bg-gray-600">
                            👤
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {rsvp.user.displayName || rsvp.user.username || 'Anonymous'}
                          </p>
                          {rsvp.attendeeCount > 1 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              +{rsvp.attendeeCount - 1} guest{rsvp.attendeeCount > 2 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          rsvp.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : rsvp.status === 'MAYBE'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {rsvp.status === 'CONFIRMED'
                          ? '✓ Going'
                          : rsvp.status === 'MAYBE'
                            ? 'Maybe'
                            : rsvp.status}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Description & RSVP */}
        <div className="space-y-6">
          {/* Description */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">
              About This Event
            </h2>
            <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
              {event.description}
            </p>
          </div>

          {/* Genres */}
          {event.genres.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">
                🎵 Music Genres
              </h2>
              <div className="flex flex-wrap gap-2">
                {event.genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">💵 Pricing</h2>
            <p className="text-gray-700 dark:text-gray-300">
              {event.isFree ? (
                <span className="text-lg font-medium text-green-600 dark:text-green-400">
                  Free Event
                </span>
              ) : (
                <span className="text-lg font-medium">${event.price}</span>
              )}
            </p>
          </div>

          {/* Links */}
          {(event.externalLink || event.streamingLink) && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">🔗 Links</h2>
              <div className="space-y-2">
                {event.externalLink && (
                  <a
                    href={event.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 hover:underline dark:text-blue-400"
                  >
                    External Event Page →
                  </a>
                )}
                {event.streamingLink && (
                  <a
                    href={event.streamingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Live Stream →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* RSVP Section */}
          {event.status !== 'CANCELLED' && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">✉️ RSVP</h2>

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                  {error}
                </div>
              )}

              {!isConnected ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please{' '}
                  <a href="/auth/login" className="text-blue-600 hover:underline">
                    sign in
                  </a>{' '}
                  to RSVP for this event.
                </p>
              ) : userRSVP ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your RSVP: <strong>{userRSVP.status}</strong>
                  </p>
                  <button
                    onClick={handleCancelRSVP}
                    disabled={submittingRSVP}
                    className="w-full rounded-md border border-red-300 bg-white px-4 py-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:bg-gray-800"
                  >
                    {submittingRSVP ? 'Cancelling...' : 'Cancel RSVP'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Response
                    </label>
                    <select
                      value={rsvpStatus}
                      onChange={(e) => setRsvpStatus(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                    >
                      <option value="CONFIRMED">Yes, I'll attend</option>
                      <option value="MAYBE">Maybe</option>
                      <option value="DECLINED">Can't make it</option>
                    </select>
                  </div>

                  {rsvpStatus === 'CONFIRMED' && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Number of Attendees
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={attendeeCount}
                        onChange={(e) => setAttendeeCount(parseInt(e.target.value) || 1)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notes (optional)
                    </label>
                    <textarea
                      value={rsvpNotes}
                      onChange={(e) => setRsvpNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                      placeholder="Any special requests or notes..."
                    />
                  </div>

                  <button
                    onClick={handleRSVP}
                    disabled={submittingRSVP || (stats?.isFull && rsvpStatus === 'CONFIRMED')}
                    className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submittingRSVP ? 'Submitting...' : 'Submit RSVP'}
                  </button>

                  {event.requireApproval && rsvpStatus === 'CONFIRMED' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Note: Your RSVP will require organizer approval
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Event — BLOG_OWNER / CURATOR / VALIDATOR */}
      {canCancel && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
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

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                QR Code — {event.title}
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <EventQRCard
                eventData={{
                  id: event.id,
                  title: event.title,
                  eventType: event.eventType,
                  startDate: event.startDate,
                  endDate: event.endDate,
                  venueName: event.venue.name,
                  venueCity: event.venue.city,
                  organizerName: organizerName,
                  isFree: event.isFree,
                  price: event.price,
                  description: event.description,
                }}
              />
            </div>
            <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
              <button
                onClick={() => setShowQRModal(false)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Performance Videos Section */}
      {event && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
            <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
            Performance Videos
          </h2>
          <YouTubeVideoGallery
            eventId={event.id}
            limit={20}
            showEventContext={false}
            showUploadForm={true}
          />
        </div>
      )}
    </div>
  )
}
