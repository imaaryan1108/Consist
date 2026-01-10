# Supabase Setup Guide

This guide will walk you through setting up Supabase for the Consist MVP.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in the details:
   - **Name**: Consist
   - **Database Password**: Choose a strong password (save it securely!)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Free tier is fine for MVP
5. Click "Create new project"
6. Wait for the project to be provisioned (takes 1-2 minutes)

## Step 2: Run the Database Schema

1. In your Supabase dashboard, click on the **SQL Editor** in the left sidebar
2. Click "New Query"
3. Open the file `supabase/schema.sql` from this project
4. Copy the entire contents
5. Paste it into the SQL Editor in Supabase
6. Click "Run" (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned" - this is expected!

## Step 3: Verify Tables Were Created

1. In the Supabase dashboard, click **Table Editor** in the left sidebar
2. You should see 5 tables:
   - `circles`
   - `users`
   - `consist_logs`
   - `pushes`
   - `activities`

## Step 4: Get Your Supabase Credentials

1. In the Supabase dashboard, click the **Settings** icon (gear) in the left sidebar
2. Click **API** under "Project Settings"
3. You'll see two important values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

## Step 5: Configure Environment Variables

1. In your project root, create a file called `.env.local`
2. Add your credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace `your-project-url-here` and `your-anon-key-here` with the values from Step 4.

## Step 6: Enable Email Authentication

1. In the Supabase dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** is enabled (it should be by default)
3. Scroll down to **Email Templates**
4. Customize the "Magic Link" template if desired (optional for MVP)

## Step 7: Configure Auth URL Settings

1. Go to **Authentication** → **URL Configuration**
2. Add your development URL to **Site URL**:
   - For local development: `http://localhost:3000`
3. Add to **Redirect URLs**:
   - `http://localhost:3000/auth/callback`

## Verification

After completing these steps, restart your Next.js dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

Your Supabase database is now ready! 🎉

## What's Been Set Up

- ✅ **5 Database Tables** with proper relationships
- ✅ **Row Level Security (RLS)** - Users only see their circle's data
- ✅ **Indexes** for fast queries
- ✅ **Real-time subscriptions** enabled for live updates
- ✅ **Helper functions** (e.g., circle code generator)
- ✅ **Constraints** to maintain data integrity

## Next Steps

After setup, we'll implement:
1. Magic link authentication
2. Circle join/create flow
3. Daily punch-in functionality
4. And more...

## Troubleshooting

**Error: "relation does not exist"**
- Make sure you ran the entire `schema.sql` in the SQL Editor

**Connection errors**
- Verify your `.env.local` has the correct URL and anon key
- Make sure there are no extra spaces or quotes
- Restart the dev server after adding env variables

**RLS errors**
- This is normal during development
- RLS policies ensure users only see their own circle's data
