import Link from 'next/link'

export const metadata = {
  title: 'Sobre o CerejaVIP - Plataforma de Acompanhantes Brasil',
  description: 'Conheça o CerejaVIP: plataforma de classificados para acompanhantes com perfis verificados, chat seguro, galeria HD e privacidade total. Presente em todas as capitais do Brasil.',
  alternates: { canonical: '/sobre' },
}

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-white">Sobre o CerejaVIP</h1>
      <p className="mt-6 text-slate-300 leading-relaxed">
        O CerejaVIP é uma plataforma de classificados premium voltada para profissionais de entretenimento adulto. 
        Nosso objetivo é oferecer um ambiente seguro, discreto e profissional para divulgação de perfis e conexão com clientes.
      </p>
      <h2 className="mt-8 text-xl font-semibold text-white">O que oferecemos</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-300">
        <li>Perfis profissionais com fotos, vídeos e descrições detalhadas</li>
        <li>Chat interno para comunicação direta e segura</li>
        <li>Planos flexíveis (grátis e pagos) para maior visibilidade</li>
        <li>Verificação de identidade para maior credibilidade</li>
        <li>Suporte e orientação para anunciantes</li>
      </ul>
      <h2 className="mt-8 text-xl font-semibold text-white">Compromisso</h2>
      <p className="mt-3 text-slate-300 leading-relaxed">
        Respeitamos a privacidade e a segurança de todos os usuários. Nossa equipe trabalha para manter a plataforma 
        livre de conteúdos inadequados e fraudes, prezando sempre pelo bom relacionamento entre anunciantes e visitantes.
      </p>
      <p className="mt-6">
        <Link href="/contato" className="text-primary-500 hover:underline">
          Entre em contato →
        </Link>
      </p>
    </div>
  )
}
