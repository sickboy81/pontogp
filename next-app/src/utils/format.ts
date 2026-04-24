/** Faz o parse da data vinda do PocketBase / API (string ISO, "YYYY-MM-DD HH:mm:ss", ms, s Unix). */
export function parsePocketBaseDateInput(input: string | number | null | undefined): Date | null {
  if (input == null) return null
  if (typeof input === 'number' && Number.isFinite(input)) {
    const ms = input < 1e12 ? input * 1000 : input
    const d = new Date(ms)
    return isNaN(d.getTime()) ? null : d
  }
  const raw = String(input).trim()
  if (!raw) return null
  if (/^\d{10,13}$/.test(raw)) {
    const n = parseInt(raw, 10)
    const d = new Date(n < 1e12 ? n * 1000 : n)
    return isNaN(d.getTime()) ? null : d
  }
  let d = new Date(raw)
  if (!isNaN(d.getTime())) return d
  if (/^\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}/.test(raw)) {
    const t = raw.replace(' ', 'T')
    d = new Date(t)
    if (!isNaN(d.getTime())) return d
    d = new Date(`${t}Z`)
    if (!isNaN(d.getTime())) return d
  }
  return null
}

/** “há X min”, “há 2 h” — pt-BR. */
export function formatRelativeTime(dateStr: string | number | null | undefined): string {
  const d = parsePocketBaseDateInput(dateStr)
  if (!d) return ''
  const now = new Date()
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (sec < 0) return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  if (sec < 60) return 'há poucos segundos'
  if (sec < 3600) return `há ${Math.floor(sec / 60)} min`
  if (sec < 86400) return `há ${Math.floor(sec / 3600)} h`
  if (sec < 604800) {
    const days = Math.floor(sec / 86400)
    return `há ${days} ${days === 1 ? 'dia' : 'dias'}`
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}
