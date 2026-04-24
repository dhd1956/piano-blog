'use client'

/**
 * Public Event Snapshot — no login required.
 * Linked from QR codes on event flyers/posters.
 */

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface EventSnapshot {
  id: number
  title: string
  description: string
  eventType: string
  startDate: string
  endDate: string
  isFree: boolean
  price: number | null
  status: string
  genres: string[]
  venue: { id: number; name: string; city: string }
  organizer: { displayName: string | null; username: string | null }
  rsvps: { status: string }[]
}

interface Stats {
  confirmedCount: number
  spotsRemaining: number | null
  isFull: boolean
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

export default function EventPreviewPage() {
  const params = useParams()
  const eventId = params.id as string
  const [event, setEvent] = useState<EventSnapshot | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!eventId) return
    fetch(`/api/events/${eventId}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true)
          setLoading(false)
          return null
        }
        if (!r.ok) {
          setLoading(false)
          return null
        }
        return r.json()
      })
      .then((data) => {
        if (data) {
          setEvent(data.event)
          setStats(data.stats)
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
        setNotFound(true)
      })
  }, [eventId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  if (notFound || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-6 dark:bg-gray-900">
        <p className="text-lg text-gray-600 dark:text-gray-400">Event not found.</p>
        <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">
          Explore Global Piano Network →
        </Link>
      </div>
    )
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-CA', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })

  const eventTypeLabel = EVENT_TYPE_LABELS[event.eventType] || '📌 Event'
  const organizerName = event.organizer.displayName || event.organizer.username || 'Organizer'
  const isCancelled = event.status === 'CANCELLED'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header CTA */}
      <div className="bg-blue-600 px-4 py-3 text-center text-sm text-white">
        Discover piano venues, events &amp; musicians —{' '}
        <Link href="/" className="font-semibold underline">
          Explore Global Piano Network
        </Link>
      </div>

      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="overflow-hidden rounded-2xl bg-white shadow-md dark:bg-gray-800">
          {/* Top stripe */}
          <div
            className={`px-6 py-6 ${isCancelled ? 'bg-gray-500' : 'bg-gradient-to-r from-purple-600 to-blue-600'}`}
          >
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white">
                {eventTypeLabel}
              </span>
              {isCancelled && (
                <span className="rounded-full bg-red-500 px-3 py-1 text-sm font-medium text-white">
                  Cancelled
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white">{event.title}</h1>
            <p className="mt-1 text-purple-100">{organizerName}</p>
          </div>

          <div className="space-y-5 px-6 py-6">
            {/* Date & Time */}
            <div>
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                Date &amp; Time
              </p>
              <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                {formatDate(event.startDate)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatTime(event.startDate)} – {formatTime(event.endDate)}
              </p>
            </div>

            {/* Venue */}
            <div>
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                Venue
              </p>
              <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                {event.venue.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{event.venue.city}</p>
            </div>

            {/* Pricing */}
            <div>
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                Admission
              </p>
              <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                {event.isFree ? (
                  <span className="text-green-600 dark:text-green-400">Free</span>
                ) : (
                  `$${event.price} CAD`
                )}
              </p>
            </div>

            {/* Attendance */}
            {stats && (
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Attendance
                </p>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  {stats.confirmedCount} going
                  {stats.isFull && (
                    <span className="ml-2 font-medium text-red-600 dark:text-red-400">· Full</span>
                  )}
                  {!stats.isFull && stats.spotsRemaining !== null && (
                    <span className="ml-2 text-gray-500">· {stats.spotsRemaining} spots left</span>
                  )}
                </p>
              </div>
            )}

            {/* Genres */}
            {event.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {event.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  About
                </p>
                <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {event.description.length > 200
                    ? `${event.description.slice(0, 200)}…`
                    : event.description}
                </p>
              </div>
            )}
          </div>

          {/* Footer CTAs */}
          <div className="border-t border-gray-100 px-6 py-4 dark:border-gray-700">
            {!isCancelled && (
              <Link
                href={`/auth/login?redirect=/events/${event.id}`}
                className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white hover:bg-blue-700"
              >
                Sign in to RSVP
              </Link>
            )}
            <Link
              href="/"
              className="mt-3 block text-center text-sm text-gray-500 hover:underline dark:text-gray-400"
            >
              New here? Explore Global Piano Network →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
