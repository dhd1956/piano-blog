'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import Image from 'next/image'

interface NoteAuthor {
  id: number
  displayName: string | null
  username: string | null
  avatar: string | null
  profileSlug: string | null
}

export interface NoteData {
  id: number
  title: string | null
  body: string
  practiceMinutes: number | null
  qualityRating: number | null
  youtubeUrls: string[]
  isPrivate: boolean
  pxpAwarded: boolean
  createdAt: string
  author: NoteAuthor
  groupId?: number | null
  eventId?: number | null
  profileUserId?: number | null
}

interface NoteCardProps {
  note: NoteData
  onDelete?: (id: number) => void
  currentUserId?: number
}

function authorName(a: NoteAuthor) {
  return a.displayName || a.username || `User #${a.id}`
}

function authorHref(a: NoteAuthor) {
  return a.profileSlug ? `/profile/${a.profileSlug}` : null
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400" aria-label={`Quality: ${rating} out of 5`}>
      {'★'.repeat(rating)}
      {'☆'.repeat(5 - rating)}
    </span>
  )
}

export default function NoteCard({ note, onDelete, currentUserId }: NoteCardProps) {
  const isOwn = currentUserId === note.author.id
  const href = authorHref(note.author)

  const handleDelete = async () => {
    if (!confirm('Delete this note?')) return
    const res = await fetch(`/api/notes/${note.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok) onDelete?.(note.id)
  }

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Header row */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {note.author.avatar ? (
            <Image
              src={note.author.avatar}
              alt={authorName(note.author)}
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {authorName(note.author).charAt(0).toUpperCase()}
            </div>
          )}
          {href ? (
            <Link
              href={href}
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              {authorName(note.author)}
            </Link>
          ) : (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {authorName(note.author)}
            </span>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(note.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          {note.isPrivate && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              🔒 Private
            </span>
          )}
        </div>
        {isOwn && onDelete && (
          <button
            onClick={handleDelete}
            className="text-xs text-red-400 hover:underline dark:text-red-400"
          >
            Delete
          </button>
        )}
      </div>

      {/* Title */}
      {note.title && (
        <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
          {note.title}
        </h3>
      )}

      {/* Body (markdown) */}
      <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.body}</ReactMarkdown>
      </div>

      {/* Metrics row */}
      {(note.practiceMinutes ||
        note.qualityRating ||
        note.youtubeUrls.length > 0 ||
        note.pxpAwarded) && (
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {note.practiceMinutes && note.practiceMinutes > 0 && (
            <span>⏱ {note.practiceMinutes} min</span>
          )}
          {note.qualityRating && (
            <span>
              <StarRating rating={note.qualityRating} />
            </span>
          )}
          {note.youtubeUrls.length > 0 && (
            <span className="flex items-center gap-1">
              🎥{' '}
              {note.youtubeUrls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Video {note.youtubeUrls.length > 1 ? i + 1 : ''}
                </a>
              ))}
            </span>
          )}
          {note.pxpAwarded && (
            <span className="text-green-600 dark:text-green-400">✓ PXP earned</span>
          )}
        </div>
      )}
    </article>
  )
}
