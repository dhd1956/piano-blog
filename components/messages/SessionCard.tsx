'use client'

import Link from 'next/link'

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface SessionUser {
  id: number
  displayName: string | null
  username: string | null
  avatar: string | null
  profileSlug: string | null
}

interface LastMessage {
  id: number
  body: string
  senderId: number
  createdAt: string
}

interface SessionCardProps {
  session: {
    id: number
    updatedAt: string
    saved: boolean
    otherUser: SessionUser
    lastMessage: LastMessage | null
  }
  currentUserId: number
}

export default function SessionCard({ session, currentUserId }: SessionCardProps) {
  const { otherUser, lastMessage } = session

  const name = otherUser.displayName || otherUser.username || 'Unknown musician'
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const preview = lastMessage
    ? (lastMessage.senderId === currentUserId ? 'You: ' : '') +
      lastMessage.body.slice(0, 80) +
      (lastMessage.body.length > 80 ? '…' : '')
    : 'No messages yet'

  return (
    <Link
      href={`/messages/${session.id}`}
      className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {otherUser.avatar ? (
          <img src={otherUser.avatar} alt={name} className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">
            {initials}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-semibold text-gray-900 dark:text-gray-100">{name}</p>
          <div className="flex flex-shrink-0 items-center gap-2">
            {session.saved && (
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-medium text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                Saved
              </span>
            )}
            <span className="text-[11px] text-gray-400">{timeAgo(session.updatedAt)}</span>
          </div>
        </div>
        <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">{preview}</p>
      </div>
    </Link>
  )
}
