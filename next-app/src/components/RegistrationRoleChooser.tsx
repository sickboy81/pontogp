'use client'

import { BadgeCheck, Heart, MessageCircle, Sparkles, UserRound } from 'lucide-react'

type RegistrationRole = 'advertiser' | 'user'

type RegistrationRoleChooserProps = {
  onSelect: (role: RegistrationRole) => void
}

const cards: Array<{
  role: RegistrationRole
  eyebrow: string
  title: string
  description: string
  bullets: string[]
  icon: typeof Sparkles
  accent: string
}> = [
  {
    role: 'advertiser',
    eyebrow: 'Quero anunciar',
    title: 'Criar perfil profissional',
    description:
      'Conta para quem vai montar anúncio, publicar perfil, receber contatos e gerenciar visibilidade.',
    bullets: [
      'Criar e publicar perfil',
      'Receber favoritos e mensagens',
      'Gerenciar fotos, stories e plano',
    ],
    icon: Sparkles,
    accent: 'border-primary-500/40 bg-primary-500/10 text-primary-200',
  },
  {
    role: 'user',
    eyebrow: 'Sou cliente',
    title: 'Explorar e salvar perfis',
    description:
      'Conta para quem deseja favoritar perfis, trocar mensagens internas e acompanhar anúncios preferidos.',
    bullets: [
      'Salvar favoritos',
      'Conversar por mensagem interna',
      'Acompanhar perfis e novidades',
    ],
    icon: UserRound,
    accent: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
  },
]

export default function RegistrationRoleChooser({
  onSelect,
}: RegistrationRoleChooserProps) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <button
            key={card.role}
            type="button"
            onClick={() => onSelect(card.role)}
            className={`group rounded-2xl border p-6 text-left transition hover:-translate-y-0.5 hover:border-primary-400/60 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 ${card.accent}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                  {card.eyebrow}
                </p>
                <h2 className="mt-3 text-2xl font-bold text-white">{card.title}</h2>
              </div>
              <span className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white">
                <Icon className="h-6 w-6" />
              </span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-200">{card.description}</p>

            <ul className="mt-5 space-y-2 text-sm text-slate-100">
              {card.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2">
                  {card.role === 'advertiser' ? (
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-300" />
                  ) : (
                    <Heart className="mt-0.5 h-4 w-4 shrink-0 text-sky-200" />
                  )}
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
              Continuar com esse tipo
              {card.role === 'advertiser' ? (
                <Sparkles className="h-4 w-4" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
