'use client'

/**
 * /groups — Group listing page
 * Public read access. CURATOR and BLOG_OWNER see "Create Group" button.
 */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { useRole } from '@/hooks/useRole'
import { useRequireAuth } from '@/hooks/useRequireAuth'

interface Owner {
  id: number
  displayName: string | null
  username: string | null
  avatar: string | null
  profileSlug: string | null
}

interface Group {
  id: number
  slug: string
  name: string
  description: string | null
  avatar: string | null
  isActive: boolean
  createdAt: string
  owner: Owner
  memberCount: number
  venueCount: number
}

function OwnerName(owner: Owner) {
  return owner.displayName || owner.username || `User #${owner.id}`
}

export default function GroupsPage() {
  const { isAuthenticated } = useAuth()
  const { isCurator, isBlogOwner } = useRole()
  const canCreate = isCurator || isBlogOwner
  const { isLoading: authLoading } = useRequireAuth()

  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '18' })
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await fetch(`/api/groups?${params}`)
      if (!res.ok) throw new Error('Failed to load groups')
      const data = await res.json()
      setGroups(data.groups ?? [])
      setTotalPages(data.pagination?.totalPages ?? 1)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Groups</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Communities of pianists, organisers, and venue regulars.
          </p>
        </div>
        {canCreate && (
          <Link
            href="/groups/create"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            + Create Group
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search groups by name or description…"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* States */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
            />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && groups.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">
            {debouncedSearch ? 'No groups match your search.' : 'No groups yet.'}
          </p>
          {canCreate && !debouncedSearch && (
            <Link
              href="/groups/create"
              className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Create the first group →
            </Link>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && groups.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/groups/${g.slug}`}
              className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-3">
                {g.avatar ? (
                  <Image
                    src={g.avatar}
                    alt={g.name}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {g.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                    {g.name}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    by {OwnerName(g.owner)}
                  </p>
                </div>
              </div>

              {/* Description */}
              {g.description && (
                <p className="mt-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                  {g.description}
                </p>
              )}

              {/* Stats */}
              <div className="mt-auto flex gap-4 pt-4 text-xs text-gray-500 dark:text-gray-400">
                <span>
                  👥 {g.memberCount} member{g.memberCount !== 1 ? 's' : ''}
                </span>
                <span>
                  📍 {g.venueCount} venue{g.venueCount !== 1 ? 's' : ''}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1 || loading}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-600"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages || loading}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-600"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
