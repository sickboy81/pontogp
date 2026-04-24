import 'server-only'

import { execFile } from 'child_process'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import sharp from 'sharp'

const execFileAsync = promisify(execFile)

function getFfmpegPath(): string | null {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const p = require('ffmpeg-static') as string | false | null
    return typeof p === 'string' && p.length > 0 ? p : null
  } catch {
    return null
  }
}

function safeBaseName(name: string, fallback: string): string {
  const base = (path.basename(name, path.extname(name)) || fallback).replace(/[^\w.-]+/g, '_').slice(0, 80)
  return base || fallback
}

/** Converte qualquer imagem suportada pelo sharp para WebP (máx. lado ~2560px). */
export async function imageFileToWebp(file: File): Promise<File> {
  const buf = Buffer.from(await file.arrayBuffer())
  const base = safeBaseName(file.name, 'image')
  const pipeline = sharp(buf, { animated: true, pages: -1, limitInputPixels: 268_402_689 })
    .rotate()
    .resize(2560, 2560, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
  const out = await pipeline.toBuffer()
  return new File([Uint8Array.from(out)], `${base}.webp`, { type: 'image/webp' })
}

/** Reencoda vídeo para MP4 H.264 ~720p, AAC leve (quando há áudio). */
export async function videoFileToCompactMp4(file: File): Promise<File> {
  const ffmpeg = getFfmpegPath()
  if (!ffmpeg) {
    throw new Error('FFMPEG_NOT_AVAILABLE')
  }
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const tmp = os.tmpdir()
  const ext = path.extname(file.name) || '.mp4'
  const inPath = path.join(tmp, `cv-in-${id}${ext}`)
  const outPath = path.join(tmp, `cv-out-${id}.mp4`)
  const base = safeBaseName(file.name, 'video')
  await fs.writeFile(inPath, Buffer.from(await file.arrayBuffer()))
  const common = [
    '-y',
    '-i',
    inPath,
    '-vf',
    'scale=-2:720',
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '26',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    '-threads',
    '0',
  ] as const
  try {
    try {
      await execFileAsync(
        ffmpeg,
        [...common, '-c:a', 'aac', '-b:a', '96k', '-ac', '2', outPath],
        { maxBuffer: 120 * 1024 * 1024, timeout: 5 * 60 * 1000 }
      )
    } catch {
      await execFileAsync(
        ffmpeg,
        [...common, '-an', outPath],
        { maxBuffer: 120 * 1024 * 1024, timeout: 5 * 60 * 1000 }
      )
    }
    const out = await fs.readFile(outPath)
    if (out.length === 0) throw new Error('empty output')
    return new File([Uint8Array.from(out)], `${base}.mp4`, { type: 'video/mp4' })
  } finally {
    await fs.unlink(inPath).catch(() => {})
    await fs.unlink(outPath).catch(() => {})
  }
}

export async function maybeVideoToCompactMp4(file: File): Promise<File> {
  if (!file.type.startsWith('video/')) return file
  try {
    return await videoFileToCompactMp4(file)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'FFMPEG_NOT_AVAILABLE') {
      console.warn('[media-upload] ffmpeg não encontrado; enviando vídeo original.')
      return file
    }
    console.warn('[media-upload] falha ao transcodificar vídeo; enviando original.', msg)
    return file
  }
}

export function isRasterImageMime(mime: string): boolean {
  const m = mime.toLowerCase()
  return (
    m.startsWith('image/') &&
    !m.includes('svg') &&
    m !== 'image/vnd.microsoft.icon' &&
    m !== 'image/x-icon'
  )
}

const IMAGE_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  heic: 'image/heic',
  heif: 'image/heif',
  avif: 'image/avif',
  bmp: 'image/bmp',
}

/** MIME a partir do ficheiro (extensão quando o browser envia type vazio). */
export function resolveImageMime(file: File): string | null {
  const t = (file.type || '').trim().toLowerCase()
  if (t && t !== 'application/octet-stream' && t !== 'application/x-msdownload') {
    return t
  }
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  return IMAGE_EXT[ext] || null
}

