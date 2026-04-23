import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold text-white">Página não encontrada</h1>
      <p className="mt-2 text-slate-400">A URL que você acessou não existe.</p>
      <Link href="/" className="mt-6 text-primary-500 hover:underline">
        Voltar ao início
      </Link>
    </div>
  )
}
