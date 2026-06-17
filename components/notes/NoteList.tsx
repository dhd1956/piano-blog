'use client'

import { useState, useEffect, useCallback } from 'react'
import NoteCard, { NoteData } from './NoteCard'
import NoteEditor from './NoteEditor'

interface NoteListProps {
  groupId?: number
  eventId?: number
  profileUserId?: number
  isOwnProfile?: boolean
  canCreate?: boolean
  currentUserId?: number
  label?: string
}

export default function NoteList({
  groupId,
  eventId,
  profileUserId,
  isOwnProfile,
  canCreate = false,
  currentUserId,
  label = 'Notes',
}: NoteListProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notes, setNotes] = useState<NoteData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [showEditor, setShowEditor] = useState(false)

  const attachmentParam =
    groupId != null
      ? `groupId=${groupId}`
      : eventId != null
        ? `eventId=${eventId}`
        : `profileUserId=${profileUserId}`

  const fetchNotes = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/notes?${attachmentParam}&limit=50`, {
          signal,
          credentials: 'include',
        })
        if (!res.ok) throw new Error('Failed to fetch notes')
        const data = await res.json()
        setNotes(data.notes || [])
        setTotalCount(data.pagination?.totalCount ?? data.notes?.length ?? 0)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        setError('Failed to load notes')
      } finally {
        setLoading(false)
      }
    },
    [attachmentParam]
  )

  useEffect(() => {
    const ac = new AbortController()
    fetchNotes(ac.signal)
    return () => ac.abort()
  }, [fetchNotes])

  const handleSaved = (note: NoteData) => {
    setNotes((prev) => [note, ...prev])
    setTotalCount((c) => c + 1)
    setShowEditor(false)
  }

  const handleDeleted = (id: number) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    setTotalCount((c) => Math.max(0, c - 1))
  }

  const handleEdited = (updated: NoteData) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen((o) => !o)}
          className="flex flex-1 items-center justify-between text-left hover:opacity-80 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-900"
          aria-expanded={isOpen}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">📝 {label}</h3>
          <div className="flex items-center gap-2">
            {!loading && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {totalCount} {totalCount === 1 ? 'note' : 'notes'}
              </span>
            )}
            <svg
              className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </button>
        {canCreate && isOpen && !showEditor && (
          <button
            onClick={() => setShowEditor(true)}
            className="ml-4 shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            + Add Note
          </button>
        )}
      </div>

      {/* Collapsible content */}
      {isOpen && (
        <div className="mt-4 space-y-4">
          {canCreate && !showEditor && (
            <button
              onClick={() => setShowEditor(true)}
              className="w-full rounded-lg border-2 border-dashed border-gray-200 px-4 py-3 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 sm:hidden dark:border-gray-700 dark:hover:border-blue-700"
            >
              + Add a note…
            </button>
          )}

          {showEditor && (
            <NoteEditor
              groupId={groupId}
              eventId={eventId}
              profileUserId={profileUserId}
              isOwnProfile={isOwnProfile}
              onSaved={handleSaved}
              onCancel={() => setShowEditor(false)}
            />
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading notes…</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && notes.length === 0 && !showEditor && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">No notes yet.</p>
              {canCreate && (
                <button
                  onClick={() => setShowEditor(true)}
                  className="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  Be the first to add one
                </button>
              )}
            </div>
          )}

          {!loading && !error && notes.length > 0 && (
            <div className="space-y-3">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  currentUserId={currentUserId}
                  onDelete={handleDeleted}
                  onEdit={handleEdited}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
