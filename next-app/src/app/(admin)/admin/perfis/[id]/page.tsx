'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import type { Profile } from '@/lib/types'
import { getAdminProfilePhotoLabel } from '@/lib/admin-profile-preview.mjs'

export default function AdminProfilePreviewPage() {
  const params = useParams<{ id: string }>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/admin/profiles/${encodeURIComponent(params.id)}`, { credentials: 'include', cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({})) as { profile?: Profile; error?: string }
        if (!response.ok) throw new Error(data.error || 'Não foi possível abrir o perfil.')
        setProfile(data.profile || null)
      })
      .catch((cause: unknown) => { if (!(cause instanceof DOMException && cause.name === 'AbortError')) setError(cause instanceof Error ? cause.message : 'Não foi possível abrir o perfil.') })
    return () => controller.abort()
  }, [params.id])

  if (error) {
    return (
      <div>
        <Link href="/admin/perfis" className="inline-flex items-center gap-2 text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Voltar aos perfis
        </Link>
        <p className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-200">{error}</p>
      </div>
    )
  }
  if (!profile) return <div className="flex justify-center py-16"><Loader2 className="h-10 w-10 animate-spin text-primary-500" /></div>

  const photos = profile.photos || []
  return (
    <div className="max-w-5xl">
      <Link href="/admin/perfis" className="inline-flex items-center gap-2 text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Voltar aos perfis
      </Link>
      <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-slate-900">
        <p className="font-semibold">Prévia administrativa — {profile.status === 'inactive' ? 'Rascunho' : 'Perfil não público'}</p>
        <p className="mt-1 text-sm text-slate-700">Esta visualização é exclusiva do admin e não publica o anúncio.</p>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <section className="rounded-xl border border-slate-700 bg-slate-800/40 p-5">
          <div className="grid grid-cols-2 gap-3">
            {photos.length ? photos.map((photo, index) => (
              <button
                key={photo}
                type="button"
                onClick={() => setSelectedPhoto(index)}
                className="group relative overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                aria-label={getAdminProfilePhotoLabel(profile.name, index)}
              >
                <img src={photo} alt={`Foto ${index + 1} de ${profile.name}`} className="aspect-[2/3] w-full object-cover transition group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 bg-slate-950/75 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">Clique para ampliar</span>
              </button>
            )) : <p className="col-span-2 rounded-lg bg-slate-800 p-6 text-center text-sm text-slate-400">Sem fotos enviadas.</p>}
          </div>
        </section>
        <section className="rounded-xl border border-slate-700 bg-slate-800/40 p-6">
          <p className="text-sm uppercase tracking-wide text-primary-300">{profile.category || 'Anunciante'}</p>
          <h1 className="mt-1 text-3xl font-bold text-white">{profile.name || 'Sem nome público'}</h1>
          <p className="mt-2 text-slate-300">{profile.city || 'Cidade não informada'}{profile.state ? `, ${profile.state}` : ''}</p>
          {profile.bio_title && <h2 className="mt-6 text-xl font-semibold text-white">{profile.bio_title}</h2>}
          {profile.bio && <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-300">{profile.bio}</p>}
          <dl className="mt-6 grid gap-4 border-t border-slate-700 pt-5 sm:grid-cols-2">
            <div><dt className="text-xs uppercase text-slate-500">Plano</dt><dd className="mt-1 text-slate-200">{profile.plan_slug || profile.plan || 'Grátis'}</dd></div>
            <div><dt className="text-xs uppercase text-slate-500">Contato cadastrado</dt><dd className="mt-1 text-slate-200">{profile.whatsapp || profile.telegram || profile.phone || 'Não informado'}</dd></div>
          </dl>
        </section>
      </div>
      {selectedPhoto !== null && photos[selectedPhoto] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4" role="dialog" aria-modal="true" aria-label="Foto ampliada" onClick={() => setSelectedPhoto(null)}>
          <button type="button" className="absolute right-5 top-5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900" onClick={() => setSelectedPhoto(null)}>Fechar</button>
          <img src={photos[selectedPhoto]} alt={`Foto ${selectedPhoto + 1} de ${profile.name}`} className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain" onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
