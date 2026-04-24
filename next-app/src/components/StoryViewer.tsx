'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { X, Heart, MessageCircle, Volume2, VolumeX, MoreVertical, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/auth'
import { formatRelativeTime } from '@/utils/format'

export interface StoryItem {
  id: string
  profile: { id: string; name: string; thumbnail?: string } | null
  file: string
  type: string
  text: string
  created: string
}

interface StoryComment {
  id: string
  content: string
  created: string
  userName: string
}

interface StoryViewerProps {
  stories: StoryItem[]
  initialIndex?: number
  onClose: () => void
  /** Pode ver menu de opções (ex.: denunciar): logado e não é o dono do perfil. */
  canReport?: boolean
}

const AUTO_NEXT_MS = 7000
const SWIPE_MIN = 56
const TAP_MAX_MOVE = 18
const TAP_MAX_MS = 320

/** Largura máx. do “telefone” no viewer: ~8% mais larga que 430px (largura comum de stories antiga). */
const VIEWER_MAX_W = 500

const STORY_REPORT_REASONS = [
  { value: 'Conteúdo sexual explícito indevido', label: 'Conteúdo sexual explícito indevido' },
  { value: 'Nudez ou pornografia proibida', label: 'Nudez ou pornografia proibida' },
  { value: 'Violência, ódio ou assédio', label: 'Violência, ódio ou assédio' },
  { value: 'Spam ou publicidade enganosa', label: 'Spam ou publicidade enganosa' },
  { value: 'Fraude, golpe ou identidade falsa', label: 'Fraude, golpe ou identidade falsa' },
  { value: 'Menor de idade ou exploração', label: 'Menor de idade ou exploração' },
  { value: 'Drogas, armas ou atividades ilegais', label: 'Drogas, armas ou atividades ilegais' },
  { value: 'Violação de direitos autorais', label: 'Violação de direitos autorais' },
  { value: 'Outro', label: 'Outro' },
] as const

