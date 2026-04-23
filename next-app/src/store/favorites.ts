'use client'

import { create } from 'zustand'
import type { Profile } from '@/lib/types'

interface FavoritesState {
  profileIds: Set<string>
  profiles: Profile[]
  loading: boolean
  loaded: boolean
  fetchFavorites: () => Promise<void>
  addFavorite: (profileId: string) => Promise<boolean>
  removeFavorite: (profileId: string) => Promise<boolean>
  toggleFavorite: (profileId: string) => Promise<boolean>
  isFavorite: (profileId: string) => boolean
}

const api = {
  get: () =>
    fetch('/api/favorites', { credentials: 'include' }).then((r) => {
      if (r.status === 401) return []
      return r.json()
    }),
  post: (profileId: string) =>
    fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ profileId }),
    }),
  delete: (profileId: string) =>
    fetch(`/api/favorites?profileId=${encodeURIComponent(profileId)}`, {
      method: 'DELETE',
      credentials: 'include',
    }),
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  profileIds: new Set(),
  profiles: [],
  loading: false,
  loaded: false,

  fetchFavorites: async () => {
    set({ loading: true })
    try {
      const profiles = (await api.get()) as Profile[]
      const profileIds = new Set(profiles.map((p) => p.id))
      set({ profiles, profileIds, loaded: true })
    } catch {
      set({ profiles: [], profileIds: new Set(), loaded: true })
    } finally {
      set({ loading: false })
    }
  },

  addFavorite: async (profileId: string) => {
    const res = await api.post(profileId)
    if (!res.ok) return false
    set((s) => ({
      profileIds: new Set([...s.profileIds, profileId]),
    }))
    return true
  },

  removeFavorite: async (profileId: string) => {
    await api.delete(profileId)
    set((s) => {
      const next = new Set(s.profileIds)
      next.delete(profileId)
      return {
        profileIds: next,
        profiles: s.profiles.filter((p) => p.id !== profileId),
      }
    })
    return true
  },

  toggleFavorite: async (profileId: string) => {
    const { profileIds } = get()
    if (profileIds.has(profileId)) {
      return get().removeFavorite(profileId)
    }
    return get().addFavorite(profileId)
  },

  isFavorite: (profileId: string) => get().profileIds.has(profileId),
}))
