'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface NoteEditorProps {
  // Create mode — supply attachment context
  groupId?: number
  eventId?: number
  profileUserId?: number
  isOwnProfile?: boolean

  // Edit mode — supply noteId + initial values (omit attachment props)
  noteId?: number
  initialTitle?: string
  initialBody?: string
  initialPracticeMinutes?: number | null
  initialQualityRating?: number | null
  initialYoutubeUrls?: string[]
  initialIsPrivate?: boolean

  onSaved: (note: any) => void
  onCancel: () => void
}

export default function NoteEditor({
  groupId,
  eventId,
  profileUserId,
  isOwnProfile,
  noteId,
  initialTitle = '',
  initialBody = '',
  initialPracticeMinutes,
  initialQualityRating,
  initialYoutubeUrls = [],
  initialIsPrivate = false,
  onSaved,
  onCancel,
}: NoteEditorProps) {
  const isEditMode = noteId != null

  const [title, setTitle] = useState(initialTitle)
  const [body, setBody] = useState(initialBody)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(groupId ?? null)
  const [availableGroups, setAvailableGroups] = useState<{ id: number; name: string }[]>([])
  const [practiceMinutes, setPracticeMinutes] = useState(
    initialPracticeMinutes != null ? String(initialPracticeMinutes) : ''
  )
  const [qualityRating, setQualityRating] = useState<number | null>(initialQualityRating ?? null)
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>(initialYoutubeUrls)
  const [newUrl, setNewUrl] = useState('')
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate)
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pxpEarned, setPxpEarned] = useState<number | null>(null)

  // When creating a note on an event, fetch user's groups so they can optionally link one
  useEffect(() => {
    if (isEditMode || !eventId) return
    fetch('/api/groups?member=true&limit=50', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.groups?.length > 0) setAvailableGroups(data.groups)
      })
      .catch(() => {})
  }, [isEditMode, eventId])

  const handleAddUrl = () => {
    const trimmed = newUrl.trim()
    if (trimmed && !youtubeUrls.includes(trimmed)) {
      setYoutubeUrls([...youtubeUrls, trimmed])
      setNewUrl('')
    }
  }

  const handleRemoveUrl = (url: string) => {
    setYoutubeUrls(youtubeUrls.filter((u) => u !== url))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) {
      setError('Note body is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload: any = {
        body: body.trim(),
        title: title.trim() || undefined,
        practiceMinutes: practiceMinutes ? parseInt(practiceMinutes) : undefined,
        qualityRating: qualityRating ?? undefined,
        youtubeUrls,
        isPrivate,
      }

      let res: Response
      if (isEditMode) {
        res = await fetch(`/api/notes/${noteId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        if (eventId != null) {
          payload.eventId = eventId
          if (selectedGroupId != null) payload.groupId = selectedGroupId
        } else if (groupId != null) {
          payload.groupId = groupId
        } else if (profileUserId != null) {
          payload.profileUserId = profileUserId
        }

        res = await fetch('/api/notes', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save note')
      if (!isEditMode && data.pxpAwarded > 0) setPxpEarned(data.pxpAwarded)
      onSaved(data.note)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const showPrivateToggle = !isEditMode && profileUserId != null && !isOwnProfile

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20"
    >
      {pxpEarned != null && (
        <div className="mb-3 rounded-lg bg-green-100 px-3 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
          +{pxpEarned} PXP earned for logging practice time!
        </div>
      )}

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        maxLength={200}
        className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />

      {/* Body with preview toggle */}
      <div className="mb-1 flex gap-2 text-xs">
        <button
          type="button"
          onClick={() => setPreview(false)}
          className={`rounded px-2 py-1 ${!preview ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'}`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setPreview(true)}
          className={`rounded px-2 py-1 ${preview ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'}`}
        >
          Preview
        </button>
      </div>

      {preview ? (
        <div className="prose prose-sm dark:prose-invert min-h-[120px] max-w-none rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
          {body.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          ) : (
            <p className="text-gray-400 italic dark:text-gray-500">Nothing to preview yet.</p>
          )}
        </div>
      ) : (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your note here… (Markdown supported)"
          rows={5}
          required
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      )}

      {/* Metrics row */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Practice time (min)
          </label>
          <input
            type="number"
            min="0"
            max="999"
            value={practiceMinutes}
            onChange={(e) => setPracticeMinutes(e.target.value)}
            placeholder="e.g. 45"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Quality (1–5)
          </label>
          <div className="flex gap-1 pt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setQualityRating(qualityRating === star ? null : star)}
                className={`text-xl leading-none ${qualityRating != null && star <= qualityRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* YouTube URLs */}
      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
          Recording / video links
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://youtu.be/..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddUrl()
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={!newUrl.trim()}
            className="rounded-lg bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300 disabled:opacity-40 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            Add
          </button>
        </div>
        {youtubeUrls.length > 0 && (
          <ul className="mt-2 space-y-1">
            {youtubeUrls.map((url) => (
              <li key={url} className="flex items-center gap-2 text-xs">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-blue-600 hover:underline dark:text-blue-400"
                >
                  {url}
                </a>
                <button
                  type="button"
                  onClick={() => handleRemoveUrl(url)}
                  className="shrink-0 text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Group association — shown when creating a note on an event page */}
      {!isEditMode && eventId != null && availableGroups.length > 0 && (
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Associate with a group (optional)
          </label>
          <select
            value={selectedGroupId ?? ''}
            onChange={(e) => setSelectedGroupId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">No group</option>
            {availableGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {showPrivateToggle && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="checkbox"
            id="note-private"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="note-private" className="text-xs text-gray-600 dark:text-gray-400">
            Private note (only visible to you)
          </label>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !body.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
        >
          {saving ? 'Saving…' : isEditMode ? 'Save Changes' : 'Save Note'}
        </button>
      </div>
    </form>
  )
}
