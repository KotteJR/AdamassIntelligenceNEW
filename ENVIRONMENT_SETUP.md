# Environment Setup Guide

## Current Issue

You're getting the error `Missing environment variable SUPABASE_SERVICE_ROLE_KEY` because the admin dashboard needs admin privileges to access all data.

## Quick Fix (Temporary)

The app will now work with just your current environment variables, but with limited admin functionality due to Row Level Security (RLS) restrictions.

## Full Admin Access Setup

To get full admin functionality, you need to add the Supabase Service Role Key:

### 1. Get Your Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (not the anon key)

### 2. Add to Environment Variables

Create or update your `.env.local` file in the project root:

```bash
# Your existing variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Add this for full admin access
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional: Other variables for full functionality
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
N8N_WEBHOOK_URL=your_n8n_webhook_url
```

### 3. Restart the Development Server

```bash
npm run dev
```

## What Each Key Does

- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Public key with RLS restrictions (what you have now)
- **SUPABASE_SERVICE_ROLE_KEY**: Admin key that bypasses RLS (what you need for full admin access)

## Current Status

✅ **App works** with your current setup
⚠️ **Admin dashboard** has limited functionality due to RLS restrictions
✅ **Full admin access** available once you add the service role key

## Security Note

The service role key should **NEVER** be exposed to the client side. It's only used in server-side API routes and gives full database access. Keep it secure and never commit it to version control.
