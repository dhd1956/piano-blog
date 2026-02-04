/**
 * Event Type Definitions
 *
 * Centralized type definitions for events in the Piano Blog application.
 * These types match the Prisma Event model and include computed fields from the API.
 */

export interface Event {
  id: number
  title: string
  description: string
  eventType: EventType
  startDate: string
  endDate: string
  status: EventStatus
  venueId: number
  address: string | null
  latitude: number | null
  longitude: number | null
  timezone: string | null
  maxAttendees: number | null
  requireApproval: boolean
  isPublic: boolean
  isFree: boolean
  price: number | null
  genres: string[]
  tags: string[]
  coverImage: string | null
  externalLink: string | null
  streamingLink: string | null
  cancelledAt: string | null
  cancellationReason: string | null
  createdAt: string
  updatedAt: string

  // Series fields (optional - null for standalone events)
  seriesId?: number | null
  series?: EventSeries | null
  seriesOccurrence?: number | null
  isSeriesException?: boolean

  // Computed fields from API
  totalAttendees?: number
  spotsRemaining?: number
  isFull?: boolean
  confirmedCount?: number
  pendingCount?: number
  maybeCount?: number
}

export type EventType =
  | 'JAM_SESSION'
  | 'GIG'
  | 'CONCERT'
  | 'RECITAL'
  | 'OPEN_MIC'
  | 'WORKSHOP'
  | 'MASTERCLASS'
  | 'REHEARSAL'
  | 'MEETUP'
  | 'OTHER'

export type EventStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'

export interface EventRSVP {
  id: number
  eventId: number
  userId: number
  status: RSVPStatus
  attendeeCount: number
  notes: string | null
  respondedAt: string
  createdAt: string
  updatedAt: string
}

export type RSVPStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'MAYBE' | 'WAITLIST'

// Recurrence types for EventSeries
export type RecurrencePattern = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'WEEKDAYS'

export type EventSeriesStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED'

/**
 * Recurrence configuration based on pattern type
 *
 * DAILY: { interval: 1 } - every day, { interval: 2 } - every 2 days
 * WEEKLY: { daysOfWeek: [6] } - every Saturday (0=Sun, 6=Sat)
 * MONTHLY: { dayOfMonth: 15 } - 15th of month, or { weekOfMonth: 1, dayOfWeek: 6 } - 1st Saturday
 * WEEKDAYS: {} - no config needed (Mon-Fri implied)
 */
export interface RecurrenceConfig {
  interval?: number // DAILY: every N days
  daysOfWeek?: number[] // WEEKLY: 0-6 (Sun-Sat)
  dayOfMonth?: number // MONTHLY: 1-31
  weekOfMonth?: number // MONTHLY: 1-4 (or 5 for "last")
  dayOfWeek?: number // MONTHLY: 0-6 for Nth weekday pattern
}

/**
 * Compact event interface for list displays
 * Used in event cards and venue pages
 */
export interface EventSummary {
  id: number
  title: string
  eventType: EventType
  startDate: string
  endDate: string
  status: EventStatus
  maxAttendees: number | null
  genres: string[]
  totalAttendees?: number
  isFull?: boolean
}

/**
 * Event with organizer and venue details
 * Used in event detail pages
 */
export interface EventWithDetails extends Event {
  organizer: {
    id: number
    walletAddress: string
    username: string | null
    displayName: string | null
  }
  venue: {
    id: number
    name: string
    slug: string
    city: string
    address: string | null
  }
  rsvps?: EventRSVP[]
}

/**
 * EventSeries - Template for recurring events
 * Spawns individual Event instances based on recurrence pattern
 */
export interface EventSeries {
  id: number
  organizerId: number
  organizer?: {
    id: number
    walletAddress: string | null
    username: string | null
    displayName: string | null
    avatar: string | null
    profileSlug: string | null
  }

  // Template fields
  title: string
  description: string
  eventType: EventType
  venueId: number
  venue?: {
    id: number
    name: string
    slug: string
    city: string
    address: string | null
  }

  // Time template
  startTime: string // "19:00"
  endTime: string // "21:00"
  timezone: string

  // Event settings
  maxAttendees: number | null
  requireApproval: boolean
  isPublic: boolean
  isFree: boolean
  price: number | null
  genres: string[]
  coverImage: string | null
  externalLink: string | null
  streamingLink: string | null

  // Recurrence configuration
  recurrencePattern: RecurrencePattern
  recurrenceConfig: RecurrenceConfig
  seriesStartDate: string
  seriesEndDate: string

  // Status
  status: EventSeriesStatus
  cancelledAt: string | null
  cancellationReason: string | null

  // Metadata
  createdAt: string
  updatedAt: string

  // Relations
  events?: Event[]

  // Computed fields
  totalEvents?: number
  upcomingEvents?: number
  completedEvents?: number
  nextEventDate?: string | null
}

/**
 * Compact series interface for list displays
 */
export interface EventSeriesSummary {
  id: number
  title: string
  eventType: EventType
  recurrencePattern: RecurrencePattern
  seriesStartDate: string
  seriesEndDate: string
  status: EventSeriesStatus
  venue?: {
    id: number
    name: string
    city: string
  }
  totalEvents?: number
  upcomingEvents?: number
  nextEventDate?: string | null
}
