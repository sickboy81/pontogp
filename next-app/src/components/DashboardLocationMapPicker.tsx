'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

const TILE_SIZE = 256

function lonToWorldX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * TILE_SIZE * 2 ** zoom
}

function latToWorldY(lat: number, zoom: number): number {
  const safeLat = Math.max(-85.05112878, Math.min(85.05112878, lat))
  const rad = (safeLat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * TILE_SIZE * 2 ** zoom
}

function worldXToLng(x: number, zoom: number): number {
  return (x / (TILE_SIZE * 2 ** zoom)) * 360 - 180
}

function worldYToLat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / (TILE_SIZE * 2 ** zoom)
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
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
  const mapRef = useRef<HTMLDivElement | null>(null)
  const dragStartRef = useRef<{
    pointerX: number
    pointerY: number
    worldX: number
    worldY: number
  } | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [dragging, setDragging] = useState(false)
  const zoom = approximate ? 13 : 15
  const hasCoords = lat != null && lng != null

  const searchLabel = useMemo(() => {
    const neighborhood = neighborhoods[0]?.trim()
    return [neighborhood, city, state, 'Brasil'].filter(Boolean).join(', ')
  }, [city, neighborhoods, state])

  const center = useMemo(() => {
    if (hasCoords) return { lat, lng }
    return null
  }, [hasCoords, lat, lng])

  const tiles = useMemo(() => {
    if (!center) return []
    const centerX = lonToWorldX(center.lng, zoom)
    const centerY = latToWorldY(center.lat, zoom)
    const centerTileX = Math.floor(centerX / TILE_SIZE)
    const centerTileY = Math.floor(centerY / TILE_SIZE)
    const list: Array<{ key: string; url: string; x: number; y: number }> = []

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const tileX = centerTileX + dx
        const tileY = centerTileY + dy
        list.push({
          key: `${zoom}-${tileX}-${tileY}`,
          url: `/api/map-tiles/${zoom}/${tileX}/${tileY}.png`,
          x: tileX * TILE_SIZE - centerX,
          y: tileY * TILE_SIZE - centerY,
        })
      }
    }
    return list
  }, [center, zoom])

  useEffect(() => {
    if (hasCoords || !city || !state) return
    void geocodeAddress()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, state])

  const geocodeAddress = async () => {
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
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      })
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
  }

  const updateFromPointer = (clientX: number, clientY: number) => {
    const start = dragStartRef.current
    if (!start) return
    const worldX = start.worldX + clientX - start.pointerX
    const worldY = start.worldY + clientY - start.pointerY
    onChange({
      lat: worldYToLat(worldY, zoom),
      lng: worldXToLng(worldX, zoom),
    })
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-medium text-slate-200">Mapa de localização</h3>
          <p className="text-xs text-slate-500">
            O mapa usa bairro, cidade e estado. Arraste o pin para ajustar o ponto.
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

      {center ? (
        <div
          ref={mapRef}
          className="relative h-72 overflow-hidden rounded-lg border border-slate-600 bg-slate-800"
          onPointerMove={(e) => {
            if (!dragging) return
            e.preventDefault()
            updateFromPointer(e.clientX, e.clientY)
          }}
          onPointerUp={(e) => {
            if (!dragging) return
            e.currentTarget.releasePointerCapture(e.pointerId)
            setDragging(false)
            updateFromPointer(e.clientX, e.clientY)
            dragStartRef.current = null
          }}
          onPointerCancel={() => {
            setDragging(false)
            dragStartRef.current = null
          }}
        >
          <div className="absolute left-1/2 top-1/2 h-0 w-0">
            {tiles.map((tile) => (
              <img
                key={tile.key}
                src={tile.url}
                alt=""
                draggable={false}
                className="absolute h-64 w-64 select-none"
                style={{ left: tile.x, top: tile.y }}
              />
            ))}
          </div>
          <button
            type="button"
            className={`absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full cursor-grab text-primary-500 drop-shadow-lg active:cursor-grabbing ${dragging ? 'scale-110' : ''}`}
            onPointerDown={(e) => {
              if (!center) return
              dragStartRef.current = {
                pointerX: e.clientX,
                pointerY: e.clientY,
                worldX: lonToWorldX(center.lng, zoom),
                worldY: latToWorldY(center.lat, zoom),
              }
              e.currentTarget.parentElement?.setPointerCapture(e.pointerId)
              setDragging(true)
            }}
            aria-label="Arrastar localização no mapa"
          >
            <MapPin className="h-10 w-10 fill-primary-500/30" />
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-slate-950/75 px-3 py-2 text-xs text-slate-300">
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
