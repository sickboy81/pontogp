'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, ImagePlus, Loader2, Mic, Plus, Save, Trash2, Video, Settings, BarChart3, Link2, Copy, TrendingUp, Clock, Target, Lightbulb, GripVertical, AlertTriangle, RefreshCw } from 'lucide-react'
import type { Profile, Schedule } from '@/lib/types'
import {
  CATEGORIES, GENDERS, STATES, ETHNICITIES, HAIR_COLORS, BODY_TYPES, BREAST_TYPES, PUBIS_TYPES,
  PAYMENT_METHOD_OPTIONS, SERVICE_LOCATION_OPTIONS, SERVICE_TO_OPTIONS,
  SMOKER_OPTIONS, getCitiesByState, getServicesByCategory, getSpecialServicesByCategory,
  getNeighborhoodsByCity,
  OTHER_SERVICES_MASSAGIST, FOR_SALE_ONLINE, MASSAGE_CERTIFICATIONS,
} from '@/utils/constants'
import ScheduleManager from '@/components/ScheduleManager'
import DashboardLocationMapPicker from '@/components/DashboardLocationMapPicker'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/auth'
import {
  parseInstagramUsername,
  parseOnlyfansUsername,
  parsePrivacyUsername,
  parseTwitterUsername,
  socialProfileHref,
} from '@/lib/social-links'
import {
  MIN_PROFILE_BIO_LENGTH,
  MIN_PROFILE_PHOTOS,
  canPublishProfile,
  canRemoveProfilePhoto,
  canSaveProfileContacts,
  getMissingProfileBioCharacters,
  getMissingProfilePhotos,
  getProfileDraftValidationError,
  hasPublishableProfileBio,
  hasPublicProfileContact,
  hasUnsavedProfileContactChanges,
} from '@/lib/profile-publication.mjs'
import { resolveProtectedAccess } from '@/lib/protected-access.mjs'

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
  show_whatsapp: boolean
  show_telegram: boolean
  show_phone: boolean
  instagram: string
  twitter: string
  privacy: string
  slug: string
  short_description: string
  hair_color: string
  body_type: string
  height: string
  weight: string
  eye_color: string
  foot_size: string
  languages: string[]
  accepts_travel: boolean
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
  bio_show_full_profile: boolean
  /** Linhas livres: o que oferece + valor (R$). */
  price_rows: Array<{ description: string; price: string }>
  location_lat: string
  location_lng: string
  location_approximate: boolean
}

function telegramHref(raw: string): string {
  const value = raw.trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  const username = value.replace(/^@+/, '').replace(/^t(elegram)?\.me\/?/i, '').split('/')[0]
  return username ? `https://t.me/${username}` : ''
}

function whatsappHref(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : ''
}

function buildSuggestedBioLinks(form: FormData): Array<{ label: string; url: string; type: string; enabled: boolean }> {
  const links: Array<{ label: string; url: string; type: string; enabled: boolean }> = []
  const add = (type: string, label: string, url: string | null | undefined) => {
    const clean = (url || '').trim()
    if (clean) links.push({ type, label, url: clean, enabled: true })
  }
  if (form.show_whatsapp) add('whatsapp', 'WhatsApp', whatsappHref(form.whatsapp))
  if (form.show_telegram) add('telegram', 'Telegram', telegramHref(form.telegram))
  if (form.show_phone) add('phone', 'Ligar agora', form.phone ? `tel:${form.phone.trim()}` : '')
  add('instagram', 'Instagram', socialProfileHref(form.instagram, 'instagram'))
  add('twitter', 'X', socialProfileHref(form.twitter, 'twitter'))
  add('privacy', 'Privacy', socialProfileHref(form.privacy, 'privacy'))
  add('onlyfans', 'OnlyFans', socialProfileHref(form.onlyfans, 'onlyfans'))
  return links
}

function normalizeBioLinkUrl(url: string): string {
  const value = url.trim()
  if (!value) return ''
  if (/^(tel|mailto|sms):/i.test(value)) return value.replace(/\/+$/, '').toLowerCase()
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    const parsed = new URL(withProtocol)
    return `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, '')}`.toLowerCase()
  } catch {
    return value.replace(/\/+$/, '').toLowerCase()
  }
}

function parseCoordinate(value: string, min: number, max: number): number | null {
  const normalized = value.trim().replace(',', '.')
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null
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
  show_whatsapp: true,
  show_telegram: true,
  show_phone: true,
  instagram: '',
  twitter: '',
  privacy: '',
  slug: '',
  short_description: '',
  hair_color: '',
  body_type: '',
  height: '',
  weight: '',
  eye_color: '',
  foot_size: '',
  languages: [],
  accepts_travel: false,
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
  bio_show_full_profile: true,
  price_rows: [{ description: '', price: '' }],
  location_lat: '',
  location_lng: '',
  location_approximate: true,
}

function profilePriceRowsFromProfile(p: Profile): Array<{ description: string; price: string }> {
  if (p.prices?.length) {
    return p.prices.map((row) => ({
      description: row.description ?? '',
      price: row.price != null ? String(row.price) : '',
    }))
  }
  const legacy: Array<{ description: string; price: string }> = []
  if (p.price_30min != null) legacy.push({ description: '30 min', price: String(p.price_30min) })
  if (p.price_1h != null) legacy.push({ description: '1h', price: String(p.price_1h) })
  if (p.price_2h != null) legacy.push({ description: '2h', price: String(p.price_2h) })
  if (p.price_overnight != null) legacy.push({ description: 'Pernoite', price: String(p.price_overnight) })
  return legacy.length > 0 ? legacy : [{ description: '', price: '' }]
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
    show_whatsapp: p.show_whatsapp !== false,
    show_telegram: p.show_telegram !== false,
    show_phone: p.show_phone !== false,
    instagram: parseInstagramUsername(p.instagram ?? ''),
    twitter: parseTwitterUsername(p.twitter ?? ''),
    privacy: parsePrivacyUsername(p.privacy ?? ''),
    slug: p.slug ?? '',
    short_description: p.short_description ?? '',
    hair_color: p.hair_color != null ? String(p.hair_color) : '',
    body_type: p.body_type != null ? String(p.body_type) : '',
    height: p.height != null ? String(p.height) : '',
    weight: p.weight ?? '',
    eye_color: p.eye_color ?? '',
    foot_size: p.foot_size ?? '',
    languages: Array.isArray(p.languages) ? p.languages : [],
    accepts_travel: p.accepts_travel ?? false,
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
    onlyfans: parseOnlyfansUsername(p.onlyfans ?? ''),
    piercings: p.piercings ?? false,
    tattoos: p.tattoos ?? false,
    smoker: p.smoker ?? '',
    display_mode: p.display_mode ?? 'default',
    bio_theme: p.bio_theme ?? 'dark',
    bio_button_color: p.bio_button_color ?? '',
    bio_links: Array.isArray(p.bio_links) ? p.bio_links.map((l) => ({ label: l?.label ?? '', url: l?.url ?? '', type: (l as { type?: string })?.type ?? 'custom', enabled: (l as { enabled?: boolean })?.enabled !== false })) : [],
    bio_avatar_index: p.bio_avatar_index != null ? p.bio_avatar_index : 0,
    bio_show_full_profile: p.bio_show_full_profile !== false,
    price_rows: profilePriceRowsFromProfile(p),
    location_lat: p.location_lat != null ? String(p.location_lat) : '',
    location_lng: p.location_lng != null ? String(p.location_lng) : '',
    location_approximate: p.location_approximate ?? true,
  }
}

