import type { Profile } from '@/lib/types'
import type { ProfileJsonTagField } from '@/lib/api/profiles'

/** Query string para a home: mesma categoria/gênero/local + opção de perfil (API faz cidade → estado → Brasil). */
export function profileTagSearchPath(profile: Profile, field: ProfileJsonTagField, value: string): string {
  const p = new URLSearchParams()
  if (profile.category) p.set('category', profile.category)
  if (profile.gender) p.set('gender', profile.gender)
  if (profile.state) p.set('state', profile.state)
  if (profile.city) p.set('city', profile.city)
  p.set('tag', value)
  p.set('tag_field', field)
  p.set('exclude_profile', profile.id)
  return `/?${p.toString()}`
}
