'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import Link from 'next/link'
import MessageBubble from '@/components/messages/MessageBubble'

interface Participant {
  id: number
  displayName: string | null
  username: string | null
  avatar: string | null
  profileSlug: string | null
  walletAddress: string | null
}

interface Message {
  id: number
  senderId: number
  body: string
  createdAt: string
}

interface Session {
  id: number
  createdAt: string
  updatedAt: string
  savedByCreator: boolean
  savedByRecipient: boolean
  saved: boolean
  creatorId: number
  recipientId: number
  creator: Participant
  recipient: Participant
  messages: Message[]
}

export default function MessageThreadPage() {
  const { isLoading: authLoading } = useRequireAuth()
  const { user } = useAuth()
  const params = useParams()
  const sessionId = params.id as string

  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [savingSession, setSavingSession] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/${sessionId}`, { credentials: 'include' })
      if (res.status === 403) {
        setError("You don't have access to this conversation.")
        return
      }
      if (!res.ok) throw new Error('Failed to load conversation')
      const data = await res.json()
      setSession(data.session)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (!authLoading) loadSession()
  }, [authLoading, loadSession])

  // Scroll to bottom when messages load or a new one is added
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages.length])

  async function handleSend() {
    if (!reply.trim() || sending) return
    setSending(true)
    const body = reply.trim()
    setReply('')
    try {
      const res = await fetch(`/api/messages/${sessionId}/reply`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (!res.ok) throw new Error('Failed to send')
      const data = await res.json()
      // Optimistically append
      setSession((prev) => (prev ? { ...prev, messages: [...prev.messages, data.message] } : prev))
    } catch {
      setReply(body) // restore on failure
    } finally {
      setSending(false)
    }
  }

  async function handleToggleSave() {
    if (!session || savingSession) return
    setSavingSession(true)
    const newSaved = !session.saved
    try {
      await fetch(`/api/messages/${sessionId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saved: newSaved }),
      })
      setSession((prev) => (prev ? { ...prev, saved: newSaved } : prev))
    } finally {
      setSavingSession(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col px-4 py-8">
        <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-gray-400">{error ?? 'Conversation not found.'}</p>
        <Link
          href="/messages"
          className="mt-4 inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← Back to Messages
        </Link>
      </div>
    )
  }

  const isCreator = session.creatorId === user?.id
  const otherUser = isCreator ? session.recipient : session.creator
  const otherName = otherUser.displayName || otherUser.username || 'Unknown musician'
  const profileHref = otherUser.profileSlug
    ? `/profile/${otherUser.walletAddress ?? otherUser.profileSlug}`
    : null

  function nameFor(senderId: number) {
    if (senderId === session!.creatorId)
      return session!.creator.displayName || session!.creator.username || 'Musician'
    return session!.recipient.displayName || session!.recipient.username || 'Musician'
  }

  function avatarFor(senderId: number) {
    return senderId === session!.creatorId ? session!.creator.avatar : session!.recipient.avatar
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col px-4 py-6" style={{ minHeight: '80vh' }}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/messages"
            className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >
            ← Messages
          </Link>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          {otherUser.avatar ? (
            <img
              src={otherUser.avatar}
              alt={otherName}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">
              {otherName
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
          )}
          {profileHref ? (
            <Link
              href={profileHref}
              className="font-semibold text-gray-900 hover:underline dark:text-gray-100"
            >
              {otherName}
            </Link>
          ) : (
            <span className="font-semibold text-gray-900 dark:text-gray-100">{otherName}</span>
          )}
        </div>

        {/* Save toggle */}
        <button
          onClick={handleToggleSave}
          disabled={savingSession}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            session.saved
              ? 'bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900/40 dark:text-teal-300'
              : 'border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800'
          }`}
        >
          {session.saved ? '🔖 Saved' : '🔖 Save conversation'}
        </button>
      </div>

      {/* Message thread */}
      <div className="flex-1 space-y-4 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        {session.messages.length === 0 && (
          <p className="text-center text-sm text-gray-400">No messages yet.</p>
        )}
        {session.messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            body={msg.body}
            senderName={nameFor(msg.senderId)}
            senderAvatar={avatarFor(msg.senderId)}
            isOwn={msg.senderId === user?.id}
            createdAt={msg.createdAt}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      <div className="mt-4">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend()
          }}
          maxLength={500}
          rows={3}
          placeholder="Write a reply… (Ctrl+Enter to send)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          disabled={sending}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">{reply.length}/500</span>
          <button
            onClick={handleSend}
            disabled={!reply.trim() || sending}
            className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
