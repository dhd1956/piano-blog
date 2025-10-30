'use client'

/**
 * WPB-201: Musicians Directory Page
 * Displays all musicians with profiles in a grid layout
 * Supports pagination
 */

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface MusicianProfile {
  instruments: string[]
  musicalStyles: string[]
  genres: string[]
  experienceLevel: string | null
  yearsPlaying: number | null
  availableForGigs: boolean
  availableForCollab: boolean
}

interface Musician {
  id: number
  walletAddress: string | null
  username: string | null
  displayName: string | null
  avatar: string | null
  location: string | null
  title: string | null
  profileSlug: string | null
  totalCAVEarned: number
  lastActive: Date
  musicianProfile: MusicianProfile
}

interface PaginationMeta {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasMore: boolean
}

export default function MusiciansPage() {
  const [musicians, setMusicians] = useState<Musician[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadMusicians(currentPage)
  }, [currentPage])

  const loadMusicians = async (page: number) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/musicians?page=${page}&limit=20`)

      if (!response.ok) {
        throw new Error('Failed to load musicians')
      }

      const data = await response.json()
      setMusicians(data.musicians)
      setPagination(data.pagination)
    } catch (err: any) {
      console.error('Error loading musicians:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getProfileUrl = (musician: Musician) => {
    if (musician.profileSlug) return `/profile/${musician.profileSlug}`
    if (musician.username) return `/profile/${musician.username}`
    if (musician.walletAddress) return `/profile/${musician.walletAddress}`
    return '#'
  }

  if (loading && musicians.length === 0) {
    return <MusiciansLoadingSkeleton />
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-red-900">Error Loading Musicians</h2>
          <p className="mb-4 text-red-800">{error}</p>
          <button
            onClick={() => loadMusicians(currentPage)}
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
        <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-gray-100">
          🎸 Musicians Directory
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Discover talented musicians in the Piano Style community
        </p>
        {pagination && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Showing {musicians.length} of {pagination.totalCount} musicians
          </p>
        )}
      </div>

      {/* Empty State */}
      {musicians.length === 0 && !loading && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 text-6xl">🎹</div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            No Musicians Yet
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Be the first to create a musician profile!
          </p>
          <Link
            href="/profile"
            className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            Create Your Profile
          </Link>
        </div>
      )}

      {/* Musicians Grid */}
      {musicians.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {musicians.map((musician) => (
              <MusicianCard key={musician.id} musician={musician} />
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

function MusicianCard({ musician }: { musician: Musician }) {
  const profile = musician.musicianProfile
  const displayName = musician.displayName || musician.username || 'Anonymous Musician'
  const profileUrl =
    musician.profileSlug || musician.username || musician.walletAddress || `user-${musician.id}`

  return (
    <Link href={`/profile/${profileUrl}`}>
      <div className="group h-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
        {/* Avatar */}
        <div className="mb-4 flex justify-center">
          {musician.avatar ? (
            <Image
              src={musician.avatar}
              alt={displayName}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full border-4 border-blue-600 object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-gray-300 bg-gray-100 text-4xl dark:border-gray-600 dark:bg-gray-700">
              👤
            </div>
          )}
        </div>

        {/* Name & Title */}
        <div className="mb-3 text-center">
          <h3 className="mb-1 text-lg font-bold text-gray-900 group-hover:text-blue-600 dark:text-gray-100">
            {displayName}
          </h3>
          {musician.title && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{musician.title}</p>
          )}
        </div>

        {/* Location */}
        {musician.location && (
          <div className="mb-3 flex items-center justify-center gap-1 text-sm text-gray-500 dark:text-gray-500">
            <span>📍</span>
            <span>{musician.location}</span>
          </div>
        )}

        {/* Instruments */}
        {profile.instruments && profile.instruments.length > 0 && (
          <div className="mb-3 flex flex-wrap justify-center gap-1">
            {profile.instruments.slice(0, 3).map((instrument) => (
              <span
                key={instrument}
                className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {instrument}
              </span>
            ))}
            {profile.instruments.length > 3 && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                +{profile.instruments.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Musical Styles */}
        {profile.musicalStyles && profile.musicalStyles.length > 0 && (
          <div className="mb-3 flex flex-wrap justify-center gap-1">
            {profile.musicalStyles.slice(0, 2).map((style) => (
              <span
                key={style}
                className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200"
              >
                {style}
              </span>
            ))}
          </div>
        )}

        {/* Availability Badges */}
        <div className="flex justify-center gap-2">
          {profile.availableForGigs && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
              <span className="text-green-600">✓</span>
              Gigs
            </span>
          )}
          {profile.availableForCollab && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <span className="text-blue-600">✓</span>
              Collabs
            </span>
          )}
        </div>

        {/* View Profile Button */}
        <div className="mt-4">
          <div className="w-full rounded-md bg-blue-600 py-2 text-center text-sm font-medium text-white group-hover:bg-blue-700">
            View Profile
          </div>
        </div>
      </div>
    </Link>
  )
}

function MusiciansLoadingSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <div className="mb-2 h-10 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-6 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-4 flex justify-center">
              <div className="h-24 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="mb-3 space-y-2">
              <div className="mx-auto h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="mx-auto h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="mb-3 flex justify-center gap-1">
              <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="mt-4">
              <div className="h-8 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
