'use client'

/**
 * WPB-201: Musicians Directory Page
 * Displays all musicians with profiles in a grid layout
 * Supports pagination, search, collab type filtering, and availability filtering
 */

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const PRESET_INSTRUMENTS = [
  'Piano (acoustic)',
  'Digital Piano / Keyboard',
  'Organ / Hammond',
  'Synthesizer',
  'Guitar (acoustic)',
  'Guitar (electric)',
  'Bass Guitar',
  'Violin',
  'Viola',
  'Cello',
  'Double Bass',
  'Ukulele',
  'Harp',
  'Flute',
  'Clarinet',
  'Saxophone',
  'Trumpet',
  'Trombone',
  'Drums / Percussion',
  'Vocals',
]

const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional']

const COLLAB_TYPE_OPTIONS = [
  { value: 'LYRICS', label: 'Lyrics' },
  { value: 'MELODY', label: 'Melody' },
  { value: 'CHORDS', label: 'Chords' },
  { value: 'ARRANGEMENTS', label: 'Arrangements' },
  { value: 'CHARTS_SCORES', label: 'Charts & scores' },
  { value: 'INSTRUMENT_PARTS', label: 'Instrument parts' },
  { value: 'VOCALS', label: 'Vocals' },
  { value: 'PRODUCTION', label: 'Production' },
  { value: 'MIXING', label: 'Mixing' },
]

interface MusicianProfile {
  instruments: string[]
  musicalStyles: string[]
  genres: string[]
  experienceLevel: string | null
  yearsPlaying: number | null
  availableForGigs: boolean
  availableForCollab: boolean
  collaborationTypes: string[]
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
  totalPXPEarned: number
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

  // Filters
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [activeCollabTypes, setActiveCollabTypes] = useState<string[]>([])
  const [availableForCollabOnly, setAvailableForCollabOnly] = useState(false)

