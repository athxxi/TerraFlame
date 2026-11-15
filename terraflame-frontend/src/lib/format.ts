export function formatInteger(n: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
}

export function formatKm2(km2: number): string {
  return `${formatInteger(km2)} km²`
}