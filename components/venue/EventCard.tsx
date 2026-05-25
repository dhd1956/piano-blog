'use client'

import Link from 'next/link'
import { EventSummary } from '@/types/event'
import { tzLabel } from '@/lib/timezone-label'

interface EventCardProps {
  event: EventSummary
  venueProvince?: string | null
  venueCountry?: string | null
}

export default function EventCard({ event, venueProvince, venueCountry }: EventCardProps) {
  const eventDate = new Date(event.startDate)
  const tz = tzLabel({ province: venueProvince, country: venueCountry })
  const formattedDate =
    eventDate.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ', ' +
    eventDate.toLocaleTimeString('en-US', {
      timeZone: 'UTC',
      hour: 'numeric',
      minute: '2-digit',
    }) +
    (tz ? ` ${tz}` : '')

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      JAM_SESSION: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      GIG: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      CONCERT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      RECITAL: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      OPEN_MIC: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      WORKSHOP: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      MASTERCLASS: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      REHEARSAL: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      MEETUP: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    }
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ')
  }

  return (
    <Link
      href={`/events/${event.id}`}
      className="block rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Title */}
          <h4 className="truncate font-medium text-gray-900 dark:text-gray-100">{event.title}</h4>

          {/* Date and time */}
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">📅 {formattedDate}</p>

          {/* Genres (if available) */}
          {event.genres && event.genres.length > 0 && (
            <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-500">
              🎵 {event.genres.slice(0, 3).join(', ')}
            </p>
          )}
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          {/* Event type badge */}
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap ${getEventTypeColor(event.eventType)}`}
          >
            {formatEventType(event.eventType)}
          </span>

          {/* Attendance indicator */}
          {event.maxAttendees && (
            <span
              className={`text-xs whitespace-nowrap ${event.isFull ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}
            >
              {event.totalAttendees || 0}/{event.maxAttendees}
              {event.isFull && ' (Full)'}
            </span>
          )}

          {/* Status badge (if cancelled) */}
          {event.status === 'CANCELLED' && (
            <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
              Cancelled
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
