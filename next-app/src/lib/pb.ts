import PocketBase from 'pocketbase'

const url = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

/** Cliente PocketBase (browser). Para chamadas no servidor use as funções em lib/api que fazem fetch. */
export function getPb(): PocketBase {
  if (typeof window === 'undefined') {
    return new PocketBase(url)
  }
  if ((globalThis as any).__pb) return (globalThis as any).__pb
  const pb = new PocketBase(url)
  pb.autoCancellation(false)
  ;(globalThis as any).__pb = pb
  return pb
}

export function getFileUrl(
  record: { collectionId: string; id: string } | null,
  filename: string
): string {
  if (!filename || !record) return ''
  if (filename.startsWith('http')) return filename
  const base = process.env.NEXT_PUBLIC_POCKETBASE_URL || url
  return `${base}/api/files/${record.collectionId}/${record.id}/${filename}`
}

export function getFileUrlThumb(
  record: { collectionId: string; id: string } | null,
  filename: string,
  thumb: string
): string {
  if (!filename || !record) return ''
  const base = process.env.NEXT_PUBLIC_POCKETBASE_URL || url
  return `${base}/api/files/${record.collectionId}/${record.id}/${filename}?thumb=${thumb}`
}
