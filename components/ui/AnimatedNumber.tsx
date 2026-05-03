'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  duration?: number
  className?: string
}

export function AnimatedNumber({ value, duration = 800, className }: Props) {
  const [display, setDisplay] = useState(0)
  const start = useRef<number | null>(null)
  const frame = useRef<number>(0)

  useEffect(() => {
    start.current = null
    const from = 0
    const to = value

    const step = (timestamp: number) => {
      if (!start.current) start.current = timestamp
      const elapsed = timestamp - start.current
      const progress = Math.min(elapsed / duration, 1)
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (progress < 1) {
        frame.current = requestAnimationFrame(step)
      }
    }

    frame.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame.current)
  }, [value, duration])

  return <span className={className}>{display}</span>
}
