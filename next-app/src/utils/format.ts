/** “há X min”, “há 2 h” — pt-BR. */
export function formatRelativeTime(dateStr: string): string {
  const raw = (dateStr || '').trim()
  if (!raw) return ''

  let d = new Date(raw)
  // PocketBase costuma vir como "YYYY-MM-DD HH:mm:ss" (sem timezone).
  if (isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(raw)) {
    d = new Date(raw.replace(' ', 'T'))
  }
  if (isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(raw)) {
    d = new Date(`${raw.replace(' ', 'T')}Z`)
  }
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
