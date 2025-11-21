# Deploying Supabase Migration to Vercel/Production

## Overview

Your local environment is now using Supabase. To deploy to Vercel, you need to update environment variables in the Vercel dashboard.

## Step-by-Step Deployment Guide

### 1. Update Vercel Environment Variables

Go to your Vercel project dashboard:

1. Navigate to: **Project Settings** → **Environment Variables**
2. Update/add these variables for **Production**, **Preview**, and **Development**:

#### Required Database Variables

```bash
# Supabase Database Connection (Pooled - for application)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true

# Supabase Direct Connection (for migrations - if needed)
DIRECT_URL=postgresql://postgres.[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

#### Required Supabase API Variables

```bash
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://aimrdgwyaqezypestica.supabase.co

# Supabase Anonymous Key (safe for frontend)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbXJkZ3d5YXFlenlwZXN0aWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2ODAzMTksImV4cCI6MjA3OTI1NjMxOX0.Y6nWdplH_VXVYqEFJ7seK124nxzngTRiTpfXwjnOVvM

# Supabase Service Role Key (server-side only - KEEP SECRET)
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
```

#### Keep Existing Variables

Make sure these existing variables remain:

- `JWT_SECRET`
- `NEXT_PUBLIC_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_CHAIN_ID`
- `NEXT_PUBLIC_RPC_URL`
- `NEXT_PUBLIC_PXP_TOKEN_ADDRESS`
- `NEXT_PUBLIC_PXP_REWARDS_ADDRESS`
- `NEXT_PUBLIC_BLOG_OWNER_ADDRESS`
- `NEXT_PUBLIC_REOWN_PROJECT_ID`
- Any other blockchain/Web3 variables

### 2. Remove Old Neon Variable (Optional)

You can remove or comment out the old Neon `DATABASE_URL` if it exists in Vercel.

### 3. Deploy to Vercel

#### Option A: Automatic Deployment (Recommended)

1. Commit your changes:

   ```bash
   git add .env.example SUPABASE_MIGRATION.md SUPABASE_DEPLOYMENT.md prisma/schema.prisma
   git commit -m "feat: Migrate database from Neon to Supabase

   - Update Prisma schema with Supabase connection
   - Add DIRECT_URL for migrations
   - Update environment variable examples
   - Add migration documentation

   🤖 Generated with Claude Code

   Co-Authored-By: Claude <noreply@anthropic.com>"
   git push origin main
   ```

2. Vercel will automatically deploy when you push to `main`

#### Option B: Manual Deployment

```bash
vercel --prod
```

### 4. Run Database Migrations on Vercel (If Needed)

Your database schema is already set up on Supabase, so migrations should already be applied. However, if you need to run migrations in the future:

**Option 1: Use Vercel CLI**

```bash
vercel env pull .env.production
npx prisma migrate deploy
```

**Option 2: Run migrations locally against production**

```bash
# Temporarily set DATABASE_URL to production Supabase
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

**Note**: The schema is already deployed to Supabase, so you likely don't need to run migrations now.

### 5. Verify Deployment

After deployment:

1. **Check Build Logs** in Vercel dashboard
   - Look for any Prisma errors
   - Verify environment variables are loaded

2. **Test Production Site**
   - Visit your production URL
   - Test user login
   - Test venue submission
   - Check database connectivity

3. **Monitor Vercel Logs**
   - Check for database connection errors
   - Verify API routes work correctly

## Important Considerations

### Database Migrations in Production

**Current State**:

- ✅ Schema is deployed to Supabase
- ✅ User data migrated (7 users)
- ⚠️ Venue data NOT migrated (fresh start or manual import needed)

**When deploying**:

- Vercel build will use the existing Supabase database
- No data loss (unless you run `prisma migrate reset`)
- New users/venues created in production will go to Supabase

### Connection Pooling

Supabase provides connection pooling via PgBouncer:

- ✅ Recommended for serverless (Vercel)
- ✅ Handles many concurrent connections
- ✅ Already configured in `DATABASE_URL`

### Environment Variable Scopes