export default function StoryViewer({
  stories,
  initialIndex = 0,
  onClose,
  canReport = false,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [likes, setLikes] = useState({ count: 0, liked: false })
  const [comments, setComments] = useState<StoryComment[]>([])
  const [commentInput, setCommentInput] = useState('')
  const [commentSending, setCommentSending] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [videoMuted, setVideoMuted] = useState(true)
  const [heartBurst, setHeartBurst] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const videoRef = useRef<HTMLVideoElement>(null)
  const touchStart = useRef<{ y: number; x: number; t: number } | null>(null)
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null)
  const optionsMenuRef = useRef<HTMLDivElement | null>(null)

  const story = stories[currentIndex]
  const hasNext = currentIndex < stories.length - 1
  const hasPrev = currentIndex > 0
  const storyCreatedLabel = story?.created
    ? formatRelativeTime(story.created) || new Date(story.created).toLocaleString('pt-BR')
    : 'agora'

  const goNext = useCallback(() => {
    if (hasNext) {
      setCurrentIndex((i) => i + 1)
      setProgress(0)
      setIsPaused(false)
      setVideoMuted(true)
    } else {
      onClose()
    }
  }, [hasNext, onClose])

  const goPrev = useCallback(() => {
    if (hasPrev) {
      setCurrentIndex((i) => i - 1)
      setProgress(0)
      setIsPaused(false)
      setVideoMuted(true)
    }
  }, [hasPrev])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (story?.type === 'video') {
      v.muted = videoMuted
      if (isPaused || showComments || reportOpen) {
        v.pause()
      } else {
        v.play().catch(() => {})
      }
    }
  }, [story?.type, story?.file, isPaused, showComments, reportOpen, videoMuted, currentIndex])

  useEffect(() => {
    if (!story || story.type === 'video' || isPaused || showComments || reportOpen) return
    const start = Date.now()
    const t = setInterval(() => {
      const elapsed = Date.now() - start
      setProgress((elapsed / AUTO_NEXT_MS) * 100)
      if (elapsed >= AUTO_NEXT_MS) {
        clearInterval(t)
        goNext()
      }
    }, 50)
    return () => clearInterval(t)
  }, [currentIndex, story?.type, story?.id, goNext, isPaused, showComments, reportOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (reportOpen) {
          setReportOpen(false)
          setIsPaused(false)
          return
        }
        if (showComments) {
          setShowComments(false)
          setIsPaused(false)
          return
        }
        if (optionsOpen) {
          setOptionsOpen(false)
          return
        }
        onClose()
        return
      }
      if (showComments) return
      if (reportOpen) return
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') goPrev()
      if (e.key === ' ') {
        e.preventDefault()
        setIsPaused((p) => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, goNext, goPrev, reportOpen, showComments, optionsOpen])

  useEffect(() => {
    if (!story?.id) return
    setLikes({ count: 0, liked: false })
    setComments([])
    setIsPaused(false)
    fetch(`/api/stories/${story.id}/likes`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setLikes({ count: d.count ?? 0, liked: !!d.liked }))
      .catch(() => {})
    fetch(`/api/stories/${story.id}/comments`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setComments(d.items ?? []))
      .catch(() => {})
  }, [story?.id])

  const handleShare = useCallback(async () => {
    if (!story?.profile?.id) {
      toast.error('Não foi possível gerar o link')
      return
    }
    setIsPaused(true)
    setOptionsOpen(false)
    setShowComments(false)
    const path = `/perfil/${story.profile.id}?stories=1&story=${encodeURIComponent(story.id)}`
    const url = typeof window !== 'undefined' ? `${window.location.origin}${path}` : ''
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: story.profile?.name ? `Story — ${story.profile.name}` : 'Story — CerejaVIP',
          text:
            story.text?.trim() ||
            (story.profile?.name
              ? `Confira o story de ${story.profile.name} no CerejaVIP.`
              : 'Confira este story no CerejaVIP.'),
          url,
        })
        return
      }
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') return
    }
    try {
      await navigator.clipboard?.writeText(url)
      toast.success('Link copiado!')
    } catch {
      toast.error('Não foi possível copiar o link')
    }
  }, [story])

  const handleLike = useCallback(() => {
    if (!story?.id || likeLoading) return
    if (!isAuthenticated) {
      toast.error('Faça login para curtir')
      return
    }
    setLikeLoading(true)
    fetch(`/api/stories/${story.id}/like`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (r) => {
        const d = (await r.json().catch(() => ({}))) as {
          liked?: boolean
          count?: number
          error?: string
        }
        if (!r.ok) {
          toast.error(d.error || 'Não foi possível curtir')
          return
        }
        if (typeof d.liked === 'boolean') {
          const liked = d.liked
          setLikes((prev) => ({
            count: d.count ?? (prev.count + (liked ? 1 : -1)),
            liked,
          }))
        }
      })
      .finally(() => setLikeLoading(false))
  }, [story?.id, likeLoading, isAuthenticated])

  const triggerDoubleTapLike = useCallback(() => {
    setHeartBurst(true)
    window.setTimeout(() => setHeartBurst(false), 900)
    if (!isAuthenticated) {
      toast.error('Faça login para curtir')
      return
    }
    if (!story?.id || likeLoading) return
    if (!likes.liked) handleLike()
  }, [isAuthenticated, story?.id, likes.liked, likeLoading, handleLike])

  const handleCommentSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const content = commentInput.trim()
      if (!content || !story?.id || commentSending) return
      setCommentSending(true)
      fetch(`/api/stories/${story.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      })
        .then(async (r) => {
          const d = (await r.json().catch(() => ({}))) as {
            id?: string
            content?: string
            created?: string
            error?: string
          }
          if (!r.ok) {
            toast.error(d.error || 'Não foi possível enviar o comentário')
            return
          }
          if (d.id && d.content) {
            const displayName =
              (user?.name && user.name.trim()) ||
              [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
              user?.email ||
              'Você'
            setComments((prev) => [
              ...prev,
              {
                id: d.id!,
                content: d.content!,
                created: d.created || new Date().toISOString(),
                userName: displayName,
              },
            ])
            setCommentInput('')
          } else {
            toast.error('Resposta inesperada do servidor')
          }
        })
        .finally(() => setCommentSending(false))
    },
    [story?.id, commentInput, commentSending, user?.name, user?.first_name, user?.last_name, user?.email]
  )

  useEffect(() => {
    if (!optionsOpen) return
    const close = (e: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node)) {
        setOptionsOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [optionsOpen])

  const handleReportSubmit = useCallback(async () => {
    if (!story?.id || !story.profile?.id) return
    if (!reportReason) {
      toast.error('Selecione um motivo')
      return
    }
    setReportSubmitting(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          profileId: story.profile.id,
          storyId: story.id,
          reason: reportReason,
          description: reportDescription.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { error?: string }).error || 'Erro ao enviar denúncia')
        return
      }
      toast.success('Denúncia enviada. Obrigado.')
      setReportOpen(false)
      setReportReason('')
      setReportDescription('')
      setOptionsOpen(false)
      setIsPaused(false)
    } finally {
      setReportSubmitting(false)
    }
  }, [story?.id, story?.profile, reportReason, reportDescription])

  useEffect(() => {
    setOptionsOpen(false)
    setReportOpen(false)
  }, [story?.id])

  const onTouchStart = (e: React.TouchEvent) => {
    const p = e.touches[0]
    touchStart.current = { y: p.clientY, x: p.clientX, t: Date.now() }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return
    const p = e.changedTouches[0]
    const dy = start.y - p.clientY
    const dx = p.clientX - start.x
    const dt = Date.now() - start.t
    const moved = Math.hypot(dx, dy)

    if (moved < TAP_MAX_MOVE && dt < TAP_MAX_MS) {
      const prev = lastTap.current
      lastTap.current = { t: Date.now(), x: p.clientX, y: p.clientY }
      if (prev && Date.now() - prev.t < 350 && Math.hypot(p.clientX - prev.x, p.clientY - prev.y) < 40) {
        lastTap.current = null
        triggerDoubleTapLike()
        return
      }
      setIsPaused((p) => !p)
      return
    }

    if (Math.abs(dy) >= SWIPE_MIN && Math.abs(dy) > Math.abs(dx) * 0.7) {
      if (dy > 0) goNext()
      else goPrev()
    }
  }

  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) < 40) return
    e.preventDefault()
    if (e.deltaY > 0) goNext()
    else goPrev()
  }

  if (!story) return null

  return (
    <>
      {reportOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              if (!reportSubmitting) {
                setReportOpen(false)
                setIsPaused(false)
              }
            }}
            aria-hidden
          />
          <div
            className="relative w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            role="dialog"
            aria-labelledby="story-report-title"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 id="story-report-title" className="text-lg font-bold text-white">
                Denunciar story
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (!reportSubmitting) {
                    setReportOpen(false)
                    setIsPaused(false)
                  }
                }}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-400">
              Escolha o motivo. Nossa equipe analisará a denúncia.
            </p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Motivo</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Selecione</option>
                  {STORY_REPORT_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Detalhes (opcional)</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Complemente se quiser (máx. 1000 caracteres)"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!reportSubmitting) {
                    setReportOpen(false)
                    setIsPaused(false)
                  }
                }}
                disabled={reportSubmitting}
                className="flex-1 rounded-lg bg-slate-700 py-2.5 font-medium text-slate-300 transition hover:bg-slate-600 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReportSubmit}
                disabled={reportSubmitting}
                className="flex-1 rounded-lg bg-amber-600 py-2.5 font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
              >
                {reportSubmitting ? 'Enviando…' : 'Enviar denúncia'}
              </button>
            </div>
          </div>
        </div>
      )}

    <div className="fixed inset-0 z-[100] flex justify-center bg-black">
      <div
        className="relative h-[100dvh] w-full touch-pan-y overflow-hidden shadow-2xl shadow-black/50"
        style={{ maxWidth: `min(100vw, ${VIEWER_MAX_W}px)` }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
        role="application"
        aria-label="Stories"
      >
        {/* Barras de progresso (tipo TikTok / IG) */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex gap-1 px-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
          {stories.map((_, i) => (
            <div key={stories[i].id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full bg-white transition-[width] duration-75 ease-linear"
                style={{
                  width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Mídia full-bleed vertical */}
        <div className="absolute inset-0 bg-black">
          {story.type === 'video' ? (
            <video
              ref={videoRef}
              src={story.file}
              className="h-full w-full object-cover"
              playsInline
              muted={videoMuted}
              loop={false}
              onEnded={goNext}
            />
          ) : (
            <img
              src={story.file}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          )}

          {/* Toque único: pausar / retomar (área central; não cobre a rail direita) */}
          <button
            type="button"
            aria-label={isPaused ? 'Retomar' : 'Pausar'}
            className="absolute inset-y-0 left-0 right-[5.5rem] z-10 cursor-default bg-transparent md:right-24"
            onClick={() => setIsPaused((p) => !p)}
          />

          {heartBurst && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <Heart className="h-28 w-28 animate-ping text-red-500/90 drop-shadow-lg" fill="currentColor" />
            </div>
          )}

          {/* Gradientes */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Cabeçalho: avatar + nome */}
          <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between pl-3 pr-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 pr-2">
              {story.profile?.thumbnail ? (
                <img
                  src={story.profile.thumbnail}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-full border-2 border-white object-cover ring-2 ring-white/20"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white bg-white/10 text-sm font-bold text-white ring-2 ring-white/20">
                  {story.profile?.name?.charAt(0) || '?'}
                </div>
              )}
              <div className="min-w-0">
                <span className="truncate text-sm font-semibold tracking-tight text-white drop-shadow-md">
                  {story.profile?.name || 'Story'}
                </span>
                <p className="text-xs text-white/60 drop-shadow-md">{storyCreatedLabel}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-2 text-white hover:bg-white/15"
              aria-label="Fechar"
            >
              <X className="h-7 w-7" />
            </button>
          </div>

          {/* Legenda em baixo (estilo TikTok) */}
          {story.text ? (
            <div className="absolute bottom-0 left-0 right-[5.5rem] z-30 px-4 pb-[max(5.5rem,env(safe-area-inset-bottom))] md:right-24">
              <p className="text-sm leading-snug text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">{story.text}</p>
            </div>
          ) : null}

          {/* Rail direita: som, curtir, comentar */}
          <div
            className="absolute bottom-0 right-2 z-40 flex flex-col items-center gap-5 pb-[max(5rem,env(safe-area-inset-bottom))] pt-24"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {story.type === 'video' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setVideoMuted((m) => !m)
                }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/50"
                aria-label={videoMuted ? 'Ativar som' : 'Silenciar'}
              >
                {videoMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleLike()
              }}
              disabled={likeLoading}
              className="flex flex-col items-center gap-1 text-white drop-shadow-md disabled:opacity-60"
              aria-label={likes.liked ? 'Descurtir' : 'Curtir'}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm hover:bg-black/50">
                <Heart className={`h-7 w-7 ${likes.liked ? 'fill-red-500 text-red-500' : ''}`} />
              </span>
              <span className="text-xs font-semibold tabular-nums">{likes.count > 999 ? '999+' : likes.count}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowComments((v) => !v)
                setIsPaused(true)
                setOptionsOpen(false)
              }}
              className="flex flex-col items-center gap-1 text-white drop-shadow-md"
              aria-label="Comentários"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm hover:bg-black/50">
                <MessageCircle className="h-7 w-7" />
              </span>
              <span className="text-xs font-semibold tabular-nums">{comments.length > 999 ? '999+' : comments.length}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleShare()
              }}
              className="flex flex-col items-center gap-1 text-white drop-shadow-md"
              aria-label="Compartilhar"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm hover:bg-black/50">
                <Share2 className="h-7 w-7" />
              </span>
              <span className="max-w-[4.5rem] text-center text-[10px] font-semibold leading-tight text-white/95">
                Compartilhar
              </span>
            </button>
            <div className="relative z-[50]" ref={optionsMenuRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setOptionsOpen((v) => !v)
                    setIsPaused(true)
                    setShowComments(false)
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white drop-shadow-md hover:bg-white/10"
                  aria-label="Mais opções"
                  aria-expanded={optionsOpen}
                >
                  <MoreVertical className="h-7 w-7" />
                </button>
                {optionsOpen && (
                  <div
                    className="absolute bottom-full right-0 z-[60] mb-2 min-w-[12rem] overflow-hidden rounded-xl border border-white/10 bg-zinc-950/95 py-1 shadow-xl backdrop-blur-md"
                    role="menu"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full px-4 py-2.5 text-left text-sm text-white transition hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOptionsOpen(false)
                        setShowComments(false)
                        if (!isAuthenticated) {
                          toast.error('Faça login para denunciar')
                          return
                        }
                        if (!story.profile?.id) {
                          toast.error('Não foi possível identificar o autor desta story')
                          return
                        }
                        if (!canReport) {
                          toast.error('Você não pode denunciar a própria story')
                          return
                        }
                        setReportOpen(true)
                        setIsPaused(true)
                      }}
                    >
                      Denunciar
                    </button>
                  </div>
                )}
              </div>
          </div>
        </div>

        {/* Indicador pausa */}
        {isPaused && !showComments && !reportOpen && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[24] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-black/40 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur-sm">
            Pausado · deslize ↑ próximo
          </div>
        )}

        {/* Sheet comentários (de baixo, estilo mobile) */}
        {showComments && (
          <div className="absolute inset-x-0 bottom-0 z-50 flex max-h-[58vh] flex-col rounded-t-2xl border border-white/10 bg-zinc-950/95 shadow-[0_-8px_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-sm font-semibold text-white">Comentários</span>
              <button
                type="button"
                onClick={() => {
                  setShowComments(false)
                  setIsPaused(false)
                }}
                className="rounded-full p-2 text-white/80 hover:bg-white/10"
                aria-label="Fechar comentários"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-2">
              {comments.length === 0 ? (
                <p className="py-6 text-center text-sm text-white/50">Nenhum comentário ainda.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="rounded-xl bg-white/5 px-3 py-2.5 text-sm">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-medium text-primary-300">{c.userName}</p>
                      {c.created && (
                        <span className="shrink-0 text-[10px] text-white/40">
                          {formatRelativeTime(c.created) || new Date(c.created).toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>
                    <p className="text-white/90">{c.content}</p>
                  </div>
                ))
              )}
            </div>
            {isAuthenticated ? (
              <form onSubmit={handleCommentSubmit} className="shrink-0 border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Adicionar comentário..."
                    maxLength={500}
                    className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <button
                    type="submit"
                    disabled={commentSending || !commentInput.trim()}
                    className="shrink-0 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-45"
                  >
                    {commentSending ? '…' : 'Enviar'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="shrink-0 border-t border-white/10 p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-sm text-white/70">
                <Link href="/login" className="font-semibold text-primary-400 underline hover:text-primary-300">
                  Entre
                </Link>{' '}
                para comentar.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  )
}
