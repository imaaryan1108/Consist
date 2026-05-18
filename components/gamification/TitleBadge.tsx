'use client'

import { motion } from 'framer-motion'
import { TITLES, RARITY_COLORS } from '@/app/actions/titles'

interface TitleBadgeProps {
  titleKey: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animate?: boolean
}

export function TitleBadge({ titleKey, size = 'md', showLabel = true, animate = false }: TitleBadgeProps) {
  const title = TITLES[titleKey]
  if (!title) return null

  const colors = RARITY_COLORS[title.rarity]

  const sizeStyles = {
    sm: { badge: 'px-2 py-0.5 text-[10px] gap-1', emoji: 'text-xs' },
    md: { badge: 'px-3 py-1 text-xs gap-1.5', emoji: 'text-sm' },
    lg: { badge: 'px-4 py-1.5 text-sm gap-2', emoji: 'text-base' },
  }

  const s = sizeStyles[size]

  const badge = (
    <span className={`inline-flex items-center ${s.badge} rounded-full border font-black uppercase tracking-wider ${colors}`}>
      <span className={s.emoji}>{title.emoji}</span>
      {showLabel && <span>{title.label}</span>}
    </span>
  )

  if (!animate) return badge

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    >
      {badge}
    </motion.div>
  )
}
