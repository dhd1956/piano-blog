'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import NoteCard, { NoteData } from '@/components/notes/NoteCard'

interface NoteWithContext extends NoteData {
  group?: { id: number; slug: string; name: string } | null
  event?: { id: number; title: string } | null
  profileUser?: {
    id: number
    displayName: string | null
    username: string | null
    profileSlug: string | null
  } | null
}

interface Metrics {
  totalNotes: number
  totalPracticeMinutes: number
  averageQuality: number | null
  pxpFromNotes: number
}

interface PXPPayment {
  id: number
  amount: number
  memo: string | null
  blockTimestamp: string
}

export default function MyNotesPage() {
  const { user: authUser, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [notes, setNotes] = useState<NoteWithContext[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [pxpPayments, setPxpPayments] = useState<PXPPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPXPDrilldown, setShowPXPDrilldown] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!authUser) {
      router.push('/auth/login')
      return
    }

    fetch('/api/notes/my', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setNotes(data.notes)
          setMetrics(data.metrics)
          setPxpPayments(data.pxpPayments)
        } else {
          setError(data.error || 'Failed to load notes')
        }
      })
      .catch(() => setError('Failed to load notes'))
      .finally(() => setLoading(false))
  }, [authUser, authLoading, router])

  const handleDeleted = (id: number) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    setMetrics((prev) => (prev ? { ...prev, totalNotes: Math.max(0, prev.totalNotes - 1) } : prev))
  }

  const groupNotes = notes.filter((n) => n.groupId != null)
  const eventNotes = notes.filter((n) => n.eventId != null)
  const profileNotes = notes.filter((n) => n.profileUserId != null && !n.isPrivate)
  const privateNotes = notes.filter((n) => n.profileUserId != null && n.isPrivate)

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-gray-500">Loading…</div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  function formatMinutes(mins: number) {
    if (mins < 60) return `${mins}m`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">My Notes</h1>
      <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
        Practice logs, session notes, and community messages you've written.
      </p>

      {/* Metrics */}
      {metrics && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {metrics.totalNotes}
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Total notes</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatMinutes(metrics.totalPracticeMinutes)}
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Practice time</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {metrics.averageQuality != null ? `${metrics.averageQuality}/5` : '—'}
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Avg quality</p>
          </div>
          <button
            onClick={() => setShowPXPDrilldown((v) => !v)}
            className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {metrics.pxpFromNotes}
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">PXP from notes ▾</p>
          </button>
        </div>
      )}

      {/* PXP drill-down */}
      {showPXPDrilldown && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            PXP earned from practice sessions
          </h2>
          {pxpPayments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No practice PXP yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500 dark:border-gray-700">
                  <th className="pr-4 pb-2">Date</th>
                  <th className="pr-4 pb-2">PXP</th>
                  <th className="pb-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {pxpPayments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-50 text-gray-700 dark:border-gray-800 dark:text-gray-300"
                  >
                    <td className="py-2 pr-4 text-xs text-gray-500">
                      {new Date(p.blockTimestamp).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-4 font-medium text-green-600 dark:text-green-400">
                      +{p.amount}
                    </td>
                    <td className="max-w-xs truncate py-2 text-xs text-gray-500">{p.memo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Sections */}
      {notes.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-10 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">No notes yet.</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Add notes from group pages, event pages, or musician profiles.
          </p>
        </div>
      )}

      {groupNotes.length > 0 && (
        <Section title="Group Notes">
          {groupNotes.map((note) => (
            <div key={note.id}>
              {note.group && (
                <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                  In{' '}
                  <Link
                    href={`/groups/${note.group.slug}`}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {note.group.name}
                  </Link>
                </p>
              )}
              <NoteCard note={note} currentUserId={authUser?.id} onDelete={handleDeleted} />
            </div>
          ))}
        </Section>
      )}

      {eventNotes.length > 0 && (
        <Section title="Event Notes">
          {eventNotes.map((note) => (
            <div key={note.id}>
              {note.event && (
                <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                  At{' '}
                  <Link
                    href={`/events/${note.event.id}`}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {note.event.title}
                  </Link>
                </p>
              )}
              <NoteCard note={note} currentUserId={authUser?.id} onDelete={handleDeleted} />
            </div>
          ))}
        </Section>
      )}

      {profileNotes.length > 0 && (
        <Section title="Profile Notes">
          {profileNotes.map((note) => (
            <div key={note.id}>
              {note.profileUser && (
                <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                  On{' '}
                  <Link
                    href={
                      note.profileUser.profileSlug
                        ? `/profile/${note.profileUser.profileSlug}`
                        : '#'
                    }
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {note.profileUser.displayName ||
                      note.profileUser.username ||
                      `User #${note.profileUser.id}`}
                  </Link>
                </p>
              )}
              <NoteCard note={note} currentUserId={authUser?.id} onDelete={handleDeleted} />
            </div>
          ))}
        </Section>
      )}

      {privateNotes.length > 0 && (
        <Section title="Private Notes">
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Only visible to you.</p>
          {privateNotes.map((note) => (
            <div key={note.id}>
              {note.profileUser && (
                <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                  About{' '}
                  <Link
                    href={
                      note.profileUser.profileSlug
                        ? `/profile/${note.profileUser.profileSlug}`
                        : '#'
                    }
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {note.profileUser.displayName ||
                      note.profileUser.username ||
                      `User #${note.profileUser.id}`}
                  </Link>
                </p>
              )}
              <NoteCard note={note} currentUserId={authUser?.id} onDelete={handleDeleted} />
            </div>
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
