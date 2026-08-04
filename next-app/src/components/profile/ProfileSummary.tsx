'use client'

import { BadgeCheck, Clock3, MapPin, Sparkles, Star } from 'lucide-react'
import Link from 'next/link'
import type { Profile, Schedule } from '@/lib/types'
import { formatPrice } from '@/utils/format'
import { profileTagSearchPath } from '@/lib/profile-tag-search'

type PriceItem = { label: string; value: number }

type ProfileSummaryProps = {
  profile: Profile
  unavailable: boolean
  tagChipClass: string
  priceItems: PriceItem[]
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

function ScheduleList({ schedule }: { schedule: Schedule[] }) {
  return (
    <ul className="space-y-1.5 rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-sm">
      {schedule
        .filter((item) => item.enabled)
        .map((item) => {
          const timeStr =
            item.start_time && item.end_time
              ? item.start_time === '00:00' && item.end_time === '23:59'
                ? '24h'
                : `${item.start_time} – ${item.end_time}`
              : '–'

          return (
            <li key={item.day} className="flex justify-between text-slate-200">
              <span>{DAY_LABELS[item.day] ?? item.day}</span>
              <span className="font-medium text-white">{timeStr}</span>
            </li>
          )
        })}
    </ul>
  )
}

export default function ProfileSummary({
  profile,
  unavailable,
  tagChipClass,
  priceItems,
}: ProfileSummaryProps) {
  const primaryPrices = priceItems.slice(0, 4)
  const secondaryPrices = priceItems.slice(4)
  const availabilityLabel = unavailable
    ? 'Indisponível'
    : profile.is_online
      ? 'Online agora'
      : 'Sob consulta'

  return (
    <div className="profile-reveal flex-1 space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.24fr)_minmax(280px,0.76fr)]">
        <section className="rounded-[1.75rem] border border-slate-700/70 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800/80 p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-primary-200">
              <Sparkles className="h-3.5 w-3.5" />
              Perfil premium
            </span>
            {profile.featured && (
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-amber-200">
                <Star className="h-3.5 w-3.5" />
                Destaque
              </span>
            )}
          </div>

          {profile.bio_title && (
            <h2 className="mt-5 text-xl font-semibold text-white">{profile.bio_title}</h2>
          )}
          {profile.bio && (
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-slate-300">
              {profile.bio}
            </p>
          )}
          {unavailable && (
            <p className="mt-4 rounded-2xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Perfil indisponível no momento. As fotos ficam desfocadas até a renovação do anúncio.
            </p>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-[1.75rem] border border-slate-700/70 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Resumo rápido
              </p>
              <span className="text-[11px] uppercase tracking-[0.16em] text-slate-600">
                visão geral
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-1">
              <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Cidade</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                  <MapPin className="h-4 w-4 text-primary-300" />
                  {profile.city}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Idade</p>
                <p className="mt-2 text-sm font-semibold text-white">{profile.age} anos</p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Categoria</p>
                <p className="mt-2 text-sm font-semibold capitalize text-white">{profile.category}</p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Status</p>
                <p className={`mt-2 text-sm font-semibold ${unavailable ? 'text-amber-300' : profile.is_online ? 'text-green-300' : 'text-slate-200'}`}>
                  {availabilityLabel}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-700/70 bg-slate-900/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Confiança e disponibilidade
            </p>
            <div className="mt-4 grid gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/60 px-3 py-3">
                <BadgeCheck className={`h-4 w-4 shrink-0 ${profile.verified ? 'text-emerald-300' : 'text-slate-500'}`} />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Verificação</p>
                  <p className="mt-1 truncate text-sm font-semibold text-white">
                    {profile.verified ? 'Perfil verificado' : 'Sem verificação pública'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/60 px-3 py-3">
                <Clock3 className={`h-4 w-4 shrink-0 ${unavailable ? 'text-amber-300' : 'text-primary-300'}`} />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Atendimento</p>
                  <p className="mt-1 truncate text-sm font-semibold text-white">
                    {unavailable
                      ? 'Temporariamente indisponível'
                      : profile.is_online
                        ? 'Atendimento ativo agora'
                        : 'Resposta sob consulta'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {primaryPrices.length > 0 && (
        <section className="rounded-[1.75rem] border border-slate-700/70 bg-slate-900/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-slate-500">Valores e formatos</h3>
            <p className="text-xs text-slate-500">Resumo das opções principais</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {primaryPrices.map((item, index) => (
              <div key={`${item.label}-${index}`} className="rounded-2xl border border-slate-700 bg-slate-800/65 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{formatPrice(item.value)}</p>
              </div>
            ))}
          </div>
          {secondaryPrices.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {secondaryPrices.map((item, index) => (
                <span key={`${item.label}-extra-${index}`} className="rounded-full border border-slate-700 bg-slate-800/70 px-4 py-2 text-sm text-slate-200">
                  {item.label}: {formatPrice(item.value)}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {((profile.services?.length ?? 0) > 0 ||
        (profile.massage_types?.length ?? 0) > 0 ||
        (profile.online_services?.length ?? 0) > 0) && (
        <div className="rounded-[1.75rem] border border-slate-700/70 bg-slate-900/60 p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-slate-500">
            {profile.category === 'massagista'
              ? 'Tipos de massagens'
              : profile.category === 'online'
                ? 'Serviços online'
                : 'Serviços oferecidos'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {(profile.services ?? []).map((item) => (
              <Link key={`svc-${item}`} href={profileTagSearchPath(profile, 'services', item)} className={tagChipClass}>
                {item}
              </Link>
            ))}
            {(profile.massage_types ?? []).map((item) => (
              <Link key={`mass-${item}`} href={profileTagSearchPath(profile, 'massage_types', item)} className={tagChipClass}>
                {item}
              </Link>
            ))}
            {(profile.online_services ?? []).map((item) => (
              <Link key={`onl-${item}`} href={profileTagSearchPath(profile, 'online_services', item)} className={tagChipClass}>
                {item}
              </Link>
            ))}
          </div>
        </div>
      )}

      {(profile.payment_methods?.length ?? 0) > 0 && (
        <div className="rounded-[1.75rem] border border-slate-700/70 bg-slate-900/60 p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-slate-500">Formas de pagamento</h3>
          <div className="flex flex-wrap gap-2">
            {profile.payment_methods!.map((item) => (
              <Link key={item} href={profileTagSearchPath(profile, 'payment_methods', item)} className={tagChipClass}>
                {item}
              </Link>
            ))}
          </div>
        </div>
      )}

      {profile.category !== 'online' && (profile.neighborhoods?.length ?? 0) > 0 && (
        <div className="rounded-[1.75rem] border border-slate-700/70 bg-slate-900/60 p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-slate-500">Bairros / regiões</h3>
          <div className="flex flex-wrap gap-2">
            {profile.neighborhoods!.map((item) => (
              <Link key={item} href={profileTagSearchPath(profile, 'neighborhoods', item)} className={tagChipClass}>
                {item}
              </Link>
            ))}
          </div>
        </div>
      )}

      {profile.category !== 'online' && (profile.service_locations?.length ?? 0) > 0 && (
        <div className="rounded-[1.75rem] border border-slate-700/70 bg-slate-900/60 p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-slate-500">Locais de atendimento</h3>
          <div className="flex flex-wrap gap-2">
            {profile.service_locations!.map((item) => (
              <Link
                key={item === 'Hotel' ? 'Hotel/Motel' : item}
                href={profileTagSearchPath(profile, 'service_locations', item)}
                className={tagChipClass}
              >
                {item === 'Hotel' ? 'Hotel/Motel' : item}
              </Link>
            ))}
          </div>
        </div>
      )}

      {profile.category !== 'online' && (profile.service_to?.length ?? 0) > 0 && (
        <div className="rounded-[1.75rem] border border-slate-700/70 bg-slate-900/60 p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-slate-500">Atende a</h3>
          <div className="flex flex-wrap gap-2">
            {profile.service_to!.map((item) => (
              <Link key={item} href={profileTagSearchPath(profile, 'service_to', item)} className={tagChipClass}>
                {item}
              </Link>
            ))}
          </div>
        </div>
      )}

      {(profile.special_services?.length ?? 0) > 0 && (
        <div className="rounded-[1.75rem] border border-slate-700/70 bg-slate-900/60 p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-slate-500">
            {profile.category === 'massagista' ? 'Final feliz' : 'Serviços especiais'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.special_services!.map((item) => (
              <Link key={item} href={profileTagSearchPath(profile, 'special_services', item)} className={tagChipClass}>
                {item}
              </Link>
            ))}
          </div>
        </div>
      )}

      {profile.category === 'massagista' && (profile.other_services?.length ?? 0) > 0 && (
        <div className="rounded-[1.75rem] border border-slate-700/70 bg-slate-900/60 p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-slate-500">Outros serviços</h3>
          <div className="flex flex-wrap gap-2">
            {profile.other_services!.map((item) => (
              <Link key={item} href={profileTagSearchPath(profile, 'other_services', item)} className={tagChipClass}>
                {item}
              </Link>
            ))}
          </div>
        </div>
      )}

      {profile.category === 'online' && (profile.for_sale?.length ?? 0) > 0 && (
        <div className="rounded-[1.75rem] border border-slate-700/70 bg-slate-900/60 p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-slate-500">Para vender</h3>
          <div className="flex flex-wrap gap-2">
            {profile.for_sale!.map((item) => (
              <Link key={item} href={profileTagSearchPath(profile, 'for_sale', item)} className={tagChipClass}>
                {item}
              </Link>
            ))}
          </div>
        </div>
      )}

      {profile.category === 'online' && (profile.virtual_fantasies?.length ?? 0) > 0 && (
        <div className="rounded-[1.75rem] border border-slate-700/70 bg-slate-900/60 p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-slate-500">Fantasias virtuais</h3>
          <div className="flex flex-wrap gap-2">
            {profile.virtual_fantasies!.map((item) => (
              <Link key={item} href={profileTagSearchPath(profile, 'virtual_fantasies', item)} className={tagChipClass}>
                {item}
              </Link>
            ))}
          </div>
        </div>
      )}

      {(profile.height_exact || profile.pubis_type || profile.piercings || profile.tattoos || profile.smoker) && (
        <div className="rounded-[1.75rem] border border-slate-700/70 bg-slate-900/60 p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-slate-500">Características</h3>
          <div className="flex flex-wrap gap-2">
            {profile.height_exact && <span className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200">Altura: {profile.height_exact}</span>}
            {profile.pubis_type && <span className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200">Pubis: {profile.pubis_type}</span>}
            {profile.piercings && <span className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200">Piercing</span>}
            {profile.tattoos && <span className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200">Tatuagem</span>}
            {profile.smoker && <span className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200">Fuma: {profile.smoker}</span>}
          </div>
        </div>
      )}

      {profile.schedule && profile.schedule.filter((item) => item.enabled).length > 0 && (
        <div className="rounded-[1.75rem] border border-slate-700/70 bg-slate-900/60 p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-slate-500">Horários de atendimento</h3>
          <ScheduleList schedule={profile.schedule} />
        </div>
      )}
    </div>
  )
}
