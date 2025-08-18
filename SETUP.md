# SplitLite Setup Guide

## Prisma + Supabase Setup

### 1. Supabase Project Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > Database
3. Copy the connection string (it will look like this):
   ```
   postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

### 2. Environment Configuration

1. Copy the environment template:
   ```bash
   cp env.example .env
   ```

2. Update `.env` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   
   # Use the connection string from Supabase with pgbouncer=true for connection pooling
   DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

### 3. Database Migration

1. Run the Prisma migration:
   ```bash
   npx prisma migrate dev --name init
   ```

2. This will create all the necessary tables in your Supabase database.

### 4. Supabase Auth Configuration

1. Go to Authentication > Settings > URL Configuration
2. Add `http://localhost:3000/auth/callback` to your redirect URLs

### 5. Verify Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000`
3. Try signing in with your email
4. Check that the user and default group are created in your Supabase database

## Database Schema

The application uses the following Prisma models:

- **User**: User accounts with email and name
- **Group**: Expense groups (e.g., "บ้านเรา", "Trip to Japan")
- **Membership**: User-group relationships with roles (owner, admin, member)
- **Expense**: Individual expenses with amount and description
- **Split**: How expenses are split between users

## Connection Pooling

The application uses Supabase's connection pooling to handle multiple concurrent database connections efficiently. The `?pgbouncer=true` parameter in the DATABASE_URL enables this feature.

## Troubleshooting

### Migration Issues
- Ensure your DATABASE_URL is correct
- Check that your Supabase project is active
- Verify your database password is correct

### Authentication Issues
- Make sure redirect URLs are configured in Supabase
- Check that environment variables are loaded correctly
- Verify the auth callback route is working

### Prisma Issues
- Run `npx prisma generate` if you modify the schema
- Use `npx prisma studio` to view your database
- Check `npx prisma db push` for schema changes without migrations
