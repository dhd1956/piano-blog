/**
 * Leaderboard Types
 * For PXP ranking and community leaderboard features
 */

export interface LeaderboardEntry {
  rank: number
  userId: number
  displayName: string
  username?: string
  avatar?: string
  location?: string
  totalPXPEarned: number
  badges: string[]
  venuesDiscovered: number
  reviewCount: number
  profileIdentifier: string // walletAddress, username, or profileSlug for profile link
}

export interface LeaderboardPagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasMore: boolean
}

export interface CurrentUserRank {
  rank: number
  entry: LeaderboardEntry
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[]
  pagination: LeaderboardPagination
  currentUser?: CurrentUserRank
}

export type TimeFrame = 'all' | 'month' | 'week'

export interface LeaderboardFilters {
  timeframe?: TimeFrame
  page?: number
  limit?: number
}
