/** “há X min”, “há 2 h” — pt-BR. */
export function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (sec < 0) return 'agora'
  if (sec < 60) return 'agora'
  if (sec < 3600) return `há ${Math.floor(sec / 60)} min`
  if (sec < 86400) return `há ${Math.floor(sec / 3600)} h`
  if (sec < 604800) return `há ${Math.floor(sec / 86400)} ${Math.floor(sec / 86400) === 1 ? 'dia' : 'dias'}`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}
