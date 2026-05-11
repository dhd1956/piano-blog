'use client'

import { useState, useEffect } from 'react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useAuth } from '@/context/AuthContext'
import SessionCard from '@/components/messages/SessionCard'

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

interface Session {
  id: number
  updatedAt: string
  saved: boolean
  otherUser: SessionUser
  lastMessage: LastMessage | null
}

export default function MessagesPage() {
  const { isLoading: authLoading } = useRequireAuth()
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/messages', { credentials: 'include' })
        if (!res.ok) throw new Error('Failed to load messages')
        const data = await res.json()
        setSessions(data.sessions ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    if (!authLoading) load()
  }, [authLoading])

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="mb-6 h-8 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="mb-3 h-20 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Messages
        {sessions.length > 0 && (
          <span className="ml-2 text-base font-normal text-gray-400">({sessions.length})</span>
        )}
      </h1>

      {sessions.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-8 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-4xl">💬</p>
          <p className="mt-3 font-medium text-gray-700 dark:text-gray-300">No conversations yet</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Visit a musician&apos;s profile and click &ldquo;Collaborate&rdquo; to start a thread.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} currentUserId={user?.id ?? 0} />
          ))}
        </div>
      )}
    </div>
  )
}
