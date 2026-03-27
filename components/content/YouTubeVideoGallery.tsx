'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface YouTubeVideo {
  id: number
  eventId: number
  youtubeId: string
  youtubeUrl: string
  title: string
  channelName: string | null
  thumbnailUrl: string | null
  viewCount: number
  pxpAwarded: number
  initialPXPAwarded: boolean
  milestone1kAwarded: boolean
  milestone10kAwarded: boolean
  verified: boolean
  status: string
  createdAt: string
  event?: {
    id: number
    title: string
    startDate: string
    venue: {
      id: number
      name: string
    }
  }
}

interface YouTubeVideoGalleryProps {
  userId?: number
  eventId?: number
  limit?: number
  showUploadForm?: boolean
  showEventContext?: boolean // Show event info with each video
}

export default function YouTubeVideoGallery({
  userId,
  eventId,
  limit = 10,
  showUploadForm = false,
  showEventContext = true,
}: YouTubeVideoGalleryProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalPXP, setTotalPXP] = useState(0)

  // Submission form state
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState<{
    title: string
    pxp: number
  } | null>(null)

  useEffect(() => {
    fetchVideos()
  }, [userId, eventId, limit])

  const fetchVideos = async () => {
    setIsLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()
      if (eventId) params.append('eventId', eventId.toString())
      else if (userId) params.append('userId', userId.toString())
      params.append('limit', limit.toString())

      const response = await fetch(`/api/content/youtube/submit?${params.toString()}`, {
        credentials: 'include',
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setVideos(result.videos)

        // Calculate total PXP earned from videos
        const total = result.videos.reduce(
          (sum: number, video: YouTubeVideo) => sum + video.pxpAwarded,
          0
        )
        setTotalPXP(total)
      } else {
        setError(result.error || 'Failed to load videos')
      }
    } catch (err: any) {
      setError('Failed to load videos')
      console.error('Error fetching videos:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventId || !youtubeUrl.trim()) return

    setSubmitting(true)
    setSubmitError('')
    setSubmitSuccess(null)

    try {
      const res = await fetch('/api/content/youtube/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ youtubeUrl: youtubeUrl.trim(), eventId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit video')
      setSubmitSuccess({ title: data.video.title, pxp: data.performerPXP })
      setYoutubeUrl('')
      fetchVideos()
    } catch (err: any) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const getMilestoneProgress = (video: YouTubeVideo) => {
    if (video.milestone10kAwarded) {
      return { label: 'All milestones reached!', color: 'text-green-600', progress: 100 }
    } else if (video.milestone1kAwarded) {
      const progress = (video.viewCount / 10000) * 100
      return {
        label: `${video.viewCount.toLocaleString()} / 10,000 views`,
        color: 'text-blue-600',
        progress: Math.min(progress, 100),
      }
    } else {
      const progress = (video.viewCount / 1000) * 100
      return {
        label: `${video.viewCount.toLocaleString()} / 1,000 views`,
        color: 'text-amber-600',
        progress: Math.min(progress, 100),
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading videos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-sm text-red-800 dark:text-red-300">❌ {error}</p>
      </div>
    )
  }

  const uploadForm = showUploadForm && eventId && (
    <form onSubmit={handleSubmit} className="mb-6">
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        YouTube video URL
      </label>
      <div className="flex gap-2">
        <input
          type="url"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          required
        />
        <button
          type="submit"
          disabled={submitting || !youtubeUrl.trim()}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Add Video'}
        </button>
      </div>
      {submitError && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">❌ {submitError}</p>
      )}
      {submitSuccess && (
        <div className="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
          🎉 <strong>"{submitSuccess.title}"</strong> added!{' '}
          {submitSuccess.pxp > 0 && <span>You earned {submitSuccess.pxp} PXP.</span>}
        </div>
      )}
    </form>
  )

  if (videos.length === 0) {
    return (
      <div>
        {uploadForm}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 text-4xl">🎹</div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
            No videos submitted yet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {showUploadForm
              ? 'Paste a YouTube URL above to link your performance and earn PXP!'
              : 'Submit your piano performances to earn PXP rewards'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {uploadForm}
      {/* Total PXP Summary */}
      {totalPXP > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 p-4 dark:border-yellow-800 dark:from-yellow-900/20 dark:to-amber-900/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total PXP Earned from Videos
              </h3>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalPXP.toLocaleString()} PXP
              </p>
            </div>
            <svg className="h-12 w-12 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Videos Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {videos.map((video) => {
          const milestone = getMilestoneProgress(video)

          return (
            <div
              key={video.id}
              className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              {/* Thumbnail */}
              <a
                href={video.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block aspect-video overflow-hidden bg-gray-100 dark:bg-gray-700"
              >
                {video.thumbnailUrl ? (
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <svg
                      className="h-16 w-16 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}

                {/* Play Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="rounded-full bg-red-600 p-3">
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                </div>
              </a>

              {/* Video Info */}
              <div className="p-4">
                <h4 className="mb-1 line-clamp-2 font-medium text-gray-900 dark:text-gray-100">
                  {video.title}
                </h4>
                {video.channelName && (
                  <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">
                    {video.channelName}
                  </p>
                )}

                {/* Event Context */}
                {showEventContext && video.event && (
                  <a
                    href={`/events/${video.event.id}`}
                    className="mb-3 flex items-center gap-1.5 text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="line-clamp-1">
                      {video.event.title} @ {video.event.venue.name}
                    </span>
                  </a>
                )}

                {/* PXP Earned */}
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 dark:bg-yellow-900/30">
                    <svg
                      className="h-4 w-4 text-yellow-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                      {video.pxpAwarded} PXP
                    </span>
                  </div>

                  {/* Milestone Badges */}
                  {video.milestone1kAwarded && (
                    <div className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      1K ✓
                    </div>
                  )}
                  {video.milestone10kAwarded && (
                    <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      10K ✓
                    </div>
                  )}
                </div>

                {/* Progress to Next Milestone */}
                {!video.milestone10kAwarded && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${milestone.color}`}>{milestone.label}</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {Math.round(milestone.progress)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                        style={{ width: `${milestone.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Next reward:{' '}
                      {video.milestone1kAwarded ? (
                        <strong>200 PXP at 10K views</strong>
                      ) : (
                        <strong>150 PXP at 1K views</strong>
                      )}
                    </p>
                  </div>
                )}

                {/* Status Badge */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {video.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                        Pending verification
                      </span>
                    )}
                  </div>

                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Watch on YouTube →
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
