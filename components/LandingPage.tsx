'use client'

import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'

interface Post {
  slug: string
  date: string
  title: string
  summary?: string
  tags: string[]
}

interface LandingPageProps {
  posts: Post[]
}

export default function LandingPage({ posts }: LandingPageProps) {
  const featuredPosts = posts.slice(0, 3)

  return (
    <>
      {/* Hero Section */}
      <div className="from-primary-50 to-primary-100 relative overflow-hidden bg-gradient-to-br py-16 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl dark:text-gray-100">
              Welcome to the Global Piano Network
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl leading-8 text-gray-700 dark:text-gray-300">
              Discover venues with publicly accessible pianos, connect with musicians worldwide, and
              share the joy of piano in your community
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/blog"
                className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-lg px-6 py-3 text-base font-semibold text-white shadow-md transition"
              >
                Read the Blog
              </Link>
              <Link
                href="/venues"
                className="border-primary-600 text-primary-600 hover:bg-primary-50 dark:border-primary-400 dark:text-primary-400 rounded-lg border-2 bg-white px-6 py-3 text-base font-semibold shadow-md transition dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                Explore Venues
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Value Propositions */}
      <div className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Blog Value Prop */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div className="bg-primary-100 dark:bg-primary-900/20 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                <svg
                  className="text-primary-600 dark:text-primary-400 h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">
                Piano Journey
              </h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Follow along as I document my piano learning journey, share techniques, and explore
                musical concepts
              </p>
              <Link
                href="/blog"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
              >
                Read Posts →
              </Link>
            </div>

            {/* Venues Value Prop */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div className="bg-primary-100 dark:bg-primary-900/20 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                <svg
                  className="text-primary-600 dark:text-primary-400 h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">
                Find Pianos
              </h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Discover venues with publicly accessible pianos. Submit your findings and help build
                our community map
              </p>
              <Link
                href="/venues"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
              >
                Browse Venues →
              </Link>
            </div>

            {/* Community Value Prop */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div className="bg-primary-100 dark:bg-primary-900/20 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                <svg
                  className="text-primary-600 dark:text-primary-400 h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">
                Join Community
              </h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Connect with musicians, discover events, and share your own musical experiences with
                fellow community members
              </p>
              <Link
                href="/musicians"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
              >
                Meet Musicians →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Blog Posts */}
      <div className="bg-gray-50 py-16 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Latest from the Blog
            </h2>
            <Link
              href="/blog"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {featuredPosts.map((post) => (
              <article
                key={post.slug}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <time
                  dateTime={post.date}
                  className="mb-2 block text-sm text-gray-500 dark:text-gray-400"
                >
                  {formatDate(post.date, siteMetadata.locale)}
                </time>
                <h3 className="mb-2 text-xl font-bold">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-900 dark:text-gray-100"
                  >
                    {post.title}
                  </Link>
                </h3>
                {post.summary && (
                  <p className="mb-4 text-gray-600 dark:text-gray-400">{post.summary}</p>
                )}
                <div className="mb-4 flex flex-wrap gap-2">
                  {post.tags.slice(0, 2).map((tag) => (
                    <Tag key={tag} text={tag} />
                  ))}
                </div>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                >
                  Read more →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">
            How It Works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="bg-primary-600 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white">
                  1
                </div>
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">Discover</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Browse venues, read blog posts, and explore our community of musicians
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="bg-primary-600 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white">
                  2
                </div>
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">
                Contribute
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Submit venues with pianos, share your profile, or create events
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="bg-primary-600 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white">
                  3
                </div>
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">Connect</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Meet fellow pianists, attend events, and grow together as musicians
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 dark:bg-primary-700 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-white">Ready to Get Started?</h2>
          <p className="text-primary-100 mb-8 text-xl">
            Join our community and start exploring pianos near you
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/submit"
              className="text-primary-600 rounded-lg bg-white px-6 py-3 text-base font-semibold shadow-md transition hover:bg-gray-100"
            >
              Submit a Venue
            </Link>
            <Link
              href="/musicians"
              className="rounded-lg border-2 border-white bg-transparent px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-white/10"
            >
              Browse Musicians
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
