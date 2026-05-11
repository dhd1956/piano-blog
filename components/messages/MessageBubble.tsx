'use client'

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

interface MessageBubbleProps {
  body: string
  senderName: string
  senderAvatar: string | null
  isOwn: boolean
  createdAt: string
}

export default function MessageBubble({
  body,
  senderName,
  senderAvatar,
  isOwn,
  createdAt,
}: MessageBubbleProps) {
  const initials = senderName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {senderAvatar ? (
          <img src={senderAvatar} alt={senderName} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
            {initials}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isOwn
              ? 'rounded-br-sm bg-teal-600 text-white'
              : 'rounded-bl-sm bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
          }`}
        >
          {body}
        </div>
        <span className="text-[11px] text-gray-400">{timeAgo(createdAt)}</span>
      </div>
    </div>
  )
}
