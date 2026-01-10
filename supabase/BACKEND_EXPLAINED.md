# Backend Architecture Explained: Supabase vs Express

A comprehensive guide for developers coming from Express.js to understand Supabase.

---

## Table of Contents
1. [The Big Picture: What is Supabase?](#the-big-picture)
2. [Express vs Supabase: Different Mental Models](#express-vs-supabase)
3. [Our Database Schema: What, Why, How](#database-schema)
4. [Row Level Security (RLS): The Magic Security Layer](#row-level-security)
5. [Real-time Subscriptions: Live Updates](#real-time-subscriptions)
6. [Helper Functions: Our API Layer](#helper-functions)
7. [The Complete Request Flow](#request-flow)

---

## The Big Picture: What is Supabase?

### Express Mental Model (What You Know)
```
Client → Your Express Server → Database (PostgreSQL/MongoDB)
         ↑
    You write code for:
    - Authentication
    - API routes
    - Database queries
    - Authorization checks
    - Real-time (Socket.io)
```

### Supabase Mental Model (What We're Using)
```
Client → Supabase (Pre-built backend) → PostgreSQL Database
         ↑
    Supabase provides:
    - Auto-generated REST & GraphQL APIs
    - Built-in authentication
    - Row-level security (database-level auth)
    - Real-time subscriptions
    - File storage
```

### WHY Supabase for MVPs?

**In Express, you'd write:**
```javascript
// routes/auth.js
router.post('/login', async (req, res) => {
  // Validate email
  // Check password
  // Generate JWT
  // Send token
  // Handle errors
  // ... 50-100 lines of code
})

// routes/users.js
router.get('/users/:id', authenticate, async (req, res) => {
  // Check if user is authorized
  // Query database
  // Handle errors
  // Return JSON
})

// And repeat for every endpoint...
```

**With Supabase:**
```javascript
// Authentication
await supabase.auth.signInWithOtp({ email })

// Queries
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)

// Security handled at DATABASE level (RLS)
```

**Bottom line:** Supabase eliminates ~80% of boilerplate code. You get authentication, APIs, and security out of the box.

---

## Express vs Supabase: Different Mental Models

### How You'd Build This in Express

```javascript
// Traditional Express approach
const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { Pool } = require('pg')

const app = express()
const db = new Pool({ /* connection */ })

// Middleware to check authentication
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET)
    req.user = user
    next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// Middleware to check authorization (can user access this circle?)
async function authorizeCircleAccess(req, res, next) {
  const userId = req.user.id
  const circleId = req.params.circleId
  
  const result = await db.query(
    'SELECT circle_id FROM users WHERE id = $1',
    [userId]
  )
  
  if (result.rows[0]?.circle_id !== circleId) {
    return res.status(403).json({ error: 'Not authorized' })
  }
  
  next()
}

// EVERY route needs both middlewares
app.get('/circles/:circleId/members', 
  authenticate, 
  authorizeCircleAccess, 
  async (req, res) => {
    const { circleId } = req.params
    const result = await db.query(
      'SELECT * FROM users WHERE circle_id = $1',
      [circleId]
    )
    res.json(result.rows)
  }
)

// You'd need to write similar code for:
// - POST /consist (mark consisted)
// - POST /push (push a friend)
// - GET /activities (activity feed)
// - ... and so on (10-20 routes)
```

**Problems with this approach:**
1. **Lots of code** - You write auth/authz for every route
2. **Easy to forget** - Miss one middleware? Security hole!
3. **Hard to test** - Need to test each route's security
4. **Boilerplate** - Same patterns repeated everywhere

### How We Do It in Supabase

```javascript
// No Express server needed!
// No middleware functions needed!
// All of this is handled at the DATABASE level

// Client-side code (Next.js)
const { data: members } = await supabase
  .from('users')
  .select('*')
  .eq('circle_id', circleId)

// ☝️ This automatically:
// 1. Checks if user is authenticated
// 2. Checks if user has access to this circle (via RLS)
// 3. Only returns data the user is allowed to see
// 4. Returns real-time updates if subscribed
```

**HOW does this work without a backend?**

The magic is **Row Level Security (RLS)** - we'll explain this next.

---

## Database Schema: What, Why, How

Let's walk through our 5 tables and understand the design decisions.

### Table 1: `circles`

```sql
create table public.circles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text unique not null,
  created_at timestamp with time zone default now(),
  created_by uuid references auth.users(id)
);
```

**WHAT:** A "circle" is a private group of friends.

**WHY these fields:**
- `id` (UUID): Unique identifier. UUIDs are better than auto-incrementing IDs for security (can't guess next ID)
- `name`: "Gym Bros", "Morning Warriors", etc.
- `code`: 6-character join code (like "ABC123") so friends can find the circle
- `created_by`: Who created this circle (links to Supabase's built-in auth system)

**HOW it works in Express vs Supabase:**

Express:
```javascript
// You'd write a route
app.post('/circles', authenticate, async (req, res) => {
  const code = generateRandomCode()
  const result = await db.query(
    'INSERT INTO circles (name, code, created_by) VALUES ($1, $2, $3) RETURNING *',
    [req.body.name, code, req.user.id]
  )
  res.json(result.rows[0])
})
```

Supabase:
```javascript
// Direct database call from frontend
const { data } = await supabase
  .from('circles')
  .insert({ name: 'Gym Bros', code: 'ABC123', created_by: userId })
  .select()
  .single()
```

### Table 2: `users`

```sql
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  circle_id uuid references public.circles(id) on delete set null,
  current_streak int default 0 check (current_streak >= 0),
  longest_streak int default 0 check (longest_streak >= 0),
  total_days int default 0 check (total_days >= 0),
  score int default 0 check (score >= 0),
  last_consist_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

**WHAT:** Extended user profile with gym consistency stats.

**WHY this design:**
- `id references auth.users(id)`: Supabase has a built-in `auth.users` table. We extend it with our custom fields.
- `circle_id`: Which circle is this user in? (NULL if not in a circle yet)
- `current_streak`, `longest_streak`, `total_days`: Denormalized data for performance
- `check (current_streak >= 0)`: Database constraint - enforces business rules at DB level

**Denormalization Explained:**

In a "pure" database design, you might calculate streak on-the-fly:
```sql
-- Calculate streak every time (SLOW for large datasets)
SELECT COUNT(*) FROM consist_logs 
WHERE user_id = '...' 
AND date >= /* complex date logic */
```

Instead, we store the streak directly on the user row:
```sql
-- Just read it (FAST)
SELECT current_streak FROM users WHERE id = '...'
```

**Trade-off:** When user consists, we update BOTH tables:
1. Insert into `consist_logs` (record the action)
2. Update `users` (increment streak, score, etc.)

This is called "denormalization" - duplicating data for speed.

### Table 3: `consist_logs`

```sql
create table public.consist_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  created_at timestamp with time zone default now(),
  
  unique(user_id, date)  -- Can't consist twice in one day
);
```

**WHAT:** A log of every day a user marked "consisted".

**WHY:**
- Immutable record (we never delete these)
- Used to verify streaks and calculate history
- `unique(user_id, date)`: Database enforces "once per day" rule

**HOW it prevents cheating:**

Without this constraint:
```javascript
// Oops! User clicked the button twice
await supabase.from('consist_logs').insert({ user_id: 'abc', date: '2026-01-11' })
await supabase.from('consist_logs').insert({ user_id: 'abc', date: '2026-01-11' })
// Now they have 2 logs for the same day!
```

With the constraint:
```javascript
await supabase.from('consist_logs').insert({ user_id: 'abc', date: '2026-01-11' })
await supabase.from('consist_logs').insert({ user_id: 'abc', date: '2026-01-11' })
// Second insert fails with error: "duplicate key value violates unique constraint"
```

The database protects you from bugs!

### Table 4: `pushes`

```sql
create table public.pushes (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid references public.users(id) on delete cascade not null,
  to_user_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  created_at timestamp with time zone default now(),
  
  check (from_user_id != to_user_id)  -- Can't push yourself
);
```

**WHAT:** Record of motivation pushes between friends.

**WHY:**
- Track who pushed whom
- Enforce 3-push-per-day limit (checked in application code)
- Give bonus points if user consists after being pushed
- `check (from_user_id != to_user_id)`: Can't push yourself!

**Database Constraints = Free Validation:**

In Express, you'd write:
```javascript
app.post('/push', authenticate, async (req, res) => {
  if (req.body.to_user_id === req.user.id) {
    return res.status(400).json({ error: "Can't push yourself" })
  }
  // ... rest of logic
})
```

With database constraints, this is impossible:
```javascript
// This will ALWAYS fail at database level
await supabase.from('pushes').insert({
  from_user_id: 'user123',
  to_user_id: 'user123',  // Same as from!
  date: '2026-01-11'
})
// Error: new row violates check constraint "pushes_from_user_id_check"
```

### Table 5: `activities`

```sql
create table public.activities (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('consisted', 'streak_milestone', 'push_sent', 'consisted_after_push', 'streak_broken')),
  actor_id uuid references public.users(id) on delete cascade not null,
  target_id uuid references public.users(id) on delete cascade,
  circle_id uuid references public.circles(id) on delete cascade not null,
  metadata jsonb,
  created_at timestamp with time zone default now()
);
```

**WHAT:** Activity feed - a timeline of events in a circle.

**WHY:**
- Shows social proof ("John consisted today!")
- Creates accountability ("Sarah pushed you!")
- Celebrates milestones ("Alice hit a 7-day streak!")

**The `metadata` field (JSONB):**

JSONB is PostgreSQL's JSON data type. It lets you store flexible data:

```javascript
// Milestone activity
{
  type: 'streak_milestone',
  actor_id: 'user123',
  circle_id: 'circle456',
  metadata: {
    streak: 7,
    message: '7-day streak!'
  }
}

// Push activity
{
  type: 'push_sent',
  actor_id: 'user123',
  target_id: 'user789',
  circle_id: 'circle456',
  metadata: {
    push_message: 'Get to the gym! 💪'
  }
}
```

**WHY JSONB instead of separate columns?**

Different event types need different data:
- `consisted`: No extra data needed
- `streak_milestone`: Need streak count
- `push_sent`: Maybe custom message

Instead of creating columns for every possible field, use flexible JSON.

---

## Row Level Security (RLS): The Magic Security Layer

This is the **most important concept** in Supabase. It replaces all your Express middleware.

### The Problem in Express

```javascript
// Every route needs authorization checks
app.get('/users', authenticate, async (req, res) => {
  const userCircle = await getUserCircle(req.user.id)
  
  // Manual check!
  const users = await db.query(
    'SELECT * FROM users WHERE circle_id = $1',
    [userCircle]
  )
  
  res.json(users.rows)
})

app.get('/activities', authenticate, async (req, res) => {
  const userCircle = await getUserCircle(req.user.id)
  
  // Same check again!
  const activities = await db.query(
    'SELECT * FROM activities WHERE circle_id = $1',
    [userCircle]
  )
  
  res.json(activities.rows)
})

// Repeat 20 times... easy to forget one!
```

### The Solution: RLS

RLS moves authorization from your code to the **database itself**.

```sql
-- This policy applies to EVERY query on the users table
create policy "Users can view circle members"
  on public.users for select
  using (
    circle_id in (
      select circle_id from public.users where id = auth.uid()
    )
    or id = auth.uid()
  );
```

**HOW does this work?**

When you run:
```javascript
const { data } = await supabase.from('users').select('*')
```

Supabase **automatically rewrites** your query to:
```sql
SELECT * FROM public.users
WHERE (
  circle_id IN (SELECT circle_id FROM public.users WHERE id = current_user_id)
  OR id = current_user_id
)
```

**You can't bypass this.** Even if you try:
```javascript
// Malicious attempt to see all users
const { data } = await supabase.from('users').select('*')

// Only returns users in YOUR circle!
```

### Breaking Down Our RLS Policies

#### Policy 1: View Circle Members
```sql
create policy "Users can view circle members"
  on public.users for select
  using (
    circle_id in (
      select circle_id from public.users where id = auth.uid()
    )
    or id = auth.uid()
  );
```

**Translation:**
- `on public.users for select`: Applies to SELECT queries on users table
- `auth.uid()`: Current logged-in user's ID (Supabase provides this)
- Logic: "You can see users if they're in your circle OR if it's your own profile"

**Example Scenario:**

You (user123) are in circle "Gym Bros" (circle456).

When you query:
```javascript
const { data } = await supabase.from('users').select('*')
```

You get:
- ✅ All users in circle456 (your circle)
- ✅ Your own profile
- ❌ Users in other circles
- ❌ Users with no circle

#### Policy 2: Create Pushes
```sql
create policy "Users can create pushes to circle members"
  on public.pushes for insert
  with check (
    from_user_id = auth.uid()
    and to_user_id in (
      select id from public.users 
      where circle_id = (
        select circle_id from public.users where id = auth.uid()
      )
    )
  );
```

**Translation:**
- `for insert`: Applies when creating new pushes
- `with check`: Condition must be true for insert to succeed
- Logic: "You can push someone if you're the sender AND they're in your circle"

**Prevents attacks:**
```javascript
// Trying to push someone not in your circle
await supabase.from('pushes').insert({
  from_user_id: 'you',
  to_user_id: 'random_person_in_different_circle',
  date: '2026-01-11'
})
// ❌ Fails! RLS blocks it.
```

### Why RLS is Better Than Express Middleware

| Aspect | Express Middleware | Row Level Security |
|--------|-------------------|-------------------|
| **Location** | Application code | Database layer |
| **Can forget to add** | ✅ Yes (security holes!) | ❌ No (always enforced) |
| **Testing** | Must test each route | Test once, applies everywhere |
| **Performance** | Extra queries for auth | Single optimized query |
| **Consistency** | Different logic per route | Same rules everywhere |

---

## Real-time Subscriptions: Live Updates

In Express, real-time usually means WebSockets (Socket.io).

### Express + Socket.io Approach

```javascript
// Server
const io = require('socket.io')(server)

io.on('connection', (socket) => {
  socket.on('join_circle', (circleId) => {
    // Manually check authorization
    if (userIsInCircle(socket.user, circleId)) {
      socket.join(`circle_${circleId}`)
    }
  })
  
  // When someone consists, notify others
  socket.on('consisted', async (data) => {
    await db.query('INSERT INTO consist_logs ...')
    io.to(`circle_${data.circleId}`).emit('user_consisted', data)
  })
})

// Client
socket.emit('join_circle', circleId)
socket.on('user_consisted', (data) => {
  // Update UI
})
```

**Problems:**
- Manual setup for each event type
- Authorization checks needed for each event
- Complex reconnection logic
- Scaling issues (need Redis for multiple servers)

### Supabase Real-time Approach

```javascript
// Client only! No server code needed.
const subscription = supabase
  .channel(`circle:${circleId}:members`)
  .on(
    'postgres_changes',
    {
      event: '*',  // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'users',
      filter: `circle_id=eq.${circleId}`
    },
    (payload) => {
      console.log('User updated:', payload.new)
      // Update UI automatically
    }
  )
  .subscribe()
```

**HOW it works:**

1. Supabase listens to PostgreSQL's built-in change log
2. When a row changes, it broadcasts to subscribed clients
3. RLS policies apply - you only get updates you're allowed to see
4. Automatically handles reconnection, batching, etc.

**Our specific subscriptions:**

```javascript
// Real-time circle members (see who's online, who consisted)
subscribeToCircleMembers(circleId, (payload) => {
  if (payload.eventType === 'UPDATE') {
    // Someone's streak changed! Update the UI
    updateMemberInUI(payload.new)
  }
})

// Real-time activity feed
subscribeToCircleActivities(circleId, (payload) => {
  if (payload.eventType === 'INSERT') {
    // New activity! Add to feed
    prependActivityToFeed(payload.new)
  }
})
```

**Use case example:**

1. Alice marks "consisted" on her phone
2. Database updates: `consist_logs` INSERT, `users` UPDATE (streak++)
3. Supabase broadcasts to all subscribers in Alice's circle
4. Bob's phone receives update instantly
5. Bob sees: "Alice consisted! 🔥 5-day streak"

All without writing any WebSocket code!

---

## Helper Functions: Our API Layer

Even though Supabase provides direct database access, we still write helper functions. **WHY?**

### Raw Supabase Queries (Without Helpers)

```javascript
// Check if user consisted today
const today = new Date().toISOString().split('T')[0]
const { data } = await supabase
  .from('consist_logs')
  .select('id')
  .eq('user_id', userId)
  .eq('date', today)
  .single()

const consistedToday = !!data
```

**Problems:**
- Repeating this logic everywhere
- Easy to make mistakes (forget `.single()`, wrong date format)
- Hard to change later (update in 20 places)

### With Helper Functions

```javascript
// lib/supabase/helpers.ts
export async function hasConsistedToday(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('consist_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error checking consist status:', error)
    return false
  }
  
  return !!data
}

// Usage (anywhere in your app)
const consisted = await hasConsistedToday(userId)
```

**Benefits:**
- ✅ Descriptive name (`hasConsistedToday` vs raw query)
- ✅ Error handling in one place
- ✅ Easy to test
- ✅ Type-safe (TypeScript knows it returns boolean)

### Breaking Down Our Helpers

#### Circle Management
```javascript
// Generate unique circle code
export async function generateCircleCode(): Promise<string> {
  const { data } = await supabase.rpc('generate_circle_code')
  return data
}
```

**What's `rpc`?**

RPC = Remote Procedure Call. It calls custom functions you define in the database.

Remember this in our schema?
```sql
create or replace function generate_circle_code()
returns text as $$
  -- ... generates random 6-char code
$$ language plpgsql;
```

`supabase.rpc('generate_circle_code')` calls that function.

**WHY define it in the database?**
- Guaranteed unique (database checks for collisions)
- Atomic operation (no race conditions)
- Reusable from any client

#### Joining a Circle
```javascript
export async function joinCircle(code: string): Promise<Circle | null> {
  const { data, error } = await supabase
    .from('circles')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()
  
  if (error) {
    return null
  }
  
  return data
}
```

**Breakdown:**
- `.from('circles')`: Query the circles table
- `.select('*')`: Get all columns
- `.eq('code', code.toUpperCase())`: WHERE code = 'ABC123'
- `.single()`: Expect exactly one result (or error)

**WHY `.single()`?**

Without it:
```javascript
const { data } = await supabase.from('circles').select('*').eq('code', 'ABC123')
// data is an array: [{ id: '...', name: 'Gym Bros', ... }]
```

With it:
```javascript
const { data } = await supabase.from('circles').select('*').eq('code', 'ABC123').single()
// data is an object: { id: '...', name: 'Gym Bros', ... }
```

#### Push Validation
```javascript
export async function getPushCountToday(userId: string): Promise<number> {
  const today = getTodayDate()
  
  const { count } = await supabase
    .from('pushes')
    .select('*', { count: 'exact', head: true })
    .eq('from_user_id', userId)
    .eq('date', today)
  
  return count || 0
}
```

**New concept: `{ count: 'exact', head: true }`**
- `count: 'exact'`: Count total rows
- `head: true`: Don't return the actual rows (just the count)

**WHY?**

Efficient! Instead of:
```javascript
// Inefficient: Fetch all rows, count in JavaScript
const { data } = await supabase.from('pushes').select('*')...
return data.length  // Transfers all data over network!
```

We do:
```javascript
// Efficient: Count in database
const { count } = await supabase.from('pushes').select('*', { count: 'exact', head: true })...
return count  // Only transfers a single number!
```

---

## The Complete Request Flow

Let's trace what happens when a user **marks "consisted"**.

### Step 1: User Clicks Button

```javascript
// components/DailyPunchIn.tsx
const handleConsist = async () => {
  // Check if already consisted today
  const alreadyConsisted = await hasConsistedToday(userId)
  if (alreadyConsisted) {
    toast.error('You already consisted today!')
    return
  }
  
  // Insert consist log
  const { error } = await supabase
    .from('consist_logs')
    .insert({
      user_id: userId,
      date: getTodayDate()
    })
  
  if (error) {
    toast.error('Failed to mark consisted')
    return
  }
  
  // Update user stats
  await updateUserStats(userId)
}
```

### Step 2: Database Insert (consist_logs)

```
Client → Supabase API → PostgreSQL
                      ↓
                  1. Check RLS Policy:
                     "Can user_id: abc insert their own log?"
                     ✅ Yes (matches auth.uid())
                     
                  2. Check Constraints:
                     unique(user_id, date)
                     ✅ No duplicate for today
                     
                  3. Insert Row:
                     INSERT INTO consist_logs (user_id, date)
                     VALUES ('abc', '2026-01-11')
                     
                  4. Return Success
```

### Step 3: Update User Stats

```javascript
async function updateUserStats(userId: string) {
  // Get recent logs to calculate streak
  const { data: logs } = await supabase
    .from('consist_logs')
    .select('date')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(365)  // Last year
  
  // Calculate new streak
  const { currentStreak } = calculateStreak(logs, getTodayDate())
  
  // Get current longest streak
  const { data: user } = await supabase
    .from('users')
    .select('longest_streak, total_days, score')
    .eq('id', userId)
    .single()
  
  // Check if pushed today
  const wasPushed = await wasPushedToday(userId)
  
  // Calculate points
  const { total: newPoints, isNewRecord } = calculateConsistPoints(
    wasPushed,
    currentStreak,
    user.longest_streak
  )
  
  // Update user
  const { error } = await supabase
    .from('users')
    .update({
      current_streak: currentStreak,
      longest_streak: Math.max(currentStreak, user.longest_streak),
      total_days: user.total_days + 1,
      score: user.score + newPoints,
      last_consist_date: getTodayDate(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
  
  // Create activity feed item
  await supabase
    .from('activities')
    .insert({
      type: 'consisted',
      actor_id: userId,
      circle_id: user.circle_id,
      metadata: { streak: currentStreak }
    })
  
  // If milestone, create another activity
  if (currentStreak === 7) {
    await supabase
      .from('activities')
      .insert({
        type: 'streak_milestone',
        actor_id: userId,
        circle_id: user.circle_id,
        metadata: { streak: 7 }
      })
  }
}
```

### Step 4: Real-time Broadcast

```
PostgreSQL receives UPDATE on users table
       ↓
PostgreSQL's replication log updated
       ↓
Supabase Realtime Server listens to log
       ↓
Checks: Who's subscribed to this circle?
       ↓
Broadcasts to all subscribers:
  {
    eventType: 'UPDATE',
    table: 'users',
    new: { id: 'abc', current_streak: 5, ... },
    old: { id: 'abc', current_streak: 4, ... }
  }
       ↓
Other users' clients receive update
       ↓
UIs update automatically
```

### Step 5: UI Updates Everywhere

```javascript
// In other users' browsers
subscribeToCircleMembers(circleId, (payload) => {
  // payload.new contains updated user data
  const updatedUser = payload.new
  
  // Update the circle member list
  setMembers(prev => prev.map(m => 
    m.id === updatedUser.id ? updatedUser : m
  ))
  
  // Maybe show a toast
  toast.success(`${updatedUser.name} consisted! 🔥`)
})
```

---

## Summary: The Supabase Advantage

### What You'd Write in Express

- **Authentication**: 200+ lines (JWT, refresh tokens, email verification)
- **Authorization**: 50+ lines per protected route
- **API Routes**: 20-30 routes × 30 lines each = 600+ lines
- **Database**: Connection pooling, query builders, migrations
- **Real-time**: Socket.io setup, room management, auth
- **Total**: ~2000+ lines of backend code

### What We Wrote with Supabase

- **Database Schema**: `schema.sql` (one-time setup)
- **Helper Functions**: `helpers.ts` (200 lines of business logic)
- **Utils**: `utils.ts` (150 lines of calculations)
- **Total**: ~400 lines total, **80% less code**

### When to Use Supabase vs Express

**Use Supabase when:**
- ✅ Building MVPs quickly
- ✅ Standard CRUD operations
- ✅ Need real-time features
- ✅ Small team (1-3 developers)
- ✅ PostgreSQL-compatible data model

**Use Express when:**
- ❌ Complex business logic that doesn't map to database operations
- ❌ Need to integrate with many third-party APIs
- ❌ Existing backend infrastructure to integrate with
- ❌ Very custom authentication flows

### For Consist MVP

Supabase is perfect because:
1. **Simple data model** - Circles, users, logs
2. **Clear security boundaries** - RLS maps perfectly to "circle privacy"
3. **Real-time is essential** - See friends' progress live
4. **Speed matters** - Launch MVP in days, not weeks

---

## Next Steps: Using What You've Learned

Now that you understand the backend:

1. **Set up Supabase** (follow SETUP.md)
2. **Test the schema** - Insert some test data
3. **Try the queries** - Open Supabase's Table Editor and run queries
4. **Watch RLS in action** - Try to access data you shouldn't be able to
5. **Build the frontend** - Use the helper functions we created

The beauty of this architecture: **you never write backend API code**. It's all database queries with automatic security!
