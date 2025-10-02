/**
 * QR Code Profile System Types
 * For venue and user profile QR code generation and scanning
 */

// Base QR code data structure
export interface BaseQRData {
  type: 'venue' | 'user' | 'payment'
  version: string // Format version for backward compatibility
  url: string // Web fallback URL
  timestamp?: number // Generation timestamp
}

// Venue QR Code Data
export interface VenueQRData extends BaseQRData {
  type: 'venue'
  data: {
    venueId: number
    slug: string
    name: string
    city: string
    address?: string
    description?: string // Brief venue description
    appDescription?: string // Description of the Piano Style app
    pianoInfo?: {
      hasPiano: boolean
      pianoType?: string
      condition?: string
    }
    operatingHours?: string
    contactInfo?: string
    website?: string
    socialLinks?: {
      facebook?: string
      instagram?: string
      twitter?: string
    }
  }
  payment?: PaymentData
}

// User Profile QR Code Data
export interface UserProfileQRData extends BaseQRData {
  type: 'user'
  data: {
    walletAddress: string
    username?: string
    displayName?: string
    profileSlug?: string
    bio?: string // Max 150 characters for QR size
    title?: string // Professional title/role
    avatar?: string // URL or IPFS hash
    stats: {
      totalPXPEarned: number
      venuesDiscovered: number
      verificationsCompleted?: number
    }
    badges?: UserBadge[]
    skills?: string[] // Max 5 skills
    socialLinks?: {
      twitter?: string
      linkedin?: string
      github?: string
      website?: string
    }
    publicProfile: boolean
  }
  payment?: PaymentData
}

// Payment information (optional for any QR code)
export interface PaymentData {
  address: string // Wallet address
  amount?: number // Optional pre-filled amount in PXP
  token: 'PXP'
  tokenAddress?: string // PXP token contract address
  chainId?: number
  memo?: string
}

// User achievement badges
export type UserBadge =
  | 'verified_curator'
  | 'top_scout'
  | 'early_adopter'
  | 'community_champion'
  | 'piano_virtuoso'
  | 'jam_host'
  | 'venue_partner'

export interface UserBadgeInfo {
  badge: UserBadge
  name: string
  description: string
  icon: string
  earnedAt?: Date
}

// QR Card Layout Types
export type QRCardLayout =
  | 'business-card' // 3.5" x 2"
  | 'postcard' // 4" x 6"
  | 'poster' // 8.5" x 11"
  | 'sticker' // 3" x 3"
  | 'table-tent' // 4" x 6" folded
  | 'badge' // 3" x 4" badge/lanyard size

export interface QRCardDimensions {
  width: number // in inches
  height: number // in inches
  unit: 'in' | 'cm' | 'px'
  dpi?: number // for print quality (default: 300)
}

export const QR_CARD_SIZES: Record<QRCardLayout, QRCardDimensions> = {
  'business-card': { width: 3.5, height: 2, unit: 'in', dpi: 300 },
  postcard: { width: 4, height: 6, unit: 'in', dpi: 300 },
  poster: { width: 8.5, height: 11, unit: 'in', dpi: 300 },
  sticker: { width: 3, height: 3, unit: 'in', dpi: 300 },
  'table-tent': { width: 4, height: 6, unit: 'in', dpi: 300 },
  badge: { width: 3, height: 4, unit: 'in', dpi: 300 },
}

// QR Card Theme/Styling
export interface QRCardTheme {
  primaryColor: string // Brand primary color
  secondaryColor: string // Accent color
  textColor: string // Main text color
  backgroundColor: string // Card background
  qrBackgroundColor?: string // QR code background (default: white)
  qrForegroundColor?: string // QR code foreground (default: black)
  fontFamily?: string
  logo?: string // URL or path to logo image
  showAppDescription?: boolean
  showBranding?: boolean
}

// Default themes
export const DEFAULT_THEMES: Record<string, QRCardTheme> = {
  piano: {
    primaryColor: '#1e3a8a', // Deep blue
    secondaryColor: '#fbbf24', // Amber
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    qrBackgroundColor: '#ffffff',
    qrForegroundColor: '#000000',
    showAppDescription: true,
    showBranding: true,
  },
  elegant: {
    primaryColor: '#4c1d95', // Purple
    secondaryColor: '#e879f9', // Pink
    textColor: '#374151',
    backgroundColor: '#faf5ff',
    showAppDescription: true,
    showBranding: true,
  },
  minimal: {
    primaryColor: '#000000',
    secondaryColor: '#6b7280',
    textColor: '#111827',
    backgroundColor: '#ffffff',
    showAppDescription: false,
    showBranding: false,
  },
  vibrant: {
    primaryColor: '#dc2626', // Red
    secondaryColor: '#ea580c', // Orange
    textColor: '#991b1b',
    backgroundColor: '#fef2f2',
    showAppDescription: true,
    showBranding: true,
  },
}

