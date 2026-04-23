/** Tipos usados pela API (PocketBase). */

export interface Profile {
  id: string
  user_id: string
  name: string
  age: number
  city: string
  state: string
  bio_title?: string
  bio: string
  category: 'acompanhante' | 'massagista' | 'online'
  gender: 'mulher' | 'homem' | 'trans' | 'casal'
  ethnicity: string
  services: string[]
  photos: string[]
  thumbnail?: string
  videos: string[]
  audio?: string
  price_30min?: number
  price_1h?: number
  price_2h?: number
  price_overnight?: number
  prices?: Array<{ description: string; price: number }>
  payment_methods: string[]
  neighborhoods: string[]
  location_approximate: boolean
  location_lat?: number
  location_lng?: number
  whatsapp?: string
  telegram?: string
  phone?: string
  instagram?: string
  twitter?: string
  is_online: boolean
  online_until?: string
  verified: boolean
  /** id do registro `plans` (relação) ou slug em dados antigos */
  plan: string
  /** Preenchido quando a API expande a relação `plan` (ex.: ouro, prata). */
  plan_slug?: string
  status: 'active' | 'inactive' | 'suspended' | 'muted' | 'archived'
  views: number
  clicks: number
  favorites_count: number
  slug?: string
  code?: string
  display_mode?: 'default' | 'link_bio'
  short_description?: string
  bio_theme?: string
  bio_button_color?: string
  bio_links?: Array<{ label: string; url: string }>
  bio_avatar_index?: number
  hair_color?: string
  body_type?: string
  height?: number
  weight?: string
  height_exact?: string
  breast_type?: string
  pubis_type?: string
  service_locations?: string[]
  service_to?: string[]
  special_services?: string[]
  /** Acompanhante: serviços gerais. Massagista: tipos de massagem. Online: serviços online. */
  massage_types?: string[]
  online_services?: string[]
  /** Apenas massagista: Depilação, Estética, Reflexologia podal */
  other_services?: string[]
  /** Apenas online: itens à venda */
  for_sale?: string[]
  /** Apenas online: fantasias virtuais */
  virtual_fantasies?: string[]
  /** Apenas massagista: certificada */
  certified?: boolean
  /** Apenas massagista: oferece final feliz (mostra special_services como "Final feliz") */
  offers_happy_ending?: boolean
  onlyfans?: string
  piercings?: boolean
  tattoos?: boolean
  smoker?: string
  featured?: boolean
  featured_until?: string
  visual_highlight?: boolean
  contact_expires_at?: string
  search_expires_at?: string
  last_bump_at?: string
  auto_bump?: boolean
  bumps_used_today?: number
  bumps_used_date?: string
  created_at: string
  updated_at: string
  schedule?: Schedule[]
}

export interface Schedule {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  enabled: boolean
  start_time?: string
  end_time?: string
}

export interface FilterOptions {
  city?: string
  state?: string
  category?: 'acompanhante' | 'massagista' | 'online'
  gender?: 'mulher' | 'homem' | 'trans' | 'casal'
  ethnicity?: string
  hair_color?: string
  body_type?: string
  breast_type?: string
  min_age?: number
  max_age?: number
  min_price?: number
  max_price?: number
  services?: string[]
  verified?: boolean
  online?: boolean
  search?: string
  sort?: string
}

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  role: string
  status: string
  avatar?: string
  verified?: boolean
  document_verified?: boolean
  name?: string
}

export interface Plan {
  id: string
  name: string
  slug: string
  enabled: boolean
  highlight_color?: string
  price_weekly: number
  price_monthly: number
  daily_bumps: number
  max_photos: number | 'unlimited'
  features: string[]
  target_type?: 'advertiser' | 'user'
  highlight_percentage?: number
}

export interface Message {
  id: string
  sender: string
  recipient: string
  sender_id?: string
  recipient_id?: string
  content: string
  read: boolean
  created_at: string
  expand?: {
    sender?: { id: string; name?: string; email?: string; avatar?: string }
    recipient?: { id: string; name?: string; email?: string; avatar?: string }
  }
}
