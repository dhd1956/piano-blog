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
