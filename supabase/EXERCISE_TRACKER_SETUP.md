# Exercise Tracker Setup Guide

## Step 1: Apply Database Schema

Run the SQL file in your Supabase SQL Editor:

1. Go to [app.supabase.com](https://app.supabase.com) → Your Project
2. Click **SQL Editor** in the left sidebar
3. Click **"New Query"**
4. Copy all contents from `supabase/exercise_logs_schema.sql`
5. Paste and click **"Run"**

This will create:
- `exercise_logs` table
- Indexes for performance
- Row Level Security policies  
- Trigger to auto-update exercise count

## Step 2: Regenerate TypeScript Types

```bash
cd /Users/aaryan/Desktop/Other/Projects/Consist

# Generate fresh types
npx supabase gen types typescript --linked > types/database.types.ts
```

## Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
# Then restart
pnpm dev
```

## What You'll See

On `/tracking` page:
- **Add Exercise** form with:
  - Exercise name input
  - Sets, Reps, Weight fields
  - Add button to add more exercises
- **Today's Workout** list showing all added exercises
- **Complete Workout** button to save everything

## Usage Example

1. Enter "Inclined Chest Press"
2. Sets: 3
3. Reps: 12
4. Weight: 15
5. Click **+ Add Exercise**
6. Repeat for all exercises
7. Click **✅ Complete Workout**

All exercises save together as one workout session!
