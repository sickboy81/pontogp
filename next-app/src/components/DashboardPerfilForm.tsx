'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ImagePlus, Loader2, Mic, Save, Trash2, Video, Settings, BarChart3, Link2, Copy, TrendingUp, Clock, Target, Lightbulb, GripVertical } from 'lucide-react'
import type { Profile, Schedule } from '@/lib/types'
import {
  CATEGORIES, GENDERS, STATES, HAIR_COLORS, BODY_TYPES, BREAST_TYPES, PUBIS_TYPES,
  PAYMENT_METHOD_OPTIONS, SERVICE_LOCATION_OPTIONS, SERVICE_TO_OPTIONS,
  SMOKER_OPTIONS, getCitiesByState, getServicesByCategory, getSpecialServicesByCategory,
  OTHER_SERVICES_MASSAGIST, FOR_SALE_ONLINE, MASSAGE_CERTIFICATIONS,
} from '@/utils/constants'
import ScheduleManager from '@/components/ScheduleManager'
import toast from 'react-hot-toast'

type FormData = {
  name: string
  age: number
  city: string
  state: string
  bio_title: string
  bio: string
  category: Profile['category']
  gender: Profile['gender']
  ethnicity: string
  whatsapp: string
  telegram: string
  phone: string
  instagram: string
  twitter: string
  slug: string
  short_description: string
  hair_color: string
  body_type: string
  height: string
  weight: string
  height_exact: string
  breast_type: string
  pubis_type: string
  services: string[]
  massage_types: string[]
  online_services: string[]
  other_services: string[]
  for_sale: string[]
  virtual_fantasies: string[]
  certified: boolean
  offers_happy_ending: boolean | undefined
  payment_methods: string[]
  neighborhoods: string[]
  service_locations: string[]
  service_to: string[]
  special_services: string[]
  onlyfans: string
  piercings: boolean
  tattoos: boolean
  smoker: string
  display_mode: 'default' | 'link_bio'
  bio_theme: string
  bio_button_color: string
  bio_links: Array<{ label: string; url: string; type?: string; enabled?: boolean }>
  bio_avatar_index: number
  price_30min: string
  price_1h: string
  price_2h: string
  price_overnight: string
  location_lat: string
  location_lng: string
  location_approximate: boolean
}

const emptyForm: FormData = {
  name: '',
  age: 18,
  city: '',
  state: '',
  bio_title: '',
  bio: '',
  category: 'acompanhante',
  gender: 'mulher',
  ethnicity: '',
  whatsapp: '',
  telegram: '',
  phone: '',
  instagram: '',
  twitter: '',
  slug: '',
  short_description: '',
  hair_color: '',
  body_type: '',
  height: '',
  weight: '',
  height_exact: '',
  breast_type: '',
  pubis_type: '',
  services: [],
  massage_types: [],
  online_services: [],
  other_services: [],
  for_sale: [],
  virtual_fantasies: [],
  certified: false,
  offers_happy_ending: undefined,
  payment_methods: [],
  neighborhoods: [],
  service_locations: [],
  service_to: [],
  special_services: [],
  onlyfans: '',
  piercings: false,
  tattoos: false,
  smoker: '',
  display_mode: 'default',
  bio_theme: 'dark',
  bio_button_color: '',
  bio_links: [],
  bio_avatar_index: 0,
  price_30min: '',
  price_1h: '',
  price_2h: '',
  price_overnight: '',
  location_lat: '',
  location_lng: '',
  location_approximate: true,
}

function profileToForm(p: Profile | null): FormData {
  if (!p) return emptyForm
  return {
    name: p.name ?? '',
    age: p.age ?? 18,
    city: p.city ?? '',
    state: p.state ?? '',
    bio_title: p.bio_title ?? '',
    bio: p.bio ?? '',
    category: p.category ?? 'acompanhante',
    gender: p.gender ?? 'mulher',
    ethnicity: p.ethnicity ?? '',
    whatsapp: p.whatsapp ?? '',
    telegram: p.telegram ?? '',
    phone: p.phone ?? '',
    instagram: p.instagram ?? '',
    twitter: p.twitter ?? '',
    slug: p.slug ?? '',
    short_description: p.short_description ?? '',
    hair_color: p.hair_color != null ? String(p.hair_color) : '',
    body_type: p.body_type != null ? String(p.body_type) : '',
    height: p.height != null ? String(p.height) : '',
    weight: p.weight ?? '',
    height_exact: p.height_exact ?? '',
    breast_type: p.breast_type ?? '',
    pubis_type: p.pubis_type ?? '',
    services: Array.isArray(p.services) ? p.services : [],
    massage_types: Array.isArray(p.massage_types) ? p.massage_types : [],
    online_services: Array.isArray(p.online_services) ? p.online_services : [],
    other_services: Array.isArray(p.other_services) ? p.other_services : [],
    for_sale: Array.isArray(p.for_sale) ? p.for_sale : [],
    virtual_fantasies: Array.isArray(p.virtual_fantasies) ? p.virtual_fantasies : [],
    certified: p.certified ?? false,
    offers_happy_ending: p.offers_happy_ending,
    payment_methods: Array.isArray(p.payment_methods) ? p.payment_methods : [],
    neighborhoods: Array.isArray(p.neighborhoods) ? p.neighborhoods : [],
    service_locations: Array.isArray(p.service_locations) ? p.service_locations : [],
    service_to: Array.isArray(p.service_to) ? p.service_to : [],
    special_services: Array.isArray(p.special_services) ? p.special_services : [],
    onlyfans: p.onlyfans ?? '',
    piercings: p.piercings ?? false,
    tattoos: p.tattoos ?? false,
    smoker: p.smoker ?? '',
    display_mode: p.display_mode ?? 'default',
    bio_theme: p.bio_theme ?? 'dark',
    bio_button_color: p.bio_button_color ?? '',
    bio_links: Array.isArray(p.bio_links) ? p.bio_links.map((l) => ({ label: l?.label ?? '', url: l?.url ?? '', type: (l as { type?: string })?.type ?? 'custom', enabled: (l as { enabled?: boolean })?.enabled !== false })) : [],
    bio_avatar_index: p.bio_avatar_index != null ? p.bio_avatar_index : 0,
    price_30min: p.price_30min != null ? String(p.price_30min) : '',
    price_1h: p.price_1h != null ? String(p.price_1h) : '',
    price_2h: p.price_2h != null ? String(p.price_2h) : '',
    price_overnight: p.price_overnight != null ? String(p.price_overnight) : '',
    location_lat: p.location_lat != null ? String(p.location_lat) : '',
    location_lng: p.location_lng != null ? String(p.location_lng) : '',
    location_approximate: p.location_approximate ?? true,
  }
}

