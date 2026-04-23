import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <header className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between px-4 py-2 md:min-h-16">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-header.png" alt="CerejaVIP" className="h-11 w-auto max-h-12 object-contain md:h-14 md:max-h-16" />
          </Link>
        </div>
      </header>
      <div className="relative flex flex-1 items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(220,38,38,0.12),transparent)]" />
        <div className="relative w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
