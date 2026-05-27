'use client'

/**
 * /groups/create — Create or edit a group
 * Accessible to CURATOR and BLOG_OWNER only.
 * Pass ?edit=<slug> to load existing group for editing.
 */

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRole } from '@/hooks/useRole'

function makeSlugPreview(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function CreateGroupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editSlug = searchParams.get('edit')

  const { isAuthenticated } = useAuth()
  const { isCurator, isBlogOwner } = useRole()
  const canAccess = isCurator || isBlogOwner

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [avatar, setAvatar] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(!!editSlug)
  const [error, setError] = useState<string | null>(null)

  const slugPreview = makeSlugPreview(name)
  const isEdit = !!editSlug

  // Load existing group when editing
  useEffect(() => {
    if (!editSlug) return
    setLoadingEdit(true)
    fetch(`/api/groups/${editSlug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.group) {
          setName(d.group.name)
          setDescription(d.group.description ?? '')
          setAvatar(d.group.avatar ?? '')
        }
      })
      .catch(() => {})
      .finally(() => setLoadingEdit(false))
  }, [editSlug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Group name is required.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      let res: Response
      if (isEdit) {
        res = await fetch(`/api/groups/${editSlug}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            avatar: avatar.trim() || null,
          }),
        })
      } else {
        res = await fetch('/api/groups', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            avatar: avatar.trim() || null,
          }),
        })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save group')

      const targetSlug = data.group?.slug ?? editSlug
      router.push(`/groups/${targetSlug}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Auth guard
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-gray-400">Please sign in to create a group.</p>
      </div>
    )
  }

  if (!canAccess) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          You need to be a Curator or Blog Owner to create groups.
        </p>
        <Link href="/groups" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          ← Back to Groups
        </Link>
      </div>
    )
  }

  if (loadingEdit) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-gray-500">Loading…</div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link
        href="/groups"
        className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        ← Back to Groups
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
        {isEdit ? 'Edit Group' : 'Create Group'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Group name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="e.g. Toronto Jazz Pianists"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          {name && (
            <p className="mt-1 text-xs text-gray-400">
              URL: /groups/
              <span className="font-mono text-gray-600 dark:text-gray-300">
                {slugPreview || '…'}
              </span>
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="What's this group about?"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Avatar URL */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Avatar URL
          </label>
          <input
            type="url"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-400">
            Paste an image URL to use as the group avatar.
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
        >
          {loading ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save Changes' : 'Create Group'}
        </button>
      </form>
    </div>
  )
}