// QR Card Configuration
export interface QRCardConfig {
  layout: QRCardLayout
  theme: QRCardTheme
  includeDescription?: boolean
  includePayment?: boolean
  defaultPaymentAmount?: number
  qrCodeSize?: number // QR code size in pixels
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  printMarks?: {
    showBleed?: boolean // Printer bleed marks
    showCropMarks?: boolean // Crop/trim marks
    showColorBars?: boolean // Color calibration bars
  }
}

// Print-ready export options
export interface QRCardExportOptions {
  format: 'png' | 'pdf' | 'svg'
  quality?: number // 1-100 for PNG
  colorSpace?: 'RGB' | 'CMYK' // Color space for printing
  includeBleed?: boolean
  bleedSize?: number // in inches (typically 0.125)
  filename?: string
}

// QR Code generation result
export interface QRCodeGenerationResult {
  qrCodeDataURL: string // Base64 data URL
  qrData: VenueQRData | UserProfileQRData // Original data
  config: QRCardConfig
  generatedAt: Date
}

// QR Code scanning result
export interface QRCodeScanResult {
  success: boolean
  data?: VenueQRData | UserProfileQRData
  error?: string
  scannedAt: Date
}

// Analytics for QR code usage
export interface QRCodeAnalytics {
  qrCodeId: string
  type: 'venue' | 'user'
  entityId: number | string // Venue ID or user wallet address
  scans: number
  uniqueScans: number
  lastScanned?: Date
  scansByLocation?: Record<string, number> // Country/city breakdown
  scansByDevice?: Record<string, number> // Mobile/desktop
  conversions?: {
    profileViews: number
    paymentsInitiated: number
    paymentsCompleted: number
  }
}

// Deep link format
export type DeepLinkFormat = {
  scheme: string // e.g., 'pianostyle://'
  host: string // e.g., 'venue' or 'user'
  path: string // e.g., '/slug' or '/address'
  params?: Record<string, string> // Query parameters
}

// Helper functions
export function generateDeepLink(data: VenueQRData | UserProfileQRData): string {
  if (data.type === 'venue') {
    const params = new URLSearchParams()
    if (data.payment?.amount) {
      params.set('payment', data.payment.amount.toString())
    }
    return `pianostyle://venue/${data.data.slug}${params.toString() ? '?' + params.toString() : ''}`
  } else {
    // data.type === 'user'
    const params = new URLSearchParams()
    if (data.data.username) {
      params.set('username', data.data.username)
    }
    if (data.payment?.amount) {
      params.set('payment', data.payment.amount.toString())
    }
    return `pianostyle://user/${data.data.walletAddress}${params.toString() ? '?' + params.toString() : ''}`
  }
}

export function parseDeepLink(url: string): DeepLinkFormat | null {
  try {
    const urlObj = new URL(url)
    if (urlObj.protocol !== 'pianostyle:') {
      return null
    }

    return {
      scheme: urlObj.protocol,
      host: urlObj.hostname,
      path: urlObj.pathname,
      params: Object.fromEntries(urlObj.searchParams.entries()),
    }
  } catch {
    return null
  }
}

// Validation helpers
export function isValidVenueQRData(data: any): data is VenueQRData {
  return (
    data &&
    data.type === 'venue' &&
    data.data &&
    typeof data.data.venueId === 'number' &&
    typeof data.data.slug === 'string' &&
    typeof data.data.name === 'string'
  )
}

export function isValidUserProfileQRData(data: any): data is UserProfileQRData {
  return (
    data &&
    data.type === 'user' &&
    data.data &&
    typeof data.data.walletAddress === 'string' &&
    /^0x[a-fA-F0-9]{40}$/.test(data.data.walletAddress)
  )
}

// Badge definitions
export const BADGE_DEFINITIONS: Record<UserBadge, Omit<UserBadgeInfo, 'badge' | 'earnedAt'>> = {
  verified_curator: {
    name: 'Verified Curator',
    description: 'Authorized to verify venues',
    icon: '✅',
  },
  top_scout: {
    name: 'Top Scout',
    description: 'Discovered 10+ verified venues',
    icon: '🔍',
  },
  early_adopter: {
    name: 'Early Adopter',
    description: 'One of the first 100 users',
    icon: '🌟',
  },
  community_champion: {
    name: 'Community Champion',
    description: 'Active community contributor',
    icon: '🏆',
  },
  piano_virtuoso: {
    name: 'Piano Virtuoso',
    description: 'Professional pianist',
    icon: '🎹',
  },
  jam_host: {
    name: 'Jam Host',
    description: 'Regularly hosts jam sessions',
    icon: '🎵',
  },
  venue_partner: {
    name: 'Venue Partner',
    description: 'Verified venue owner/manager',
    icon: '🤝',
  },
}
