'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Edit, Eye, Heart, ImagePlus, Loader2, MessageCircle, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { parsePocketBaseDateInput } from '@/utils/format'
import { CEREJA_STORIES_DURATION_HOURS } from '@/lib/cereja-stories.mjs'

type MyStoryRow = {
  id: string
  type: string
  text: string
  file: string
  created?: string
  expires_at?: string
  views: number
  active: boolean
  likesCount: number
  commentsCount: number
}

function formatExpiresAtDateTime(iso: string | undefined): string | null {
  if (!iso) return null
  const d = parsePocketBaseDateInput(iso) ?? new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function storyExpiresLine(s: MyStoryRow): string {
  const explicit = formatExpiresAtDateTime(s.expires_at)
  if (explicit) return `Até ${explicit}`

  const created = s.created != null && String(s.created).trim() !== '' ? parsePocketBaseDateInput(s.created) : null
  if (created) {
    const end = new Date(created.getTime() + CEREJA_STORIES_DURATION_HOURS * 60 * 60 * 1000)
    if (!isNaN(end.getTime())) {
      return `Até ${end.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`
    }
  }

  return `Fica visível ${CEREJA_STORIES_DURATION_HOURS}h após publicar`
}

export default function DashboardStoriesClient() {
  const [stories, setStories] = useState<MyStoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingStory, setEditingStory] = useState<{ id: string; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const loadStories = () => {
    setLoading(true)
    fetch('/api/stories/mine', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items?: MyStoryRow[] }) => {
        setStories(Array.isArray(data.items) ? data.items : [])
      })
      .catch(() => setStories([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadStories()
  }, [])

  const handleDeleteStory = async (id: string) => {
    if (!confirm('Excluir esta Cereja Story? Não dá para desfazer.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/stories/${id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { error?: string }).error || 'Erro ao excluir')
        return
      }
      setStories((prev) => prev.filter((s) => s.id !== id))
      if (editingStory?.id === id) setEditingStory(null)
      toast.success('Cereja Story excluída.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSaveStoryText = async () => {
    if (!editingStory) return
    setSaving(true)
    try {
      const res = await fetch(`/api/stories/${editingStory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: editingStory.text }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { error?: string }).error || 'Erro ao salvar')
        return
      }
      const text = (data as { text?: string }).text ?? editingStory.text
      setStories((prev) => prev.map((s) => (s.id === editingStory.id ? { ...s, text } : s)))
      setEditingStory(null)
      toast.success('Texto atualizado.')
    } finally {
      setSaving(false)
    }
  }

  const activeCount = stories.filter((s) => s.active).length
  const totalViews = stories.reduce((sum, s) => sum + (Number(s.views) || 0), 0)

  return (
    <div className="advertiser-dashboard mx-auto max-w-3xl">
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Voltar ao dashboard
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cereja Stories</h1>
          <p className="mt-1 text-sm text-slate-400">
            Histórico completo para editar textos, acompanhar desempenho e excluir publicações antigas.
          </p>
        </div>
        <button
          type="button"
          onClick={loadStories}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Atualizar
        </button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="advertiser-active-stat rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-2xl font-bold text-emerald-200">{activeCount}</p>
          <p className="text-xs uppercase tracking-wider text-emerald-300/80">Ativas agora</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-2xl font-bold text-white">{stories.length}</p>
          <p className="text-xs uppercase tracking-wider text-slate-500">Total publicadas</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-2xl font-bold text-white">{totalViews}</p>
          <p className="text-xs uppercase tracking-wider text-slate-500">Views totais</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        {loading && stories.length === 0 ? (
          <div className="flex items-center gap-2 py-8 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando Cereja Stories...
          </div>
        ) : stories.length === 0 ? (
          <p className="py-4 text-sm text-slate-400">Ainda não há Cereja Stories publicadas.</p>
        ) : (
          <ul className="space-y-3">
            {stories.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-600/80 bg-slate-900/40 p-3 sm:flex-row"
              >
                <div className="shrink-0 sm:w-24">
                  {s.file && s.type === 'video' ? (
                    <video
                      src={s.file}
                      className="h-28 w-full rounded-md object-cover sm:h-24 sm:w-24"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : s.file ? (
                    <Image
                      src={s.file}
                      alt=""
                      width={112}
                      height={112}
                      sizes="(max-width: 640px) 112px, 96px"
                      className="h-28 w-full rounded-md object-cover sm:h-24 sm:w-24"
                    />
                  ) : (
                    <div className="flex h-28 items-center justify-center rounded-md bg-slate-700 text-xs text-slate-500 sm:h-24 sm:w-24">
                      Sem arquivo
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`advertiser-story-status rounded px-2 py-0.5 font-medium ${s.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-600 text-slate-300'}`}>
                      {s.active ? 'Ativa' : 'Expirada / inativa'}
                    </span>
                    <span className="text-slate-500">{s.type === 'video' ? 'Vídeo' : 'Imagem'}</span>
                    <span className="text-slate-400">{storyExpiresLine(s)}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-300">
                    <span className="inline-flex items-center gap-1" title="Visualizações">
                      <Eye className="h-4 w-4 text-slate-500" />
                      {s.views}
                    </span>
                    <span className="inline-flex items-center gap-1" title="Curtidas">
                      <Heart className="h-4 w-4 text-slate-500" />
                      {s.likesCount}
                    </span>
                    <span className="inline-flex items-center gap-1" title="Comentários">
                      <MessageCircle className="h-4 w-4 text-slate-500" />
                      {s.commentsCount}
                    </span>
                  </div>

                  {editingStory?.id === s.id ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={editingStory.text}
                        onChange={(e) => setEditingStory({ ...editingStory, text: e.target.value })}
                        rows={3}
                        maxLength={2000}
                        className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="Legenda da Cereja Story (opcional)"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleSaveStoryText}
                          disabled={saving}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Guardar texto
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingStory(null)}
                          disabled={saving}
                          className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {s.text ? (
                        <p className="mt-2 line-clamp-3 text-sm text-slate-300">{s.text}</p>
                      ) : (
                        <p className="mt-2 text-sm italic text-slate-500">Sem legenda</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingStory({ id: s.id, text: s.text })}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Editar texto
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStory(s.id)}
                          disabled={deletingId === s.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-1.5 text-sm text-red-200 hover:bg-red-950/50 disabled:opacity-50"
                        >
                          {deletingId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          Excluir
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

