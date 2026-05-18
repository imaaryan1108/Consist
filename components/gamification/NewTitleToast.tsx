'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { TITLES, RARITY_COLORS } from '@/app/actions/titles'
import confetti from 'canvas-confetti'

interface Props {
  titleKeys: string[]
  onClose: () => void
}

export function NewTitleToast({ titleKeys, onClose }: Props) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!titleKeys.length) return

    // Fire confetti for legendary titles
    const title = TITLES[titleKeys[current]]
    if (title?.rarity === 'legendary') {
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.4 }, colors: ['#C6FF00', '#fff', '#a855f7'] })
    }

    const timer = setTimeout(() => {
      if (current < titleKeys.length - 1) setCurrent(c => c + 1)
      else onClose()
    }, 3500)

    return () => clearTimeout(timer)
  }, [current, titleKeys])

  if (!titleKeys.length) return null

  const titleKey = titleKeys[current]
  const title = TITLES[titleKey]
  if (!title) return null

  const colors = RARITY_COLORS[title.rarity]
  const rarityLabel = { common: 'New Title', rare: 'Rare Title Unlocked', legendary: '✨ Legendary Title' }

  return (
    <AnimatePresence>
      <motion.div
        key={titleKey}
        initial={{ opacity: 0, y: -60, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -40, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-sm"
      >
        <div className={`glass-card rounded-2xl border p-4 shadow-2xl ${colors}`}>
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl"
            >
              {title.emoji}
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-0.5">
                {rarityLabel[title.rarity]}
              </p>
              <p className="font-black text-lg tracking-tight leading-none">{title.label}</p>
              <p className="text-[11px] opacity-60 font-medium mt-1">{title.description}</p>
            </div>
          </div>

          {/* Progress bar auto-dismiss */}
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 rounded-full bg-current opacity-30"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 3.5, ease: 'linear' }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
