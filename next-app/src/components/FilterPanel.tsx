'use client'

import { useState, useEffect } from 'react'
import { X, MapPin, User, SlidersHorizontal, Check, Banknote } from 'lucide-react'
import type { FilterOptions } from '@/lib/types'
import {
  CATEGORIES,
  GENDERS,
  STATES,
  ETHNICITIES,
  HAIR_COLORS,
  BODY_TYPES,
  AGE_OPTIONS_MIN,
  getCitiesByState,
} from '@/utils/constants'

interface FilterPanelProps {
  filters: FilterOptions
  onChange: (filters: FilterOptions) => void
  isOpen: boolean
  onClose: () => void
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="mb-6">
      <div className="mb-4 flex items-center gap-2 px-1">
        <Icon className="h-4 w-4 text-primary-500" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

export default function FilterPanel({ filters, onChange, isOpen, onClose }: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const updateFilter = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    if (key === 'state') {
      setLocalFilters((prev) => ({ ...prev, [key]: value, city: undefined }))
    } else {
      setLocalFilters((prev) => ({ ...prev, [key]: value }))
    }
  }

  const applyFilters = () => {
    onChange(localFilters)
    onClose()
  }

  const clearFilters = () => {
    const cleared: FilterOptions = {
      category: localFilters.category ?? 'acompanhante',
      gender: localFilters.gender ?? 'mulher',
    }
    setLocalFilters(cleared)
    onChange(cleared)
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-[450px] flex-col overflow-hidden border-l border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-500/10 p-2">
              <SlidersHorizontal className="h-5 w-5 text-primary-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Filtros</h2>
              <p className="text-xs text-slate-500">Refine sua busca</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-6">
          <Section title="Básico" icon={SlidersHorizontal}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="ml-1 text-xs font-medium text-slate-500">Categoria</label>
                <select
                  value={localFilters.category ?? 'acompanhante'}
                  onChange={(e) => updateFilter('category', e.target.value as FilterOptions['category'])}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-xs font-medium text-slate-500">Gênero</label>
                <select
                  value={localFilters.gender ?? 'mulher'}
                  onChange={(e) => updateFilter('gender', e.target.value as FilterOptions['gender'])}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </Section>
          <Section title="Localização" icon={MapPin}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="ml-1 text-xs font-medium text-slate-500">Estado</label>
                <select
                  value={localFilters.state ?? ''}
                  onChange={(e) => updateFilter('state', (e.target.value || undefined) as string)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos</option>
                  {STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-xs font-medium text-slate-500">Cidade</label>
                <select
                  value={localFilters.city ?? ''}
                  onChange={(e) => updateFilter('city', (e.target.value || undefined) as string)}
                  disabled={!localFilters.state}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  <option value="">{localFilters.state ? 'Todas' : 'Selecione estado'}</option>
                  {getCitiesByState(localFilters.state).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </Section>
          <Section title="Preço (1h)" icon={Banknote}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="ml-1 text-xs font-medium text-slate-500">Mín. (R$)</label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  placeholder="Ex: 100"
                  value={localFilters.min_price ?? ''}
                  onChange={(e) => updateFilter('min_price', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-xs font-medium text-slate-500">Máx. (R$)</label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  placeholder="Ex: 500"
                  value={localFilters.max_price ?? ''}
                  onChange={(e) => updateFilter('max_price', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </Section>
          <Section title="Idade e atributos" icon={User}>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="ml-1 text-xs font-medium text-slate-500">Idade mín</label>
                <select
                  value={localFilters.min_age ?? ''}
                  onChange={(e) => updateFilter('min_age', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">De</option>
                  {AGE_OPTIONS_MIN.map((v) => (
                    <option key={v} value={v}>{v} anos</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-xs font-medium text-slate-500">Idade máx</label>
                <select
                  value={localFilters.max_age ?? ''}
                  onChange={(e) => updateFilter('max_age', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Até</option>
                  {AGE_OPTIONS_MIN.map((v) => (
                    <option key={v} value={v}>{v} anos</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="ml-1 text-xs font-medium text-slate-500">Etnia</label>
              <select
                value={localFilters.ethnicity ?? ''}
                onChange={(e) => updateFilter('ethnicity', (e.target.value || undefined) as string)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todas</option>
                {ETHNICITIES.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="ml-1 text-xs font-medium text-slate-500">Cabelo</label>
                <select
                  value={localFilters.hair_color ?? ''}
                  onChange={(e) => updateFilter('hair_color', (e.target.value || undefined) as string)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos</option>
                  {HAIR_COLORS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-xs font-medium text-slate-500">Corpo</label>
                <select
                  value={localFilters.body_type ?? ''}
                  onChange={(e) => updateFilter('body_type', (e.target.value || undefined) as string)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos</option>
                  {BODY_TYPES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => updateFilter('verified', localFilters.verified ? undefined : true)}
                className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${
                  localFilters.verified
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400'
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Check className="h-4 w-4" />
                  Apenas verificados
                </span>
                {localFilters.verified && <Check className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => updateFilter('online', localFilters.online ? undefined : true)}
                className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${
                  localFilters.online
                    ? 'border-green-500 bg-green-500/10 text-green-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400'
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span className={`h-2 w-2 rounded-full ${localFilters.online ? 'animate-pulse bg-green-400' : 'bg-slate-600'}`} />
                  Online agora
                </span>
                {localFilters.online && <Check className="h-4 w-4" />}
              </button>
            </div>
          </Section>
        </div>
        <div className="flex gap-3 border-t border-slate-800 bg-slate-900 p-6">
          <button
            type="button"
            onClick={clearFilters}
            className="flex-1 rounded-xl bg-slate-800 py-3 px-4 font-bold text-slate-300 transition hover:bg-slate-700 active:scale-95"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={applyFilters}
            className="flex-[2] rounded-xl bg-primary-500 py-3 px-4 font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-600 active:scale-95"
          >
            Ver resultados
          </button>
        </div>
      </div>
    </>
  )
}
