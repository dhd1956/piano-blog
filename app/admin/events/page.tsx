'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

type EventStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'

interface AdminEvent {
  id: number
  title: string
  startDate: string
  endDate: string | null
  status: EventStatus
  eventType: string
  seriesId: number | null
  venue: { id: number; name: string; city: string } | null
  organizer: { id: number; displayName: string | null; username: string | null } | null
}

interface VenueSummary {
  id: number
  name: string
  city: string
}

const STATUS_COLOURS: Record<EventStatus, string> = {
  UPCOMING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  ONGOING: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  COMPLETED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function organizerLabel(o: { displayName: string | null; username: string | null } | null): string {
  if (!o) return '—'
  return o.displayName || o.username || '—'
}

export default function AdminEventsPage() {
  const { user } = useAuth()
  const isBlogOwner = user?.role === 'BLOG_OWNER'

  const [events, setEvents] = useState<AdminEvent[]>([])
  const [venues, setVenues] = useState<VenueSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [venueId, setVenueId] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  // Selection
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const selectAllRef = useRef<HTMLInputElement>(null)

  // Cancel modal
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelResult, setCancelResult] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    if (!isBlogOwner) return
    setLoading(true)
    setError(null)
    setSelected(new Set())
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (venueId) params.set('venueId', venueId)
      if (status) params.set('status', status)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const res = await fetch(`/api/admin/events?${params}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load events')
      const data = await res.json()
      setEvents(data.events ?? [])
      if (data.venues?.length) setVenues(data.venues)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [isBlogOwner, search, venueId, status, from, to])

  // Load on mount (no filters)
  useEffect(() => {
    if (isBlogOwner) fetchEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBlogOwner])

  // Sync indeterminate state on select-all checkbox
  useEffect(() => {
    if (!selectAllRef.current) return
    const allCount = events.filter((e) => e.status !== 'CANCELLED').length
    selectAllRef.current.indeterminate = selected.size > 0 && selected.size < allCount
  }, [selected, events])

  function toggleRow(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    const cancellable = events.filter((e) => e.status !== 'CANCELLED').map((e) => e.id)
    if (selected.size === cancellable.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(cancellable))
    }
  }

  async function handleBulkCancel() {
    if (selected.size === 0) return
    setCancelling(true)
    setCancelResult(null)
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds: [...selected], reason: reason || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Bulk cancel failed')
      setCancelResult(`${data.cancelled} event${data.cancelled !== 1 ? 's' : ''} cancelled.`)
      setShowModal(false)
      setReason('')
      setSelected(new Set())
      await fetchEvents()
    } catch (err: any) {
      setCancelResult(`Error: ${err.message}`)
    } finally {
      setCancelling(false)
    }
  }

  if (!isBlogOwner) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-gray-400">Admin access required.</p>
      </div>
    )
  }

  const cancellableSelected = [...selected].filter((id) => {
    const ev = events.find((e) => e.id === id)
    return ev && ev.status !== 'CANCELLED'
  })
  const allCancellable = events.filter((e) => e.status !== 'CANCELLED')

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Admin — Bulk Cancel Events
      </h1>

      {/* Filter bar */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input
          type="text"
          placeholder="Search title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        <select
          value={venueId}
          onChange={(e) => setVenueId(e.target.value)}
          className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">All venues</option>
          {venues.map((v) => (
            <option key={v.id} value={String(v.id)}>
              {v.name} — {v.city}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">All statuses</option>
          <option value="UPCOMING">Upcoming</option>
          <option value="ONGOING">Ongoing</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <input
          type="date"
          title="From date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        <input
          type="date"
          title="To date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={fetchEvents}
          disabled={loading}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Apply Filters'}
        </button>
        <button
          onClick={() => {
            setSearch('')
            setVenueId('')
            setStatus('')
            setFrom('')
            setTo('')
          }}
          className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Clear
        </button>

        <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
          {events.length} event{events.length !== 1 ? 's' : ''} shown
        </span>

        {selected.size > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Cancel {selected.size} selected
          </button>
        )}
      </div>

      {cancelResult && (
        <div
          className={`mb-4 rounded px-4 py-2 text-sm ${
            cancelResult.startsWith('Error')
              ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
          }`}
        >
          {cancelResult}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={selected.size === allCancellable.length && allCancellable.length > 0}
                  onChange={toggleAll}
                  aria-label="Select all cancellable events"
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                Title
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                Venue
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                Date
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                Status
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                Organizer
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                Series
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && events.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No events found. Adjust filters and click Apply.
                </td>
              </tr>
            )}
            {!loading &&
              events.map((ev) => {
                const isCancelled = ev.status === 'CANCELLED'
                const isChecked = selected.has(ev.id)
                return (
                  <tr
                    key={ev.id}
                    className={`transition-colors ${
                      isChecked
                        ? 'bg-red-50 dark:bg-red-900/10'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    } ${isCancelled ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isCancelled}
                        onChange={() => toggleRow(ev.id)}
                        aria-label={`Select ${ev.title}`}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/events/${ev.id}`}
                        target="_blank"
                        className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        {ev.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {ev.venue ? `${ev.venue.name}, ${ev.venue.city}` : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {formatDate(ev.startDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOURS[ev.status]}`}
                      >
                        {ev.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {organizerLabel(ev.organizer)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {ev.seriesId ? `#${ev.seriesId}` : '—'}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {/* Cancel confirmation modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">
              Cancel {cancellableSelected.length} Event
              {cancellableSelected.length !== 1 ? 's' : ''}?
            </h2>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              This will set the selected events to CANCELLED. Attendees will not be automatically
              notified. This cannot be undone from this interface.
            </p>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Cancellation reason (optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Venue closed, season cancelled…"
              className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false)
                  setReason('')
                }}
                disabled={cancelling}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Go back
              </button>
              <button
                onClick={handleBulkCancel}
                disabled={cancelling}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling…' : 'Confirm Cancel'}
              </button>
            </div>
            {cancelResult && cancelResult.startsWith('Error') && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">{cancelResult}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
