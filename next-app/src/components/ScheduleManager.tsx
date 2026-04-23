'use client'

import { useState, useEffect } from 'react'
import { Copy } from 'lucide-react'
import type { Schedule } from '@/lib/types'

interface ScheduleManagerProps {
  schedule: Schedule[]
  onChange: (schedule: Schedule[]) => void
}

const DAYS = [
  { value: 'monday' as const, label: 'Segunda-feira' },
  { value: 'tuesday' as const, label: 'Terça-feira' },
  { value: 'wednesday' as const, label: 'Quarta-feira' },
  { value: 'thursday' as const, label: 'Quinta-feira' },
  { value: 'friday' as const, label: 'Sexta-feira' },
  { value: 'saturday' as const, label: 'Sábado' },
  { value: 'sunday' as const, label: 'Domingo' },
]

export default function ScheduleManager({ schedule, onChange }: ScheduleManagerProps) {
  const [localSchedule, setLocalSchedule] = useState<Schedule[]>(() => {
    if (schedule.length > 0) return schedule
    return DAYS.map((day) => ({ day: day.value, enabled: false }))
  })

  useEffect(() => {
    onChange(localSchedule)
  }, [localSchedule, onChange])

  const updateDay = (day: Schedule['day'], updates: Partial<Schedule>) => {
    setLocalSchedule((prev) =>
      prev.map((s) => (s.day === day ? { ...s, ...updates } : s))
    )
  }

  const applyToAllDays = (enabled: boolean, startTime?: string, endTime?: string) => {
    setLocalSchedule((prev) =>
      prev.map((s) => ({
        ...s,
        enabled,
        start_time: startTime ?? s.start_time,
        end_time: endTime ?? s.end_time,
      }))
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary-500/10 p-2">
            <Copy className="h-4 w-4 text-primary-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Configuração rápida</h3>
            <p className="text-xs text-slate-400">Aplique o mesmo horário para todos</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-2 transition-colors hover:border-primary-500/50">
            <input
              type="checkbox"
              onChange={(e) => {
                if (e.target.checked) applyToAllDays(true, '00:00', '23:59')
              }}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-xs font-bold uppercase text-slate-300">24h todos</span>
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-900/50 p-1">
            <input
              type="time"
              className="w-24 cursor-pointer bg-transparent px-2 py-1 text-center text-sm text-white focus:outline-none"
              onChange={(e) => e.target.value && applyToAllDays(true, e.target.value, undefined)}
            />
            <span className="text-slate-600">-</span>
            <input
              type="time"
              className="w-24 cursor-pointer bg-transparent px-2 py-1 text-center text-sm text-white focus:outline-none"
              onChange={(e) => e.target.value && applyToAllDays(true, undefined, e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/30">
        <div className="grid grid-cols-[1fr,auto] gap-4 border-b border-slate-700/50 bg-slate-800/50 p-3 text-xs font-bold uppercase tracking-wider text-slate-500 sm:grid-cols-[120px,1fr,auto]">
          <div className="pl-2">Dia</div>
          <div className="hidden sm:block">Horário</div>
          <div className="pr-2 text-right">Status</div>
        </div>
        <div className="divide-y divide-slate-700/50">
          {DAYS.map((day) => {
            const daySchedule = localSchedule.find((s) => s.day === day.value)
            const enabled = daySchedule?.enabled ?? false
            const is24h =
              daySchedule?.start_time === '00:00' && daySchedule?.end_time === '23:59'

            return (
              <div
                key={day.value}
                className={`grid grid-cols-[1fr,auto] items-center gap-4 p-3 sm:grid-cols-[120px,1fr,auto] ${enabled ? 'bg-slate-800/30' : 'opacity-60 hover:opacity-100'}`}
              >
                <label className="flex cursor-pointer items-center gap-3 pl-2">
                  <div
                    className={`h-6 w-10 rounded-full p-1 transition-colors ${enabled ? 'bg-primary-500' : 'bg-slate-700'}`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={enabled}
                    onChange={(e) => updateDay(day.value, { enabled: e.target.checked })}
                  />
                  <span
                    className={`text-sm font-medium ${enabled ? 'text-white' : 'text-slate-400'}`}
                  >
                    {day.label.replace('-feira', '')}
                  </span>
                </label>

                <div
                  className={`col-span-2 flex flex-wrap items-center gap-3 sm:col-span-1 ${!enabled ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={is24h}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateDay(day.value, { start_time: '00:00', end_time: '23:59' })
                        } else {
                          updateDay(day.value, { start_time: '', end_time: '' })
                        }
                      }}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-xs font-medium text-slate-300">24h</span>
                  </label>
                  {!is24h && (
                    <div className="flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-900/50 p-1">
                      <input
                        type="time"
                        value={daySchedule?.start_time ?? ''}
                        onChange={(e) => updateDay(day.value, { start_time: e.target.value })}
                        className="w-20 bg-transparent px-1 text-center text-sm text-white focus:outline-none"
                      />
                      <span className="text-slate-600">-</span>
                      <input
                        type="time"
                        value={daySchedule?.end_time ?? ''}
                        onChange={(e) => updateDay(day.value, { end_time: e.target.value })}
                        className="w-20 bg-transparent px-1 text-center text-sm text-white focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="hidden pr-2 text-right sm:block">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-bold ${enabled ? (is24h ? 'bg-primary-500/10 text-primary-400' : 'bg-primary-500/10 text-primary-400') : 'bg-slate-700/50 text-slate-500'}`}
                  >
                    {enabled ? (is24h ? '24h' : 'Definido') : 'Fechado'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
