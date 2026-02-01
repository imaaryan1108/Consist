# Database Setup Instructions

## Step 1: Apply Transformation Schema

Run the following SQL files in your Supabase SQL Editor in this order:

1. **Main transformation schema**:
   ```sql
   -- Copy and paste contents of: supabase/transformation_schema.sql
   ```

2. **Helper function for score incrementing**:
   ```sql
   -- Copy and paste contents of: supabase/increment_score_function.sql
   ```

## Step 2: Regenerate TypeScript Types

After applying the schema, you need to regenerate the database types. The current types in `types/database.types.ts` have been pre-populated with the expected structure, but you should regenerate them from your actual database for accuracy.

### Option A: Using Supabase CLI (Recommended)

> **Note**: Use `npx supabase` if you installed it locally, or just `supabase` if installed globally.

```bash
# Login to Supabase (this will open a browser)
npx supabase login

# Link your project (you'll need your project reference ID from Supabase dashboard)
npx supabase link --project-ref YOUR_PROJECT_REF

# Generate types from your actual database
npx supabase gen types typescript --linked > types/database.types.ts
```

To find your project reference ID:
1. Go to your Supabase project dashboard
2. Click on "Settings" → "General"
3. Copy the "Reference ID" (looks like: `abcdefghijklmnop`)

### Option B: Manual Copy

If you prefer not to use the CLI:
1. Go to your Supabase Dashboard
2. Navigate to "Database" → "Types"
3. Copy the generated TypeScript types
4. Paste into `types/database.types.ts`

## Step 3: Verify Setup

Run the development server to check for any remaining type errors:

```bash
npm run dev
```

All TypeScript errors related to table inserts should be resolved once the types are regenerated from the actual database.

## Notes

- The pre-populated types in `types/database.types.ts` are manually created based on the schema
- They should match what Supabase will generate, but regenerating ensures 100% accuracy
- If you see TypeScript errors about "type 'never'", it means the Supabase client doesn't recognize the new tables yet
