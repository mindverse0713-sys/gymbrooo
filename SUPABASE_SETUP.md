# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Create a new project
4. Wait for the database to be provisioned

## 2. Get Database Connection String

1. In your Supabase project dashboard, go to **Settings** > **Database**
2. Scroll down to **Connection string** section
3. Copy the **URI** connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)
4. Replace `[YOUR-PASSWORD]` with your database password (set during project creation)

## 3. Update .env file

Add the connection string to your `.env` file:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

**Note:** For serverless environments (like Vercel), add `?pgbouncer=true&connection_limit=1` to use connection pooling.

## 4. For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add `DATABASE_URL` with your Supabase connection string
4. Make sure to add it for all environments (Production, Preview, Development)

## 5. Run Migrations

After setting up the connection string:

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Or create a migration (recommended for production)
npm run db:migrate
```

## 6. Seed the Database (Optional)

If you want to populate initial exercises:

```bash
npx tsx prisma/seed.ts
```

## Connection Pooling for Production

For production apps with high traffic, consider using Supabase's connection pooling:

1. Use port `6543` instead of `5432` for pooled connections
2. Connection string: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true`

## Troubleshooting

- If you get connection errors, make sure your IP is allowed in Supabase dashboard (Settings > Database > Connection Pooling)
- For serverless, always use connection pooling (pgbouncer=true)
- Make sure your password is URL-encoded if it contains special characters

