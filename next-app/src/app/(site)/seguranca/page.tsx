export const metadata = {
  title: 'Segurança - Dicas para Acompanhantes e Clientes',
  description: 'Dicas de segurança para acompanhantes e clientes na CerejaVIP. Saiba como se proteger, verificar perfis e manter sua privacidade em encontros.',
  alternates: { canonical: '/seguranca' },
}

export default function SegurancaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-white">Dicas de Segurança</h1>
      <p className="mt-4 text-slate-300 leading-relaxed">
        Sua segurança é nossa prioridade. Siga estas orientações para uma experiência mais segura na plataforma.
      </p>

      <section className="mt-8 space-y-6 text-slate-300 leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold text-white">Para anunciantes</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Evite compartilhar endereço exato antes de conhecer o cliente</li>
            <li>Mantenha encontros em locais que você conhece</li>
            <li>Informe alguém de confiança sobre seus compromissos</li>
            <li>Use o chat interno da plataforma para primeira comunicação</li>
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Para visitantes</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Prefira perfis verificados</li>
            <li>Nunca faça pagamentos antecipados fora da plataforma</li>
            <li>Desconfie de ofertas irreais ou cobranças suspeitas</li>
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Denúncias</h2>
          <p className="mt-2">
            Encontrou algo inadequado ou suspeito? Entre em contato pelo formulário de contato e descreva o ocorrido.
          </p>
        </div>
      </section>
    </div>
  )
}
