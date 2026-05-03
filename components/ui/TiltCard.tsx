'use client'

import { useRef, ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface Props {
  children: ReactNode
  className?: string
  intensity?: number // 1–20, default 10
}

export function TiltCard({ children, className = '', intensity = 10 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const glareX = useMotionValue(50)
  const glareY = useMotionValue(50)

  const springConfig = { stiffness: 300, damping: 30, mass: 0.5 }
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [intensity, -intensity]), springConfig)
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-intensity, intensity]), springConfig)
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 20 })

  function getRelativePos(clientX: number, clientY: number) {
    const el = ref.current
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    return {
      x: (clientX - rect.left) / rect.width - 0.5,
      y: (clientY - rect.top) / rect.height - 0.5,
    }
  }

  function onMove(clientX: number, clientY: number) {
    const { x, y } = getRelativePos(clientX, clientY)
    rawX.set(x)
    rawY.set(y)
    // glare follows pointer
    const el = ref.current
    if (el) {
      const rect = el.getBoundingClientRect()
      glareX.set(((clientX - rect.left) / rect.width) * 100)
      glareY.set(((clientY - rect.top) / rect.height) * 100)
    }
    glareOpacity.set(0.12)
  }

  function onLeave() {
    rawX.set(0)
    rawY.set(0)
    glareOpacity.set(0)
  }

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        transformPerspective: 800,
      }}
      onMouseMove={(e) => onMove(e.clientX, e.clientY)}
      onMouseLeave={onLeave}
      onTouchMove={(e) => {
        const t = e.touches[0]
        if (t) onMove(t.clientX, t.clientY)
      }}
      onTouchEnd={onLeave}
      className={`relative ${className}`}
    >
      {children}

      {/* Glare overlay */}
      <motion.div
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          opacity: glareOpacity,
          background: useTransform(
            [glareX, glareY],
            ([x, y]) =>
              `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.5) 0%, transparent 60%)`
          ),
        }}
      />
    </motion.div>
  )
}
