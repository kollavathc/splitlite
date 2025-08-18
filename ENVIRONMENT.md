# Environment Variables Configuration

This document describes all required environment variables for the SplitLite application.

## Required Environment Variables

### Supabase Configuration

#### `NEXT_PUBLIC_SUPABASE_URL`
- **Description**: Your Supabase project URL
- **Format**: `https://[YOUR-PROJECT-REF].supabase.co`
- **Example**: `https://abcdefghijklmnop.supabase.co`
- **Where to find**: Supabase Dashboard → Settings → API → Project URL
- **Required**: ✅ Yes
- **Public**: ✅ Yes (used in client-side code)

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Description**: Your Supabase anonymous/public key
- **Format**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNjQ5NjAwMCwiZXhwIjoxOTUyMDcyMDAwfQ.example`
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → anon public
- **Required**: ✅ Yes
- **Public**: ✅ Yes (used in client-side code)

### Database Configuration

#### `DATABASE_URL`
- **Description**: PostgreSQL connection string with Supabase connection pooling
- **Format**: `postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`
- **Example**: `postgresql://postgres.abcdefghijklmnop:mypassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- **Where to find**: Supabase Dashboard → Settings → Database → Connection string → URI
- **Required**: ✅ Yes
- **Public**: ❌ No (server-side only)

#### `DIRECT_URL` (Optional)
- **Description**: Direct PostgreSQL connection string (without pooling) for migrations and introspection
- **Format**: `postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].supabase.com:5432/postgres`
- **Example**: `postgresql://postgres.abcdefghijklmnop:mypassword123@aws-0-us-east-1.supabase.com:5432/postgres`
- **Where to find**: Supabase Dashboard → Settings → Database → Connection string → URI (use port 5432)
- **Required**: ❌ No (optional, for migrations)
- **Public**: ❌ No (server-side only)

## Optional Environment Variables

### Site Configuration

#### `NEXT_PUBLIC_SITE_URL`
- **Description**: Your application's public URL (for auth redirects)
- **Format**: `https://yourdomain.com` or `http://localhost:3000`
- **Example**: `https://splitlite.vercel.app`
- **Default**: `http://localhost:3000`
- **Required**: ❌ No
- **Public**: ✅ Yes

## Environment Setup Guide

### 1. Local Development (.env.local)

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Database URL with Connection Pooling
DATABASE_URL="postgresql://postgres.your-project-ref:your-password@aws-0-your-region.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct Database URL (optional, for migrations)
DIRECT_URL="postgresql://postgres.your-project-ref:your-password@aws-0-your-region.supabase.com:5432/postgres"

# Site URL (optional)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Vercel Deployment

Add these environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with the appropriate values
4. Set the environment to "Production" (and optionally "Preview" for staging)

### 3. Supabase Connection Pooling Setup

To enable connection pooling in Supabase:

1. **Enable Connection Pooling**:
   - Go to Supabase Dashboard → Settings → Database
   - Scroll down to "Connection Pooling"
   - Enable "Connection Pooling"

2. **Get Connection String**:
   - Use the "Connection string" format
   - Make sure it includes `?pgbouncer=true` parameter
   - Use port `6543` (pooler port) instead of `5432`

3. **Update Prisma Schema**:
   - Your `prisma/schema.prisma` should include:
   ```prisma
   datasource db {
     provider = "postgresql"
     url = env("DATABASE_URL")
     directUrl = env("DIRECT_URL") // Optional: for direct connections
   }
   ```

## Security Notes

### Public vs Private Variables

- **`NEXT_PUBLIC_*`**: These variables are exposed to the client-side and should be safe for public use
- **Non-public variables**: These are only available server-side and should contain sensitive information

### Best Practices

1. **Never commit `.env` files** to version control
2. **Use different keys** for development and production
3. **Rotate keys regularly** for security
4. **Use connection pooling** for better performance
5. **Enable Row Level Security (RLS)** in Supabase

## Troubleshooting

### Common Issues

#### 1. "Invalid database string" Error
- **Cause**: Incorrect DATABASE_URL format
- **Solution**: Ensure you're using the connection pooling URL with `?pgbouncer=true`

#### 2. "Unauthorized" Errors
- **Cause**: Invalid or missing Supabase keys
- **Solution**: Verify your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### 3. Connection Timeout
- **Cause**: Network issues or incorrect region
- **Solution**: Check your region in the DATABASE_URL and ensure it matches your Supabase project

#### 4. Prisma Generation Fails
- **Cause**: Missing DATABASE_URL or invalid connection
- **Solution**: Verify DATABASE_URL is set and accessible

### Verification Commands

Test your environment setup:

```bash
# Test database connection
npx prisma db pull

# Generate Prisma client
npx prisma generate

# Test Supabase connection (in your app)
# Check if auth and storage work properly
```

## Build Configuration

The build command has been updated to include Prisma generation:

```json
{
  "scripts": {
    "build": "npx prisma generate && next build"
  }
}
```

This ensures that:
1. Prisma client is generated before the build
2. Database schema is up to date
3. TypeScript types are properly generated

## Migration Notes

When deploying to production:

1. **Run migrations**: `npx prisma migrate deploy`
2. **Generate client**: `npx prisma generate`
3. **Verify connection**: Test database connectivity
4. **Check environment**: Ensure all variables are set correctly
