'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Story {
  id: string
  profile: { id: string; name: string; thumbnail?: string } | null
  file: string
  type: string
  text: string
  created: string
}

interface ProfileStories {
  profileId: string
  profileName: string
  thumbnail: string
  stories: Story[]
}

export default function StoriesSection() {
  const [grouped, setGrouped] = useState<ProfileStories[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stories', { cache: 'no-store' })
      .then((r) => r.json())
      .then((items: Story[]) => {
        const byProfile = new Map<string, ProfileStories>()
        for (const s of items) {
          if (!s.profile?.id) continue
          const key = s.profile.id
          const existing = byProfile.get(key)
          const thumbnail = s.profile.thumbnail || (s.type === 'image' ? s.file : '')
          if (!existing) {
            byProfile.set(key, {
              profileId: s.profile.id,
              profileName: s.profile.name,
              thumbnail,
              stories: [s],
            })
          } else {
            existing.stories.push(s)
          }
        }
        setGrouped(Array.from(byProfile.values()))
      })
      .catch(() => setGrouped([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading || grouped.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-white">Stories</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {grouped.map((g) => (
          <Link
            key={g.profileId}
            href={`/perfil/${g.profileId}?stories=1`}
            className="group flex shrink-0 flex-col items-center"
          >
            <div className="relative">
              <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-primary-500 p-0.5">
                {g.thumbnail ? (
                  <img
                    src={g.thumbnail}
                    alt={g.profileName}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-700 text-xl font-bold text-slate-400">
                    {g.profileName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-xs font-medium text-white">
                {g.stories.length}
              </span>
            </div>
            <span className="mt-2 max-w-[70px] truncate text-xs text-slate-400 group-hover:text-white">
              {g.profileName}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
