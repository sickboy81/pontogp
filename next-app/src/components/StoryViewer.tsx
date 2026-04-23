'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

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
}

const AUTO_NEXT_MS = 6000

export default function StoryViewer({ stories, initialIndex = 0, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [likes, setLikes] = useState({ count: 0, liked: false })
  const [comments, setComments] = useState<StoryComment[]>([])
  const [commentInput, setCommentInput] = useState('')
  const [commentSending, setCommentSending] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const user = useAuthStore((s) => s.user)

  const story = stories[currentIndex]
  const hasNext = currentIndex < stories.length - 1
  const hasPrev = currentIndex > 0

  const goNext = useCallback(() => {
    if (hasNext) {
      setCurrentIndex((i) => i + 1)
      setProgress(0)
    } else {
      onClose()
    }
  }, [hasNext, onClose])

  const goPrev = useCallback(() => {
    if (hasPrev) {
      setCurrentIndex((i) => i - 1)
      setProgress(0)
    }
  }, [hasPrev])

  useEffect(() => {
    if (!story || story.type === 'video') return
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
  }, [currentIndex, story?.type, goNext])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, goNext, goPrev])

  useEffect(() => {
    if (!story?.id) return
    setLikes({ count: 0, liked: false })
    setComments([])
    fetch(`/api/stories/${story.id}/likes`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setLikes({ count: d.count ?? 0, liked: !!d.liked }))
      .catch(() => {})
    fetch(`/api/stories/${story.id}/comments`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setComments(d.items ?? []))
      .catch(() => {})
  }, [story?.id])

  const handleLike = useCallback(() => {
    if (!story?.id || likeLoading) return
    setLikeLoading(true)
    fetch(`/api/stories/${story.id}/like`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.liked !== undefined) setLikes((prev) => ({ count: d.count ?? (prev.count + (d.liked ? 1 : -1)), liked: d.liked }))
      })
      .finally(() => setLikeLoading(false))
  }, [story?.id, likeLoading])

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
        .then((r) => r.json())
        .then((d) => {
          if (d.id) {
            setComments((prev) => [...prev, { id: d.id, content: d.content, created: d.created, userName: user?.name ?? 'Você' }])
            setCommentInput('')
          }
        })
        .finally(() => setCommentSending(false))
    },
    [story?.id, commentInput, commentSending, user?.name]
  )

  if (!story) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      <div className="absolute inset-0 flex flex-col">
        {/* Progress bars */}
        <div className="flex gap-1 p-2">
          {stories.map((_, i) => (
            <div
              key={stories[i].id}
              className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30"
            >
              <div
                className="h-full bg-white transition-all duration-75"
                style={{
                  width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header: profile + close */}
        <div className="absolute left-0 right-0 top-12 z-10 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {story.profile?.thumbnail ? (
              <img
                src={story.profile.thumbnail}
                alt=""
                className="h-10 w-10 rounded-full border-2 border-white object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-600 text-sm font-bold text-white">
                {story.profile?.name?.charAt(0) || '?'}
              </div>
            )}
            <span className="font-semibold text-white">{story.profile?.name || 'Story'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/90 hover:bg-white/20"
            aria-label="Fechar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content area - tap zones */}
        <div className="flex flex-1 items-center justify-center">
          <button
            type="button"
            className="absolute left-0 top-0 bottom-0 z-10 w-1/3 cursor-default focus:outline-none md:w-1/4"
            onClick={goPrev}
            aria-label="Anterior"
          />
          <button
            type="button"
            className="absolute right-0 top-0 bottom-0 z-10 w-1/3 cursor-default focus:outline-none md:w-1/4"
            onClick={goNext}
            aria-label="Próximo"
          />

          <div className="relative max-h-full w-full max-w-lg">
            {story.type === 'video' ? (
              <video
                src={story.file}
                controls
                autoPlay
                playsInline
                className="max-h-[85vh] w-full object-contain"
                onEnded={goNext}
              />
            ) : (
              <img
                src={story.file}
                alt=""
                className="max-h-[85vh] w-full object-contain"
              />
            )}
            {story.text && (
              <p className="absolute bottom-4 left-4 right-4 rounded-lg bg-black/50 px-3 py-2 text-sm text-white">
                {story.text}
              </p>
            )}
          </div>
        </div>

        {/* Like + Comment + Nav */}
        <div className="absolute bottom-4 left-0 right-0 flex items-end justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLike}
              disabled={likeLoading}
              className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-2 text-white hover:bg-white/30 disabled:opacity-60"
              aria-label={likes.liked ? 'Descurtir' : 'Curtir'}
            >
              <Heart className={`h-5 w-5 ${likes.liked ? 'fill-red-400 text-red-400' : ''}`} />
              <span className="text-sm font-medium">{likes.count}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowComments((v) => !v)}
              className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-2 text-white hover:bg-white/30"
              aria-label="Comentários"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{comments.length}</span>
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30 disabled:invisible"
              disabled={!hasPrev}
              aria-label="Anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
              aria-label="Próximo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Comments panel */}
        {showComments && (
          <div className="absolute right-0 top-0 bottom-0 z-20 flex w-full max-w-sm flex-col border-l border-white/20 bg-black/80 backdrop-blur sm:w-96">
            <div className="flex items-center justify-between border-b border-white/20 p-3">
              <span className="text-sm font-semibold text-white">Comentários</span>
              <button type="button" onClick={() => setShowComments(false)} className="rounded p-1 text-white/80 hover:bg-white/20">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {comments.length === 0 ? (
                <p className="text-center text-sm text-white/60">Nenhum comentário ainda.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="rounded-lg bg-white/10 px-3 py-2 text-sm">
                    <p className="font-medium text-white">{c.userName}</p>
                    <p className="text-white/90">{c.content}</p>
                  </div>
                ))
              )}
            </div>
            {user && (
              <form onSubmit={handleCommentSubmit} className="border-t border-white/20 p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Comentar..."
                    maxLength={500}
                    className="flex-1 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-primary-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={commentSending || !commentInput.trim()}
                    className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
                  >
                    {commentSending ? '...' : 'Enviar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
