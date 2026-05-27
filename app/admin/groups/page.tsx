'use client'

/**
 * /admin/groups — Admin group management (BLOG_OWNER only)
 * Table of all groups (including inactive) with inline expand panels
 * for venue assignment and member management.
 * Mirrors the pattern of /admin/users.
 */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

interface UserSummary {
  id: number
  displayName: string | null
  username: string | null
  avatar: string | null
  profileSlug: string | null
  walletAddress: string | null
}

interface VenueSummary {
  id: number
  name: string
  city: string
  province: string | null
  country: string | null
  isVirtual: boolean
  slug: string
}

interface GroupMemberEntry {
  groupId: number
  userId: number
  addedAt: string
  user: UserSummary
}

interface GroupVenueEntry {
  groupId: number
  venueId: number
  addedAt: string
  venue: VenueSummary
}

interface GroupDetail {
  id: number
  slug: string
  name: string
  description: string | null
  avatar: string | null
  isActive: boolean
  createdAt: string
  ownerId: number
  owner: UserSummary
  members: GroupMemberEntry[]
  venues: GroupVenueEntry[]
}

interface GroupSummary {
  id: number
  slug: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  owner: UserSummary
  memberCount: number
  venueCount: number
}

function userName(u: UserSummary) {
  return u.displayName || u.username || `User #${u.id}`
}

