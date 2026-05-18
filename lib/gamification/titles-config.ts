export const TITLES: Record<string, { label: string; description: string; emoji: string; rarity: 'common' | 'rare' | 'legendary' }> = {
  anchor:       { label: 'The Anchor',      emoji: '⚓', rarity: 'common',    description: 'First 3-day streak' },
  ghost:        { label: 'The Ghost',       emoji: '👻', rarity: 'rare',      description: '7 days without missing once' },
  machine:      { label: 'The Machine',     emoji: '⚙️', rarity: 'legendary', description: '14-day streak' },
  pusher:       { label: 'The Pusher',      emoji: '👊', rarity: 'common',    description: 'Sent 5+ pushes' },
  comeback_kid: { label: 'Comeback Kid',    emoji: '🔥', rarity: 'rare',      description: 'Rebuilt a streak after breaking it' },
  iron_will:    { label: 'Iron Will',       emoji: '🛡️', rarity: 'rare',      description: 'Punched in on a day you were pushed' },
  feeder:       { label: 'The Feeder',      emoji: '🥗', rarity: 'common',    description: 'Logged 5 meals' },
  macro_god:    { label: 'Macro God',       emoji: '💪', rarity: 'legendary', description: 'Hit macro targets 3 days in a row' },
}

export const RARITY_COLORS: Record<string, string> = {
  common:    'text-slate-300 border-slate-500/30 bg-slate-500/10',
  rare:      'text-blue-300 border-blue-400/30 bg-blue-500/10',
  legendary: 'text-primary border-primary/30 bg-primary/10',
}

export const CHAPTERS = [
  { number: 1, name: 'The Awakening', days: [1, 7],   threshold: 70, gradient: 'linear-gradient(135deg, #64748b, #94a3b8)', darkText: false },
  { number: 2, name: 'The Grind',     days: [8, 14],  threshold: 75, gradient: 'linear-gradient(135deg, #2563eb, #60a5fa)', darkText: false },
  { number: 3, name: 'The Lock-in',   days: [15, 21], threshold: 80, gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)', darkText: false },
  { number: 4, name: 'The Month',     days: [22, 30], threshold: 85, gradient: 'linear-gradient(135deg, #C6FF00, #4ade80)', darkText: true  },
]
