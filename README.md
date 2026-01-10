# Consist

A private social discipline app where friends come together to build consistency through daily gym check-ins, streaks, and gentle social pressure.

## About

Consist is not about being perfect; it's about showing up every day, together. Instead of tracking workouts alone, users mark themselves "Consistent" each day, maintain streaks, and motivate each other through a simple push-to-consist feature. The app turns showing up into an identity, not just an action — making consistency visible, social, and emotionally rewarding.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd Consist
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
/consist
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with fonts and metadata
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/            # React components (to be added)
├── lib/                   # Utility functions and clients
│   └── supabase/         # Supabase client configuration
├── types/                 # TypeScript type definitions
│   └── database.types.ts # Database schema types
└── public/               # Static assets
```

## Development Roadmap

See `task.md` in the `.gemini/antigravity/brain` directory for the detailed development checklist.

### MVP Features

- ✅ Project setup
- 🚧 Daily "Consist" punch-in
- 🚧 Streak calculation
- 🚧 Consistency circles (friend groups)
- 🚧 Push to Consist (motivation feature)
- 🚧 Activity feed
- 🚧 Points system
- 🚧 Profile stats

## Contributing

This is an MVP project. Contributions are welcome as the project evolves.

## License

MIT
