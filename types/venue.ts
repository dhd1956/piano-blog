/**
 * Venue-related TypeScript interfaces and types
 * for the Piano Style Platform
 */

// Basic venue data structure matching smart contract
export interface VenueContract {
  hasPiano: boolean
  hasJamSession: boolean
  verified: boolean
  venueType: number
  submissionTimestamp: number
  verificationTimestamp: number
  submittedBy: string
  verifiedBy?: string
  lastUpdatedBy?: string
  name: string
  city: string
  fullAddress?: string
  contactType: string
  contactInfo?: string
  ipfsHash: string
  lastUpdatedTimestamp?: number
  curatorNotes?: string
}

// Extended venue data with processed/computed fields
export interface Venue {
  id: number
  name: string
  city: string
  fullAddress: string
  hasPiano: boolean
  hasJamSession: boolean
  verified: boolean
  venueType: number
  contactType: string
  contactInfo: string
  ipfsHash: string
  submittedBy: string
  verifiedBy?: string
  lastUpdatedBy: string
  submissionDate: Date
  verificationDate?: Date
  lastUpdatedDate?: Date
  curatorNotes: string
}

// Extended venue metadata stored on IPFS
export interface VenueMetadata {
  // Basic venue information
  venueDetails: {
    fullName: string
    description: string
    fullAddress: string
    city: string
    contactInfo?: string
    contactType?: string
    website?: string
    socialMedia?: {
      facebook?: string
      instagram?: string
      twitter?: string
    }
  }

  // Musical information
  musicalInfo: {
    hasPiano: boolean
    hasJamSession: boolean
    pianoType?: 'upright' | 'grand' | 'digital' | 'electric' | 'keyboard'
    pianoCondition?: 'excellent' | 'good' | 'fair' | 'needs_tuning' | 'poor'
    pianoBrand?: string
    pianoModel?: string
    lastTuned?: string
    pianoNotes?: string

    // Jam session details
    jamSchedule?: string
    jamFrequency?: 'daily' | 'weekly' | 'monthly' | 'occasional' | 'by_request'
    jamGenres?: string[]
    jamRequirements?: string
    jamContactInfo?: string
  }

  // Operational information
  operationalInfo: {
    operatingHours?: {
      monday?: string
      tuesday?: string
      wednesday?: string
      thursday?: string
      friday?: string
      saturday?: string
      sunday?: string
      notes?: string
    }
    accessibility?: {
      wheelchairAccessible: boolean
      parkingAvailable: boolean
      publicTransportNear: boolean
      notes?: string
    }
    ambiance?: {
      noiseLevel?: 'quiet' | 'moderate' | 'lively' | 'loud'
      lighting?: 'dim' | 'moderate' | 'bright'
      atmosphere?: string
      musicPolicy?: string
    }
  }

  // Submission/verification metadata
  submissionInfo: {
    submittedBy: string
    submissionDate: string
    verified: boolean
    verificationDate?: string
    verifiedBy?: string

    // Version control
    version: number
    lastUpdated: string
    lastUpdatedBy?: string

    // Media
    photos?: string[]
    videos?: string[]
    audioSamples?: string[]
  }

  // Curator-specific information
  curatorInfo?: {
    curatorNotes?: string
    verificationNotes?: string
    curatorRating?: number
    recommendedFor?: string[]
    warningsOrConcerns?: string
    followUpNeeded?: boolean
    followUpDate?: string
  }
}

// Form data for venue submission
export interface VenueSubmissionForm {
  // Basic information
  name: string
  city: string
  fullAddress: string
  venueType: number
  contactType: string
  contactInfo: string
  description: string

  // Features
  hasPiano: boolean
  hasJamSession: boolean

  // Extended information
  website?: string
  pianoType?: string
  pianoCondition?: string
  pianoBrand?: string
  lastTuned?: string
  jamSchedule?: string
  jamFrequency?: string
  jamGenres?: string
  operatingHours?: string
  specialNotes?: string

