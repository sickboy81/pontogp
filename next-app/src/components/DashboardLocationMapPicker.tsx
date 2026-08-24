'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_FALLBACK_URL = '/api/map-tiles/{z}/{x}/{y}'

type LeafletNamespace = {
  map: (
    el: HTMLElement,
    options?: Record<string, unknown>
  ) => {
    setView: (latlng: [number, number], zoom: number) => unknown
    addLayer: (layer: unknown) => unknown
    removeLayer: (layer: unknown) => unknown
    remove: () => void
    invalidateSize: () => void
    on: (event: string, handler: (...args: unknown[]) => void) => void
  }
  tileLayer: (
    url: string,
    options?: Record<string, unknown>
  ) => {
    addTo: (map: unknown) => unknown
    on: (event: string, handler: (...args: unknown[]) => void) => void
  }
  marker: (
    latlng: [number, number],
    options?: Record<string, unknown>
  ) => {
    addTo: (map: unknown) => unknown
    setLatLng: (latlng: [number, number]) => void
    getLatLng: () => { lat: number; lng: number }
    on: (event: string, handler: (...args: unknown[]) => void) => void
    remove: () => void
  }
  icon: (options: Record<string, unknown>) => unknown
}

declare global {
  interface Window {
    L?: LeafletNamespace
    __cerejaLeafletLoading?: Promise<LeafletNamespace>
  }
}

function loadLeaflet(): Promise<LeafletNamespace> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window indisponível'))
  }
  if (window.L) return Promise.resolve(window.L)
  if (window.__cerejaLeafletLoading) return window.__cerejaLeafletLoading

  const promise = new Promise<LeafletNamespace>((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS_URL}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = LEAFLET_CSS_URL
      link.crossOrigin = ''
      document.head.appendChild(link)
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${LEAFLET_JS_URL}"]`
    )
    // Script no DOM sem window.L: carga falhou ou ficou inconsistente — remove para nova tentativa.
    if (existingScript && !window.L) {
      existingScript.remove()
    }

    const script = document.createElement('script')
    script.src = LEAFLET_JS_URL
    script.async = true
    script.crossOrigin = ''
    document.body.appendChild(script)

    const fail = (err: Error) => {
      script.remove()
      reject(err)
    }

    const onReady = () => {
      if (window.L) {
        resolve(window.L)
      } else {
        fail(new Error('Leaflet carregou mas window.L está indefinido'))
      }
    }
    script.addEventListener('load', onReady)
    script.addEventListener('error', () => fail(new Error('Falha ao carregar Leaflet')))
  })

  promise.catch(() => {
    delete window.__cerejaLeafletLoading
  })

  window.__cerejaLeafletLoading = promise
  return promise
}

interface DashboardLocationMapPickerProps {
  lat: number | null
  lng: number | null
  city: string
  state: string
  neighborhoods: string[]
  approximate: boolean
  onChange: (coords: { lat: number; lng: number }) => void
  onClear: () => void
}

