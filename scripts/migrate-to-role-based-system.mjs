import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateToRoles() {
  console.log('🔄 Migrating to role-based permission system...\n')

  // Step 1: Get blog owner address from environment
  const blogOwnerAddress = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS
  if (!blogOwnerAddress) {
    console.error('❌ NEXT_PUBLIC_BLOG_OWNER_ADDRESS not set in environment')
    return
  }

  // Step 2: Set blog owner role
  const blogOwner = await prisma.user.updateMany({
    where: {
      walletAddress: {
        equals: blogOwnerAddress.toLowerCase(),
        mode: 'insensitive',
      },
    },
    data: { role: 'BLOG_OWNER' },
  })

  console.log(`✓ Set BLOG_OWNER role: ${blogOwner.count} user(s)`)

  // Step 3: Migrate curators (isAuthorizedVerifier: true → role: CURATOR)
  const curators = await prisma.user.updateMany({
    where: {
      isAuthorizedVerifier: true,
      role: { not: 'BLOG_OWNER' }, // Don't downgrade blog owner
    },
    data: { role: 'CURATOR' },
  })

  console.log(`✓ Migrated ${curators.count} curator(s) to CURATOR role`)

  // Step 4: Ensure all other users are SCOUT (default)
  const scouts = await prisma.user.updateMany({
    where: {
      role: { equals: 'SCOUT' },
      isAuthorizedVerifier: false,
    },
    data: { role: 'SCOUT' }, // Explicitly set for clarity
  })

  console.log(`✓ Confirmed ${scouts.count} user(s) have SCOUT role`)

  // Step 5: Verification - show role distribution
  const roleStats = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
  })

  console.log('\n📊 Role distribution after migration:')
  roleStats.forEach((stat) => {
    console.log(`  ${stat.role}: ${stat._count} users`)
  })

  // Step 6: Verify no permissions lost
  const curatorCheck = await prisma.user.findMany({
    where: { isAuthorizedVerifier: true },
    select: { username: true, role: true, isAuthorizedVerifier: true },
  })

  console.log('\n✓ Curator verification:')
  curatorCheck.forEach((user) => {
    const status = user.role === 'CURATOR' || user.role === 'BLOG_OWNER' ? '✓' : '❌'
    console.log(`  ${status} ${user.username}: ${user.role}`)
  })
}

migrateToRoles()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
