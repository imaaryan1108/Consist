export function haptic(type: 'light' | 'medium' | 'heavy' | 'success' = 'light') {
  if (!navigator.vibrate) return
  const patterns = {
    light:   10,
    medium:  20,
    heavy:   [10, 30, 10],
    success: [10, 40, 10, 40, 80],
  }
  navigator.vibrate(patterns[type])
}
