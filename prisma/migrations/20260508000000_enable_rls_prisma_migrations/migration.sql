-- Enable RLS on Prisma's internal migration tracking table.
-- No policies are added intentionally: RLS with no policies = deny all via
-- PostgREST, which is correct for this table. Prisma connects via the
-- service role and bypasses RLS, so migrations are unaffected.
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
