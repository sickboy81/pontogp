'use client'

/**
 * Mapa de localização do perfil. Exibe apenas quando há location_lat e location_lng.
 * Usa iframe do OpenStreetMap para não adicionar dependências (Leaflet).
 */

interface ProfileMapProps {
  lat: number
  lng: number
  city?: string
  state?: string
  neighborhoods?: string[]
  approximate?: boolean
  className?: string
}

export default function ProfileMap({ lat, lng, city, state, neighborhoods = [], approximate, className = '' }: ProfileMapProps) {
  const delta = approximate ? 0.05 : 0.02
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lng}`

  return (
    <div className={className}>
      <div className="mb-2 flex items-center">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Localização
          {approximate && (
            <span className="ml-2 text-xs font-normal text-slate-400">(aproximada)</span>
          )}
        </h3>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800">
        <iframe
          title="Mapa de localização"
          src={embedUrl}
          className="h-48 w-full border-0 pointer-events-none sm:h-56"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          tabIndex={-1}
          aria-hidden="true"
        />
        {(city || state || neighborhoods[0]) && (
          <p className="border-t border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
            {neighborhoods[0] ? `${neighborhoods[0]}${city || state ? ' — ' : ''}` : ''}
            {[city, state].filter(Boolean).join(', ')}
          </p>
        )}
      </div>
    </div>
  )
}
