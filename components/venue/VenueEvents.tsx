'use client'

import { useState, useEffect, useCallback } from 'react'
import EventCard from './EventCard'
import { EventSummary } from '@/types/event'

interface VenueEventsProps {
  venueId: number
  venueName: string
}

export default function VenueEvents({ venueId, venueName }: VenueEventsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/events?venueId=${venueId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }

      const data = await response.json()

      // Filter for upcoming + recent past (30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const filtered = (data.events || []).filter((event: EventSummary) => {
        const eventDate = new Date(event.startDate)
        return eventDate >= thirtyDaysAgo
      })

      // Sort by start date (earliest first)
      filtered.sort((a: EventSummary, b: EventSummary) => {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      })

      setEvents(filtered)
    } catch (err) {
      console.error('Error fetching events:', err)
      setError('Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [venueId])

  // Fetch events on mount to display correct count immediately
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* Header with expand/collapse button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left hover:opacity-80 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-900"
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} upcoming events section`}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          🎵 Upcoming Events
        </h3>
        <div className="flex items-center gap-2">
          {!loading && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {events.length} event{events.length !== 1 ? 's' : ''}
            </span>
          )}
          <svg
            className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="mt-4 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <p className="ml-3 text-sm text-gray-600 dark:text-gray-400">Loading events...</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No upcoming events at this venue. Check back soon!
              </p>
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <>
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