  // Advanced search
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [filterInstruments, setFilterInstruments] = useState<string[]>([])
  const [filterExperience, setFilterExperience] = useState('')
  const [filterAvailableForGigs, setFilterAvailableForGigs] = useState(false)
  const [filterLocation, setFilterLocation] = useState('')
  const [filterInfluences, setFilterInfluences] = useState('')
  const [filterSongs, setFilterSongs] = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput)
      setCurrentPage(1)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchInput])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [
    activeCollabTypes,
    availableForCollabOnly,
    filterInstruments,
    filterExperience,
    filterAvailableForGigs,
    filterLocation,
    filterInfluences,
    filterSongs,
  ])

  useEffect(() => {
    loadMusicians(currentPage, search, activeCollabTypes, availableForCollabOnly)
  }, [
    currentPage,
    search,
    activeCollabTypes,
    availableForCollabOnly,
    filterInstruments,
    filterExperience,
    filterAvailableForGigs,
    filterLocation,
    filterInfluences,
    filterSongs,
  ])

  const loadMusicians = async (
    page: number,
    searchTerm: string,
    collabTypes: string[],
    availForCollab: boolean
  ) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (searchTerm) params.set('search', searchTerm)
      if (collabTypes.length) params.set('collabTypes', collabTypes.join(','))
      if (availForCollab) params.set('availableForCollab', 'true')
      if (filterInstruments.length) params.set('instruments', filterInstruments.join(','))
      if (filterExperience) params.set('experienceLevel', filterExperience)
      if (filterAvailableForGigs) params.set('availableForGigs', 'true')
      if (filterLocation.trim()) params.set('location', filterLocation.trim())
      if (filterInfluences.trim()) params.set('influences', filterInfluences.trim())
      if (filterSongs.trim()) params.set('songs', filterSongs.trim())

      const response = await fetch(`/api/musicians?${params}`)
      if (!response.ok) throw new Error('Failed to load musicians')

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

  const hasActiveFilters =
    search ||
    activeCollabTypes.length > 0 ||
    availableForCollabOnly ||
    filterInstruments.length > 0 ||
    filterExperience ||
    filterAvailableForGigs ||
    filterLocation ||
    filterInfluences ||
    filterSongs

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setActiveCollabTypes([])
    setAvailableForCollabOnly(false)
    setFilterInstruments([])
    setFilterExperience('')
    setFilterAvailableForGigs(false)
    setFilterLocation('')
    setFilterInfluences('')
    setFilterSongs('')
    setCurrentPage(1)
  }

  const toggleFilterInstrument = (instrument: string) => {
    setFilterInstruments((prev) =>
      prev.includes(instrument) ? prev.filter((i) => i !== instrument) : [...prev, instrument]
    )
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
            onClick={() =>
              loadMusicians(currentPage, search, activeCollabTypes, availableForCollabOnly)
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
      <div className="mb-6">
        <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-gray-100">
          🎸 Musicians Directory
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Discover talented musicians in the Global Piano Network community
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {/* Search input */}
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name…"
          className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />

        {/* Collab type chips — multiple selection */}
        <div className="flex flex-wrap gap-2">
          {COLLAB_TYPE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() =>
                setActiveCollabTypes((prev) =>
                  prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
                )
              }
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeCollabTypes.includes(value)
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Available for collabs toggle + clear */}
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={availableForCollabOnly}
              onChange={(e) => setAvailableForCollabOnly(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-teal-600"
            />
            Available for collaborations only
          </label>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline">
              Clear filters
            </button>
          )}
        </div>

        {/* Advanced Search toggle */}
        <button
          onClick={() => setAdvancedOpen((o) => !o)}
          className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400"
        >
          <span>Advanced Search</span>
          <span>{advancedOpen ? '▲' : '▼'}</span>
        </button>

        {advancedOpen && (
          <div className="space-y-4 border-t border-gray-200 pt-4 dark:border-gray-700">
            {/* Instruments */}
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                Instruments
              </p>
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                {PRESET_INSTRUMENTS.map((inst) => (
                  <label
                    key={inst}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={filterInstruments.includes(inst)}
                      onChange={() => toggleFilterInstrument(inst)}
                      className="h-4 w-4 rounded border-gray-300 text-teal-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{inst}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Experience level + Location */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Experience Level
                </label>
                <select
                  value={filterExperience}
                  onChange={(e) => setFilterExperience(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Any level</option>
                  {EXPERIENCE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Location
                </label>
                <input
                  type="text"
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  placeholder="City or region…"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Influences + Songs */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Influences
                </label>
                <input
                  type="text"
                  value={filterInfluences}
                  onChange={(e) => setFilterInfluences(e.target.value)}
                  placeholder="e.g. Chopin, Bill Evans…"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Songs / Repertoire
                </label>
                <input
                  type="text"
                  value={filterSongs}
                  onChange={(e) => setFilterSongs(e.target.value)}
                  placeholder="e.g. Moonlight Sonata…"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Available for gigs */}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={filterAvailableForGigs}
                onChange={(e) => setFilterAvailableForGigs(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-teal-600"
              />
              Available for gigs only
            </label>
          </div>
        )}
      </div>

      {/* Result count */}
      {pagination && (
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-500">
          {loading
            ? 'Loading…'
            : `Showing ${musicians.length} of ${pagination.totalCount} musicians`}
        </p>
      )}

      {/* Empty State */}
      {musicians.length === 0 && !loading && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 text-6xl">🎹</div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {hasActiveFilters ? 'No musicians match your filters' : 'No Musicians Yet'}
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            {hasActiveFilters ? (
              <button onClick={clearFilters} className="text-blue-600 hover:underline">
                Clear filters
              </button>
            ) : (
              'Be the first to create a musician profile!'
            )}
          </p>
          {!hasActiveFilters && (
            <Link
              href="/profile"
              className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              Create Your Profile
            </Link>
          )}
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

        {/* Collaboration types */}
        {profile.collaborationTypes && profile.collaborationTypes.length > 0 && (
          <div className="mb-3 flex flex-wrap justify-center gap-1">
            {profile.collaborationTypes.slice(0, 3).map((type) => (
              <span
                key={type}
                className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-800 dark:bg-teal-900 dark:text-teal-200"
              >
                {COLLAB_TYPE_OPTIONS.find((o) => o.value === type)?.label || type}
              </span>
            ))}
            {profile.collaborationTypes.length > 3 && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                +{profile.collaborationTypes.length - 3}
              </span>
            )}
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