type TabId = 'dados' | 'midia' | 'stats' | 'bio'

type ProfileStats = {
  analyticsLevel?: 'views' | 'basic' | 'full'
  totals: {
    views: number
    clicks: number
    favorites: number
    stories: number
    storyViews: number
  }
  periods: {
    viewsLast7Days: number
    viewsLast30Days: number
    clicksLast7Days: number
    clicksLast30Days: number
  }
  clickCountsByType: Record<string, number>
  daily: Array<{ date: string; views: number; clicks: number }>
  peakHour: { hour: number; events: number } | null
  insights?: {
    uniqueVisitors: number
    ctr: number
    messageRate: number
    messagesLast30Days: number
    viewsChangeLast7Days: number | null
    clicksChangeLast7Days: number | null
  }
}

export default function DashboardPerfilForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
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
  const [authHydrated, setAuthHydrated] = useState(false)
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null)
  const [profileReloadKey, setProfileReloadKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoUploadProgress, setPhotoUploadProgress] = useState({ current: 0, total: 0 })
  const [photoDeleting, setPhotoDeleting] = useState<string | null>(null)
  const [draggedPhoto, setDraggedPhoto] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoDeleting, setVideoDeleting] = useState<string | null>(null)
  const [audioUploading, setAudioUploading] = useState(false)
  const [audioDeleting, setAudioDeleting] = useState(false)
  const [schedule, setSchedule] = useState<Schedule[]>([])
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    const persistence = useAuthStore.persist
    if (persistence.hasHydrated()) setAuthHydrated(true)
    return persistence.onFinishHydration(() => setAuthHydrated(true))
  }, [])

  useEffect(() => {
    let cancelled = false
    const access = resolveProtectedAccess({ hydrated: authHydrated, authenticated: isAuthenticated })
    if (access === 'loading') return
    if (access === 'login') {
      router.replace(`/login?callbackUrl=${encodeURIComponent('/dashboard/perfil')}`)
      setLoading(false)
      return
    }
    setLoading(true)
    setProfileLoadError(null)
    fetch('/api/profiles/me', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar o perfil')
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setProfile(data)
        setForm(profileToForm(data))
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(undefined)
          setProfileLoadError('Não foi possível carregar os dados do seu perfil agora.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [router, authHydrated, isAuthenticated, profileReloadKey])

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

  useEffect(() => {
    if (!profile || activeTab !== 'stats') return
    let cancelled = false
    setStatsLoading(true)
    fetch('/api/profiles/me/stats', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch(() => {
        if (!cancelled) setStats(null)
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false)
      })
    return () => { cancelled = true }
  }, [profile, activeTab])

  const cities = getCitiesByState(form.state)
  const cityNeighborhoodOptions = getNeighborhoodsByCity(form.city)
  const selectedNeighborhoods = new Set(form.neighborhoods)
  const mapLat = parseCoordinate(form.location_lat, -90, 90)
  const mapLng = parseCoordinate(form.location_lng, -180, 180)
  const photoCount = profile?.photos?.length || 0
  const missingPhotoCount = getMissingProfilePhotos(photoCount)
  const bioLength = form.bio.trim().length
  const persistedBio = profile?.bio ?? ''
  const missingPersistedBioCharacters = getMissingProfileBioCharacters(persistedBio)
  const hasPersistedPublishableBio = hasPublishableProfileBio(persistedBio)
  const hasUnsavedBioChanges = Boolean(profile) && form.bio.trim() !== persistedBio.trim()
  const hasPublicContact = hasPublicProfileContact(form)
  const hasPersistedPublicContact = hasPublicProfileContact(profile ?? {})
  const hasUnsavedContactChanges = profile
    ? hasUnsavedProfileContactChanges(profile, form)
    : false
  const canPublish =
    canPublishProfile(photoCount) &&
    hasPersistedPublishableBio &&
    hasPersistedPublicContact &&
    !hasUnsavedBioChanges &&
    !hasUnsavedContactChanges
  const publicationPendingMessages = [
    missingPhotoCount > 0
      ? `${missingPhotoCount} ${missingPhotoCount === 1 ? 'foto' : 'fotos'}`
      : null,
    missingPersistedBioCharacters > 0
      ? `${missingPersistedBioCharacters} ${missingPersistedBioCharacters === 1 ? 'caractere na bio salva' : 'caracteres na bio salva'}`
      : null,
    hasUnsavedBioChanges ? 'salvar as alterações da bio' : null,
    !hasPersistedPublicContact ? 'um contato público salvo' : null,
    hasUnsavedContactChanges ? 'salvar as alterações de contato' : null,
  ].filter((message): message is string => Boolean(message))
  const canRemovePhoto = profile
    ? canRemoveProfilePhoto(profile.status, photoCount)
    : false

  const toggleNeighborhood = (neighborhood: string, checked: boolean) => {
    setForm((f) => ({
      ...f,
      neighborhoods: checked
        ? Array.from(new Set([...f.neighborhoods, neighborhood]))
        : f.neighborhoods.filter((item) => item !== neighborhood),
    }))
  }

  const setTab = (tab: TabId) => {
    setActiveTab(tab)
    router.replace(`/dashboard/perfil?tab=${tab}`, { scroll: false })
  }

  function extractMediaId(urlOrId: string): string {
    if (!urlOrId) return ''
    const value = decodeURIComponent(urlOrId)
    const urlMatch = value.match(/\/([a-z0-9]{15})\/[^/]+(?:\?.*)?$/i)
    if (urlMatch) return urlMatch[1]
    return /^[a-z0-9]{15}$/i.test(value) ? value : ''
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0 || !profile) return
    setPhotoUploading(true)
    setPhotoUploadProgress({ current: 0, total: files.length })
    setError(null)
    try {
      for (const [index, file] of files.entries()) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(`/api/profiles/${profile.id}/photos`, {
          method: 'POST',
          credentials: 'include',
          body: fd,
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(
            `Foto ${index + 1}: ${(data as { error?: string }).error || 'não foi possível enviar'}`
          )
        }
        const uploadedProfile = (await res.json().catch(() => null)) as Profile | null
        if (uploadedProfile?.id) setProfile(uploadedProfile)
        setPhotoUploadProgress({ current: index + 1, total: files.length })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar foto')
    } finally {
      setPhotoUploading(false)
      setPhotoUploadProgress({ current: 0, total: 0 })
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

  const handlePhotoReorder = async (sourceUrl: string, targetUrl: string) => {
    if (!profile || sourceUrl === targetUrl) return
    const previousPhotos = profile.photos || []
    const nextPhotos = [...previousPhotos]
    const sourceIndex = nextPhotos.indexOf(sourceUrl)
    const targetIndex = nextPhotos.indexOf(targetUrl)
    if (sourceIndex < 0 || targetIndex < 0) return
    nextPhotos.splice(sourceIndex, 1)
    nextPhotos.splice(targetIndex, 0, sourceUrl)
    setProfile((current) => current ? { ...current, photos: nextPhotos } : current)
    setError(null)
    try {
      const res = await fetch(`/api/profiles/${profile.id}/photos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ photos: nextPhotos.map(extractMediaId) }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.id) throw new Error(data?.error || 'Não foi possível salvar a ordem das fotos.')
      setProfile(data as Profile)
    } catch (err) {
      setProfile((current) => current ? { ...current, photos: previousPhotos } : current)
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a ordem das fotos.')
    } finally {
      setDraggedPhoto(null)
    }
  }

  const handlePublish = async () => {
    if (!profile || profile.status !== 'inactive' || !canPublish) return
    setPublishing(true)
    setError(null)
    try {
      const res = await fetch(`/api/profiles/${profile.id}/publish`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || 'Erro ao publicar perfil')
      }
      setProfile((current) => current ? { ...current, status: 'active' } : current)
      toast.success('Perfil publicado com sucesso.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao publicar perfil')
    } finally {
      setPublishing(false)
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
      const draftValidationError = getProfileDraftValidationError(form)
      if (draftValidationError) {
        setError(draftValidationError)
        setSaving(false)
        return
      }

      const contactsAreValid = profile
        ? canSaveProfileContacts(profile.status, form)
        : true
      if (!contactsAreValid) {
        setError('Preencha e torne público pelo menos um contato.')
        setSaving(false)
        return
      }

      const parsePrice = (s: string) => {
        const t = s.trim().replace(/\s/g, '').replace(',', '.')
        if (!t) return NaN
        return Number(t)
      }
      const halfRow = form.price_rows.some((r) => {
        const d = r.description.trim()
        const hasP = r.price.trim().length > 0
        return (d && !hasP) || (!d && hasP)
      })
      if (halfRow) {
        setError('Em cada linha de preço, preencha o nome e o valor em R$, ou deixe a linha totalmente vazia.')
        setSaving(false)
        return
      }
      const badPrice = form.price_rows.some((r) => {
        if (!r.description.trim()) return false
        const pr = parsePrice(r.price)
        return !Number.isFinite(pr) || pr < 0
      })
      if (badPrice) {
        setError('Verifique os valores em R$ (use números, por exemplo 150 ou 199,90).')
        setSaving(false)
        return
      }
      const pricesPayload = form.price_rows
        .map((r) => ({
          description: r.description.trim(),
          price: parsePrice(r.price),
        }))
        .filter((r) => r.description && Number.isFinite(r.price) && r.price >= 0)

      const toTrimmed = (v: unknown) => String(v ?? '').trim()

      const body = {
        name: toTrimmed(form.name),
        age: Number(form.age) || 18,
        city: toTrimmed(form.city),
        state: toTrimmed(form.state),
        bio_title: toTrimmed(form.bio_title) || null,
        bio: toTrimmed(form.bio),
        category: form.category,
        gender: form.gender,
        ethnicity: toTrimmed(form.ethnicity) || null,
        whatsapp: toTrimmed(form.whatsapp) || null,
        telegram: toTrimmed(form.telegram) || null,
        phone: toTrimmed(form.phone) || null,
        show_whatsapp: form.show_whatsapp,
        show_telegram: form.show_telegram,
        show_phone: form.show_phone,
        instagram: parseInstagramUsername(form.instagram) || null,
        twitter: parseTwitterUsername(form.twitter) || null,
        privacy: parsePrivacyUsername(form.privacy) || null,
        slug: toTrimmed(form.slug) || null,
        short_description: toTrimmed(form.short_description) || null,
        hair_color: String(form.hair_color ?? '').trim() || null,
        body_type: String(form.body_type ?? '').trim() || null,
        height: toTrimmed(form.height) ? Number(form.height) : null,
        weight: toTrimmed(form.weight) || null,
        eye_color: toTrimmed(form.eye_color) || null,
        foot_size: toTrimmed(form.foot_size) || null,
        languages: form.languages.length ? form.languages : [],
        accepts_travel: form.accepts_travel,
        breast_type: toTrimmed(form.breast_type) || null,
        pubis_type: toTrimmed(form.pubis_type) || null,
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
        onlyfans: parseOnlyfansUsername(form.onlyfans) || null,
        piercings: form.piercings,
        tattoos: form.tattoos,
        smoker: toTrimmed(form.smoker) || null,
        display_mode: form.display_mode || null,
        bio_theme: form.display_mode === 'link_bio' ? (form.bio_theme || 'dark') : null,
        bio_button_color: form.display_mode === 'link_bio' && form.bio_button_color ? form.bio_button_color : null,
        bio_links: form.display_mode === 'link_bio' && form.bio_links.length > 0 ? form.bio_links.filter((l) => l.enabled !== false && l.label.trim() && l.url.trim()).map((l) => ({ label: l.label.trim(), url: l.url.trim() })) : null,
        bio_avatar_index: form.display_mode === 'link_bio' ? form.bio_avatar_index : null,
        bio_show_full_profile: form.display_mode === 'link_bio' ? form.bio_show_full_profile : null,
        prices: pricesPayload.length > 0 ? pricesPayload : null,
        price_30min: null,
        price_1h: null,
        price_2h: null,
        price_overnight: null,
        location_lat: mapLat,
        location_lng: mapLng,
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
        const created = (await res.json()) as Profile
        setProfile(created)
        setForm(profileToForm(created))
        setTab('midia')
        toast.success('Perfil salvo como rascunho. Adicione pelo menos 3 fotos para publicar.')
        return
      }
      const refreshed = await fetch('/api/profiles/me', { credentials: 'include', cache: 'no-store' })
      const updated = refreshed.ok ? await refreshed.json().catch(() => null) : null
      if (!updated?.id) throw new Error('O perfil foi salvo, mas não foi possível recarregá-lo. Atualize a página antes de sair.')
      setProfile(updated)
      setForm(profileToForm(updated))
      toast.success('Alterações salvas com sucesso.')
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

  if (profileLoadError) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-slate-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao dashboard
        </Link>
        <div role="alert" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-300" />
          <p className="text-lg font-semibold text-white">O editor não carregou</p>
          <p className="mt-2 text-sm text-slate-300">{profileLoadError} Verifique sua conexão e tente novamente.</p>
          <button
            type="button"
            onClick={() => setProfileReloadKey((key) => key + 1)}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 font-semibold text-white transition hover:bg-primary-500"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const completionItems = [
    { label: 'Nome e localização', done: Boolean(form.name.trim() && form.city && form.state) },
    { label: 'Descrição mínima', done: form.bio.trim().length >= MIN_PROFILE_BIO_LENGTH },
    { label: 'Pelo menos 3 fotos', done: (profile?.photos?.length || 0) >= MIN_PROFILE_PHOTOS },
    { label: 'Contato público', done: Boolean(form.whatsapp || form.telegram || form.phone) },
    { label: 'Preços informados', done: form.price_rows.some((row) => row.price.trim().length > 0) },
  ]
  const completionPercent = Math.round((completionItems.filter((item) => item.done).length / completionItems.length) * 100)

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
        <section aria-labelledby="profile-completion-title" className="mb-6 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 id="profile-completion-title" className="font-semibold text-white">Completude do perfil</h2>
              <p className="text-sm text-slate-400">Complete estes itens para publicar e converter melhor.</p>
            </div>
            <span className="text-lg font-bold text-primary-400">{completionPercent}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-700" role="progressbar" aria-valuenow={completionPercent} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${completionPercent}%` }} />
          </div>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {completionItems.map((item) => <li key={item.label} className={item.done ? 'text-emerald-300' : 'text-slate-400'}><CheckCircle2 className="mr-2 inline h-4 w-4" />{item.label}</li>)}
          </ul>
        </section>
      )}

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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Estado *</label>
            <select
              required
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
            <label className="mb-1 block text-sm font-medium text-slate-300">Cidade *</label>
            <select
              required
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

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Etnia</label>
          <select
            value={form.ethnicity.trim()}
            onChange={(e) => setForm((f) => ({ ...f, ethnicity: e.target.value }))}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">— Selecione</option>
            {ETHNICITIES.map((eth) => (
              <option key={eth} value={eth}>{eth}</option>
            ))}
            {form.ethnicity.trim() && !ETHNICITIES.includes(form.ethnicity.trim()) && (
              <option value={form.ethnicity.trim()}>{form.ethnicity.trim()} (valor atual)</option>
            )}
          </select>
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
            <label className="mb-1 block text-sm font-medium text-slate-300">Cor dos olhos</label>
            <select value={form.eye_color} onChange={(e) => setForm((f) => ({ ...f, eye_color: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="">—</option>
              {['Castanhos', 'Pretos', 'Azuis', 'Verdes', 'Mel', 'Cinzas'].map((color) => <option key={color} value={color}>{color}</option>)}
            </select>
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
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Tamanho dos pés</label>
            <select value={form.foot_size} onChange={(e) => setForm((f) => ({ ...f, foot_size: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="">—</option>
              {Array.from({ length: 13 }, (_, index) => String(index + 34)).map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800/40 p-4">
          <p className="mb-2 text-sm font-medium text-slate-300">Idiomas que fala</p>
          <div className="flex flex-wrap gap-3">
            {['Português', 'Inglês', 'Espanhol', 'Francês', 'Italiano', 'Alemão'].map((language) => (
              <label key={language} className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={form.languages.includes(language)} onChange={(e) => setForm((f) => ({ ...f, languages: e.target.checked ? [...f.languages, language] : f.languages.filter((item) => item !== language) }))} className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500" />
                {language}
              </label>
            ))}
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
          <label className="flex cursor-pointer items-center gap-2 self-end pb-2">
            <input type="checkbox" checked={form.accepts_travel} onChange={(e) => setForm((f) => ({ ...f, accepts_travel: e.target.checked }))} className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-slate-300">Aceita viajar</span>
          </label>
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
                  <label key={loc === 'Hotel' ? 'Hotel/Motel' : loc} className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={form.service_locations.includes(loc)} onChange={(e) => setForm((f) => ({ ...f, service_locations: e.target.checked ? [...f.service_locations, loc] : f.service_locations.filter((x) => x !== loc) }))} className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm text-slate-300">{loc === 'Hotel' ? 'Hotel/Motel' : loc}</span>
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
              {cityNeighborhoodOptions.length > 0 ? (
                <div className="grid max-h-64 gap-2 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900/30 p-3 sm:grid-cols-2 md:grid-cols-3">
                  {cityNeighborhoodOptions.map((neighborhood) => (
                    <label key={neighborhood} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedNeighborhoods.has(neighborhood)}
                        onChange={(e) => toggleNeighborhood(neighborhood, e.target.checked)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-slate-300">{neighborhood}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-500">
                  Selecione uma cidade com lista de bairros disponível ou adicione regiões manualmente abaixo.
                </p>
              )}
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-slate-500">Adicionar bairros/regiões extras</label>
                <input
                  type="text"
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ',') return
                    e.preventDefault()
                    const value = e.currentTarget.value.trim().replace(/,$/, '')
                    if (!value) return
                    toggleNeighborhood(value, true)
                    e.currentTarget.value = ''
                  }}
                  onBlur={(e) => {
                    const value = e.currentTarget.value.trim().replace(/,$/, '')
                    if (!value) return
                    toggleNeighborhood(value, true)
                    e.currentTarget.value = ''
                  }}
                  placeholder="Digite e pressione Enter. Ex: Zona Sul"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              {form.neighborhoods.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.neighborhoods.map((neighborhood) => (
                    <button
                      key={neighborhood}
                      type="button"
                      onClick={() => toggleNeighborhood(neighborhood, false)}
                      className="rounded-full border border-primary-500/40 bg-primary-500/10 px-3 py-1 text-xs text-primary-100 hover:bg-primary-500/20"
                    >
                      {neighborhood} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-slate-700 pt-4">
              <label className="mb-3 flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={form.location_approximate} onChange={(e) => setForm((f) => ({ ...f, location_approximate: e.target.checked }))} className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-slate-300">Usar localização aproximada por segurança</span>
              </label>
              <DashboardLocationMapPicker
                lat={mapLat}
                lng={mapLng}
                city={form.city}
                state={form.state}
                neighborhoods={form.neighborhoods}
                approximate={form.location_approximate}
                onChange={({ lat, lng }) => setForm((f) => ({
                  ...f,
                  location_lat: lat.toFixed(6),
                  location_lng: lng.toFixed(6),
                }))}
                onClear={() => setForm((f) => ({ ...f, location_lat: '', location_lng: '' }))}
              />
            </div>
          </>
        )}

        <div className="border-t border-slate-700 pt-4">
          <h3 className="mb-3 font-medium text-slate-300">Horários de atendimento</h3>
          <p className="mb-4 text-sm text-slate-400">
            Informe quando você costuma atender. Você poderá alterar estes horários a qualquer momento.
          </p>
          <ScheduleManager schedule={schedule} onChange={setSchedule} />
        </div>

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
          <label className="mb-1 block text-sm font-medium text-slate-300">Título da bio</label>
          <input
            type="text"
            value={form.bio_title}
            onChange={(e) => setForm((f) => ({ ...f, bio_title: e.target.value }))}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Bio</label>
          <textarea
            rows={4}
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <p
            className={`mt-1 text-xs ${bioLength >= MIN_PROFILE_BIO_LENGTH ? 'text-slate-500' : 'text-amber-400'}`}
            aria-live="polite"
          >
            {bioLength}/{MIN_PROFILE_BIO_LENGTH} caracteres.
            {bioLength < MIN_PROFILE_BIO_LENGTH
              ? ` Faltam ${MIN_PROFILE_BIO_LENGTH - bioLength} para publicar; o rascunho pode ser salvo agora.`
              : ' Bio pronta para publicação.'}
            {hasUnsavedBioChanges ? ' Salve as alterações antes de publicar.' : ''}
          </p>
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
          <h3 className="mb-1 font-medium text-slate-300">Contato</h3>
          <p
            className={`mb-3 text-xs ${hasPublicContact ? 'text-slate-500' : 'text-amber-400'}`}
            aria-live="polite"
          >
            Telefone, WhatsApp ou Telegram público é obrigatório para publicar. O rascunho pode ser salvo antes.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500">WhatsApp</label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={form.show_whatsapp}
                  onChange={(e) => setForm((f) => ({ ...f, show_whatsapp: e.target.checked }))}
                  className="rounded border-slate-600 bg-slate-800 text-primary-600"
                />
                Mostrar no perfil público
              </label>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Telegram</label>
              <input
                type="text"
                value={form.telegram}
                onChange={(e) => setForm((f) => ({ ...f, telegram: e.target.value }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={form.show_telegram}
                  onChange={(e) => setForm((f) => ({ ...f, show_telegram: e.target.checked }))}
                  className="rounded border-slate-600 bg-slate-800 text-primary-600"
                />
                Mostrar no perfil público
              </label>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Telefone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={form.show_phone}
                  onChange={(e) => setForm((f) => ({ ...f, show_phone: e.target.checked }))}
                  className="rounded border-slate-600 bg-slate-800 text-primary-600"
                />
                Mostrar no perfil público
              </label>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4">
          <h3 className="mb-1 font-medium text-slate-300">Redes sociais</h3>
          <p className="mb-3 text-xs text-slate-500">
            Links públicos no seu perfil e no link na bio. Pode colar URL completa; guardamos apenas o username.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Instagram</label>
              <p className="mb-1.5 text-[11px] leading-snug text-slate-600">
                Só o username. O botão no perfil abre instagram.com/…
              </p>
              <div className="flex min-w-0 overflow-hidden rounded-lg border border-slate-600 bg-slate-800 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
                <span className="shrink-0 select-none border-r border-slate-600 bg-slate-900/80 px-2 py-2 text-xs text-slate-500 sm:text-sm">
                  instagram.com/
                </span>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                  onBlur={() =>
                    setForm((f) => ({ ...f, instagram: parseInstagramUsername(f.instagram) }))
                  }
                  placeholder="utilizador"
                  autoComplete="off"
                  inputMode="text"
                  className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">X (Twitter)</label>
              <p className="mb-1.5 text-[11px] leading-snug text-slate-600">
                Só o username. O botão no perfil abre x.com/…
              </p>
              <div className="flex min-w-0 overflow-hidden rounded-lg border border-slate-600 bg-slate-800 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
                <span className="shrink-0 select-none border-r border-slate-600 bg-slate-900/80 px-2 py-2 text-xs text-slate-500 sm:text-sm">
                  x.com/
                </span>
                <input
                  type="text"
                  value={form.twitter}
                  onChange={(e) => setForm((f) => ({ ...f, twitter: e.target.value }))}
                  onBlur={() =>
                    setForm((f) => ({ ...f, twitter: parseTwitterUsername(f.twitter) }))
                  }
                  placeholder="utilizador"
                  autoComplete="off"
                  inputMode="text"
                  className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Privacy</label>
              <p className="mb-1.5 text-[11px] leading-snug text-slate-600">
                Só o nome do perfil no Privacy (Brasil). O link público será privacy.com.br/profile/…
              </p>
              <div className="flex min-w-0 overflow-hidden rounded-lg border border-slate-600 bg-slate-800 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
                <span className="shrink-0 select-none border-r border-slate-600 bg-slate-900/80 px-2 py-2 text-xs text-slate-500 sm:text-sm">
                  privacy.com.br/profile/
                </span>
                <input
                  type="text"
                  value={form.privacy}
                  onChange={(e) => setForm((f) => ({ ...f, privacy: e.target.value }))}
                  onBlur={() =>
                    setForm((f) => ({ ...f, privacy: parsePrivacyUsername(f.privacy) }))
                  }
                  placeholder="utilizador"
                  autoComplete="off"
                  inputMode="text"
                  className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">OnlyFans</label>
              <p className="mb-1.5 text-[11px] leading-snug text-slate-600">
                Só o nome de utilizador. O botão no perfil abre onlyfans.com/…
              </p>
              <div className="flex min-w-0 overflow-hidden rounded-lg border border-slate-600 bg-slate-800 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
                <span className="shrink-0 select-none border-r border-slate-600 bg-slate-900/80 px-2 py-2 text-xs text-slate-500 sm:text-sm">
                  onlyfans.com/
                </span>
                <input
                  type="text"
                  value={form.onlyfans}
                  onChange={(e) => setForm((f) => ({ ...f, onlyfans: e.target.value }))}
                  onBlur={() =>
                    setForm((f) => ({ ...f, onlyfans: parseOnlyfansUsername(f.onlyfans) }))
                  }
                  placeholder="utilizador"
                  autoComplete="off"
                  inputMode="text"
                  className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="font-medium text-slate-300">Preços (R$)</h3>
            <p className="max-w-md text-xs leading-relaxed text-slate-500 sm:text-right">
              Em cada linha escreva <span className="text-slate-400">o que é a tarifa</span> e o{' '}
              <span className="text-slate-400">valor</span>. Ex.: «1 hora» + 350 · «Pernoite» + 1200 · «Videochamada 15
              min» + 80 · «Pacote dia inteiro» + 2500
            </p>
          </div>
          <div className="space-y-3">
            {form.price_rows.map((row, idx) => (
              <div key={idx} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-xs text-slate-500">O que inclui / nome da tarifa</label>
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) =>
                      setForm((f) => {
                        const price_rows = [...f.price_rows]
                        price_rows[idx] = { ...price_rows[idx], description: e.target.value }
                        return { ...f, price_rows }
                      })
                    }
                    placeholder="Ex.: 30 minutos, Diária, Só massagem…"
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div className="w-full sm:w-36">
                  <label className="mb-1 block text-xs text-slate-500">Valor (R$)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={row.price}
                    onChange={(e) =>
                      setForm((f) => {
                        const price_rows = [...f.price_rows]
                        price_rows[idx] = { ...price_rows[idx], price: e.target.value }
                        return { ...f, price_rows }
                      })
                    }
                    placeholder="0 ou 150"
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                {form.price_rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        price_rows: f.price_rows.filter((_, i) => i !== idx),
                      }))
                    }
                    className="flex shrink-0 items-center justify-center rounded-lg border border-slate-600 p-2 text-slate-400 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300 sm:mb-0.5"
                    aria-label="Remover linha de preço"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {form.price_rows.length < 15 && (
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    price_rows: [...f.price_rows, { description: '', price: '' }],
                  }))
                }
                className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-600 px-3 py-2 text-sm text-slate-400 transition hover:border-primary-500/50 hover:text-primary-300"
              >
                <Plus className="h-4 w-4" />
                Adicionar outra tarifa
              </button>
            )}
          </div>
        </div>
          </>
        )}

        {profile && activeTab === 'midia' && (
          <>
          <div className="border-t border-slate-700 pt-4">
            <h3 className="mb-3 font-medium text-slate-300">Fotos do perfil</h3>
            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">
                  {photoCount}/{MIN_PROFILE_PHOTOS} fotos obrigatórias
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {profile.status === 'active'
                    ? 'Perfil publicado. Mantenha pelo menos 3 fotos, bio completa e um contato público.'
                    : publicationPendingMessages.length > 0
                      ? `Pendências para publicar: ${publicationPendingMessages.join(', ')}.`
                      : 'Fotos, bio e contato concluídos. O perfil já pode ser publicado.'}
                </p>
              </div>
              {profile.status === 'inactive' && (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={!canPublish || publishing}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  {publishing ? 'Publicando...' : 'Publicar perfil'}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {(profile.photos || []).map((url) => {
                const pid = extractMediaId(url)
                const isDeleting = photoDeleting === pid
                const isPrimary = profile.photos?.[0] === url
                return (
                  <div
                    key={url}
                    draggable={!photoUploading && !photoDeleting}
                    onDragStart={() => setDraggedPhoto(url)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => draggedPhoto && handlePhotoReorder(draggedPhoto, url)}
                    onDragEnd={() => setDraggedPhoto(null)}
                    className={`group relative aspect-[3/4] overflow-hidden rounded-lg border bg-slate-700 ${draggedPhoto === url ? 'border-primary-400 opacity-60' : 'border-slate-600'}`}
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {isPrimary ? (
                      <span className="absolute bottom-2 left-2 rounded-md bg-primary-600/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                        Principal
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePhotoReorder(url, profile.photos?.[0] || url)}
                        className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-primary-600"
                      >
                        Usar como principal
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handlePhotoDelete(url)}
                      disabled={isDeleting || !canRemovePhoto}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-red-400 transition hover:bg-red-600/80 disabled:opacity-50"
                      aria-label="Remover foto"
                      title={!canRemovePhoto ? 'Adicione outra foto antes de remover uma das três fotos obrigatórias.' : undefined}
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
                  multiple
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
                  {photoUploading
                    ? `Enviando ${photoUploadProgress.current}/${photoUploadProgress.total}`
                    : 'Adicionar fotos'}
                </span>
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Arraste as fotos para ordenar; a primeira será a principal. Selecione uma ou várias fotos. JPG, PNG ou WebP. Máximo 5 MB por foto.
            </p>
            {profile.status === 'active' && !canRemovePhoto && (
              <p className="mt-2 text-xs text-amber-300">
                Para trocar uma das três fotos obrigatórias, adicione a nova foto antes de remover a antiga.
              </p>
            )}
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
          const analyticsLevel = stats?.analyticsLevel ?? ((profile.plan_slug ?? profile.plan ?? 'gratis').toLowerCase() === 'ouro' ? 'full' : (profile.plan_slug ?? profile.plan ?? 'gratis').toLowerCase() === 'gratis' ? 'views' : 'basic')
          const hasFullAnalyticsAccess = analyticsLevel === 'full'
          const hasBasicAnalyticsAccess = analyticsLevel === 'basic' || hasFullAnalyticsAccess
          const views = stats?.totals.views ?? profile.views ?? 0
          const clicks = stats?.totals.clicks ?? profile.clicks ?? 0
          const favorites = stats?.totals.favorites ?? profile.favorites_count ?? 0
          const ctr = views > 0 ? Math.round((clicks / views) * 1000) / 10 : 0
          const favRate = views > 0 ? Math.round((favorites / views) * 1000) / 10 : 0
          const maxDaily = Math.max(1, ...(stats?.daily ?? []).map((row) => Math.max(row.views, row.clicks)))
          const topClicks = Object.entries(stats?.clickCountsByType ?? {})
            .filter(([, value]) => value > 0)
            .sort((a, b) => b[1] - a[1])
          const clickLabels: Record<string, string> = {
            whatsapp: 'WhatsApp',
            telegram: 'Telegram',
            phone: 'Telefone',
            message: 'Mensagem',
            instagram: 'Instagram',
            twitter: 'X / Twitter',
            privacy: 'Privacy',
            onlyfans: 'OnlyFans',
          }

          const resumoBasico = (
            <div className="mb-6 rounded-xl border border-slate-600 bg-slate-800/50 p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="mb-1 font-medium text-white">Resumo do seu anúncio</h3>
                  <p className="text-sm text-slate-500">
                    {analyticsLevel === 'views' ? 'O plano Grátis mostra as visualizações totais do perfil.' : 'Resumo simples com dados reais de visualizações, cliques e favoritos.'}
                  </p>
                </div>
                {statsLoading && <Loader2 className="h-5 w-5 animate-spin text-slate-500" />}
              </div>
              <div className={`grid gap-3 ${hasBasicAnalyticsAccess ? 'sm:grid-cols-3' : 'sm:grid-cols-1'}`}>
                <div className="rounded-lg border border-slate-700/80 bg-slate-900/40 px-3 py-3 text-center">
                  <p className="text-2xl font-bold text-white">{views}</p>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Visualizações</p>
                </div>
                {hasBasicAnalyticsAccess && <div className="rounded-lg border border-slate-700/80 bg-slate-900/40 px-3 py-3 text-center">
                  <p className="text-2xl font-bold text-white">{clicks}</p>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Cliques</p>
                </div>}
                {hasBasicAnalyticsAccess && <div className="rounded-lg border border-slate-700/80 bg-slate-900/40 px-3 py-3 text-center">
                  <p className="text-2xl font-bold text-white">{favorites}</p>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Favoritos</p>
                </div>}
              </div>
              {hasBasicAnalyticsAccess && <p className="mt-3 text-center text-sm text-slate-500">
                Favoritos / visualizações: <strong className="text-slate-400">{favRate}%</strong>.
              </p>}
            </div>
          )

          const advancedContent = (
            <div className="space-y-6 border-t border-slate-700 pt-4">
              <h3 className="font-medium text-slate-300">Estatísticas avançadas</h3>

              <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4 text-center">
                <Target className="mx-auto h-8 w-8 text-primary-500" />
                <p className="mt-2 text-2xl font-bold text-white">
                  {views > 0 ? `${ctr}% de CTR` : 'Sem dados suficientes'}
                </p>
                <p className="text-sm text-slate-400">
                  {stats ? `${stats.periods.viewsLast30Days} visualizações e ${stats.periods.clicksLast30Days} cliques nos últimos 30 dias.` : 'Carregando dados reais do período.'}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Funil de conversão</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Visualizações</span>
                      <span className="font-medium text-white">{views} pessoas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Cliques</span>
                      <span className="font-medium text-white">{clicks} ações ({views > 0 ? Math.round((clicks / views) * 100) : 0}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Favoritos</span>
                      <span className="font-medium text-white">{favorites} salvos ({favRate}%)</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Cliques por canal</h4>
                  <div className="space-y-3">
                    {topClicks.length > 0 ? topClicks.map(([type, value]) => (
                      <div key={type}>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300">{clickLabels[type] ?? type}</span>
                          <span className="text-white">{value}</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-slate-700">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${clicks > 0 ? Math.min(100, (value / clicks) * 100) : 0}%` }} />
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-slate-500">Ainda não há cliques registrados por canal.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  ['Visitantes únicos', stats?.insights?.uniqueVisitors ?? 0, 'nos últimos 30 dias'],
                  ['Mensagens recebidas', stats?.insights?.messagesLast30Days ?? 0, 'nos últimos 30 dias'],
                  ['Conversão em mensagem', stats?.insights?.messageRate == null ? '—' : `${stats.insights.messageRate}%`, 'mensagens por clique'],
                  ['Variação de visitas', stats?.insights?.viewsChangeLast7Days == null ? '—' : `${stats.insights.viewsChangeLast7Days > 0 ? '+' : ''}${stats.insights.viewsChangeLast7Days}%`, 'últimos 7 dias vs. anteriores'],
                  ['Variação de cliques', stats?.insights?.clicksChangeLast7Days == null ? '—' : `${stats.insights.clicksChangeLast7Days > 0 ? '+' : ''}${stats.insights.clicksChangeLast7Days}%`, 'últimos 7 dias vs. anteriores'],
                ].map(([label, value, description]) => (
                  <div key={label as string} className="rounded-xl border border-slate-600 bg-slate-800/50 p-4 text-center">
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="mt-1 text-xs text-slate-500">{description}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  <TrendingUp className="h-4 w-4" />
                  Tendência real dos últimos 7 dias
                </h4>
                <div className="flex h-28 items-end justify-between gap-1 rounded-lg bg-slate-800/50 px-2 py-2">
                  {(stats?.daily ?? []).map((row) => (
                    <div key={row.date} className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex h-20 w-full items-end justify-center gap-0.5">
                        <div className="w-1/2 rounded-t bg-primary-500" style={{ height: `${Math.max(6, (row.views / maxDaily) * 100)}%` }} title={`${row.views} visualizações`} />
                        <div className="w-1/2 rounded-t bg-emerald-500" style={{ height: `${Math.max(6, (row.clicks / maxDaily) * 100)}%` }} title={`${row.clicks} cliques`} />
                      </div>
                      <span className="text-xs text-slate-500">{row.date.slice(5).replace('-', '/')}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">Azul = visualizações. Verde = cliques.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-400">
                    <Clock className="h-4 w-4" />
                    Horário de pico
                  </h4>
                  <p className="text-2xl font-bold text-white">
                    {stats?.peakHour ? `${String(stats.peakHour.hour).padStart(2, '0')}:00` : '—'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {stats?.peakHour ? `${stats.peakHour.events} eventos registrados nesse horário nos últimos 30 dias.` : 'Dados insuficientes para calcular horário.'}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4">
                  <h4 className="mb-2 text-sm font-semibold text-slate-400">Performance das Cereja Stories</h4>
                  <p className="text-2xl font-bold text-white">{stats?.totals.storyViews ?? 0} views acumuladas</p>
                  <p className="mt-1 text-xs text-slate-500">{stats?.totals.stories ?? 0} Cereja Stories publicadas no histórico deste perfil.</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-400">
                  <Lightbulb className="h-4 w-4" />
                  Dicas de performance
                </h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex gap-2">
                    <span className="text-emerald-500">✓</span>
                    Mantenha fotos e Cereja Stories atualizadas para aumentar a chance de cliques.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500">✓</span>
                    Compare os canais com mais cliques e deixe visíveis os contatos que convertem melhor.
                  </li>
                </ul>
              </div>
            </div>
          )

          return (
            <div>
              {resumoBasico}
              <div className="relative">
                <div className={hasFullAnalyticsAccess ? '' : 'select-none blur-md pointer-events-none'}>
                  {advancedContent}
                </div>
                {!hasFullAnalyticsAccess && (
                  <div className="absolute inset-0 flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-slate-600 bg-slate-900/90 p-4 backdrop-blur-sm">
                    <p className="text-center text-lg font-medium text-white">Estatísticas avançadas</p>
                    <p className="mt-1 max-w-sm text-center text-sm text-slate-300">
                      Funil detalhado, tendência real, canais de clique e horário de pico estão incluídos nos
                      plano <strong className="text-primary-400">Ouro</strong>.
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
                        const raw = (form.slug || 'seu-slug').trim()
                        const slugOnly = raw.startsWith('@') ? raw.slice(1) : raw
                        const url = `${base}/@${slugOnly}`
                        navigator.clipboard.writeText(url).then(() => toast.success('Link copiado!'))
                      }}
                      className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                  <input
                    type="checkbox"
                    checked={form.bio_show_full_profile}
                    onChange={(e) => setForm((f) => ({ ...f, bio_show_full_profile: e.target.checked }))}
                    className="mt-0.5 rounded border-slate-600 bg-slate-800 text-primary-600"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-200">Mostrar link para o perfil completo</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Exibe o botão “Ver perfil completo” no final da página do Link Bio.
                    </span>
                  </span>
                </label>

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
                  <p className="mb-2 text-xs text-slate-500">
                    A prévia também mostra seus contatos e redes sociais. Para editar/reordenar esses botões aqui,
                    adicione-os à lista.
                  </p>
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
                          <option value="privacy">Privacy</option>
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
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => {
                          const suggested = buildSuggestedBioLinks(f)
                          const existingTypes = new Set(f.bio_links.map((l) => l.type || 'custom'))
                          const existingUrls = new Set(f.bio_links.map((l) => normalizeBioLinkUrl(l.url)).filter(Boolean))
                          const next = suggested.filter(
                            (l) => !existingTypes.has(l.type) && !existingUrls.has(normalizeBioLinkUrl(l.url))
                          )
                          if (next.length === 0) {
                            toast('Nenhum contato/rede novo para adicionar.')
                            return f
                          }
                          return { ...f, bio_links: [...f.bio_links, ...next] }
                        })
                      }}
                      className="ml-2 rounded-lg border border-primary-500/50 px-4 py-2 text-sm text-primary-200 hover:bg-primary-500/10"
                    >
                      + Adicionar contatos/redes atuais
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
                  const photos = profile.photos?.length ? profile.photos : (profile.thumbnail ? [profile.thumbnail] : [])
                  const avatarIndex =
                    form.bio_avatar_index >= 0 && form.bio_avatar_index < photos.length
                      ? form.bio_avatar_index
                      : 0
                  const previewAvatar = photos[avatarIndex] || profile.thumbnail || ''
                  const previewLinks = form.bio_links.filter(
                    (l) => l.enabled !== false && l.label.trim() && l.url.trim()
                  )
                  const previewLinkUrls = new Set(previewLinks.map((l) => normalizeBioLinkUrl(l.url)).filter(Boolean))
                  const hasPreviewLink = (url: string | null | undefined) => {
                    const normalized = normalizeBioLinkUrl(url || '')
                    return normalized ? previewLinkUrls.has(normalized) : false
                  }
                  const contactLinks = [
                    { label: 'WhatsApp', url: form.show_whatsapp ? whatsappHref(form.whatsapp) : '' },
                    { label: 'Telegram', url: form.show_telegram ? telegramHref(form.telegram) : '' },
                    { label: 'Ligar', url: form.show_phone && form.phone ? `tel:${form.phone.trim()}` : '' },
                  ].filter((l) => l.url && !hasPreviewLink(l.url))
                  const socialLinks = [
                    { label: 'Instagram', url: socialProfileHref(form.instagram, 'instagram') },
                    { label: 'X', url: socialProfileHref(form.twitter, 'twitter') },
                    { label: 'Privacy', url: socialProfileHref(form.privacy, 'privacy') },
                    { label: 'OnlyFans', url: socialProfileHref(form.onlyfans, 'onlyfans') },
                  ].filter((l) => l.url && !hasPreviewLink(l.url))
                  return (
                  <div className="rounded-xl border border-slate-600 bg-slate-800/30 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Pré-visualização</p>
                    <div className={`mx-auto max-w-[280px] overflow-hidden rounded-2xl border border-slate-600 shadow-xl ${previewBg}`}>
                      <div className="flex flex-col items-center p-6">
                        {previewAvatar ? (
                          <img src={previewAvatar} alt="" className={`mb-3 h-20 w-20 rounded-full border-2 object-cover ${avatarBorder}`} />
                        ) : (
                          <div className={`mb-3 flex h-20 w-20 items-center justify-center rounded-full border-2 ${avatarBorder} text-2xl font-bold ${initialColor}`}>{profile.name?.charAt(0)}</div>
                        )}
                        <p className={`font-semibold ${nameColor}`}>{profile.name}</p>
                        {form.short_description && <p className={`mt-1 text-center text-xs ${descColor}`}>{form.short_description}</p>}
                        {previewLinks.length > 0 && (
                          <div className="mt-4 w-full space-y-2">
                            {previewLinks.map((l, idx) => (
                              <div key={idx} className={`rounded-xl border py-2.5 text-center text-xs font-medium ${linkBtnClass}`} style={linkBtnStyle}>{l.label || 'Link'}</div>
                            ))}
                          </div>
                        )}
                        {contactLinks.length > 0 && (
                          <div className="mt-4 w-full space-y-2">
                            {contactLinks.map((l) => (
                              <div key={l.label} className={`rounded-xl border py-2.5 text-center text-xs font-medium ${linkBtnClass}`} style={linkBtnStyle}>{l.label}</div>
                            ))}
                          </div>
                        )}
                        {socialLinks.length > 0 && (
                          <div className="mt-4 w-full">
                            <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">Redes sociais</p>
                            <div className="grid grid-cols-2 gap-2">
                              {socialLinks.map((l) => (
                                <div key={l.label} className={`rounded-xl border py-2.5 text-center text-xs font-medium ${linkBtnClass}`} style={linkBtnStyle}>{l.label}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        {form.bio_show_full_profile && (
                          <div className={`mt-4 text-center text-xs underline ${descColor}`}>
                            Ver perfil completo
                          </div>
                        )}
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
            {saving ? 'Salvando...' : profile ? 'Salvar alterações' : 'Salvar rascunho'}
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
