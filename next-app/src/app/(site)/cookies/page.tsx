import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Aviso de Cookies',
  description: 'Como a CerejaVIP utiliza cookies e tecnologias semelhantes.',
}

export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-slate-200 sm:py-16">
      <h1 className="text-3xl font-bold text-white">Aviso de Cookies</h1>
      <p className="mt-4 text-slate-400">Última atualização: 5 de agosto de 2026</p>
      <div className="mt-8 space-y-6 leading-relaxed text-slate-300">
        <section><h2 className="text-xl font-semibold text-white">O que são cookies?</h2><p className="mt-2">Cookies são pequenos arquivos armazenados no dispositivo para manter o site funcionando, lembrar preferências e entender como os recursos são utilizados.</p></section>
        <section><h2 className="text-xl font-semibold text-white">Como usamos</h2><p className="mt-2">A CerejaVIP utiliza cookies necessários para autenticação, segurança, sessão e preferências básicas. Cookies opcionais somente são utilizados quando autorizados nas configurações de consentimento.</p></section>
        <section><h2 className="text-xl font-semibold text-white">Suas escolhas</h2><p className="mt-2">Você pode aceitar todos os cookies ou salvar apenas os necessários e suas preferências. Também pode apagar cookies nas configurações do navegador. A recusa de cookies opcionais não impede o uso básico do site.</p></section>
        <section><h2 className="text-xl font-semibold text-white">LGPD e privacidade</h2><p className="mt-2">O tratamento de dados pessoais segue a nossa <Link href="/privacidade" className="text-primary-400 hover:underline">Política de Privacidade</Link>. Para dúvidas ou solicitações relacionadas aos seus dados, utilize a página de <Link href="/contato" className="text-primary-400 hover:underline">Contato</Link>.</p></section>
      </div>
    </main>
  )
}