type TabId = 'dados' | 'midia' | 'stats' | 'bio'

export default function DashboardPerfilForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const t = searchParams.get('tab')
    if (t === 'midia' || t === 'stats' || t === 'bio' || t === 'dados') return t
    return 'dados'
  })
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined)
  const [previewBio, setPreviewBio] = useState(true)
  const [draggedLinkIndex, setDraggedLinkIndex] = useState<number | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoDeleting, setPhotoDeleting] = useState<string | null>(null)
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoDeleting, setVideoDeleting] = useState<string | null>(null)
  const [audioUploading, setAudioUploading] = useState(false)
  const [audioDeleting, setAudioDeleting] = useState(false)
  const [schedule, setSchedule] = useState<Schedule[]>([])

  useEffect(() => {
    let cancelled = false
    fetch('/api/profiles/me', { credentials: 'include' })
      .then((res) => {
        if (res.status === 401) {
          router.replace(`/login?callbackUrl=${encodeURIComponent('/dashboard/perfil')}`)
          return 'UNAUTHORIZED' as const
        }
        return res.ok ? res.json() : null
      })
      .then((data) => {
        if (cancelled || data === 'UNAUTHORIZED') return
        setProfile(data)
        setForm(profileToForm(data))
      })
      .catch(() => {
        if (!cancelled) setProfile(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [router])

  useEffect(() => {
    if (profile) {
      setForm(profileToForm(profile))
      if (profile.schedule && Array.isArray(profile.schedule) && profile.schedule.length > 0) {
        setSchedule(profile.schedule)
      } else {
        setSchedule([])
      }
    }
  }, [profile])

  const cities = getCitiesByState(form.state)

  const setTab = (tab: TabId) => {
    setActiveTab(tab)
    router.replace(`/dashboard/perfil?tab=${tab}`, { scroll: false })
  }

  function extractMediaId(urlOrId: string): string {
    if (!urlOrId) return ''
    const m = urlOrId.match(/([a-z0-9]{15})$/i)
    return m ? m[1] : urlOrId
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setPhotoUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/profiles/${profile.id}/photos`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || 'Erro ao enviar foto')
      }
      const meRes = await fetch('/api/profiles/me', { credentials: 'include' })
      if (meRes.ok) {
        const data = await meRes.json()
        setProfile(data)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar foto')
    } finally {
      setPhotoUploading(false)
      e.target.value = ''
    }
  }

  const handlePhotoDelete = async (photoUrlOrId: string) => {
    if (!profile) return
    const photoId = extractMediaId(photoUrlOrId)
    if (!photoId) return
    setPhotoDeleting(photoId)
    setError(null)
    try {
      const res = await fetch(`/api/profiles/${profile.id}/photos/${photoId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || 'Erro ao remover foto')
      }
      setProfile((prev) =>
        prev ? { ...prev, photos: (prev.photos || []).filter((p) => extractMediaId(p) !== photoId) } : prev
      )
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover foto')
    } finally {
      setPhotoDeleting(null)
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setVideoUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/profiles/${profile.id}/videos`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || 'Erro ao enviar vídeo')
      }
      const meRes = await fetch('/api/profiles/me', { credentials: 'include' })
      if (meRes.ok) {
        const data = await meRes.json()
        setProfile(data)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar vídeo')
    } finally {
      setVideoUploading(false)
      e.target.value = ''
    }
  }

  const handleVideoDelete = async (videoUrlOrId: string) => {
    if (!profile) return
    const videoId = extractMediaId(videoUrlOrId)
    if (!videoId) return
    setVideoDeleting(videoId)
    setError(null)
    try {
      const res = await fetch(`/api/profiles/${profile.id}/videos/${videoId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || 'Erro ao remover vídeo')
      }
      setProfile((prev) =>
        prev ? { ...prev, videos: (prev.videos || []).filter((v) => extractMediaId(v) !== videoId) } : prev
      )
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover vídeo')
    } finally {
      setVideoDeleting(null)
    }
  }

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setAudioUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/profiles/${profile.id}/audio`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || 'Erro ao enviar áudio')
      }
      const meRes = await fetch('/api/profiles/me', { credentials: 'include' })
      if (meRes.ok) {
        const data = await meRes.json()
        setProfile(data)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar áudio')
    } finally {
      setAudioUploading(false)
      e.target.value = ''
    }
  }

  const handleAudioDelete = async () => {
    if (!profile) return
    setAudioDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/profiles/${profile.id}/audio`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || 'Erro ao remover áudio')
      }
      setProfile((prev) => (prev ? { ...prev, audio: undefined } : prev))
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover áudio')
    } finally {
      setAudioDeleting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        age: Number(form.age) || 18,
        city: form.city.trim(),
        state: form.state.trim(),
        bio_title: form.bio_title.trim() || null,
        bio: form.bio.trim(),
        category: form.category,
        gender: form.gender,
        ethnicity: form.ethnicity.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        telegram: form.telegram.trim() || null,
        phone: form.phone.trim() || null,
        instagram: form.instagram.trim() || null,
        twitter: form.twitter.trim() || null,
        slug: form.slug.trim() || null,
        short_description: form.short_description.trim() || null,
        hair_color: String(form.hair_color ?? '').trim() || null,
        body_type: String(form.body_type ?? '').trim() || null,
        height: form.height.trim() ? Number(form.height) : null,
        weight: form.weight.trim() || null,
        height_exact: form.height_exact.trim() || null,
        breast_type: form.breast_type.trim() || null,
        pubis_type: form.pubis_type.trim() || null,
        services: form.category === 'acompanhante' && form.services?.length ? form.services : (form.category !== 'acompanhante' ? [] : form.services?.length ? form.services : null),
        massage_types: form.category === 'massagista' && form.massage_types?.length ? form.massage_types : (form.category !== 'massagista' ? [] : null),
        online_services: form.category === 'online' && form.online_services?.length ? form.online_services : (form.category !== 'online' ? [] : null),
        other_services: form.category === 'massagista' && form.other_services?.length ? form.other_services : (form.category !== 'massagista' ? [] : null),
        for_sale: form.category === 'online' && form.for_sale?.length ? form.for_sale : (form.category !== 'online' ? [] : null),
        virtual_fantasies: form.category === 'online' && form.virtual_fantasies?.length ? form.virtual_fantasies : (form.category !== 'online' ? [] : null),
        certified: form.category === 'massagista' ? form.certified : false,
        offers_happy_ending: form.category === 'massagista' ? form.offers_happy_ending : undefined,
        payment_methods: form.payment_methods?.length ? form.payment_methods : null,
        neighborhoods: form.category !== 'online' && form.neighborhoods?.length ? form.neighborhoods : (form.category === 'online' ? [] : form.neighborhoods?.length ? form.neighborhoods : null),
        service_locations: form.category !== 'online' && form.service_locations?.length ? form.service_locations : (form.category === 'online' ? [] : form.service_locations?.length ? form.service_locations : null),
        service_to: form.category !== 'online' && form.service_to?.length ? form.service_to : (form.category === 'online' ? [] : form.service_to?.length ? form.service_to : null),
        special_services: (form.category === 'acompanhante' || form.category === 'massagista') && form.special_services?.length ? form.special_services : (form.category === 'online' ? [] : form.special_services?.length ? form.special_services : null),
        onlyfans: form.onlyfans.trim() || null,
        piercings: form.piercings,
        tattoos: form.tattoos,
        smoker: form.smoker.trim() || null,
        display_mode: form.display_mode || null,
        bio_theme: form.display_mode === 'link_bio' ? (form.bio_theme || 'dark') : null,
        bio_button_color: form.display_mode === 'link_bio' && form.bio_button_color ? form.bio_button_color : null,
        bio_links: form.display_mode === 'link_bio' && form.bio_links.length > 0 ? form.bio_links.filter((l) => l.enabled !== false && l.label.trim() && l.url.trim()).map((l) => ({ label: l.label.trim(), url: l.url.trim() })) : null,
        bio_avatar_index: form.display_mode === 'link_bio' ? form.bio_avatar_index : null,
        price_30min: form.price_30min ? Number(form.price_30min) : null,
        price_1h: form.price_1h ? Number(form.price_1h) : null,
        price_2h: form.price_2h ? Number(form.price_2h) : null,
        price_overnight: form.price_overnight ? Number(form.price_overnight) : null,
        location_lat: form.location_lat ? Number(form.location_lat) : null,
        location_lng: form.location_lng ? Number(form.location_lng) : null,
        location_approximate: form.location_approximate,
        schedule: schedule.length > 0 ? schedule : null,
      }
      if (profile) {
        const res = await fetch(`/api/profiles/${profile.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error((data as { error?: string }).error || 'Erro ao salvar')
        }
      } else {
        const res = await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error((data as { error?: string }).error || 'Erro ao criar perfil')
        }
      }
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-slate-700" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-800/50" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao dashboard
      </Link>
      <h1 className="mb-2 text-2xl font-bold text-white">
        {profile ? 'Editar perfil' : 'Criar perfil'}
      </h1>
      {profile && (
        <p className="mb-4 text-slate-400">Editando: {profile.name}</p>
      )}

      {/* Abas: Dados | Mídia | Stats | Bio */}
      {profile && (
        <nav className="mb-6 flex flex-wrap gap-1 border-b border-slate-700">
          {[
            { id: 'dados' as const, label: 'Dados', icon: Settings },
            { id: 'midia' as const, label: 'Mídia', icon: ImagePlus },
            { id: 'stats' as const, label: 'Stats', icon: BarChart3 },
            { id: 'bio' as const, label: 'Bio', icon: Link2 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === id
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        {error && (
          <div className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-300">{error}</div>
        )}

        {(!profile || activeTab === 'dados') && (
          <>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Nome *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Idade *</label>
            <input
              type="number"
              min={18}
              max={120}
              value={form.age}
              onChange={(e) => setForm((f) => ({ ...f, age: Number(e.target.value) || 18 }))}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Estado</label>
            <select
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value, city: '' }))}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Selecione</option>
              {STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Cidade</label>
            <select
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Selecione</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {form.category !== 'online' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Latitude (opcional)</label>
                <input type="number" step="any" value={form.location_lat} onChange={(e) => setForm((f) => ({ ...f, location_lat: e.target.value }))} placeholder="Ex: -23.5505" className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Longitude (opcional)</label>
                <input type="number" step="any" value={form.location_lng} onChange={(e) => setForm((f) => ({ ...f, location_lng: e.target.value }))} placeholder="Ex: -46.6333" className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
            </div>
            <p className="text-xs text-slate-500">Preencha latitude e longitude para exibir um mapa no seu perfil. Você pode obter as coordenadas no Google Maps (clique com o botão direito no mapa).</p>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={form.location_approximate} onChange={(e) => setForm((f) => ({ ...f, location_approximate: e.target.checked }))} className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm text-slate-300">Exibir como localização aproximada</span>
            </label>
          </>
        )}

        {profile && (
          <>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Horários de atendimento</h3>
            <ScheduleManager schedule={schedule} onChange={setSchedule} />
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Categoria</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as FormData['category'] }))}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Gênero</label>
            <select
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as FormData['gender'] }))}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Etnia</label>
          <input
            type="text"
            value={form.ethnicity}
            onChange={(e) => setForm((f) => ({ ...f, ethnicity: e.target.value }))}
            placeholder="Ex: Branca, Parda, Negra"
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Cabelo</label>
            <select
              value={form.hair_color}
              onChange={(e) => setForm((f) => ({ ...f, hair_color: e.target.value }))}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">—</option>
              {HAIR_COLORS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Corpo</label>
            <select
              value={form.body_type}
              onChange={(e) => setForm((f) => ({ ...f, body_type: e.target.value }))}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">—</option>
              {BODY_TYPES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Altura (cm)</label>
            <input
              type="number"
              min={100}
              max={250}
              value={form.height}
              onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))}
              placeholder="Ex: 165"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Peso</label>
            <input
              type="text"
              value={form.weight}
              onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
              placeholder="Ex: 60kg"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Altura exata</label>
            <input
              type="text"
              value={form.height_exact}
              onChange={(e) => setForm((f) => ({ ...f, height_exact: e.target.value }))}
              placeholder="Ex: 1,70m"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Busto</label>
            <select
              value={form.breast_type}
              onChange={(e) => setForm((f) => ({ ...f, breast_type: e.target.value }))}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">—</option>
              {BREAST_TYPES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Pubis</label>
            <select
              value={form.pubis_type}
              onChange={(e) => setForm((f) => ({ ...f, pubis_type: e.target.value }))}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">—</option>
              {PUBIS_TYPES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={form.piercings}
              onChange={(e) => setForm((f) => ({ ...f, piercings: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-slate-300">Piercing</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={form.tattoos}
              onChange={(e) => setForm((f) => ({ ...f, tattoos: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-slate-300">Tatuagem</span>
          </label>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Fuma?</label>
            <select
              value={form.smoker}
              onChange={(e) => setForm((f) => ({ ...f, smoker: e.target.value }))}
              className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">—</option>
              {SMOKER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Serviços / Tipos de massagem / Serviços online – conforme categoria */}
        <div className="border-t border-slate-700 pt-4">
          <h3 className="mb-3 font-medium text-slate-300">
            {form.category === 'massagista' ? 'Tipos de massagens' : form.category === 'online' ? 'Serviços online' : 'Serviços oferecidos'}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {getServicesByCategory(form.category).map((s) => {
              const checked = form.category === 'massagista' ? form.massage_types.includes(s) : form.category === 'online' ? form.online_services.includes(s) : form.services.includes(s)
              return (
                <label key={s} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (form.category === 'massagista') {
                        setForm((f) => ({ ...f, massage_types: e.target.checked ? [...f.massage_types, s] : f.massage_types.filter((x) => x !== s) }))
                      } else if (form.category === 'online') {
                        setForm((f) => ({ ...f, online_services: e.target.checked ? [...f.online_services, s] : f.online_services.filter((x) => x !== s) }))
                      } else {
                        setForm((f) => ({ ...f, services: e.target.checked ? [...f.services, s] : f.services.filter((x) => x !== s) }))
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-slate-300">{s}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Massagista: certificada + oferece final feliz + final feliz + outros serviços */}
        {form.category === 'massagista' && (
          <>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="mb-3 font-medium text-slate-300">Certificado</h3>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.certified}
                  onChange={(e) => setForm((f) => ({ ...f, certified: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-300">{MASSAGE_CERTIFICATIONS[0]}</span>
              </label>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="mb-3 font-medium text-slate-300">Oferece final feliz?</h3>
              <div className="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="offers_happy_ending" checked={form.offers_happy_ending === true} onChange={() => setForm((f) => ({ ...f, offers_happy_ending: true }))} className="h-4 w-4 border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm text-slate-300">Sim</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="offers_happy_ending" checked={form.offers_happy_ending === false} onChange={() => setForm((f) => ({ ...f, offers_happy_ending: false, special_services: [] }))} className="h-4 w-4 border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm text-slate-300">Não</span>
                </label>
              </div>
            </div>
            {form.offers_happy_ending === true && (
              <div className="border-t border-slate-700 pt-4">
                <h3 className="mb-3 font-medium text-slate-300">Final feliz</h3>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {getSpecialServicesByCategory('massagista').map((s) => (
                    <label key={s} className="flex cursor-pointer items-center gap-2">
                      <input type="checkbox" checked={form.special_services.includes(s)} onChange={(e) => setForm((f) => ({ ...f, special_services: e.target.checked ? [...f.special_services, s] : f.special_services.filter((x) => x !== s) }))} className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500" />
                      <span className="text-sm text-slate-300">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="border-t border-slate-700 pt-4">
              <h3 className="mb-3 font-medium text-slate-300">Outros serviços</h3>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {OTHER_SERVICES_MASSAGIST.map((s) => (
                  <label key={s} className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={form.other_services.includes(s)} onChange={(e) => setForm((f) => ({ ...f, other_services: e.target.checked ? [...f.other_services, s] : f.other_services.filter((x) => x !== s) }))} className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm text-slate-300">{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Online: fantasias virtuais + para vender */}
        {form.category === 'online' && (
          <>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="mb-3 font-medium text-slate-300">Fantasias virtuais</h3>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {getSpecialServicesByCategory('online').map((s) => (
                  <label key={s} className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={form.virtual_fantasies.includes(s)} onChange={(e) => setForm((f) => ({ ...f, virtual_fantasies: e.target.checked ? [...f.virtual_fantasies, s] : f.virtual_fantasies.filter((x) => x !== s) }))} className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm text-slate-300">{s}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="mb-3 font-medium text-slate-300">Para vender</h3>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {FOR_SALE_ONLINE.map((s) => (
                  <label key={s} className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={form.for_sale.includes(s)} onChange={(e) => setForm((f) => ({ ...f, for_sale: e.target.checked ? [...f.for_sale, s] : f.for_sale.filter((x) => x !== s) }))} className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm text-slate-300">{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="border-t border-slate-700 pt-4">
          <h3 className="mb-3 font-medium text-slate-300">Formas de pagamento aceitas</h3>
          <div className="flex flex-wrap gap-3">
            {PAYMENT_METHOD_OPTIONS.map((pm) => (
              <label key={pm.value} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.payment_methods.includes(pm.value)}
                  onChange={(e) => {
                    setForm((f) => ({
                      ...f,
                      payment_methods: e.target.checked ? [...f.payment_methods, pm.value] : f.payment_methods.filter((x) => x !== pm.value),
                    }))
                  }}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-300">{pm.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Locais / Atende a / Bairros – ocultos para categoria Online */}
        {form.category !== 'online' && (
          <>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="mb-3 font-medium text-slate-300">Locais de atendimento</h3>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {SERVICE_LOCATION_OPTIONS.map((loc) => (
                  <label key={loc} className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={form.service_locations.includes(loc)} onChange={(e) => setForm((f) => ({ ...f, service_locations: e.target.checked ? [...f.service_locations, loc] : f.service_locations.filter((x) => x !== loc) }))} className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm text-slate-300">{loc}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="mb-3 font-medium text-slate-300">Atende a</h3>
              <div className="flex flex-wrap gap-3">
                {SERVICE_TO_OPTIONS.map((o) => (
                  <label key={o.value} className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={form.service_to.includes(o.value)} onChange={(e) => setForm((f) => ({ ...f, service_to: e.target.checked ? [...f.service_to, o.value] : f.service_to.filter((x) => x !== o.value) }))} className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm text-slate-300">{o.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="mb-3 font-medium text-slate-300">Bairros / regiões de atendimento</h3>
              <input type="text" value={form.neighborhoods.join(', ')} onChange={(e) => setForm((f) => ({ ...f, neighborhoods: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))} placeholder="Ex: Copacabana, Ipanema, Leblon" className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
          </>
        )}

        {/* Serviços especiais – apenas Acompanhante (massagista usa "Final feliz" acima) */}
        {form.category === 'acompanhante' && (
          <div className="border-t border-slate-700 pt-4">
            <h3 className="mb-3 font-medium text-slate-300">Serviços especiais</h3>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {getSpecialServicesByCategory('acompanhante').map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={form.special_services.includes(s)} onChange={(e) => setForm((f) => ({ ...f, special_services: e.target.checked ? [...f.special_services, s] : f.special_services.filter((x) => x !== s) }))} className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm text-slate-300">{s}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Link OnlyFans</label>
          <input
            type="url"
            value={form.onlyfans}
            onChange={(e) => setForm((f) => ({ ...f, onlyfans: e.target.value }))}
            placeholder="https://onlyfans.com/..."
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Título da bio</label>
          <input
            type="text"
            value={form.bio_title}
            onChange={(e) => setForm((f) => ({ ...f, bio_title: e.target.value }))}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Bio *</label>
          <textarea
            required
            rows={4}
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Descrição curta</label>
          <input
            type="text"
            value={form.short_description}
            onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))}
            placeholder="Uma linha para cards e busca"
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Slug (link bio)</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.replace(/\s+/g, '-').toLowerCase() }))}
            placeholder="seu-nome"
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          {form.slug && (
            <p className="mt-1 text-xs text-slate-500">Seu link: /{form.slug}</p>
          )}
        </div>

        <div className="border-t border-slate-700 pt-4">
          <h3 className="mb-3 font-medium text-slate-300">Contato</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500">WhatsApp</label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Telegram</label>
              <input
                type="text"
                value={form.telegram}
                onChange={(e) => setForm((f) => ({ ...f, telegram: e.target.value }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Telefone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Instagram</label>
              <input
                type="text"
                value={form.instagram}
                onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Twitter / X</label>
              <input
                type="text"
                value={form.twitter}
                onChange={(e) => setForm((f) => ({ ...f, twitter: e.target.value }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4">
          <h3 className="mb-3 font-medium text-slate-300">Preços (R$)</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500">30 min</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.price_30min}
                onChange={(e) => setForm((f) => ({ ...f, price_30min: e.target.value }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">1h</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.price_1h}
                onChange={(e) => setForm((f) => ({ ...f, price_1h: e.target.value }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">2h</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.price_2h}
                onChange={(e) => setForm((f) => ({ ...f, price_2h: e.target.value }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Pernoite</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.price_overnight}
                onChange={(e) => setForm((f) => ({ ...f, price_overnight: e.target.value }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
          </>
        )}

        {profile && activeTab === 'midia' && (
          <>
          <div className="border-t border-slate-700 pt-4">
            <h3 className="mb-3 font-medium text-slate-300">Fotos do perfil</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {(profile.photos || []).map((url) => {
                const pid = extractMediaId(url)
                const isDeleting = photoDeleting === pid
                return (
                  <div
                    key={url}
                    className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-slate-600 bg-slate-700"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handlePhotoDelete(url)}
                      disabled={isDeleting}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-red-400 transition hover:bg-red-600/80 disabled:opacity-50"
                      aria-label="Remover foto"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )
              })}
              <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-600 bg-slate-800/50 transition hover:border-primary-500 hover:bg-slate-800">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={photoUploading}
                />
                {photoUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                ) : (
                  <ImagePlus className="h-8 w-8 text-slate-400" />
                )}
                <span className="mt-2 text-xs text-slate-500">
                  {photoUploading ? 'Enviando...' : 'Adicionar'}
                </span>
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              JPG, PNG ou WebP. Máximo 5 MB por foto.
            </p>
          </div>

          <div className="border-t border-slate-700 pt-4">
            <h3 className="mb-3 font-medium text-slate-300">Vídeos do perfil</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {(profile.videos || []).map((url) => {
                const vid = extractMediaId(url)
                const isDeleting = videoDeleting === vid
                return (
                  <div
                    key={url}
                    className="group relative aspect-video overflow-hidden rounded-lg border border-slate-600 bg-slate-700"
                  >
                    <video
                      src={url}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <button
                      type="button"
                      onClick={() => handleVideoDelete(url)}
                      disabled={!!isDeleting}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-red-400 transition hover:bg-red-600/80 disabled:opacity-50"
                      aria-label="Remover vídeo"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )
              })}
              <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-600 bg-slate-800/50 transition hover:border-primary-500 hover:bg-slate-800">
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={handleVideoUpload}
                  disabled={videoUploading}
                />
                {videoUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                ) : (
                  <Video className="h-8 w-8 text-slate-400" />
                )}
                <span className="mt-2 text-xs text-slate-500">
                  {videoUploading ? 'Enviando...' : 'Adicionar'}
                </span>
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              MP4 ou WebM. Máximo 100 MB por vídeo.
            </p>
          </div>

          <div className="border-t border-slate-700 pt-4">
            <h3 className="mb-3 font-medium text-slate-300">Áudio de apresentação</h3>
            {profile.audio ? (
              <div className="flex items-center gap-4 rounded-lg border border-slate-600 bg-slate-800/50 p-4">
                <audio
                  src={profile.audio}
                  controls
                  className="h-10 flex-1"
                />
                <button
                  type="button"
                  onClick={handleAudioDelete}
                  disabled={audioDeleting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
                >
                  {audioDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Remover</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-600 bg-slate-800/50 p-8 transition hover:border-primary-500 hover:bg-slate-800">
                <input
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/x-m4a"
                  className="hidden"
                  onChange={handleAudioUpload}
                  disabled={audioUploading}
                />
                {audioUploading ? (
                  <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
                ) : (
                  <Mic className="h-10 w-10 text-slate-400" />
                )}
                <span className="mt-2 text-sm text-slate-500">
                  {audioUploading ? 'Enviando...' : 'Adicionar áudio de apresentação'}
                </span>
              </label>
            )}
            <p className="mt-2 text-xs text-slate-500">
              MP3, WAV, OGG ou M4A. Máximo 10 MB.
            </p>
          </div>
          </>
        )}

        {profile && activeTab === 'stats' && (() => {
          const plan = (profile.plan_slug ?? profile.plan ?? 'gratis').toLowerCase()
          const hasAdvancedStatsAccess = plan === 'prata' || plan === 'ouro'
          const views = profile.views ?? 0
          const clicks = profile.clicks ?? 0
          const favorites = profile.favorites_count ?? 0

          const statsContent = (
            <div className="space-y-6 border-t border-slate-700 pt-4">
              <h3 className="font-medium text-slate-300">Estatísticas avançadas</h3>

              {/* Meta de performance */}
              <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4 text-center">
                <Target className="mx-auto h-8 w-8 text-primary-500" />
                <p className="mt-2 text-2xl font-bold text-white">
                  {views >= 10 ? `${Math.min(190, 100 + (views > 0 ? Math.round((clicks / views) * 100) : 0))}% DA META` : '—'}
                </p>
                <p className="text-sm text-slate-400">
                  {plan === 'ouro' ? 'Excelente! Você está no topo com o plano Ouro.' : plan === 'prata' ? 'Muito bem! Estatísticas completas no plano Prata.' : 'Atualize para Prata ou Ouro para ver sua meta.'}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Funil de conversão */}
                <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Funil de conversão</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Visualizações</span>
                      <span className="font-medium text-white">{views} pessoas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Cliques de contato</span>
                      <span className="font-medium text-white">{clicks} interessados ({views > 0 ? Math.round((clicks / views) * 100) : 0}% retenção)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Conversões (WhatsApp/Telegram)</span>
                      <span className="font-medium text-white">{clicks} cliques ({clicks > 0 && views > 0 ? Math.round((clicks / views) * 100) : 0}% conversão)</span>
                    </div>
                  </div>
                </div>

                {/* Origem dos contatos (simplificado; detalhes por tipo viriam da API) */}
                <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Resumo de engajamento</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">Visualizações</span>
                        <span className="text-white">{views}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-slate-700">
                        <div className="h-full rounded-full bg-primary-500" style={{ width: `${views > 0 ? Math.min(100, (views / 100) * 100) : 0}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">Cliques</span>
                        <span className="text-white">{clicks}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-slate-700">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${views > 0 ? Math.min(100, (clicks / views) * 100) : 0}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">Favoritos</span>
                        <span className="text-white">{favorites}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-slate-700">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: `${views > 0 ? Math.min(100, (favorites / views) * 100) : 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tendência semanal (placeholder) */}
              <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  <TrendingUp className="h-4 w-4" />
                  Tendência (últimos 7 dias)
                </h4>
                <div className="flex h-24 items-end justify-between gap-1 rounded-lg bg-slate-800/50 px-2 py-2">
                  {['SEX', 'SÁB', 'DOM', 'SEG', 'TER', 'QUA', 'QUI'].map((d, i) => (
                    <div key={d} className="flex flex-1 flex-col items-center gap-1">
                      <div className="h-8 w-full rounded-t bg-slate-600/50" style={{ height: `${(i % 3) * 15 + 20}%` }} />
                      <span className="text-xs text-slate-500">{d}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">Dados de tendência disponíveis no plano Prata/Ouro.</p>
              </div>

              {/* Horário de pico */}
              <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-400">
                  <Clock className="h-4 w-4" />
                  Horário de pico
                </h4>
                <p className="text-sm text-slate-500">Dados insuficientes para calcular horário.</p>
              </div>

              {/* Performance dos stories */}
              <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4">
                <h4 className="mb-2 text-sm font-semibold text-slate-400">Performance dos Stories</h4>
                <p className="text-2xl font-bold text-white">0 views acumuladas</p>
                <p className="mt-1 text-xs text-slate-500">Stories aumentam seu engajamento em média 2.5x. Continue postando!</p>
              </div>

              {/* Retenção */}
              <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4">
                <h4 className="mb-3 text-sm font-semibold text-slate-400">Resumo do perfil</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Visualizações</span>
                      <span className="text-white">{views}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-700">
                      <div className="h-full max-w-full rounded-full bg-blue-500" style={{ width: `${views > 0 ? Math.min(100, views) : 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Favoritos</span>
                      <span className="text-white">{favorites}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-700">
                      <div className="h-full rounded-full bg-purple-500" style={{ width: `${views > 0 ? Math.min(100, (favorites / Math.max(views, 1)) * 100) : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dicas */}
              <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-400">
                  <Lightbulb className="h-4 w-4" />
                  Dicas de performance
                </h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex gap-2">
                    <span className="text-emerald-500">✓</span>
                    Mantenha fotos atualizadas: perfis com fotos novas recebem 40% mais cliques.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500">✓</span>
                    Use os Stories: poste agora para aparecer no topo da página inicial!
                  </li>
                </ul>
              </div>
            </div>
          )

          return (
            <div className="relative">
              <div className={hasAdvancedStatsAccess ? '' : 'select-none blur-md pointer-events-none'}>
                {statsContent}
              </div>
              {!hasAdvancedStatsAccess && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-slate-600 bg-slate-900/90 backdrop-blur-sm">
                  <p className="text-center text-lg font-medium text-white">Estatísticas avançadas</p>
                  <p className="mt-1 max-w-sm text-center text-sm text-slate-300">
                    Funil de conversão, tendências e dicas estão disponíveis nos planos <strong className="text-primary-400">Prata</strong> e <strong className="text-primary-400">Ouro</strong>.
                  </p>
                  <Link
                    href="/planos"
                    className="mt-4 rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition hover:bg-primary-500"
                  >
                    Ver planos
                  </Link>
                </div>
              )}
            </div>
          )
        })()}

        {profile && activeTab === 'bio' && (
          <div className="space-y-6 border-t border-slate-700 pt-4">
            <h3 className="font-medium text-slate-300">Link na Bio</h3>
            <p className="text-sm text-slate-400">Página simplificada focada em links de contato e redes sociais. Ideal para Instagram/Tiktok.</p>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Modo de exibição</label>
              <div className="flex gap-4">
                <label className="flex cursor-pointer flex-col gap-1 rounded-xl border-2 border-slate-600 bg-slate-800/50 p-4 transition hover:border-slate-500 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-500/10">
                  <input type="radio" name="display_mode" value="default" checked={form.display_mode === 'default'} onChange={() => setForm((f) => ({ ...f, display_mode: 'default' }))} className="sr-only" />
                  <span className="font-medium text-white">Perfil completo</span>
                  <span className="text-xs text-slate-400">Página padrão do anúncio</span>
                </label>
                <label className="flex cursor-pointer flex-col gap-1 rounded-xl border-2 border-slate-600 bg-slate-800/50 p-4 transition hover:border-slate-500 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-500/10">
                  <input type="radio" name="display_mode" value="link_bio" checked={form.display_mode === 'link_bio'} onChange={() => setForm((f) => ({ ...f, display_mode: 'link_bio' }))} className="sr-only" />
                  <span className="font-medium text-white">Link na bio</span>
                  <span className="text-xs text-slate-400">Página compacta com links</span>
                </label>
              </div>
            </div>

            {form.display_mode === 'link_bio' && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Personalizar seu link na bio</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== 'undefined' ? `cerejavip.com/@${form.slug || 'seu-slug'}` : `cerejavip.com/@${form.slug || 'seu-slug'}`}
                      className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const base = typeof window !== 'undefined' ? window.location.origin : ''
                        const url = `${base}/${form.slug || 'seu-slug'}`
                        navigator.clipboard.writeText(url).then(() => toast.success('Link copiado!'))
                      }}
                      className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Tema visual</label>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {[
                      { id: 'dark', name: 'CerejaVIP Dark', bg: 'bg-slate-900' },
                      { id: 'light', name: 'Clean Light', bg: 'bg-slate-100' },
                      { id: 'minimal', name: 'Mínimo', bg: 'bg-white' },
                      { id: 'sunset', name: 'Sunset Vibes', bg: 'bg-gradient-to-br from-orange-400 to-rose-600' },
                      { id: 'cherry', name: 'Cereja', bg: 'bg-gradient-to-br from-rose-700 to-red-900' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, bio_theme: t.id }))}
                        className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 text-xs transition ${form.bio_theme === t.id ? 'border-primary-500 ring-2 ring-primary-500/30' : 'border-slate-600 hover:border-slate-500'}`}
                      >
                        <span className={`h-8 w-full rounded ${t.bg}`} />
                        <span className="text-slate-300">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Cor dos botões</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="color"
                      value={form.bio_button_color || '#dc2626'}
                      onChange={(e) => setForm((f) => ({ ...f, bio_button_color: e.target.value }))}
                      className="h-10 w-14 cursor-pointer rounded border border-slate-600 bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={form.bio_button_color}
                      onChange={(e) => setForm((f) => ({ ...f, bio_button_color: e.target.value }))}
                      placeholder="#dc2626"
                      className="w-28 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-white placeholder-slate-500"
                    />
                    {['#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#7c3aed', '#0ea5e9'].map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, bio_button_color: hex }))}
                        className={`h-8 w-8 rounded-full border-2 transition ${form.bio_button_color === hex ? 'border-white ring-2 ring-primary-500' : 'border-slate-600 hover:border-slate-500'}`}
                        style={{ backgroundColor: hex }}
                        aria-label={`Cor ${hex}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Foto de perfil (avatar)</label>
                  <div className="flex flex-wrap gap-2">
                    {(profile.photos || []).length > 0 ? (
                      (profile.photos || []).map((url, idx) => (
                        <button
                          key={url}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, bio_avatar_index: idx }))}
                          className={`h-14 w-14 overflow-hidden rounded-full border-2 transition ${form.bio_avatar_index === idx ? 'border-primary-500 ring-2 ring-primary-500/30' : 'border-slate-600 hover:border-slate-500'}`}
                        >
                          <img src={url} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">Adicione fotos na aba Mídia.</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Frase de apresentação</label>
                  <input
                    type="text"
                    value={form.short_description}
                    onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))}
                    placeholder="Ex: Te ajudo a relaxar com a melhor da mensagem..."
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Gerenciar links e botões</label>
                  <p className="mb-2 text-xs text-slate-500">Arraste pelo ícone ≡ para reordenar.</p>
                  <div className="space-y-3">
                    {form.bio_links.map((link, i) => (
                      <div
                        key={i}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; e.currentTarget.classList.add('opacity-80', 'ring-2', 'ring-primary-500/50') }}
                        onDragLeave={(e) => { e.currentTarget.classList.remove('opacity-80', 'ring-2', 'ring-primary-500/50') }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.currentTarget.classList.remove('opacity-80', 'ring-2', 'ring-primary-500/50')
                          const fromStr = e.dataTransfer.getData('text/plain')
                          if (fromStr === '') return
                          const from = Number(fromStr)
                          if (Number.isNaN(from) || from === i) { setDraggedLinkIndex(null); return }
                          const newLinks = form.bio_links.filter((_, j) => j !== from)
                          newLinks.splice(i > from ? i - 1 : i, 0, form.bio_links[from])
                          setForm((f) => ({ ...f, bio_links: newLinks }))
                          setDraggedLinkIndex(null)
                        }}
                        className={`flex flex-wrap items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/50 p-3 transition ${draggedLinkIndex === i ? 'opacity-60' : ''}`}
                      >
                        <span
                          draggable
                          onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(i)); e.dataTransfer.effectAllowed = 'move'; setDraggedLinkIndex(i) }}
                          onDragEnd={() => setDraggedLinkIndex(null)}
                          className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 touch-none"
                          title="Arrastar para reordenar"
                        >
                          <GripVertical className="h-5 w-5" />
                        </span>
                        <select
                          value={link.type || 'custom'}
                          onChange={(e) => setForm((f) => ({ ...f, bio_links: f.bio_links.map((l, j) => (j === i ? { ...l, type: e.target.value } : l)) }))}
                          className="rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-white"
                        >
                          <option value="whatsapp">WhatsApp</option>
                          <option value="telegram">Telegram</option>
                          <option value="instagram">Instagram</option>
                          <option value="twitter">Twitter / X</option>
                          <option value="perfil_completo">Perfil completo</option>
                          <option value="phone">Ligar agora</option>
                          <option value="onlyfans">OnlyFans</option>
                          <option value="custom">Outro</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Rótulo"
                          value={link.label}
                          onChange={(e) => setForm((f) => ({ ...f, bio_links: f.bio_links.map((l, j) => (j === i ? { ...l, label: e.target.value } : l)) }))}
                          className="min-w-[100px] flex-1 rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-white"
                        />
                        <input
                          type="text"
                          placeholder="URL ou número"
                          value={link.url}
                          onChange={(e) => setForm((f) => ({ ...f, bio_links: f.bio_links.map((l, j) => (j === i ? { ...l, url: e.target.value } : l)) }))}
                          className="min-w-[120px] flex-1 rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-white"
                        />
                        <label className="flex items-center gap-1 text-sm text-slate-400">
                          <input type="checkbox" checked={link.enabled !== false} onChange={(e) => setForm((f) => ({ ...f, bio_links: f.bio_links.map((l, j) => (j === i ? { ...l, enabled: e.target.checked } : l)) }))} className="rounded border-slate-600 bg-slate-800 text-primary-600" />
                          ON
                        </label>
                        <button type="button" onClick={() => setForm((f) => ({ ...f, bio_links: f.bio_links.filter((_, j) => j !== i) }))} className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-red-400" aria-label="Remover">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, bio_links: [...f.bio_links, { label: '', url: '', type: 'custom', enabled: true }] }))}
                      className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                    >
                      + Add link extra
                    </button>
                  </div>
                </div>

                {previewBio && profile && (() => {
                  const theme = form.bio_theme || 'dark'
                  const previewBg = theme === 'light' ? 'bg-gradient-to-b from-slate-100 to-slate-200' : theme === 'minimal' ? 'bg-white' : theme === 'sunset' ? 'bg-gradient-to-br from-orange-400/90 via-rose-500/90 to-rose-700' : theme === 'cherry' ? 'bg-gradient-to-br from-rose-800 to-red-950' : 'bg-gradient-to-b from-slate-900 to-slate-950'
                  const avatarBorder = theme === 'light' ? 'border-slate-300 bg-slate-200' : theme === 'minimal' ? 'border-slate-200 bg-slate-100' : theme === 'sunset' || theme === 'cherry' ? 'border-white/30 bg-white/20' : 'border-slate-600 bg-slate-700'
                  const nameColor = theme === 'dark' || theme === 'sunset' || theme === 'cherry' ? 'text-white' : 'text-slate-900'
                  const descColor = theme === 'dark' ? 'text-slate-400' : theme === 'sunset' || theme === 'cherry' ? 'text-white/90' : 'text-slate-600'
                  const defaultLinkBtnClass = theme === 'dark' ? 'bg-slate-800 border-slate-600 text-slate-200' : theme === 'sunset' || theme === 'cherry' ? 'bg-white/20 border-white/40 text-white' : 'bg-slate-100 border-slate-300 text-slate-800'
                  const buttonColor = form.bio_button_color?.trim()
                  const linkBtnStyle = buttonColor ? { backgroundColor: buttonColor, borderColor: buttonColor, color: '#fff' } : undefined
                  const linkBtnClass = linkBtnStyle ? 'border text-white' : defaultLinkBtnClass
                  const initialColor = theme === 'dark' ? 'text-slate-500' : theme === 'sunset' || theme === 'cherry' ? 'text-white/70' : 'text-slate-400'
                  return (
                  <div className="rounded-xl border border-slate-600 bg-slate-800/30 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Pré-visualização</p>
                    <div className={`mx-auto max-w-[280px] overflow-hidden rounded-2xl border border-slate-600 shadow-xl ${previewBg}`}>
                      <div className="flex flex-col items-center p-6">
                        {(profile.photos || [])[form.bio_avatar_index] ? (
                          <img src={(profile.photos || [])[form.bio_avatar_index]} alt="" className={`mb-3 h-20 w-20 rounded-full border-2 object-cover ${avatarBorder}`} />
                        ) : (
                          <div className={`mb-3 flex h-20 w-20 items-center justify-center rounded-full border-2 ${avatarBorder} text-2xl font-bold ${initialColor}`}>{profile.name?.charAt(0)}</div>
                        )}
                        <p className={`font-semibold ${nameColor}`}>{profile.name}</p>
                        {form.short_description && <p className={`mt-1 text-center text-xs ${descColor}`}>{form.short_description}</p>}
                        <div className="mt-3 w-full space-y-2">
                          {form.bio_links.filter((l) => l.enabled !== false && l.label).map((l, idx) => (
                            <div key={idx} className={`rounded-xl border py-2.5 text-center text-xs font-medium ${linkBtnClass}`} style={linkBtnStyle}>{l.label || 'Link'}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  )
                })()}
                <label className="flex items-center gap-2 text-sm text-slate-400">
                  <input type="checkbox" checked={previewBio} onChange={(e) => setPreviewBio(e.target.checked)} className="rounded border-slate-600 bg-slate-800 text-primary-600" />
                  Mostrar pré-visualização
                </label>
              </>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 font-semibold text-white transition hover:bg-primary-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-600 px-6 py-2.5 text-slate-300 transition hover:bg-slate-700/50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
