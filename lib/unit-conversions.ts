/**
 * Unit conversion utilities for body measurements
 */

/**
 * Helper to convert cm to feet/inches
 */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return { feet, inches }
}

/**
 * Helper to convert feet/inches to cm
 */
export function feetInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54
}

/**
 * Helper to convert kg to lbs
 */
export function kgToLbs(kg: number): number {
  return kg * 2.20462
}

/**
 * Helper to convert lbs to kg
 */
export function lbsToKg(lbs: number): number {
  return lbs / 2.20462
}
