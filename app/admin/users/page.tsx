'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'

type UserRole = 'BLOG_OWNER' | 'CURATOR' | 'VALIDATOR' | 'SCOUT'

interface AdminUser {
  id: number
  displayName: string | null
  username: string | null
  email: string | null
  walletAddress: string | null
  role: UserRole
  isActive: boolean
  createdAt: string
  lastActive: string
}

interface Venue {
  id: number
  name: string
  city: string
}

const ROLE_LABELS: Record<UserRole, string> = {
  BLOG_OWNER: 'Blog Owner',
  CURATOR: 'Curator',
  VALIDATOR: 'Validator',
  SCOUT: 'Scout',
}

const ROLE_COLOURS: Record<UserRole, string> = {
  BLOG_OWNER: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  CURATOR: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  VALIDATOR: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  SCOUT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

function displayName(u: AdminUser) {
  return u.displayName || u.username || u.email || u.walletAddress?.slice(0, 10) || `User #${u.id}`
}

export default function AdminUsersPage() {
  const { user, isAuthenticated } = useAuth()
  const isBlogOwner = user?.role === 'BLOG_OWNER'

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterRole, setFilterRole] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  // Expanded curator — shows venue assignment panel
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null)
  const [curatedVenues, setCuratedVenues] = useState<Venue[]>([])
  const [allVenues, setAllVenues] = useState<Venue[]>([])
  const [venueAssigning, setVenueAssigning] = useState(false)
  const [selectedVenueId, setSelectedVenueId] = useState<string>('')
  const [venueError, setVenueError] = useState<string | null>(null)

  // Role change in-flight tracker
  const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load users')
      const data = await res.json()
      setUsers(data.users ?? [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAllVenues = useCallback(async () => {
    try {
      const res = await fetch('/api/venues?verified=true&limit=200')
      if (res.ok) {
        const data = await res.json()
        setAllVenues(data.venues ?? [])
      }
    } catch {
      // Silent
    }
  }, [])

  useEffect(() => {
    if (isBlogOwner) {
      fetchUsers()
      fetchAllVenues()
    } else if (isAuthenticated) {
      // Non-admins get the public list (name + role only)
      fetch('/api/community/members')
        .then((r) => r.json())
        .then((d) => setUsers(d.users ?? []))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [isBlogOwner, isAuthenticated, fetchUsers, fetchAllVenues])

  const handleRoleChange = async (userId: number, newRole: string) => {
    setUpdatingRoleId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error('Failed to update role')
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole as UserRole } : u))
      )
      // Close venue panel if demoted away from CURATOR
      if (newRole !== 'CURATOR' && expandedUserId === userId) setExpandedUserId(null)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUpdatingRoleId(null)
    }
  }

  const openVenuePanel = async (userId: number) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null)
      return
    }
    setExpandedUserId(userId)
    setVenueError(null)
    setSelectedVenueId('')
    try {
      const res = await fetch(`/api/admin/users/${userId}/curated-venues`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setCuratedVenues(data.venues ?? [])
      }
    } catch {
      // Silent
    }
  }

  const handleAssignVenue = async (userId: number) => {
    if (!selectedVenueId) return
    setVenueAssigning(true)
    setVenueError(null)
    try {
      const res = await fetch(`/api/venues/${selectedVenueId}/curators`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIdentifier:
            users.find((u) => u.id === userId)?.walletAddress ||
            users.find((u) => u.id === userId)?.username ||
            '',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to assign venue')
      // Refresh curated venues list
      const r2 = await fetch(`/api/admin/users/${userId}/curated-venues`, {
        credentials: 'include',
      })
      if (r2.ok) setCuratedVenues((await r2.json()).venues ?? [])
      setSelectedVenueId('')
    } catch (err: any) {
      setVenueError(err.message)
    } finally {
      setVenueAssigning(false)
    }
  }

  const handleRemoveVenue = async (userId: number, venueId: number) => {
    try {
      await fetch(`/api/venues/${venueId}/curators`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      setCuratedVenues((prev) => prev.filter((v) => v.id !== venueId))
    } catch {
      // Silent
    }
  }

  // ── Auth guards ──────────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Please sign in to access this page.</p>
      </div>
    )
  }

  // Non-admin: read-only view showing only usernames
  if (!isBlogOwner) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
          Community Members
        </h1>
        <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
          {users.length} members in the Global Piano Network.
        </p>
        {loading && <p className="text-sm text-gray-500">Loading…</p>}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {users.map((u) => (
            <div
              key={u.id}
              className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {u.displayName || u.username || `Member #${u.id}`}
              </p>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLOURS[u.role]}`}
              >
                {ROLE_LABELS[u.role]}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Filtered list ─────────────────────────────────────────────────────────────

  const filtered = users.filter((u) => {
    const matchRole = filterRole === 'ALL' || u.role === filterRole
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      displayName(u).toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.walletAddress?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q)
    return matchRole && matchSearch
  })

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
      <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
        Change roles and manage venue assignments for community members.
      </p>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or wallet…"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="ALL">All roles</option>
          {Object.entries(ROLE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading users…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">No users match your filters.</p>
      )}

      <div className="space-y-3">
        {filtered.map((u) => {
          const isExpanded = expandedUserId === u.id
          const isCurator = u.role === 'CURATOR'

          return (
            <div
              key={u.id}
              className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              {/* User row */}
              <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                {/* Name / identity */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                    {displayName(u)}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    {u.email || u.walletAddress || '—'}
                  </p>
                </div>

                {/* Role badge + dropdown */}
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLOURS[u.role]}`}
                  >
                    {ROLE_LABELS[u.role]}
                  </span>

                  {u.role !== 'BLOG_OWNER' && (
                    <select
                      value={u.role}
                      disabled={updatingRoleId === u.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="SCOUT">Scout</option>
                      <option value="VALIDATOR">Validator</option>
                      <option value="CURATOR">Curator</option>
                    </select>
                  )}
                  {updatingRoleId === u.id && (
                    <span className="text-xs text-gray-400">Saving…</span>
                  )}
                </div>

                {/* Venue assignments button — only for curators */}
                {isCurator && (
                  <button
                    onClick={() => openVenuePanel(u.id)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      isExpanded
                        ? 'bg-purple-600 text-white'
                        : 'border border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/20'
                    }`}
                  >
                    {isExpanded ? 'Hide Venues ▲' : 'Manage Venues ▼'}
                  </button>
                )}
              </div>

              {/* Venue assignment panel */}
              {isExpanded && isCurator && (
                <div className="border-t border-gray-200 px-5 py-4 dark:border-gray-700">
                  <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Assigned Venues
                  </h3>

                  {curatedVenues.length === 0 ? (
                    <p className="mb-3 text-xs text-gray-400">No venues assigned yet.</p>
                  ) : (
                    <ul className="mb-4 space-y-1.5">
                      {curatedVenues.map((v) => (
                        <li
                          key={v.id}
                          className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-1.5 dark:bg-gray-700"
                        >
                          <span className="text-sm text-gray-800 dark:text-gray-200">
                            {v.name}
                            <span className="ml-1 text-xs text-gray-400">{v.city}</span>
                          </span>
                          <button
                            onClick={() => handleRemoveVenue(u.id, v.id)}
                            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {venueError && <p className="mb-2 text-xs text-red-500">{venueError}</p>}

                  {/* Add venue */}
                  <div className="flex gap-2">
                    <select
                      value={selectedVenueId}
                      onChange={(e) => setSelectedVenueId(e.target.value)}
                      className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select a venue…</option>
                      {allVenues
                        .filter((v) => !curatedVenues.some((cv) => cv.id === v.id))
                        .map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} — {v.city}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => handleAssignVenue(u.id)}
                      disabled={!selectedVenueId || venueAssigning}
                      className="rounded-md bg-purple-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      {venueAssigning ? 'Assigning…' : 'Assign'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!loading && (
        <p className="mt-6 text-xs text-gray-400">
          {filtered.length} of {users.length} users shown
        </p>
      )}
    </div>
  )
}
