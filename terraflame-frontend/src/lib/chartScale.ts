export type ValueScale = 'sqrt' | 'linear'

export function scaleValue(n: number, scale: ValueScale): number {
  if (scale === 'sqrt') return n <= 0 ? 0 : Math.sqrt(n)
  return n
}

export function formatAxisValue(scaled: number, scale: ValueScale): string {
  const actual = scale === 'sqrt' ? scaled * scaled : scaled
  if (actual >= 1_000_000) return `${(actual / 1_000_000).toFixed(1)}M`
  if (actual >= 1_000) return `${Math.round(actual / 1_000)}k`
  return String(Math.round(actual))
}