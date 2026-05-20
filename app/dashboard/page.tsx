import { Suspense } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { getDb } from '@/lib/get-db'
import { getSessionUser } from '@/lib/auth-middleware'
import { redirect } from 'next/navigation'
import WelcomeRewardBanner from '@/components/rewards/WelcomeRewardBanner'

export const metadata: Metadata = {
  title: 'Dashboard | Piano Blog',
  description: 'Your personal dashboard for exploring piano venues and events',
}

async function getUserDashboardData(userId: number) {
  const db = await getDb()
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      musicianProfile: true,
      rsvps: {
        where: {
          status: 'CONFIRMED',
          event: {
            startDate: {
              gte: new Date(),
            },
            status: 'UPCOMING',
          },
        },
        include: {
          event: {
            include: {
              venue: {
                select: {
                  name: true,
                  city: true,
                },
              },
            },
          },
        },
        take: 5,
        orderBy: {
          event: {
            startDate: 'asc',
          },
        },
      },
    },
  })

  // Get profile completion percentage
  const profileFields = [
    user?.displayName,
    user?.email,
    user?.bio,
    user?.location,
    user?.avatar,
    user?.emailVerified,
  ]
  const completedFields = profileFields.filter((field) => field).length
  const profileCompletion = Math.round((completedFields / profileFields.length) * 100)

  // Get recently viewed venues (you'd track this in a separate analytics table)
  // For now, just get recent verified venues
  const recentVenues = await db.venue.findMany({
    where: { verified: true },
    orderBy: { createdAt: 'desc' },
    take: 6,
  })

  return {
    user,
    profileCompletion,
    upcomingEvents: user?.rsvps || [],
    recentVenues,
  }
}

export default async function DashboardPage() {
  // Get current user from session
  const sessionUser = await getSessionUser()

  if (!sessionUser || !sessionUser.id) {
    redirect('/auth/login')
  }

  const { user, profileCompletion, upcomingEvents, recentVenues } = await getUserDashboardData(
    sessionUser.id
  )

  if (!user) {
    redirect('/auth/login')
  }

  const userName = user.displayName || user.username || 'there'
  const interests = user.userInterests || []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {userName}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here's what's happening in your piano community
        </p>
      </div>

      {/* Welcome Reward Banner - shows even without wallet, prompts to link if needed */}
      <WelcomeRewardBanner userAddress={user.walletAddress || undefined} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content Area */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quick Actions based on interests */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {interests.includes('discover-venues') && (
                <Link
                  href="/venues"
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-900/20"
                >
                  <span className="text-2xl">🗺️</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Find Venues Near You
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Discover piano-friendly spots
                    </p>
                  </div>
                </Link>
              )}

              {interests.includes('submit-venues') && (
                <Link
                  href="/submit"
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-900/20"
                >
                  <span className="text-2xl">📝</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Submit a Venue</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Share a place you know
                    </p>
                  </div>
                </Link>
              )}

              {interests.includes('attend-events') && (
                <Link
                  href="/events"
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-900/20"
                >
                  <span className="text-2xl">🎵</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Browse Upcoming Events
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Find jam sessions & concerts
                    </p>
                  </div>
                </Link>
              )}

              {interests.includes('connect-musicians') && (
                <Link
                  href={`/profile/${user.walletAddress || user.username}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-900/20"
                >
                  <span className="text-2xl">🤝</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      View Your Profile
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Connect with other musicians
                    </p>
                  </div>
                </Link>
              )}

              {/* Default actions if no specific interests selected */}
              {interests.length === 0 && (
                <>
                  <Link
                    href="/venues"
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-900/20"
                  >
                    <span className="text-2xl">🗺️</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Explore Venues
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Discover piano-friendly places
                      </p>
                    </div>
                  </Link>
                  <Link
                    href="/events"
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-900/20"
                  >
                    <span className="text-2xl">🎵</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Find Events</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Browse upcoming gatherings
                      </p>
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Upcoming Events You're Attending */}
          {upcomingEvents.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                Your Upcoming Events
              </h2>
              <div className="space-y-3">
                {upcomingEvents.map((rsvp) => (
                  <Link
                    key={rsvp.id}
                    href={`/events/${rsvp.event.id}`}
                    className="block rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-900/20"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {rsvp.event.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(rsvp.event.startDate).toLocaleDateString('en-US', {
                        timeZone: 'UTC',
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                    {rsvp.event.venue && (
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {rsvp.event.venue.name} • {rsvp.event.venue.city}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
              <Link
                href="/events"
                className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                View all events →
              </Link>
            </div>
          )}

          {/* Recently Added Venues */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              Recently Added Venues
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {recentVenues.slice(0, 4).map((venue) => (
                <Link
                  key={venue.id}
                  href={`/venueDetails/${venue.id}`}
                  className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-900/20"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white">{venue.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{venue.city}</p>
                  {venue.hasPiano && (
                    <span className="mt-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      🎹 Has Piano
                    </span>
                  )}
                </Link>
              ))}
            </div>
            <Link
              href="/venues"
              className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Explore all venues →
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Completion */}
          {profileCompletion < 100 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">
                Complete Your Profile
              </h3>
              <div className="mb-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {profileCompletion}% complete
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </div>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Complete your profile to get discovered and connect with the community.
              </p>
              <Link
                href={`/profile/${user.walletAddress || user.username}`}
                className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white transition-colors hover:bg-blue-700"
              >
                Complete Profile
              </Link>
            </div>
          )}

          {/* PXP Rewards Status */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">Your Rewards</h3>
            <div className="mb-4">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {user.totalPXPEarned} PXP
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total earned</p>
            </div>
            {!user.hasClaimedNewUserReward && user.walletAddress && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Don't forget to claim your welcome reward!
              </p>
            )}
          </div>

          {/* Community Stats */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
              Community Stats
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {recentVenues.length}+
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Verified Venues</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {upcomingEvents.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your RSVPs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
