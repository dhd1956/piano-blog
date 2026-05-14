'use client'

/**
 * Event Series Detail Page
 * Shows series info, recurrence pattern, and all event instances
 */

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useRequireAuth } from '@/hooks/useRequireAuth'

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
}

interface EventInstance {
  id: number
  title: string
  startDate: string
  endDate: string
  status: string
  seriesOccurrence: number | null
  isSeriesException: boolean
  _count: {
    rsvps: number
  }
}

interface EventSeries {
  id: number
  title: string
  description: string
  eventType: string
  startTime: string
  endTime: string
  timezone: string
  recurrencePattern: string
  recurrenceConfig: any
  recurrenceDescription?: string
  seriesStartDate: string
  seriesEndDate: string
  status: string
  cancelledAt: string | null
  cancellationReason: string | null
  maxAttendees: number | null
  isFree: boolean
  price: number | null
  genres: string[]
  coverImage: string | null
  organizer: Organizer
  venue: Venue
  events: EventInstance[]
}

interface SeriesStats {
  totalEvents: number
  upcomingEvents: number
  completedEvents: number
  cancelledEvents: number
  nextEventDate: string | null
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

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Active',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  PAUSED: {
    label: 'Paused',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  },
  UPCOMING: {
    label: 'Upcoming',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  ONGOING: {
    label: 'Ongoing',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
}

export default function SeriesDetailPage() {
  const { isLoading: authLoading } = useRequireAuth()
  const params = useParams()
  const router = useRouter()
  const seriesId = params?.id as string
  const { user } = useAuth()
  const walletAddress = user?.walletAddress || null

  const [series, setSeries] = useState<EventSeries | null>(null)
  const [stats, setStats] = useState<SeriesStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  // Get current user ID
  useEffect(() => {
    const checkSession = async () => {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setCurrentUserId(data.user.id)
        }
      }
    }
    checkSession()
  }, [])

  useEffect(() => {
    if (seriesId) {
      loadSeries()
    }
  }, [seriesId])

  const loadSeries = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/event-series/${seriesId}`)

      if (!response.ok) {
        throw new Error('Failed to load series')
      }

      const data = await response.json()
      setSeries(data.series)
      setStats(data.stats)
    } catch (err: any) {
      console.error('Error loading series:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSeries = async () => {
    if (!series || !currentUserId) return

    try {
      setCancelling(true)
      setError(null)

      const userAddress = walletAddress || user?.username
      const response = await fetch(
        `/api/event-series/${seriesId}?requesterAddress=${encodeURIComponent(userAddress || '')}&reason=${encodeURIComponent(cancelReason)}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel series')
      }

      setShowCancelConfirm(false)
      await loadSeries()
    } catch (err: any) {
      console.error('Error cancelling series:', err)
      setError(err.message)
    } finally {
      setCancelling(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading series...</p>
        </div>
      </div>
    )
  }

  if (error && !series) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950">
          <h2 className="mb-4 text-2xl font-bold text-red-900 dark:text-red-100">Error</h2>
          <p className="mb-4 text-red-800 dark:text-red-200">{error}</p>
          <Link href="/events/series" className="text-blue-600 hover:underline dark:text-blue-400">
            ← Back to My Series
          </Link>
        </div>
      </div>
    )
  }

  if (!series) {
    return null
  }

  const isOrganizer =
    currentUserId === series.organizer.id ||
    (walletAddress &&
      series.organizer.walletAddress &&
      walletAddress.toLowerCase() === series.organizer.walletAddress.toLowerCase())

  const organizerName =
    series.organizer.displayName || series.organizer.username || 'Anonymous Organizer'

  const formatDate = (dateString: string) => {
    // Parse only the date part to avoid UTC midnight shifting the day backward in local timezones
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const formatEventDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const now = new Date()
  const upcomingEvents = series.events.filter(
    (e) => new Date(e.startDate) >= now && e.status !== 'CANCELLED'
  )
  const pastEvents = series.events.filter(
    (e) => new Date(e.startDate) < now || e.status === 'COMPLETED'
  )

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <Link href="/events/series" className="text-blue-600 hover:underline dark:text-blue-400">
            ← My Series
          </Link>
          <span className="text-gray-400">|</span>
          <Link href="/events" className="text-gray-600 hover:underline dark:text-gray-400">
            All Events
          </Link>
        </div>
      </div>

      {/* Cover Image */}
      {series.coverImage && (
        <div className="relative mb-6 h-48 w-full overflow-hidden rounded-lg md:h-64">
          <Image src={series.coverImage} alt={series.title} fill className="object-cover" />
        </div>
      )}

      {/* Badges */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          {EVENT_TYPE_LABELS[series.eventType] || series.eventType}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {series.recurrenceDescription || 'Recurring'}
        </span>
        <span
          className={`rounded-full px-4 py-2 text-sm font-medium ${STATUS_BADGES[series.status]?.className || 'bg-gray-100 text-gray-800'}`}
        >
          {STATUS_BADGES[series.status]?.label || series.status}
        </span>
      </div>

      {/* Title */}
      <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100">{series.title}</h1>

      {/* Error Display */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalEvents}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Events</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.upcomingEvents}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Upcoming</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.completedEvents}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {stats.cancelledEvents}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Cancelled</div>
          </div>
        </div>
      )}

      {/* Main Info Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Schedule */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">📅 Schedule</h2>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p>
                <strong>Time:</strong> {formatTime(series.startTime)} - {formatTime(series.endTime)}
              </p>
              <p>
                <strong>Runs:</strong> {formatDate(series.seriesStartDate)} -{' '}
                {formatDate(series.seriesEndDate)}
              </p>
              {stats?.nextEventDate && (
                <p>
                  <strong>Next Event:</strong> {formatDate(stats.nextEventDate)}
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">📍 Location</h2>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p className="font-medium">{series.venue.name}</p>
              <p>{series.venue.city}</p>
              {series.venue.address && <p className="text-sm">{series.venue.address}</p>}
              <Link
                href={`/venueDetails/${series.venue.id}`}
                className="inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                View Venue Details →
              </Link>
            </div>
          </div>

          {/* Organizer */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">
              👤 Organizer
            </h2>
            <div className="flex items-center gap-3">
              {series.organizer.avatar ? (
                <Image
                  src={series.organizer.avatar}
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
                {series.organizer.profileSlug && (
                  <Link
                    href={`/profile/${series.organizer.profileSlug}`}
                    className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    View Profile →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Description */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">
              About This Series
            </h2>
            <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
              {series.description}
            </p>
          </div>

          {/* Genres */}
          {series.genres.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">
                🎵 Music Genres
              </h2>
              <div className="flex flex-wrap gap-2">
                {series.genres.map((genre) => (
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
              {series.isFree ? (
                <span className="text-lg font-medium text-green-600 dark:text-green-400">
                  Free Events
                </span>
              ) : (
                <span className="text-lg font-medium">${series.price} per event</span>
              )}
            </p>
            {series.maxAttendees && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Max {series.maxAttendees} attendees per event
              </p>
            )}
          </div>

          {/* Organizer Actions */}
          {isOrganizer && series.status === 'ACTIVE' && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">
                ⚙️ Manage Series
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full rounded-md border border-red-300 bg-white px-4 py-2 text-red-600 hover:bg-red-50 dark:border-red-700 dark:bg-gray-800 dark:hover:bg-red-950"
                >
                  Cancel Series
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-6">
        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
              Upcoming Events ({upcomingEvents.length})
            </h2>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        #{event.seriesOccurrence}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {formatEventDateTime(event.startDate)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{event._count.rsvps} RSVPs</span>
                        {event.isSeriesException && (
                          <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            Edited
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGES[event.status]?.className || 'bg-gray-100 text-gray-800'}`}
                  >
                    {STATUS_BADGES[event.status]?.label || event.status}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
              Past Events ({pastEvents.length})
            </h2>
            <div className="space-y-3">
              {pastEvents.slice(0, 10).map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4 opacity-75 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        #{event.seriesOccurrence}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {formatEventDateTime(event.startDate)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {event._count.rsvps} attended
                      </div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGES[event.status]?.className || 'bg-gray-100 text-gray-800'}`}
                  >
                    {STATUS_BADGES[event.status]?.label || event.status}
                  </span>
                </Link>
              ))}
              {pastEvents.length > 10 && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  + {pastEvents.length - 10} more past events
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
            <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
              Cancel Series?
            </h3>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              This will cancel all future events in this series. Past events will remain for
              historical purposes.
            </p>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reason (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                placeholder="Why is this series being cancelled?"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
              >
                Keep Series
              </button>
              <button
                onClick={handleCancelSeries}
                disabled={cancelling}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Series'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
