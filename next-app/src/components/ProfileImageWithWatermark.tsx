'use client'

const WATERMARK_TEXT = 'CerejaVIP'

interface ProfileImageWithWatermarkProps {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  /** Se false, não mostra a marca d'água (ex.: lightbox pode usar) */
  showWatermark?: boolean
}

/**
 * Imagem de perfil com marca d'água semi-transparente no canto inferior.
 */
export default function ProfileImageWithWatermark({
  src,
  alt,
  className = '',
  imgClassName = '',
  showWatermark = true,
}: ProfileImageWithWatermarkProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img src={src} alt={alt} className={`h-full w-full object-cover ${imgClassName}`} />
      {showWatermark && (
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent py-1.5 text-center text-xs font-medium text-white/90"
          aria-hidden
        >
          {WATERMARK_TEXT}
        </div>
      )}
    </div>
  )
}
