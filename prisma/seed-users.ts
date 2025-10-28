/**
 * Database Seed Script for RBAC Test Users
 * Creates test users for each role: Blog Owner, Curator, Validators (3), Scout
 */

import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

async function main() {
  console.log('🌱 Seeding RBAC test users...')

  // Blog Owner (using wallet address from env)
  const blogOwnerAddress = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS?.toLowerCase()

  if (blogOwnerAddress) {
    const blogOwner = await prisma.user.upsert({
      where: { walletAddress: blogOwnerAddress },
      update: {
        role: UserRole.BLOG_OWNER,
        displayName: 'Blog Owner',
      },
      create: {
        walletAddress: blogOwnerAddress,
        role: UserRole.BLOG_OWNER,
        displayName: 'Blog Owner',
        isActive: true,
      },
    })
    console.log('✅ Blog Owner created/updated:', blogOwner.walletAddress)
  }

  // Curator (username/password)
  const curatorPassword = await hashPassword('curator123')
  const curator = await prisma.user.upsert({
    where: { username: 'curator' },
    update: {
      passwordHash: curatorPassword,
      role: UserRole.CURATOR,
    },
    create: {
      username: 'curator',
      passwordHash: curatorPassword,
      role: UserRole.CURATOR,
      email: 'curator@pianoblog.test',
      displayName: 'Test Curator',
      createdBy: 'seed-script',
      isActive: true,
    },
  })
  console.log('✅ Curator created/updated:', curator.username)
  console.log('   Username: curator')
  console.log('   Password: curator123')

  // Validator 1
  const validator1Password = await hashPassword('validator1')
  const validator1 = await prisma.user.upsert({
    where: { username: 'validator1' },
    update: {
      passwordHash: validator1Password,
      role: UserRole.VALIDATOR,
    },
    create: {
      username: 'validator1',
      passwordHash: validator1Password,
      role: UserRole.VALIDATOR,
      email: 'validator1@pianoblog.test',
      displayName: 'Validator One',
      createdBy: 'seed-script',
      isActive: true,
    },
  })
  console.log('✅ Validator 1 created/updated:', validator1.username)
  console.log('   Username: validator1')
  console.log('   Password: validator1')

  // Validator 2
  const validator2Password = await hashPassword('validator2')
  const validator2 = await prisma.user.upsert({
    where: { username: 'validator2' },
    update: {
      passwordHash: validator2Password,
      role: UserRole.VALIDATOR,
    },
    create: {
      username: 'validator2',
      passwordHash: validator2Password,
      role: UserRole.VALIDATOR,
      email: 'validator2@pianoblog.test',
      displayName: 'Validator Two',
      createdBy: 'seed-script',
      isActive: true,
    },
  })
  console.log('✅ Validator 2 created/updated:', validator2.username)
  console.log('   Username: validator2')
  console.log('   Password: validator2')

  // Validator 3
  const validator3Password = await hashPassword('validator3')
  const validator3 = await prisma.user.upsert({
    where: { username: 'validator3' },
    update: {
      passwordHash: validator3Password,
      role: UserRole.VALIDATOR,
    },
    create: {
      username: 'validator3',
      passwordHash: validator3Password,
      role: UserRole.VALIDATOR,
      email: 'validator3@pianoblog.test',
      displayName: 'Validator Three',
      createdBy: 'seed-script',
      isActive: true,
    },
  })
  console.log('✅ Validator 3 created/updated:', validator3.username)
  console.log('   Username: validator3')
  console.log('   Password: validator3')

  // Scout (username/password)
  const scoutPassword = await hashPassword('scout123')
  const scout = await prisma.user.upsert({
    where: { username: 'scout' },
    update: {
      passwordHash: scoutPassword,
      role: UserRole.SCOUT,
    },
    create: {
      username: 'scout',
      passwordHash: scoutPassword,
      role: UserRole.SCOUT,
      email: 'scout@pianoblog.test',
      displayName: 'Test Scout',
      createdBy: 'seed-script',
      isActive: true,
    },
  })
  console.log('✅ Scout created/updated:', scout.username)
  console.log('   Username: scout')
  console.log('   Password: scout123')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📝 Test User Credentials Summary:')
  console.log('----------------------------------')
  console.log('Blog Owner: (wallet-based auth)')
  console.log(`  Wallet: ${blogOwnerAddress}`)
  console.log('\nCurator:')
  console.log('  Username: curator')
  console.log('  Password: curator123')
  console.log('\nValidators (3 required for venue verification):')
  console.log('  1. Username: validator1, Password: validator1')
  console.log('  2. Username: validator2, Password: validator2')
  console.log('  3. Username: validator3, Password: validator3')
  console.log('\nScout:')
  console.log('  Username: scout')
  console.log('  Password: scout123')
  console.log('\n💡 Use these credentials in your Postman tests')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
