'use client'

import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

interface CollabRequestButtonProps {
  recipientAddress: string
  recipientName?: string
  className?: string
}

export default function CollabRequestButton({
  recipientAddress,
  recipientName,
  className = '',
}: CollabRequestButtonProps) {
  const { user, isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [alreadySent, setAlreadySent] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Don't render if not authenticated or viewing own profile
  if (!isAuthenticated || !user) return null
  if (user.walletAddress?.toLowerCase() === recipientAddress.toLowerCase()) return null

  const handleSend = async () => {
    if (!message.trim()) return
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/collaborate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientAddress, message: message.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to send request')
        setStatus('error')
        return
      }
      setAlreadySent(!!data.alreadySent)
      setStatus('sent')
    } catch {
      setErrorMsg('Network error — please try again')
      setStatus('error')
    }
  }

  const handleClose = () => {
    setOpen(false)
    setMessage('')
    setStatus('idle')
    setErrorMsg('')
    setAlreadySent(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`rounded-md bg-teal-600 px-4 py-2 font-medium text-white shadow-sm transition-all hover:bg-teal-700 hover:shadow-md ${className}`}
      >
        🤝 Collaborate
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-gray-100">
              Collaboration Request
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Send a message to {recipientName || 'this musician'} about collaborating. They'll
              receive a notification with a link to your profile.
            </p>

            {status === 'sent' ? (
              <div className="mb-4 rounded-md bg-teal-50 p-4 text-center dark:bg-teal-900/20">
                <div className="mb-2 text-3xl">✅</div>
                <p className="font-medium text-teal-800 dark:text-teal-300">Request sent!</p>
                <p className="mt-1 text-sm text-teal-700 dark:text-teal-400">
                  {recipientName || 'They'} will see your notification and can visit your profile to
                  get in touch.
                </p>
                {alreadySent && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    Note: you've already sent a request today — allow some time for a response.
                  </p>
                )}
              </div>
            ) : (
              <>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={200}
                  rows={4}
                  placeholder="What would you like to collaborate on? (e.g. I'm writing lyrics and looking for someone to compose a melody…)"
                  className="mb-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  disabled={status === 'sending'}
                />
                <p className="mb-3 text-right text-xs text-gray-400">{message.length}/200</p>

                {status === 'error' && (
                  <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                    {errorMsg}
                  </p>
                )}
              </>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={handleClose}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {status === 'sent' ? 'Close' : 'Cancel'}
              </button>
              {status !== 'sent' && (
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || status === 'sending'}
                  className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'sending' ? 'Sending…' : 'Send Request'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
