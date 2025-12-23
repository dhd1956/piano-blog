import { Suspense } from 'react'
import { sortPosts, allCoreContent } from 'pliny/utils/contentlayer'
import { allBlogs } from 'contentlayer/generated'
import Main from './Main'

export default async function Page() {
  const sortedPosts = sortPosts(allBlogs)
  const posts = allCoreContent(sortedPosts)
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Main posts={posts} />
    </Suspense>
  )
}
