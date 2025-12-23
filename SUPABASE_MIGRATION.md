# Supabase Migration Guide

## 1. Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Create a new project
4. Wait for the database to be provisioned

## 2. Run SQL Migration

1. In your Supabase project dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run the SQL script to create all tables

Alternatively, you can use Supabase CLI:
```bash
supabase db push
```

## 3. Get Supabase Credentials

1. Go to **Settings** > **API**
2. Copy the following:
   - **Project URL** (for `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon/public key** (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## 4. Update Environment Variables

Add to your `.env` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

## 5. For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add both variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Make sure to add them for all environments (Production, Preview, Development)

## 6. Seed the Database (Optional)

To populate initial exercises, you'll need to update the seed script to use Supabase instead of Prisma. The exercises data is in `prisma/seed.ts`.

## Changes from Prisma to Supabase

### Removed Dependencies
- `@prisma/client`
- `prisma`
- `pg` (PostgreSQL driver - no longer needed as Supabase handles it)

### Added Dependencies
- `@supabase/supabase-js`

### Key Differences

1. **Query Syntax**: Supabase uses a query builder syntax instead of Prisma's object syntax
   - Prisma: `db.user.findUnique({ where: { email } })`
   - Supabase: `supabase.from('User').select('*').eq('email', email).single()`

2. **Relationships**: Supabase uses explicit joins with select syntax
   - Prisma: `include: { sets: { include: { exercise: true } } }`
   - Supabase: `.select('*, sets:Set(*, exercise:Exercise(*))')`

3. **IDs**: Using `uuid` package instead of Prisma's `cuid()`

4. **Timestamps**: Managing timestamps manually instead of Prisma's automatic handling

## Notes

- All Prisma model names are preserved as table names (User, Exercise, Program, etc.)
- Foreign key relationships are maintained in the SQL schema
- Cascade deletes work the same way through foreign key constraints
- The API interface remains the same, so the frontend doesn't need changes

