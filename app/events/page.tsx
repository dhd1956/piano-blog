'use client'

/**
 * WPB-210: Events Directory Page
 * Displays all upcoming events with filtering and search
 */

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRequireAuth } from '@/hooks/useRequireAuth'

interface Organizer {
  id: number
  displayName: string | null
  username: string | null
  avatar: string | null
  profileSlug: string | null
}

interface Venue {
  id: number
  name: string
  city: string
  address: string | null
  slug: string
}

interface Event {
  id: number
  title: string
  description: string
  eventType: string
  startDate: string
  endDate: string
  address: string | null
  isFree: boolean
  price: number | null
  coverImage: string | null
  genres: string[]
  tags: string[]
  status: string
  totalAttendees: number
  spotsRemaining: number | null
  isFull: boolean
  organizer: Organizer
  venue: Venue
}

interface PaginationMeta {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasMore: boolean
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

// Helper functions for date formatting
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function EventsPage() {
  // Require authentication to access this page
  const { isLoading: authLoading } = useRequireAuth()

  const [events, setEvents] = useState<Event[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('UPCOMING')
  const [venueNameInput, setVenueNameInput] = useState('')
  const [venueName, setVenueName] = useState('')
  const [city, setCity] = useState('')
  const [cityInput, setCityInput] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce venue name and city inputs
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setVenueName(venueNameInput)
      setCity(cityInput)
      setCurrentPage(1)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [venueNameInput, cityInput])

  useEffect(() => {
    loadEvents(currentPage, filterType, filterStatus, venueName, city, dateFrom, dateTo)
  }, [currentPage, filterType, filterStatus, venueName, city, dateFrom, dateTo])

  const hasActiveFilters =
    filterType || filterStatus !== 'UPCOMING' || venueName || city || dateFrom || dateTo

  const clearFilters = () => {
    setFilterType('')
    setFilterStatus('UPCOMING')
    setVenueNameInput('')
    setVenueName('')
    setCityInput('')
    setCity('')
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
  }

  const loadEvents = async (
    page: number,
    eventType: string,
    status: string,
    venueNameFilter: string,
    cityFilter: string,
    dateFromFilter: string,
    dateToFilter: string
  ) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({ page: String(page), limit: '12' })
      if (eventType) params.set('type', eventType)
      if (status) params.set('status', status)
      if (venueNameFilter) params.set('venueName', venueNameFilter)
      if (cityFilter) params.set('city', cityFilter)
      if (dateFromFilter) params.set('dateFrom', dateFromFilter)
      if (dateToFilter) params.set('dateTo', dateToFilter)

      const response = await fetch(`/api/events?${params}`)

      if (!response.ok) {
        throw new Error('Failed to load events')
      }

      const data = await response.json()
      setEvents(data.events)
      setPagination(data.pagination)
    } catch (err: any) {
      console.error('Error loading events:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || (loading && pagination === null)) {
    return <EventsLoadingSkeleton />
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950">
          <h2 className="mb-4 text-2xl font-bold text-red-900 dark:text-red-100">
            Error Loading Events
          </h2>
          <p className="mb-4 text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={() =>
              loadEvents(currentPage, filterType, filterStatus, venueName, city, dateFrom, dateTo)
            }
            className="rounded-md bg-red-600 px-6 py-2 text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-gray-100">🎵 Events</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Find and share live music events with musicians and piano lovers around the world
        </p>
        {pagination && (
          <p className="mt-2 text-sm text-gray-500">
            Showing {events.length} of {pagination.totalCount} events
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {/* Text filters row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={venueNameInput}
            onChange={(e) => setVenueNameInput(e.target.value)}
            placeholder="Filter by club / venue name…"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="Filter by city…"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>

        {/* Date range row */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-gray-600 dark:text-gray-400">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              setCurrentPage(1)
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <label className="text-sm text-gray-600 dark:text-gray-400">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              setCurrentPage(1)
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline">
              Clear all filters
            </button>
          )}
        </div>

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'UPCOMING', label: 'Upcoming' },
            { value: 'PAST', label: 'Past' },
            { value: 'CANCELLED', label: 'Cancelled' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => {
                setFilterStatus(value)
                setCurrentPage(1)
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                filterStatus === value
                  ? value === 'CANCELLED'
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Event type chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setFilterType('')
              setCurrentPage(1)
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              filterType === ''
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            All types
          </button>
          {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => {
                setFilterType(value)
                setCurrentPage(1)
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                filterType === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Create Event Button */}
      <div className="mb-6">
        <Link
          href="/events/create"
          className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          + Create Event
        </Link>
      </div>

      {/* Empty State */}
      {events.length === 0 && !loading && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 text-6xl">🎹</div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {hasActiveFilters ? 'No events match your filters' : 'No Events Yet'}
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            {hasActiveFilters ? (
              <button onClick={clearFilters} className="text-blue-600 hover:underline">
                Clear filters
              </button>
            ) : (
              'Be the first to create an event in the Global Piano Network community!'
            )}
          </p>
          <Link
            href="/events/create"
            className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            Create Event
          </Link>
        </div>
      )}

      {/* Events Grid */}
      {events.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`rounded-md px-4 py-2 ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                {pagination.totalPages > 5 && <span className="text-gray-500">...</span>}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function EventCard({ event }: { event: Event }) {
  const eventTypeLabel = EVENT_TYPE_LABELS[event.eventType] || '📌 Event'
  const organizerName =
    event.organizer.displayName || event.organizer.username || 'Anonymous Organizer'
  const location = event.venue.name // Venue is always required now

  return (
    <div className="group h-full rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      {/* Card body — clicking navigates to event detail */}
      <Link href={`/events/${event.id}`} className="block">
        {/* Cover Image */}
        {event.coverImage && (
          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
            <Image
              src={event.coverImage}
              alt={event.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}

        <div className="p-6">
          {/* Event Type Badge + Cancelled Badge */}
          <div className="mb-2 flex flex-wrap gap-1.5">
            <span className="inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              {eventTypeLabel}
            </span>
            {event.status === 'CANCELLED' && (
              <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/50 dark:text-red-300">
                🚫 Cancelled
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="mb-2 text-xl font-bold text-gray-900 group-hover:text-blue-600 dark:text-gray-100">
            {event.title}
          </h3>

          {/* Date & Time */}
          <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <span>📅</span>
              <span>{formatDate(event.startDate)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🕐</span>
              <span>{formatTime(event.startDate)}</span>
            </div>
          </div>

          {/* Location */}
          <div className="mb-3 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <span>📍</span>
            <span className="truncate">{location}</span>
          </div>

          {/* Organizer */}
          <div className="mb-3 flex items-center gap-2">
            {event.organizer.avatar ? (
              <Image
                src={event.organizer.avatar}
                alt={organizerName}
                width={24}
                height={24}
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-xs dark:bg-gray-600">
                👤
              </div>
            )}
            <span className="text-sm text-gray-600 dark:text-gray-400">by {organizerName}</span>
          </div>

          {/* Genres */}
          {event.genres.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {event.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Attendance Info */}
          <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {event.totalAttendees} attending
              {event.spotsRemaining !== null && ` • ${event.spotsRemaining} spots left`}
            </div>
            {event.isFull && (
              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                Full
              </span>
            )}
            {!event.isFree && event.price && (
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                ${event.price}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Action footer — matches venues page style */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <Link
            href={`/events/${event.id}`}
            className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium underline"
          >
            View Details
          </Link>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              [event.venue.name, event.venue.address, event.venue.city].filter(Boolean).join(', ')
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
          >
            🗺️ Visit Venue
          </a>
        </div>
      </div>
    </div>
  )
}

function EventsLoadingSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <div className="mb-2 h-10 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-6 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-2 h-6 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
            <div className="mb-2 h-6 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="mb-3 h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="mb-3 h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-8 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