const VIDEO_EXT: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
}

export function resolveVideoMime(file: File): string | null {
  const t = (file.type || '').trim().toLowerCase()
  if (t && t !== 'application/octet-stream' && t !== 'application/x-msdownload') {
    return t
  }
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  return VIDEO_EXT[ext] || null
}

const AUDIO_EXT: Record<string, string> = {
  mp3: 'audio/mpeg',
  mpeg: 'audio/mpeg',
  mp4: 'audio/mp4',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  wav: 'audio/wav',
  wave: 'audio/wav',
  ogg: 'audio/ogg',
  opus: 'audio/opus',
  webm: 'audio/webm',
  flac: 'audio/flac',
  wma: 'audio/x-ms-wma',
}

/** MIME a partir do ficheiro (extensão quando o browser envia type vazio). */
export function resolveAudioMime(file: File): string | null {
  const t = (file.type || '').trim().toLowerCase()
  if (t && t !== 'application/octet-stream' && t !== 'application/x-msdownload') {
    if (t === 'audio/mp3') return 'audio/mpeg'
    if (t === 'audio/x-m4a' || t === 'audio/m4a') return 'audio/mp4'
    return t
  }
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  return AUDIO_EXT[ext] || null
}

/** Coleção PocketBase `files`: só aceita estes tipos de áudio no campo file. */
export function pocketbaseAcceptsAudioMime(mime: string): boolean {
  const m = mime.toLowerCase()
  const n = m === 'audio/mp3' ? 'audio/mpeg' : m
  return n === 'audio/mpeg' || n === 'audio/mp4'
}

/** Áudio → M4A AAC mono ~80k (compatível com `audio/mp4` no PocketBase). */
export async function audioFileToCompactM4a(file: File): Promise<File> {
  const ffmpeg = getFfmpegPath()
  if (!ffmpeg) {
    throw new Error('FFMPEG_NOT_AVAILABLE')
  }
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const tmp = os.tmpdir()
  const ext = path.extname(file.name) || '.audio'
  const inPath = path.join(tmp, `ca-in-${id}${ext}`)
  const outPath = path.join(tmp, `ca-out-${id}.m4a`)
  const base = safeBaseName(file.name, 'audio')
  await fs.writeFile(inPath, Buffer.from(await file.arrayBuffer()))
  try {
    await execFileAsync(
      ffmpeg,
      [
        '-y',
        '-i',
        inPath,
        '-vn',
        '-c:a',
        'aac',
        '-b:a',
        '80k',
        '-ac',
        '1',
        '-ar',
        '44100',
        '-movflags',
        '+faststart',
        outPath,
      ],
      { maxBuffer: 50 * 1024 * 1024, timeout: 3 * 60 * 1000 }
    )
    const out = await fs.readFile(outPath)
    if (out.length === 0) throw new Error('empty output')
    return new File([Uint8Array.from(out)], `${base}.m4a`, { type: 'audio/mp4' })
  } finally {
    await fs.unlink(inPath).catch(() => {})
    await fs.unlink(outPath).catch(() => {})
  }
}

export async function maybeAudioToCompactM4a(file: File): Promise<File> {
  const mime =
    file.type && file.type.trim().toLowerCase().startsWith('audio/')
      ? file.type.trim().toLowerCase() === 'audio/mp3'
        ? 'audio/mpeg'
        : file.type.trim().toLowerCase()
      : resolveAudioMime(file)
  if (!mime || !mime.startsWith('audio/')) return file
  try {
    return await audioFileToCompactM4a(file)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'FFMPEG_NOT_AVAILABLE') {
      console.warn('[media-upload] ffmpeg não encontrado; mantendo áudio original.')
      return file
    }
    console.warn('[media-upload] falha ao transcodificar áudio; mantendo original.', msg)
    return file
  }
}