export default function AdminGroupsPage() {
  const { user, isAuthenticated } = useAuth()
  const isBlogOwner = user?.role === 'BLOG_OWNER'

  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  // Expanded group panel
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)
  const [expandedGroup, setExpandedGroup] = useState<GroupDetail | null>(null)
  const [expandLoading, setExpandLoading] = useState(false)

  // Add member in expanded panel
  const [memberInput, setMemberInput] = useState('')
  const [memberAdding, setMemberAdding] = useState(false)
  const [memberError, setMemberError] = useState<string | null>(null)

  // Link venue in expanded panel
  const [venueInput, setVenueInput] = useState('')
  const [venueAdding, setVenueAdding] = useState(false)
  const [venueError, setVenueError] = useState<string | null>(null)

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (!showInactive) params.set('active', 'true')
      // Admin view: fetch both active and inactive
      const [activeRes, inactiveRes] = await Promise.all([
        fetch(`/api/groups?limit=200`, { credentials: 'include' }),
        showInactive
          ? fetch(`/api/groups?limit=200&includeInactive=true`, { credentials: 'include' })
          : Promise.resolve(null),
      ])
      const activeData = await activeRes.json()
      const all: GroupSummary[] = activeData.groups ?? []
      // Note: The current API only returns isActive:true groups. For admin we
      // show a toggle that fetches inactive via a separate admin endpoint when built.
      // For now show all active groups.
      setGroups(all)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [showInactive])

  useEffect(() => {
    if (isBlogOwner) fetchGroups()
  }, [isBlogOwner, fetchGroups])

  const openPanel = async (slug: string) => {
    if (expandedSlug === slug) {
      setExpandedSlug(null)
      setExpandedGroup(null)
      return
    }
    setExpandedSlug(slug)
    setExpandedGroup(null)
    setMemberInput('')
    setMemberError(null)
    setVenueInput('')
    setVenueError(null)
    setExpandLoading(true)
    try {
      const res = await fetch(`/api/groups/${slug}`, { credentials: 'include' })
      const data = await res.json()
      setExpandedGroup(data.group ?? null)
    } catch {
      // Silent
    } finally {
      setExpandLoading(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expandedSlug || !memberInput.trim()) return
    setMemberAdding(true)
    setMemberError(null)
    try {
      const res = await fetch(`/api/groups/${expandedSlug}/members`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIdentifier: memberInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add member')
      setMemberInput('')
      // Refresh detail
      const r2 = await fetch(`/api/groups/${expandedSlug}`, { credentials: 'include' })
      const d2 = await r2.json()
      setExpandedGroup(d2.group ?? null)
      // Update summary counts
      setGroups((prev) =>
        prev.map((g) =>
          g.slug === expandedSlug
            ? { ...g, memberCount: d2.group?.members?.length ?? g.memberCount }
            : g
        )
      )
    } catch (err: any) {
      setMemberError(err.message)
    } finally {
      setMemberAdding(false)
    }
  }

  const handleRemoveMember = async (userId: number) => {
    if (!expandedSlug) return
    try {
      await fetch(`/api/groups/${expandedSlug}/members`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      setExpandedGroup((prev) =>
        prev ? { ...prev, members: prev.members.filter((m) => m.userId !== userId) } : prev
      )
      setGroups((prev) =>
        prev.map((g) =>
          g.slug === expandedSlug ? { ...g, memberCount: Math.max(0, g.memberCount - 1) } : g
        )
      )
    } catch {
      // Silent
    }
  }

  const handleLinkVenue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expandedSlug) return
    const venueId = parseInt(venueInput.trim())
    if (isNaN(venueId)) {
      setVenueError('Enter a valid venue ID.')
      return
    }
    setVenueAdding(true)
    setVenueError(null)
    try {
      const res = await fetch(`/api/groups/${expandedSlug}/venues`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to link venue')
      setVenueInput('')
      const r2 = await fetch(`/api/groups/${expandedSlug}`, { credentials: 'include' })
      const d2 = await r2.json()
      setExpandedGroup(d2.group ?? null)
      setGroups((prev) =>
        prev.map((g) =>
          g.slug === expandedSlug
            ? { ...g, venueCount: d2.group?.venues?.length ?? g.venueCount }
            : g
        )
      )
    } catch (err: any) {
      setVenueError(err.message)
    } finally {
      setVenueAdding(false)
    }
  }

  const handleUnlinkVenue = async (venueId: number) => {
    if (!expandedSlug) return
    try {
      await fetch(`/api/groups/${expandedSlug}/venues`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueId }),
      })
      setExpandedGroup((prev) =>
        prev ? { ...prev, venues: prev.venues.filter((v) => v.venueId !== venueId) } : prev
      )
      setGroups((prev) =>
        prev.map((g) =>
          g.slug === expandedSlug ? { ...g, venueCount: Math.max(0, g.venueCount - 1) } : g
        )
      )
    } catch {
      // Silent
    }
  }

  const handleToggleActive = async (slug: string, currentlyActive: boolean) => {
    try {
      if (currentlyActive) {
        await fetch(`/api/groups/${slug}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        setGroups((prev) => prev.map((g) => (g.slug === slug ? { ...g, isActive: false } : g)))
      } else {
        // Re-activate: PUT with isActive flag (extend API later; for now just re-fetch)
        await fetch(`/api/groups/${slug}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: true }),
        })
        await fetchGroups()
      }
    } catch {
      // Silent
    }
  }

  // Auth guards
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Please sign in to access this page.</p>
      </div>
    )
  }

  if (!isBlogOwner) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Blog owner access required.</p>
      </div>
    )
  }

  const filtered = groups.filter((g) => {
    const q = search.toLowerCase()
    return (
      !q ||
      g.name.toLowerCase().includes(q) ||
      userName(g.owner).toLowerCase().includes(q) ||
      g.slug.includes(q)
    )
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Group Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage all groups, members, and venue links.
          </p>
        </div>
        <Link
          href="/groups/create"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Create Group
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or owner…"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Show inactive
        </label>
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading groups…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">No groups found.</p>
      )}

      <div className="space-y-3">
        {filtered.map((g) => {
          const isExpanded = expandedSlug === g.slug

          return (
            <div
              key={g.id}
              className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              {/* Group row */}
              <div className="flex flex-wrap items-center gap-3 p-4">
                {/* Name + slug */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/groups/${g.slug}`}
                      className="truncate font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {g.name}
                    </Link>
                    {!g.isActive && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    by {userName(g.owner)} · {g.memberCount} member{g.memberCount !== 1 ? 's' : ''}{' '}
                    · {g.venueCount} venue{g.venueCount !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openPanel(g.slug)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {isExpanded ? 'Collapse' : 'Manage'}
                  </button>
                  <Link
                    href={`/groups/create?edit=${g.slug}`}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleToggleActive(g.slug, g.isActive)}
                    className={`rounded-lg border px-3 py-1.5 text-xs ${
                      g.isActive
                        ? 'border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20'
                        : 'border-green-300 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20'
                    }`}
                  >
                    {g.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>

              {/* Expanded management panel */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                  {expandLoading && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
                  )}

                  {expandedGroup && (
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Members panel */}
                      <div>
                        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Members ({expandedGroup.members.length})
                        </h3>
                        <ul className="space-y-1.5">
                          {expandedGroup.members.map((m) => (
                            <li
                              key={m.userId}
                              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 dark:bg-gray-700/50"
                            >
                              <span className="text-sm text-gray-800 dark:text-gray-200">
                                {userName(m.user)}
                              </span>
                              <button
                                onClick={() => handleRemoveMember(m.userId)}
                                className="text-xs text-red-500 hover:underline dark:text-red-400"
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                        {expandedGroup.members.length === 0 && (
                          <p className="text-xs text-gray-400">No members yet.</p>
                        )}
                        <form onSubmit={handleAddMember} className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={memberInput}
                            onChange={(e) => setMemberInput(e.target.value)}
                            placeholder="Username, email, or wallet…"
                            className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                          <button
                            type="submit"
                            disabled={memberAdding || !memberInput.trim()}
                            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
                          >
                            {memberAdding ? '…' : 'Add'}
                          </button>
                        </form>
                        {memberError && <p className="mt-1 text-xs text-red-500">{memberError}</p>}
                      </div>

                      {/* Venues panel */}
                      <div>
                        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Venues ({expandedGroup.venues.length})
                        </h3>
                        <ul className="space-y-1.5">
                          {expandedGroup.venues.map((gv) => (
                            <li
                              key={gv.venueId}
                              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 dark:bg-gray-700/50"
                            >
                              <div>
                                <span className="text-sm text-gray-800 dark:text-gray-200">
                                  {gv.venue.name}
                                </span>
                                {gv.venue.isVirtual && (
                                  <span className="ml-1 rounded-full bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                    Virtual
                                  </span>
                                )}
                                <p className="text-xs text-gray-400">
                                  {gv.venue.city}
                                  {gv.venue.province ? `, ${gv.venue.province}` : ''}
                                </p>
                              </div>
                              <button
                                onClick={() => handleUnlinkVenue(gv.venueId)}
                                className="text-xs text-red-500 hover:underline dark:text-red-400"
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                        {expandedGroup.venues.length === 0 && (
                          <p className="text-xs text-gray-400">No venues linked.</p>
                        )}
                        <form onSubmit={handleLinkVenue} className="mt-2 flex gap-2">
                          <input
                            type="number"
                            value={venueInput}
                            onChange={(e) => setVenueInput(e.target.value)}
                            placeholder="Venue ID"
                            className="w-24 rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                          <button
                            type="submit"
                            disabled={venueAdding || !venueInput.trim()}
                            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
                          >
                            {venueAdding ? '…' : 'Link'}
                          </button>
                        </form>
                        {venueError && <p className="mt-1 text-xs text-red-500">{venueError}</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
