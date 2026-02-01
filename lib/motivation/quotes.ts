// Motivational quotes database - Research-backed categories
// Based on behavioral psychology and neurological motivation principles

export interface MotivationalQuote {
  text: string
  category: 'consistency' | 'identity' | 'progress' | 'future-self' | 'transformation'
  author?: string
}

export const motivationalQuotes: MotivationalQuote[] = [
  // Consistency & Discipline
  {
    text: "Success is the sum of small efforts repeated day in and day out.",
    category: 'consistency',
    author: 'Robert Collier'
  },
  {
    text: "You don't have to be perfect, you just have to be consistent.",
    category: 'consistency'
  },
  {
    text: "The secret of getting ahead is getting started.",
    category: 'consistency',
    author: 'Mark Twain'
  },
  {
    text: "Discipline is choosing between what you want now and what you want most.",
    category: 'consistency'
  },
  {
    text: "Small daily improvements are the key to staggering long-term results.",
    category: 'consistency'
  },

  // Identity-Based
  {
    text: "Every action is a vote for the person you want to become.",
    category: 'identity',
    author: 'James Clear'
  },
  {
    text: "You're not trying to lose weight, you're becoming the type of person who lives healthy.",
    category: 'identity'
  },
  {
    text: "Change your identity, and your habits will follow.",
    category: 'identity'
  },
  {
    text: "The goal is not to be perfect, the goal is to be better than you were yesterday.",
    category: 'identity'
  },
  {
    text: "You are what you consistently do. Excellence is not an act, but a habit.",
    category: 'identity',
    author: 'Aristotle'
  },

  // Progress Over Perfection
  {
    text: "Progress, not perfection. Every small step counts.",
    category: 'progress'
  },
  {
    text: "A 1% improvement every day compounds to 37x better in a year.",
    category: 'progress'
  },
  {
    text: "Don't compare your chapter 1 to someone else's chapter 20.",
    category: 'progress'
  },
  {
    text: "Slow progress is still progress. Keep going.",
    category: 'progress'
  },
  {
    text: "The journey of a thousand miles begins with a single step.",
    category: 'progress',
    author: 'Lao Tzu'
  },

  // Future Self
  {
    text: "Your future self will thank you for showing up today.",
    category: 'future-self'
  },
  {
    text: "The best time to start was yesterday. The second best is now.",
    category: 'future-self'
  },
  {
    text: "Invest in yourself today. Reap the rewards tomorrow.",
    category: 'future-self'
  },
  {
    text: "Today's actions are tomorrow's habits.",
    category: 'future-self'
  },
  {
    text: "Your body is listening to everything your mind says. Stay positive.",
    category: 'future-self'
  },

  // Transformation Journey
  {
    text: "Transformation starts with small, consistent steps.",
    category: 'transformation'
  },
  {
    text: "You didn't come this far to only come this far.",
    category: 'transformation'
  },
  {
    text: "Every day is a new opportunity to transform your life.",
    category: 'transformation'
  },
  {
    text: "The only person you should try to be better than is the person you were yesterday.",
    category: 'transformation'
  },
  {
    text: "Your transformation is a marathon, not a sprint. Pace yourself and enjoy the journey.",
    category: 'transformation'
  }
]

/**
 * Get a random motivational quote
 */
export function getRandomQuote(category?: MotivationalQuote['category']): MotivationalQuote {
  const filteredQuotes = category 
    ? motivationalQuotes.filter(q => q.category === category)
    : motivationalQuotes
  
  const randomIndex = Math.floor(Math.random() * filteredQuotes.length)
  return filteredQuotes[randomIndex]
}

/**
 * Get daily quote (same quote for whole day based on date)
 */
export function getDailyQuote(): MotivationalQuote {
  const today = new Date().toISOString().split('T')[0]
  const seed = today.split('-').reduce((acc, val) => acc + parseInt(val), 0)
  const index = seed % motivationalQuotes.length
  return motivationalQuotes[index]
}

/**
 * Get quote based on user's journey stage
 */
export function getContextualQuote(params: {
  streak: number
  targetProgress?: number
  daysToGoal?: number
}): MotivationalQuote {
  const { streak, targetProgress = 0, daysToGoal } = params
  
  // New user (first 7 days)
  if (streak < 7) {
    return getRandomQuote('consistency')
  }
  
  // Building habit (7-30 days)
  if (streak < 30) {
    return getRandomQuote('identity')
  }
  
  // Mid-journey (making progress)
  if (targetProgress > 25 && targetProgress < 75) {
    return getRandomQuote('progress')
  }
  
  // Close to goal
  if (targetProgress >= 75 || (daysToGoal && daysToGoal < 30)) {
    return getRandomQuote('transformation')
  }
  
  // Default: future self focus
  return getRandomQuote('future-self')
}
