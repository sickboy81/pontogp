import Link from 'next/link'
import {
  Shield, Star, Zap, Camera, MessageCircle,
  Heart, BarChart3, Link2, Clock, Video, Lock, Sparkles,
  Eye, Phone, ArrowRight, Users, TrendingUp, BadgeCheck, Palette,
} from 'lucide-react'
import AnunciantesFaq from '@/components/AnunciantesFaq'
import AnunciantesPlans from '@/components/AnunciantesPlans'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

const features = [
  { icon: Camera, title: 'Perfil com fotos', description: 'Monte sua apresentação com fotos, descrição, serviços, valores, regiões e formas de atendimento.', color: 'text-pink-500', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20' },
  { icon: Sparkles, title: 'Cereja Stories', description: 'Publique fotos ou vídeos que aparecem por 24 horas na home e no seu perfil.', color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
  { icon: Link2, title: 'Seu Link na Bio', description: 'Crie uma página compacta com endereço personalizado para divulgar nas suas redes sociais.', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20' },
  { icon: BarChart3, title: 'Estatísticas do perfil', description: 'Veja dados disponíveis para o seu plano. O Ouro libera a versão mais completa do analytics.', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
  { icon: MessageCircle, title: 'Mensagens internas', description: 'Receba mensagens dentro da plataforma e mantenha uma alternativa aos contatos externos.', color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
  { icon: Heart, title: 'Favoritos', description: 'Visitantes logados podem salvar seu anúncio e encontrá-lo novamente na lista de favoritos.', color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' },
  { icon: BadgeCheck, title: 'Verificação de perfil', description: 'Envie os documentos solicitados para análise e, após aprovação, exiba o selo de perfil verificado.', color: 'text-sky-500', bgColor: 'bg-sky-500/10', borderColor: 'border-sky-500/20' },
  { icon: TrendingUp, title: 'Bumps conforme o plano', description: 'Use a quantidade diária incluída no seu plano para atualizar a posição do perfil na listagem.', color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
  { icon: Users, title: 'Busca por localização e conteúdo', description: 'Seu perfil pode ser encontrado por cidade, estado, bairro, serviços, características e descrição.', color: 'text-violet-500', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/20' },
  { icon: Clock, title: 'Horários e status', description: 'Informe seus horários de atendimento e altere seu status entre online e offline.', color: 'text-teal-500', bgColor: 'bg-teal-500/10', borderColor: 'border-teal-500/20' },
  { icon: Video, title: 'Vídeo e áudio', description: 'Planos compatíveis permitem complementar o perfil com vídeo e áudio de apresentação.', color: 'text-rose-500', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/20' },
  { icon: Lock, title: 'Canais sob seu controle', description: 'Escolha se quer mostrar WhatsApp, Telegram ou telefone e mantenha apenas os canais que deseja usar.', color: 'text-slate-400', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/20' },
]

const faqData = [
  { question: 'É grátis para anunciar?', answer: 'Sim. O plano grátis permite publicar o perfil com até 3 fotos e acompanhar o total de visitas. Os planos pagos aumentam os limites de mídia, bumps e estatísticas.' },
  { question: 'Como funciona o pagamento dos planos?', answer: 'Os planos são pagos por PIX. Depois que o pagamento é confirmado, a plataforma aplica os recursos e o período correspondente ao plano escolhido.' },
  { question: 'Posso trocar ou renovar meu plano?', answer: 'Sim. Você pode escolher outro plano ou renovar quando precisar. Não existe renovação automática: perto do vencimento, a plataforma envia avisos para você renovar manualmente.' },
  { question: 'Como funciona o selo de verificação?', answer: 'Você envia os documentos solicitados pela área de verificação. O pedido fica pendente até a análise administrativa; o selo só aparece após a aprovação.' },
  { question: 'Posso escolher quais contatos aparecem?', answer: 'Sim. Você escolhe quais canais deseja exibir entre WhatsApp, Telegram e telefone. O chat interno também pode ser usado por visitantes logados.' },
  { question: 'Como recebo os contatos dos clientes?', answer: 'Os clientes podem entrar em contato diretamente pelo WhatsApp (com link direto), pelo chat interno da plataforma, por Telegram ou telefone — você escolhe quais canais exibir no seu perfil.' },
  { question: 'O que é o Link na Bio?', answer: 'É uma página compacta com URL personalizada no formato cerejavip.com/@usuario. Você escolhe o tema, a foto, a frase e os botões de contato ou redes sociais.' },
  { question: 'Quando meu perfil aparece no site?', answer: 'Depois de preencher os itens obrigatórios e adicionar pelo menos 3 fotos, clique em “Publicar perfil”. Enquanto isso, você pode manter tudo salvo como rascunho.' },
]

const steps = [
  { number: 1, title: 'Crie sua conta', description: 'Cadastre seus dados e confirme o endereço de email.', icon: Users },
  { number: 2, title: 'Monte seu perfil', description: 'Adicione fotos, descrição, serviços e preços. Tudo personalizável.', icon: Camera },
  { number: 3, title: 'Escolha seu plano', description: 'Comece grátis ou escolha um plano para mais visibilidade e recursos.', icon: Star },
  { number: 4, title: 'Publique quando estiver pronta', description: 'Revise as pendências e escolha entre publicar ou manter como rascunho.', icon: Phone },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqData.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE_URL}/` },
    { '@type': 'ListItem', position: 2, name: 'Anunciantes', item: `${SITE_URL}/anunciantes` },
  ],
}

export default function AnunciantesPage() {
  return (
    <div className="anunciantes-page min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero */}
      <section className="relative isolate overflow-hidden px-4 pb-20 pt-10 md:px-8 md:pb-28 md:pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(225,29,72,.24),transparent_35%),radial-gradient(circle_at_10%_80%,rgba(14,165,233,.12),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
          <div>
          <div className="mb-7">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-primary-400 bg-primary-500/10 border border-primary-500/20 px-4 py-2">
              <Sparkles className="w-4 h-4" />
              Crie e publique seu perfil gratuitamente
            </span>
          </div>
          <h1 className="mb-6 text-4xl font-black leading-[.98] tracking-tight md:text-6xl lg:text-7xl">
            <span className="text-white">SEU PERFIL, </span>
            <span className="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">DO SEU JEITO.</span>
          </h1>
          <div className="mt-8">
            <p className="max-w-xl text-lg font-light leading-relaxed text-slate-300 md:text-xl">
              Apresente seu trabalho com fotos, descrição, valores, localização aproximada e os contatos que você escolher. Tenha também <span className="text-white font-medium">Stories, Link na Bio e um painel para cuidar do anúncio</span> em um só lugar.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register?tipo=advertiser"
                className="group inline-flex h-14 items-center justify-center rounded-xl bg-primary-600 px-8 font-bold text-white shadow-xl shadow-primary-950/40 transition-all hover:-translate-y-0.5 hover:bg-primary-500"
              >
                <span className="mr-2 text-sm uppercase tracking-widest">Anunciar Grátis</span>
                <Zap className="w-5 h-5 transition-transform group-hover:rotate-12" />
              </Link>
              <Link
                href="/planos"
                className="inline-flex h-14 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-8 text-sm uppercase tracking-widest text-slate-200 transition-all hover:bg-white/10"
              >
                Ver Planos
              </Link>
            </div>
          </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-5 rounded-[2rem] bg-primary-600/20 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/20 bg-slate-800/80 p-2 shadow-2xl backdrop-blur-xl">
              <div className="overflow-hidden rounded-[1.55rem] bg-slate-100">
                <div className="flex items-center justify-between bg-slate-200 px-4 py-2 text-[10px] text-slate-500"><span>9:41</span><span className="flex gap-1"><span>●</span><span>●</span><span>▰</span></span></div>
                <div className="bg-gradient-to-b from-rose-100 via-white to-white px-5 pb-6 pt-7 text-center text-slate-900">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-900 shadow-lg"><img src="/logo-header.png" alt="CerejaVIP" className="w-16 object-contain" /></div>
                  <div className="mt-3 flex items-center justify-center gap-1"><p className="text-lg font-bold">Seu nome de perfil</p><BadgeCheck className="h-4 w-4 text-emerald-500" /></div>
                  <p className="text-xs text-slate-500">@usuario · Rio de Janeiro</p>
                  <p className="mx-auto mt-3 max-w-[230px] text-xs leading-relaxed text-slate-600">Sua frase de apresentação aparece aqui.</p>
                  <div className="mt-5 space-y-2.5"><div className="rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white shadow-sm">WhatsApp</div><div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm">Enviar mensagem</div><div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm">Instagram</div><div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm">Ver perfil completo</div></div>
                  <p className="mt-5 text-[10px] font-semibold text-primary-600">cerejavip.com/@usuario</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="border-t border-white/10 bg-white/[.03] px-4 py-16 md:px-8 md:py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-primary-500 tracking-widest uppercase text-sm font-bold mb-4">Simples e rápido</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-16">
            Como <span className="text-primary-500">funciona</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.number} className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/[.06] p-6 text-center lg:rounded-none lg:border-y-0 lg:border-l-0 lg:last:border-r">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                      <Icon className="w-9 h-9 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-black text-sm">
                      {step.number}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-[220px]">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="border-t border-white/10 px-4 py-16 md:px-8 md:py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-primary-500 tracking-widest uppercase text-sm font-bold mb-4">Tudo que você precisa</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Funcionalidades <span className="text-primary-500">completas</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mb-16">
            Recursos para montar, divulgar e administrar sua presença no site. Alguns limites e funcionalidades variam conforme o plano escolhido.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className={`group h-full rounded-2xl border ${feature.borderColor} bg-white/[.04] p-6 transition-all hover:-translate-y-1 hover:bg-white/[.08] hover:shadow-xl hover:shadow-black/20`}
                >
                  <div className={`w-12 h-12 ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Link na Bio */}
      <section className="anunciantes-link-bio-section border-t border-white/10 bg-gradient-to-br from-cyan-950/30 via-slate-950 to-primary-950/20 px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-widest text-cyan-500">Link na Bio</p>
            <h2 className="mb-6 text-3xl font-bold md:text-5xl">
              Um link só seu para <span className="text-primary-500">divulgar nas redes</span>
            </h2>
            <p className="max-w-2xl text-lg leading-relaxed text-slate-400">
              Crie um endereço no formato <strong className="font-semibold text-white">cerejavip.com/@usuario</strong> e reúna numa página compacta sua foto, frase de apresentação, contatos e redes sociais.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Palette, title: 'Escolha o visual', text: 'Use os temas disponíveis e personalize a cor dos botões.' },
                { icon: Link2, title: 'Organize seus links', text: 'Adicione contatos, redes sociais e links extras.' },
                { icon: Eye, title: 'Veja antes de salvar', text: 'A pré-visualização mostra como sua página vai ficar.' },
                { icon: ArrowRight, title: 'Leve ao perfil completo', text: 'Você pode manter um botão para abrir seu anúncio completo.' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="anunciantes-link-bio-card rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-black/10">
                    <Icon className="mb-3 h-6 w-6 text-cyan-500" />
                    <h3 className="font-bold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{item.text}</p>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="advertiser-link-bio-preview mx-auto w-full max-w-sm rounded-[2rem] border border-primary-400/40 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 p-5 shadow-2xl shadow-black/40">
            <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white/20 bg-slate-950 shadow-lg"><img src="/logo-header.png" alt="CerejaVIP" className="w-16 object-contain" /></div>
            <div className="mt-4 flex items-center justify-center gap-1"><p className="text-center text-xl font-bold text-white">Seu nome de perfil</p><BadgeCheck className="h-4 w-4 text-emerald-400" /></div>
            <p className="text-center text-xs text-slate-400">@usuario · Rio de Janeiro</p>
            <p className="mt-2 text-center text-sm text-slate-300">Sua frase de apresentação aparece aqui.</p>
            <div className="mt-6 space-y-3">
              {['WhatsApp', 'Enviar mensagem', 'Instagram', 'Ver perfil completo'].map((label) => (
                <div key={label} className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white">{label}</div>
              ))}
            </div>
            <p className="mt-5 text-center text-xs font-semibold text-primary-300">cerejavip.com/@usuario</p>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="border-t border-white/10 bg-white/[.03] px-4 py-16 md:px-8 md:py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-primary-500 tracking-widest uppercase text-sm font-bold mb-4">Investimento</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Planos para cada <span className="text-primary-500">momento</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mb-16">
            Comece no plano grátis e escolha um plano pago quando precisar de mais fotos, mídia, bumps ou estatísticas.
          </p>
          <AnunciantesPlans />
          <div className="text-center mt-8">
            <Link href="/planos" className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Ver comparação completa dos planos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Segurança */}
      <section className="py-16 md:py-24 px-4 md:px-8 border-t border-slate-800 bg-slate-900/30">
        <div className="max-w-5xl mx-auto text-center">
          <Shield className="w-16 h-16 text-primary-500 mx-auto mb-6" />
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Sua segurança é <span className="text-primary-500">prioridade</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-12">
            Você controla o que publica e quais canais de contato ficam visíveis. A plataforma também oferece denúncia, bloqueio e verificação de perfil.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: Lock, title: 'Contatos configuráveis', description: 'Você decide se deseja mostrar WhatsApp, Telegram ou telefone no perfil público.' },
              { icon: BadgeCheck, title: 'Verificação com análise', description: 'A solicitação fica pendente para análise e o selo só é exibido depois da aprovação.' },
              { icon: Eye, title: 'Localização aproximada', description: 'O mapa público apresenta uma localização aproximada, sem exigir a exibição do endereço exato.' },
              { icon: MessageCircle, title: 'Denúncia e bloqueio', description: 'Visitantes podem denunciar perfis e usuários podem bloquear conversas dentro da plataforma.' },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="bg-slate-800/50 border border-slate-700 p-8 hover:border-primary-500/30 transition-all">
                  <Icon className="w-10 h-10 text-primary-500 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 px-4 md:px-8 border-t border-slate-800">
        <div className="max-w-3xl mx-auto">
          <p className="text-primary-500 tracking-widest uppercase text-sm font-bold mb-4">Dúvidas</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-16">
            Perguntas <span className="text-primary-500">frequentes</span>
          </h2>
          <AnunciantesFaq items={faqData} />
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative overflow-hidden border-t border-white/10 bg-gradient-to-br from-primary-950 via-slate-950 to-slate-950 px-4 py-20 md:px-8 md:py-28">
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-primary-400 bg-primary-500/10 border border-primary-500/20 px-4 py-2 mb-8">
            <Zap className="w-4 h-4" />
            Comece pelo plano grátis
          </span>
          <h2 className="text-3xl md:text-6xl font-bold mb-6">
            Pronta para montar sua presença no CerejaVIP?
          </h2>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Crie sua conta, monte o perfil no seu ritmo e publique quando todos os itens obrigatórios estiverem preenchidos.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register?tipo=advertiser"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-10 py-5 text-lg font-bold uppercase tracking-widest text-white shadow-xl shadow-primary-950/50 transition-all hover:-translate-y-0.5 hover:bg-primary-500"
            >
              <span>Criar Perfil Grátis</span>
              <Zap className="w-5 h-5 transition-transform group-hover:rotate-12" />
            </Link>
            <Link
              href="/planos"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-10 py-5 text-lg font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10"
            >
              Ver Todos os Planos
            </Link>
          </div>
          <p className="text-slate-500 text-sm mt-8">
            Plano grátis disponível · Planos pagos por PIX · Sem renovação automática
          </p>
        </div>
      </section>
    </div>
  )
}
