'use client'

/**
 * /groups/[slug] — Group detail page
 * Public: shows members + venues.
 * Owner / BLOG_OWNER: sees Manage controls (add/remove members, add/remove venues).
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { useRole } from '@/hooks/useRole'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import NoteList from '@/components/notes/NoteList'

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

interface EventSummary {
  id: number
  title: string
  eventType: string
  startDate: string
  endDate: string
  status: string
  venue: { id: number; name: string; city: string }
  organizer: { id: number; displayName: string | null; username: string | null }
}

interface Group {
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

function userName(u: UserSummary) {
  return u.displayName || u.username || `User #${u.id}`
}

function profileHref(u: UserSummary) {
  return u.profileSlug
    ? `/profile/${u.profileSlug}`
    : u.walletAddress
      ? `/profile/${u.walletAddress}`
      : null
}

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { user: authUser } = useAuth()
  const { isBlogOwner, isCurator } = useRole()
  useRequireAuth()

  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [events, setEvents] = useState<EventSummary[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)

  // Manage: add member
  const [memberInput, setMemberInput] = useState('')
  const [memberAdding, setMemberAdding] = useState(false)
  const [memberError, setMemberError] = useState<string | null>(null)

  // Manage: add venue
  const [allVenues, setAllVenues] = useState<{ id: number; name: string; city: string }[]>([])
  const [selectedVenueId, setSelectedVenueId] = useState('')
  const [venueAdding, setVenueAdding] = useState(false)
  const [venueError, setVenueError] = useState<string | null>(null)

  // Delete group
  const [deleting, setDeleting] = useState(false)

  const fetchGroup = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/groups/${slug}`)
      if (res.status === 404) {
        setError('Group not found.')
        return
      }
      if (!res.ok) throw new Error('Failed to load group')
      const data = await res.json()
      setGroup(data.group)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchGroup()
  }, [fetchGroup])

  useEffect(() => {
    if (!group) return
    setEventsLoading(true)
    fetch(`/api/events?groupId=${group.id}&status=UPCOMING&limit=10`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => {})
      .finally(() => setEventsLoading(false))
  }, [group])

  const isOwner = authUser && group ? authUser.id === group.ownerId : false
  const canManage = isOwner || isBlogOwner

  // Load venue list once we know the user can manage.
  // Curators only see venues they've been assigned to; blog owners see all.
  useEffect(() => {
    if (!canManage) return
    const url = isBlogOwner
      ? '/api/venues?limit=200&verified=true'
      : '/api/venues?limit=200&verified=true&myCurated=true'
    fetch(url, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setAllVenues(d.venues ?? []))
      .catch(() => {})
  }, [canManage, isBlogOwner])

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memberInput.trim()) return
    setMemberAdding(true)
    setMemberError(null)
    try {
      const res = await fetch(`/api/groups/${slug}/members`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIdentifier: memberInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add member')
      setMemberInput('')
      await fetchGroup()
    } catch (err: any) {
      setMemberError(err.message)
    } finally {
      setMemberAdding(false)
    }
  }

  const handleRemoveMember = async (userId: number) => {
    try {
      await fetch(`/api/groups/${slug}/members`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      setGroup((prev) =>
        prev ? { ...prev, members: prev.members.filter((m) => m.userId !== userId) } : prev
      )
    } catch {
      // Silent
    }
  }

  const handleLinkVenue = async (e: React.FormEvent) => {
    e.preventDefault()
    const venueId = parseInt(selectedVenueId)
    if (isNaN(venueId)) {
      setVenueError('Please select a venue.')
      return
    }
    setVenueAdding(true)
    setVenueError(null)
    try {
      const res = await fetch(`/api/groups/${slug}/venues`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to link venue')
      setSelectedVenueId('')
      await fetchGroup()
    } catch (err: any) {
      setVenueError(err.message)
    } finally {
      setVenueAdding(false)
    }
  }

  const handleUnlinkVenue = async (venueId: number) => {
    try {
      await fetch(`/api/groups/${slug}/venues`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueId }),
      })
      setGroup((prev) =>
        prev ? { ...prev, venues: prev.venues.filter((v) => v.venueId !== venueId) } : prev
      )
    } catch {
      // Silent
    }
  }

  const handleDeleteGroup = async () => {
    if (!confirm('Delete this group? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/groups/${slug}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) router.push('/groups')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-gray-500">Loading…</div>
    )
  }

  if (error || !group) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-gray-400">{error || 'Group not found.'}</p>
        <Link href="/groups" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          ← Back to Groups
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Back */}
      <Link
        href="/groups"
        className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        ← Back to Groups
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-start gap-5">
        {group.avatar ? (
          <Image
            src={group.avatar}
            alt={group.name}
            width={72}
            height={72}
            className="h-18 w-18 rounded-2xl object-cover"
          />
        ) : (
          <div
            className="flex h-18 w-18 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
            style={{ width: 72, height: 72 }}
          >
            {group.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{group.name}</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Created by{' '}
            {profileHref(group.owner) ? (
              <Link
                href={profileHref(group.owner)!}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {userName(group.owner)}
              </Link>
            ) : (
              userName(group.owner)
            )}
          </p>
          {group.description && (
            <p className="mt-3 text-gray-700 dark:text-gray-300">{group.description}</p>
          )}
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Link
              href={`/groups/create?edit=${group.slug}`}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Edit
            </Link>
            <button
              onClick={handleDeleteGroup}
              disabled={deleting}
              className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Members section */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Members ({group.members.length})
        </h2>

        {group.members.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No members yet.</p>
        )}

        <ul className="space-y-2">
          {group.members.map((m) => {
            const href = profileHref(m.user)
            return (
              <li
                key={m.userId}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  {m.user.avatar ? (
                    <Image
                      src={m.user.avatar}
                      alt={userName(m.user)}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {userName(m.user).charAt(0).toUpperCase()}
                    </div>
                  )}
                  {href ? (
                    <Link
                      href={href}
                      className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {userName(m.user)}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {userName(m.user)}
                    </span>
                  )}
                </div>
                {canManage && (
                  <button
                    onClick={() => handleRemoveMember(m.userId)}
                    className="text-xs text-red-500 hover:underline dark:text-red-400"
                  >
                    Remove
                  </button>
                )}
              </li>
            )
          })}
        </ul>

        {/* Add member form */}
        {canManage && (
          <form onSubmit={handleAddMember} className="mt-3 flex gap-2">
            <input
              type="text"
              value={memberInput}
              onChange={(e) => setMemberInput(e.target.value)}
              placeholder="Display name or email…"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={memberAdding || !memberInput.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
            >
              {memberAdding ? 'Adding…' : 'Add'}
            </button>
          </form>
        )}
        {memberError && <p className="mt-1 text-xs text-red-500">{memberError}</p>}
      </section>

      {/* Venues section */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Venues ({group.venues.length})
        </h2>

        {group.venues.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No venues linked.</p>
        )}

        <ul className="space-y-2">
          {group.venues.map((gv) => (
            <li
              key={gv.venueId}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/venueDetails/${gv.venue.id}`}
                    className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {gv.venue.name}
                  </Link>
                  {gv.venue.isVirtual && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                      Virtual
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {[gv.venue.city, gv.venue.province, gv.venue.country].filter(Boolean).join(', ')}
                </p>
              </div>
              {canManage && (
                <button
                  onClick={() => handleUnlinkVenue(gv.venueId)}
                  className="text-xs text-red-500 hover:underline dark:text-red-400"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>

        {/* Link venue form */}
        {canManage && (
          <form onSubmit={handleLinkVenue} className="mt-3 flex gap-2">
            <select
              value={selectedVenueId}
              onChange={(e) => setSelectedVenueId(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">— Select a venue —</option>
              {allVenues
                .filter((v) => !group.venues.some((gv) => gv.venueId === v.id))
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.city})
                  </option>
                ))}
            </select>
            <button
              type="submit"
              disabled={venueAdding || !selectedVenueId}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
            >
              {venueAdding ? 'Linking…' : 'Link'}
            </button>
          </form>
        )}
        {venueError && <p className="mt-1 text-xs text-red-500">{venueError}</p>}
      </section>

      {/* Notes section */}
      <section className="mt-8">
        <NoteList
          groupId={group.id}
          canCreate={
            !!(authUser && (isOwner || group.members.some((m) => m.userId === authUser.id)))
          }
          currentUserId={authUser?.id}
          label="Practice Notes & Updates"
        />
      </section>

      {/* Upcoming Events section */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Upcoming Events
          </h2>
          {canManage && (
            <Link
              href={`/events/create`}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              + Create Event
            </Link>
          )}
        </div>

        {eventsLoading && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading events…</p>
        )}

        {!eventsLoading && events.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming events.</p>
        )}

        {!eventsLoading && events.length > 0 && (
          <ul className="space-y-2">
            {events.map((ev) => (
              <li key={ev.id}>
                <Link
                  href={`/events/${ev.id}`}
                  className="flex items-start justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div>
                    <p className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                      {ev.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(ev.startDate).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      · {ev.venue.name}, {ev.venue.city}
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {ev.eventType.replace('_', ' ')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
