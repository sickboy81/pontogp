'use client'

import { useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface LightboxProps {
  images: string[]
  currentIndex: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}

export default function Lightbox({ images, currentIndex, onClose, onNext, onPrev }: LightboxProps) {
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onPrev()
      else if (e.key === 'ArrowRight') onNext()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, onNext, onPrev])

  if (images.length === 0) return null

  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < images.length - 1

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current
    const deltaX = endX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(deltaX) < 40) return
    if (deltaX < 0 && hasNext) onNext()
    if (deltaX > 0 && hasPrev) onPrev()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Galeria de fotos"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
        aria-label="Fechar"
      >
        <X className="h-6 w-6" />
      </button>
      {hasPrev && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition hover:bg-black/70"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {hasNext && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNext() }}
          className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition hover:bg-black/70"
          aria-label="Próxima"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Desktop: clique no lado esquerdo/direito para navegar sem fechar */}
        {hasPrev && (
          <button
            type="button"
            onClick={onPrev}
            className="absolute inset-y-0 left-0 z-10 hidden w-1/3 cursor-w-resize bg-transparent md:block"
            aria-label="Foto anterior"
          />
        )}
        {hasNext && (
          <button
            type="button"
            onClick={onNext}
            className="absolute inset-y-0 right-0 z-10 hidden w-1/3 cursor-e-resize bg-transparent md:block"
            aria-label="Próxima foto"
          />
        )}
        <img
          src={images[currentIndex]}
          alt=""
          className="max-h-[90vh] max-w-full object-contain"
        />
        <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  )
}