  // Social media
  facebook?: string
  instagram?: string
  twitter?: string

  // Accessibility
  wheelchairAccessible?: boolean
  parkingAvailable?: boolean
  publicTransportNear?: boolean

  // Media uploads (file paths or base64)
  photos?: File[] | string[]
  videos?: File[] | string[]
}

// Form data for venue updates (by curators)
export interface VenueUpdateForm extends Omit<VenueSubmissionForm, 'venueType'> {
  venueType: number
  curatorNotes?: string
  verificationStatus?: boolean
  curatorRating?: number
  recommendedFor?: string[]
  warningsOrConcerns?: string
  followUpNeeded?: boolean
  followUpDate?: string
}

// Venue display/search filters
export interface VenueFilters {
  city?: string
  verified?: boolean
  hasPiano?: boolean
  hasJamSession?: boolean
  venueType?: number | number[]
  pianoCondition?: string[]
  searchQuery?: string
}

// Venue statistics
export interface VenueStats {
  total: number
  verified: number
  withPiano: number
  withJamSessions: number
  byCity: Record<string, number>
  byType: Record<number, number>
  recentSubmissions: number
  pendingVerification: number
}

// Curator-specific interfaces
export interface CuratorPermissions {
  canVerify: boolean
  canEdit: boolean
  canDelete: boolean
  canAssignCurators: boolean
  canViewAllVenues: boolean
  canViewPending: boolean
  canUpdateMetadata: boolean
}

export interface CuratorProfile {
  address: string
  isActive: boolean
  permissions: CuratorPermissions
  verificationsCount: number
  joinDate: Date
  lastActive: Date
  specialties?: string[]
  region?: string
  notes?: string
}

// API response types
export interface VenueApiResponse {
  success: boolean
  data?: Venue | Venue[]
  error?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface MetadataApiResponse {
  success: boolean
  data?: VenueMetadata
  error?: string
  ipfsHash?: string
}

// Blockchain transaction types
export interface VenueTransaction {
  venueId: number
  action: 'submit' | 'verify' | 'update' | 'reject'
  transactionHash: string
  blockNumber: number
  timestamp: Date
  gasUsed: number
  from: string
  to: string
  status: 'pending' | 'confirmed' | 'failed'
}

// Event log types for smart contract events
export interface VenueEventLog {
  event: string
  venueId: number
  address: string
  timestamp: Date
  transactionHash: string
  blockNumber: number
  args: Record<string, any>
}

// Constants
export const VENUE_TYPES = [
  'Cafe',
  'Restaurant',
  'Bar',
  'Club',
  'Community Center',
  'Hotel/Resort',
  'Music School',
  'Church/Religious',
  'Library',
  'Other',
] as const

export const PIANO_TYPES = ['upright', 'grand', 'digital', 'electric', 'keyboard'] as const

export const PIANO_CONDITIONS = ['excellent', 'good', 'fair', 'needs_tuning', 'poor'] as const

export const JAM_FREQUENCIES = ['daily', 'weekly', 'monthly', 'occasional', 'by_request'] as const

export const NOISE_LEVELS = ['quiet', 'moderate', 'lively', 'loud'] as const

// Type guards
export function isValidVenueType(type: number): boolean {
  return type >= 0 && type < VENUE_TYPES.length
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Utility types
export type VenueTypeKey = keyof typeof VENUE_TYPES
export type PianoType = (typeof PIANO_TYPES)[number]
export type PianoCondition = (typeof PIANO_CONDITIONS)[number]
export type JamFrequency = (typeof JAM_FREQUENCIES)[number]
export type NoiseLevel = (typeof NOISE_LEVELS)[number]

// Database/persistence types (for future local storage or backend)
export interface VenueDatabaseRecord extends Venue {
  createdAt: Date
  updatedAt: Date
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error'
  localChanges?: Partial<Venue>
}