export default function DashboardLocationMapPicker({
  lat,
  lng,
  city,
  state,
  neighborhoods,
  approximate,
  onChange,
  onClear,
}: DashboardLocationMapPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<ReturnType<LeafletNamespace['map']> | null>(null)
  const markerRef = useRef<ReturnType<LeafletNamespace['marker']> | null>(null)
  const tileLayerRef = useRef<ReturnType<LeafletNamespace['tileLayer']> | null>(null)
  const onChangeRef = useRef(onChange)
  /** Sempre o último lat/lng/zoom — usado ao resolver loadLeaflet para evitar valores obsoletos no closure. */
  const mapViewRef = useRef({ lat: 0, lng: 0, zoom: 15 })
  const [isSearching, setIsSearching] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const zoom = approximate ? 13 : 15
  const hasCoords = lat != null && lng != null

  useEffect(() => {
    if (lat != null && lng != null) mapViewRef.current = { lat, lng, zoom }
  }, [lat, lng, zoom])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const searchLabel = useMemo(() => {
    const neighborhood = neighborhoods[0]?.trim()
    return [neighborhood, city, state, 'Brasil'].filter(Boolean).join(', ')
  }, [city, neighborhoods, state])

  useEffect(() => {
    if (!hasCoords) return
    if (!containerRef.current) return
    let cancelled = false
    setMapError(null)

    loadLeaflet()
      .then((L) => {
        if (cancelled) return
        const container = containerRef.current
        if (!container) return

        if (!mapRef.current) {
          const { lat: curLat, lng: curLng, zoom: curZoom } = mapViewRef.current
          const map = L.map(container, {
            zoomControl: true,
            attributionControl: true,
            scrollWheelZoom: true,
          })
          map.setView([curLat, curLng], curZoom)

          const tile = L.tileLayer(TILE_URL, {
            maxZoom: 19,
            attribution: '© OpenStreetMap',
            crossOrigin: true,
          })
          tile.addTo(map)
          tile.on('tileerror', () => {
            if (tileLayerRef.current === tile) {
              try {
                map.removeLayer(tile)
              } catch {
                /* noop */
              }
              const fallback = L.tileLayer(TILE_FALLBACK_URL, {
                maxZoom: 19,
                attribution: '© OpenStreetMap',
              })
              fallback.addTo(map)
              tileLayerRef.current = fallback
            }
          })
          tileLayerRef.current = tile

          const icon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          })

          const marker = L.marker([curLat, curLng], {
            draggable: true,
            icon,
          })
          marker.addTo(map)
          marker.on('dragend', () => {
            const next = marker.getLatLng()
            onChangeRef.current({ lat: next.lat, lng: next.lng })
          })
          markerRef.current = marker

          map.on('click', (...args: unknown[]) => {
            const event = args[0] as { latlng?: { lat: number; lng: number } }
            if (!event?.latlng || !markerRef.current) return
            markerRef.current.setLatLng([event.latlng.lat, event.latlng.lng])
            onChangeRef.current({ lat: event.latlng.lat, lng: event.latlng.lng })
          })

          mapRef.current = map
          setMapReady(true)
          setMapError(null)

          requestAnimationFrame(() => {
            try {
              map.invalidateSize()
            } catch {
              /* noop */
            }
          })
        }
      })
      .catch((err) => {
        console.error('[DashboardLocationMapPicker] falha ao iniciar Leaflet', err)
        if (!cancelled) setMapError('Não foi possível carregar a biblioteca de mapas.')
      })

    return () => {
      cancelled = true
    }
  }, [hasCoords, lat, lng, zoom])

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    if (!hasCoords) return
    markerRef.current.setLatLng([lat as number, lng as number])
    mapRef.current.setView([lat as number, lng as number], zoom)
  }, [lat, lng, zoom, hasCoords])

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        try {
          markerRef.current.remove()
        } catch {
          /* noop */
        }
        markerRef.current = null
      }
      if (mapRef.current) {
        try {
          mapRef.current.remove()
        } catch {
          /* noop */
        }
        mapRef.current = null
      }
      tileLayerRef.current = null
    }
  }, [])

  const geocodeAddress = useCallback(async () => {
    if (!city || !state) {
      toast.error('Selecione estado e cidade antes de buscar no mapa')
      return
    }

    setIsSearching(true)
    try {
      const params = new URLSearchParams({
        q: searchLabel,
        format: 'json',
        limit: '1',
        addressdetails: '0',
        countrycodes: 'br',
      })
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        { headers: { Accept: 'application/json' } }
      )
      if (!res.ok) throw new Error('geocode failed')
      const data = (await res.json()) as Array<{ lat?: string; lon?: string }>
      const first = data[0]
      const nextLat = first?.lat ? Number(first.lat) : NaN
      const nextLng = first?.lon ? Number(first.lon) : NaN
      if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
        toast.error('Não encontrei esse bairro/cidade no mapa')
        return
      }
      onChange({ lat: nextLat, lng: nextLng })
      toast.success('Mapa posicionado pelo bairro/cidade')
    } catch {
      toast.error('Erro ao buscar localização no mapa')
    } finally {
      setIsSearching(false)
    }
  }, [city, onChange, searchLabel, state])

  useEffect(() => {
    if (hasCoords || !city || !state) return
    void geocodeAddress()
  }, [city, geocodeAddress, hasCoords, state])

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-medium text-slate-200">Mapa de localização</h3>
          <p className="text-xs text-slate-500">
            Busque pelo bairro/cidade ou clique no mapa para reposicionar. Você também pode arrastar o pin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={geocodeAddress}
            disabled={isSearching}
            className="inline-flex items-center gap-2 rounded-lg border border-primary-500/50 px-3 py-2 text-xs font-medium text-primary-200 transition hover:bg-primary-500/10 disabled:opacity-60"
          >
            {isSearching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Buscar pelo bairro/cidade
          </button>
          {hasCoords && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700"
            >
              Limpar mapa
            </button>
          )}
        </div>
      </div>

      {hasCoords ? (
        <div className="relative h-48 overflow-hidden rounded-lg border border-slate-600 bg-slate-800 sm:h-56">
          <div ref={containerRef} className="absolute inset-0 z-0" />
          {!mapReady && !mapError && (
            <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center bg-slate-800/80">
              <p className="rounded-md bg-slate-900/80 px-3 py-2 text-xs text-slate-300">
                Carregando mapa...
              </p>
            </div>
          )}
          {mapError && (
            <div className="absolute inset-0 z-[400] flex items-center justify-center bg-slate-900/85 px-4 text-center">
              <p className="text-xs text-rose-300">{mapError}</p>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[401] bg-slate-950/75 px-3 py-2 text-xs text-slate-300">
            {approximate
              ? 'Localização aproximada: o perfil público mostra uma área maior para proteger o endereço.'
              : 'Localização exata: use somente se for seguro mostrar esse ponto.'}
          </div>
        </div>
      ) : (
        <p className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-3 text-xs text-slate-500">
          Selecione estado, cidade e informe bairros/regiões. Depois clique em “Buscar pelo bairro/cidade”.
        </p>
      )}

      <p className="mt-2 text-xs text-slate-500">
        Busca: {searchLabel || 'preencha cidade e bairro'}
      </p>
    </div>
  )
}
