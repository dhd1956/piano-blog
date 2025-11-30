'use client'

/**
 * Event Detail Page
 * Shows event details with RSVP functionality
 */

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useHybridWallet } from '@/hooks/useHybridWallet'

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

interface Event {
  id: number
  title: string
  description: string
  eventType: string
  startDate: string
  endDate: string
  timezone: string
  customLocation: string | null
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
  venue: Venue | null
  rsvps: RSVP[]
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

export default function EventDetailPage() {
  const params = useParams()
  const eventId = params?.id as string
  const { walletAddress, isConnected } = useHybridWallet()

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

  // Check for username session
  useEffect(() => {
    const checkSession = async () => {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const data = await response.json()
        if (data.user && data.user.username) {
          setUsername(data.user.username)
          setCurrentUserId(data.user.id)
        }
      }
    }
    checkSession()
  }, [])

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
          <Link href="/events" className="text-blue-600 hover:underline dark:text-blue-400">
            ← Back to Events
          </Link>
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
  const location = event.venue ? event.venue.name : event.customLocation || 'Location TBD'

  // Check if current user is the organizer (by user ID or wallet address)
  const isOrganizer =
    currentUserId === event.organizer.id ||
    (walletAddress &&
      event.organizer.walletAddress &&
      walletAddress.toLowerCase() === event.organizer.walletAddress.toLowerCase())

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
        <Link href="/events" className="text-blue-600 hover:underline dark:text-blue-400">
          ← Back to Events
        </Link>
        {isOrganizer && event.status !== 'CANCELLED' && (
          <Link
            href={`/events/${eventId}/edit`}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            ⚙️ Edit Event
          </Link>
        )}
      </div>

      {/* Cover Image */}
      {event.coverImage && (
        <div className="relative mb-6 h-64 w-full overflow-hidden rounded-lg md:h-96">
          <Image src={event.coverImage} alt={event.title} fill className="object-cover" />
        </div>
      )}

      {/* Event Type Badge */}
      <div className="mb-4">
        <span className="inline-block rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          {eventTypeLabel}
        </span>
        {event.status === 'CANCELLED' && (
          <span className="ml-2 inline-block rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
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
                  href={`/venues/${event.venue.slug}`}
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
          {event.status !== 'CANCELLED' && !isOrganizer && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">✉️ RSVP</h2>

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                  {error}
                </div>
              )}

              {userRSVP ? (
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

      {/* Attendees List (only for organizer) */}
      {isOrganizer && event.rsvps.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
            Attendees ({event.rsvps.length})
          </h2>
          <div className="space-y-3">
            {event.rsvps.map((rsvp) => (
              <div
                key={rsvp.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  {rsvp.user.avatar ? (
                    <Image
                      src={rsvp.user.avatar}
                      alt={rsvp.user.displayName || rsvp.user.username || 'User'}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600">
                      👤
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {rsvp.user.displayName || rsvp.user.username || 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {rsvp.status} • {rsvp.attendeeCount} attendee
                      {rsvp.attendeeCount > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    rsvp.status === 'CONFIRMED'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : rsvp.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : rsvp.status === 'MAYBE'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                >
                  {rsvp.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
