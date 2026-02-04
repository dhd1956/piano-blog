'use client'

/**
 * Event Series List Page
 * Shows user's recurring event series
 */

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { EventSeriesSummary, RecurrencePattern } from '@/types/event'

const RECURRENCE_LABELS: Record<RecurrencePattern, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  WEEKDAYS: 'Weekdays',
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  JAM_SESSION: '🎸 Jam Session',
  GIG: '🎤 Gig',
  CONCERT: '🎵 Concert',
  RECITAL: '🎹 Recital',
  OPEN_MIC: '🎙️ Open Mic',
  WORKSHOP: '📚 Workshop',
  MASTERCLASS: '🎓 Masterclass',
  REHEARSAL: '🎼 Rehearsal',
  MEETUP: '👥 Meetup',
  OTHER: '📌 Event',
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Active',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  PAUSED: {
    label: 'Paused',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  },
}

interface SeriesWithStats extends EventSeriesSummary {
  organizer?: {
    id: number
    displayName: string | null
    username: string | null
  }
}

export default function SeriesListPage() {
  const { isLoading: authLoading } = useRequireAuth()
  const { user, isAuthenticated } = useAuth()

  const [series, setSeries] = useState<SeriesWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE')

  useEffect(() => {
    if (user) {
      loadSeries()
    }
  }, [user, statusFilter])

  const loadSeries = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get user's ID first
      const sessionResponse = await fetch('/api/auth/session')
      if (!sessionResponse.ok) {
        throw new Error('Failed to get session')
      }
      const sessionData = await sessionResponse.json()
      const userId = sessionData.user?.id

      if (!userId) {
        setSeries([])
        return
      }

      const response = await fetch(
        `/api/event-series?organizerId=${userId}&status=${statusFilter}&limit=50`
      )

      if (!response.ok) {
        throw new Error('Failed to load series')
      }

      const data = await response.json()
      setSeries(data.series || [])
    } catch (err: any) {
      console.error('Error loading series:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
          My Event Series
        </h1>
        <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">
          Please sign in to view your recurring event series
        </p>
        <Link href="/events" className="text-blue-600 hover:underline dark:text-blue-400">
          ← Back to Events
        </Link>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Event Series</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Manage your recurring events</p>
        </div>
        <Link
          href="/events/create"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Series
        </Link>
      </div>

      {/* Navigation */}
      <div className="mb-6 flex items-center gap-4 text-sm">
        <Link href="/events" className="text-blue-600 hover:underline dark:text-blue-400">
          ← All Events
        </Link>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {['ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED', 'ALL'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {status === 'ALL' ? 'All' : STATUS_BADGES[status]?.label || status}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="py-12 text-center text-gray-600 dark:text-gray-400">Loading series...</div>
      )}

      {/* Empty State */}
      {!loading && series.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
            No event series found
          </h3>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            {statusFilter === 'ALL'
              ? "You haven't created any recurring event series yet."
              : `No ${statusFilter.toLowerCase()} series found.`}
          </p>
          <Link
            href="/events/create"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Create Your First Series
          </Link>
        </div>
      )}

      {/* Series List */}
      {!loading && series.length > 0 && (
        <div className="space-y-4">
          {series.map((s) => (
            <Link
              key={s.id}
              href={`/events/series/${s.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  {/* Title & Badges */}
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {s.title}
                    </h2>
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {EVENT_TYPE_LABELS[s.eventType] || s.eventType}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGES[s.status]?.className || 'bg-gray-100 text-gray-800'}`}
                    >
                      {STATUS_BADGES[s.status]?.label || s.status}
                    </span>
                  </div>

                  {/* Recurrence Info */}
                  <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>
                      {RECURRENCE_LABELS[s.recurrencePattern as RecurrencePattern] || 'Recurring'}
                    </span>
                    <span className="text-gray-400">|</span>
                    <span>
                      {formatDate(s.seriesStartDate)} - {formatDate(s.seriesEndDate)}
                    </span>
                  </div>

                  {/* Venue */}
                  {s.venue && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>
                        {s.venue.name}, {s.venue.city}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {s.totalEvents || 0}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {s.upcomingEvents || 0}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">Upcoming</div>
                  </div>
                  {s.nextEventDate && (
                    <div className="hidden text-center sm:block">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(s.nextEventDate)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Next Event</div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