Set variables for all three environments:

- **Production**: Live site (yourdomain.com)
- **Preview**: PR preview deployments
- **Development**: `vercel dev` local development

## Rollback Plan (If Needed)

If something goes wrong with Supabase in production:

1. **In Vercel Dashboard** → **Environment Variables**:

   ```bash
   DATABASE_URL=postgresql://neondb_owner:npg_dzork6EFa4fU@ep-nameless-dew-adz5bdn5-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

2. **Redeploy** or trigger new deployment:

   ```bash
   vercel --prod --force
   ```

3. Neon database still has all original data (for 7 days)

## Security Checklist

Before deploying:

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is marked as **Secret** in Vercel
- [ ] Database password is not in any committed files
- [ ] `.env.local` and `.env` are in `.gitignore`
- [ ] Only `.env.example` is committed (with placeholder values)
- [ ] `NEXT_PUBLIC_*` variables are safe to expose (no secrets)

## Troubleshooting

### Build Fails with Prisma Error

**Problem**: Vercel build fails during Prisma client generation

**Solution**:

1. Check that `DATABASE_URL` and `DIRECT_URL` are set in Vercel
2. Ensure Prisma is in `dependencies` not `devDependencies`:
   ```bash
   yarn add prisma @prisma/client
   ```

### Database Connection Errors in Production

**Problem**: `Error: Can't reach database server`

**Solutions**:

1. Verify `DATABASE_URL` is correct in Vercel
2. Check Supabase project is not paused (free tier)
3. Verify connection pooling URL is used
4. Check Supabase Network Restrictions (Settings → Database)

### Prisma Client Not Generated

**Problem**: `@prisma/client` import fails

**Solution**: Add to `package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

This ensures Prisma client is generated during Vercel build.

## Post-Deployment Tasks

After successful deployment:

1. **Test Production Database**:
   - Create a test user
   - Submit a test venue
   - Verify data persists

2. **Monitor Supabase Dashboard**:
   - Check database size
   - Monitor query performance
   - Review connection pool usage

3. **Update Documentation**:
   - Update README with Supabase info
   - Document any production-specific config

4. **Enable Supabase Features** (Optional - Phase 2):
   - Row Level Security
   - Realtime subscriptions
   - Database backups
   - Point-in-time recovery

## Supabase Production Best Practices

### 1. Enable Point-in-Time Recovery (Paid Plans)

- Protects against accidental data loss
- Settings → Database → Point-in-time Recovery

### 2. Set Up Database Backups

- Automatic daily backups (included in paid plans)
- Download manual backups: Settings → Database → Backups

### 3. Monitor Database Metrics

- Query performance
- Connection count
- Storage usage
- Check: Supabase Dashboard → Database → Metrics

### 4. Configure Network Security (Optional)

- Restrict database access by IP
- Settings → Database → Network Restrictions
- Add Vercel IP ranges if needed

## Getting Your Supabase Credentials

If you need to retrieve these values again:

1. **Database Connection Strings**:
   - Supabase Dashboard → Project Settings → Database
   - Copy "Connection string" → "Transaction mode" (pooled)

2. **API Keys**:
   - Supabase Dashboard → Project Settings → API
   - Copy `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

3. **Project URL**:
   - Visible in Supabase Dashboard URL
   - Format: `https://[PROJECT-ID].supabase.co`

## Quick Deployment Checklist

- [ ] Update Vercel environment variables (DATABASE*URL, SUPABASE*\* vars)
- [ ] Keep existing Web3/blockchain variables unchanged
- [ ] Commit changes to git (excluding .env files)
- [ ] Push to GitHub (triggers Vercel deployment)
- [ ] Monitor Vercel build logs
- [ ] Test production deployment
- [ ] Verify database connectivity
- [ ] Check user authentication works
- [ ] Optional: Import venue data to production

---

**Need Help?**

- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard/project/aimrdgwyaqezypestica
- Check logs: `vercel logs [deployment-url]`

**Questions?**: Refer to `SUPABASE_MIGRATION.md` for migration details
