'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Shield, Star, Zap, Check, Quote, Camera, MessageCircle,
  Heart, BarChart3, Link2, Clock, Video, Lock, ChevronDown, Sparkles,
  Eye, Phone, ArrowRight, Users, TrendingUp, BadgeCheck,
} from 'lucide-react'

const testimonials = [
  { name: 'Juliana M.', location: 'São Paulo, SP', text: 'Meus contatos aumentaram mais de 200% no primeiro mês! O dashboard mostra tudo em tempo real — sei exatamente de onde vêm meus clientes.', rating: 5, plan: 'Ouro' },
  { name: 'Ana Paula', location: 'Rio de Janeiro, RJ', text: 'O link na bio mudou meu jogo. Coloquei no Instagram e os contatos não param. A plataforma é muito profissional e o suporte é excelente.', rating: 5, plan: 'Prata' },
  { name: 'Mariana S.', location: 'Belo Horizonte, MG', text: 'Comecei no plano grátis e em uma semana já fiz upgrade pro Bronze. Os stories e o sistema de verificação fazem toda a diferença na credibilidade.', rating: 5, plan: 'Bronze' },
  { name: 'Fernanda L.', location: 'Curitiba, PR', text: 'O que mais gosto é a privacidade. Tenho controle total sobre quem vê meu perfil. O painel é intuitivo e moderno.', rating: 5, plan: 'Ouro' },
]

const features = [
  { icon: Camera, title: 'Galeria HD Ilimitada', description: 'Upload de fotos em alta resolução com watermark automática para proteger suas imagens.', color: 'text-pink-500', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20' },
  { icon: Sparkles, title: 'Stories Dinâmicos', description: 'Publique stories que ficam ativos por 24h. Mostre seu dia-a-dia e engaje seus visitantes.', color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
  { icon: Link2, title: 'Link na Bio', description: 'Ganhe uma URL exclusiva cerejavip.com/@seunome para usar no Instagram, Twitter e mais.', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20' },
  { icon: BarChart3, title: 'Dashboard Analytics', description: 'Acompanhe visualizações, cliques, contatos e favoritos em tempo real no seu painel.', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
  { icon: MessageCircle, title: 'Chat Interno', description: 'Receba mensagens diretamente pela plataforma. Comunicação segura sem expor seu número.', color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
  { icon: Heart, title: 'Sistema de Favoritos', description: 'Clientes salvam seu perfil nos favoritos e voltam sempre. Fidelização automática.', color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' },
  { icon: BadgeCheck, title: 'Verificação de Perfil', description: 'Selo de autenticidade exclusivo que transmite confiança e aumenta seus contatos em até 3x.', color: 'text-sky-500', bgColor: 'bg-sky-500/10', borderColor: 'border-sky-500/20' },
  { icon: TrendingUp, title: 'Bump Automático', description: 'Seu perfil sobe periodicamente no ranking de busca, garantindo visibilidade constante.', color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
  { icon: Users, title: 'Filtros Avançados', description: 'Apareça para quem procura exatamente o que você oferece. Segmentação inteligente.', color: 'text-violet-500', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/20' },
  { icon: Clock, title: 'Agenda Online', description: 'Defina seu status online/offline com horários. Seus clientes sabem quando você está disponível.', color: 'text-teal-500', bgColor: 'bg-teal-500/10', borderColor: 'border-teal-500/20' },
  { icon: Video, title: 'Vídeos de Apresentação', description: 'Envie vídeos para mostrar seu diferencial. Mais engajamento que apenas fotos.', color: 'text-rose-500', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/20' },
  { icon: Lock, title: 'Privacidade Total', description: 'Controle quem vê o quê. Proteção contra prints e controle total sobre seus dados.', color: 'text-slate-400', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/20' },
]

const faqData = [
  { question: 'É grátis para anunciar?', answer: 'Sim! Você pode criar seu perfil gratuitamente e começar a receber contatos. O plano grátis inclui fotos, descrição completa e presença na busca. Para mais visibilidade e recursos premium, oferecemos planos pagos a partir de valores acessíveis.' },
  { question: 'Como funciona o pagamento dos planos?', answer: 'Aceitamos pagamento via PIX, que é instantâneo e seguro. Após a confirmação do pagamento, seu plano é ativado automaticamente e você já começa a usufruir dos benefícios imediatamente.' },
  { question: 'Posso cancelar ou trocar de plano a qualquer momento?', answer: 'Sim! Não existe fidelidade. Quando o período do seu plano expira, você pode renová-lo, fazer upgrade, downgrade ou simplesmente continuar no plano grátis. Sem burocracia.' },
  { question: 'Como funciona o selo de verificação?', answer: 'O selo de verificação é obtido após enviar uma selfie com documento para confirmação de identidade. O processo é rápido, sigiloso e aumenta consideravelmente a confiança dos seus clientes.' },
  { question: 'Meus dados estão seguros?', answer: 'Absolutamente. Utilizamos criptografia de ponta a ponta, não compartilhamos seus dados com terceiros e você tem controle total sobre o que é exibido no seu perfil. Sua privacidade é nossa prioridade.' },
  { question: 'Como recebo os contatos dos clientes?', answer: 'Os clientes podem entrar em contato diretamente pelo WhatsApp (com link direto), pelo chat interno da plataforma, por Telegram ou telefone — você escolhe quais canais exibir no seu perfil.' },
  { question: 'O que é o Link na Bio?', answer: 'É uma URL exclusiva (cerejavip.com/@seunome) que transforma seu perfil em um mini-site. Perfeito para colocar no Instagram, Twitter, TikTok e outras redes sociais. Seus seguidores acessam seu perfil completo com um clique.' },
  { question: 'Quanto tempo leva para meu perfil aparecer?', answer: 'Seu perfil fica disponível imediatamente após a criação. Se você tiver um plano pago, ele já aparece nos destaques e no topo das buscas assim que o pagamento é confirmado.' },
]

const steps = [
  { number: 1, title: 'Crie sua conta', description: 'Cadastro rápido e gratuito. Leva menos de 2 minutos.', icon: Users },
  { number: 2, title: 'Monte seu perfil', description: 'Adicione fotos, descrição, serviços e preços. Tudo personalizável.', icon: Camera },
  { number: 3, title: 'Escolha seu plano', description: 'Comece grátis ou escolha um plano para mais visibilidade e recursos.', icon: Star },
  { number: 4, title: 'Receba contatos', description: 'Clientes encontram você e entram em contato direto via WhatsApp ou chat.', icon: Phone },
]

const planStyles: Record<string, { color: string; textColor: string }> = {
  gratis: { color: 'border-slate-600', textColor: 'text-slate-400' },
  bronze: { color: 'border-amber-700', textColor: 'text-amber-600' },
  prata: { color: 'border-slate-400', textColor: 'text-slate-300' },
  ouro: { color: 'border-amber-400', textColor: 'text-amber-400' },
}

function formatPrice(price: number) {
  if (price <= 0) return 'Grátis'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)
}

type Plan = {
  slug: string
  name: string
  price_weekly?: number
  features?: string[]
  daily_bumps?: number
}

function FAQItem({ question, answer, open, onToggle }: { question: string; answer: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors">
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-800/50 transition-colors">
        <span className="text-lg font-medium text-white pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-6 pb-6"><p className="text-slate-400 leading-relaxed">{answer}</p></div>}
    </div>
  )
}

export default function AnunciantesPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/plans?enabledOnly=true')
      .then((r) => r.json())
      .then((data: Plan[]) => {
        const order = ['gratis', 'bronze', 'prata', 'ouro']
        const sorted = data
          .filter((p) => (p.slug === 'gratis' || p.slug === 'bronze' || p.slug === 'prata' || p.slug === 'ouro' || order.includes(p.slug)))
          .sort((a, b) => {
            const ai = order.indexOf(a.slug)
            const bi = order.indexOf(b.slug)
            if (ai === -1 && bi === -1) return (a.price_weekly || 0) - (b.price_weekly || 0)
            if (ai === -1) return 1
            if (bi === -1) return -1
            return ai - bi
          })
        setPlans(sorted)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-x-hidden">
      {/* Hero */}
      <section className="relative px-4 pt-8 pb-16 md:px-8 md:pt-12 md:pb-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-6xl">
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-primary-400 bg-primary-500/10 border border-primary-500/20 px-4 py-2">
              <Sparkles className="w-4 h-4" />
              Criação de perfil 100% grátis
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl leading-tight font-black tracking-tight mb-6">
            <span className="text-white">SUA </span>
            <span className="text-white">VITRINE </span>
            <span className="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">DIGITAL.</span>
          </h1>
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start md:items-end justify-between mt-8">
            <p className="text-lg md:text-xl text-slate-400 max-w-xl font-light leading-relaxed">
              A CerejaVIP é a plataforma completa para profissionais que querem <span className="text-white font-medium">maximizar sua visibilidade</span>, gerenciar contatos e construir uma presença online profissional — tudo em um só lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="group inline-flex h-14 items-center justify-center bg-white px-8 font-medium text-black transition-all hover:bg-primary-600 hover:text-white hover:scale-105"
              >
                <span className="mr-2 text-sm uppercase tracking-widest">Anunciar Grátis</span>
                <Zap className="w-5 h-5 transition-transform group-hover:rotate-12" />
              </Link>
              <Link
                href="/planos"
                className="inline-flex h-14 items-center justify-center border border-slate-600 px-8 text-sm uppercase tracking-widest text-slate-300 hover:bg-slate-800 hover:border-slate-500 transition-all"
              >
                Ver Planos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-16 md:py-24 px-4 md:px-8 border-t border-slate-800">
        <div className="max-w-5xl mx-auto">
          <p className="text-primary-500 tracking-widest uppercase text-sm font-bold mb-4">Simples e rápido</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-16">
            Como <span className="text-primary-500">funciona</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.number} className="flex flex-col items-center text-center">
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
      <section className="py-16 md:py-24 px-4 md:px-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <p className="text-primary-500 tracking-widest uppercase text-sm font-bold mb-4">Tudo que você precisa</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Funcionalidades <span className="text-primary-500">completas</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mb-16">
            Mais do que um simples anúncio. É uma plataforma profissional com ferramentas que realmente fazem diferença nos seus resultados.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className={`bg-slate-800/50 border ${feature.borderColor} p-6 h-full hover:bg-slate-800 transition-all group`}
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

      {/* Números */}
      <section className="py-16 md:py-24 px-4 md:px-8 border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-16">
            Números que <span className="text-primary-500">impressionam</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '2.500+', label: 'Perfis Ativos' },
              { value: '150K+', label: 'Views/mês' },
              { value: '45K+', label: 'Cliques/mês' },
              { value: '98%', label: 'Satisfação' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl md:text-6xl font-black text-white mb-2">{stat.value}</div>
                <div className="text-slate-400 text-sm uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="py-16 md:py-24 px-4 md:px-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <p className="text-primary-500 tracking-widest uppercase text-sm font-bold mb-4">Investimento</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Planos para cada <span className="text-primary-500">momento</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mb-16">
            Comece grátis e faça upgrade quando quiser. Sem fidelidade, sem burocracia.
          </p>
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${plans.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
            {plans.map((plan) => {
              const style = planStyles[plan.slug] || { color: 'border-slate-600', textColor: 'text-slate-400' }
              const isPopular = plan.slug === 'prata'
              const isFree = (plan.price_weekly || 0) <= 0
              const isTop = plan.slug === 'ouro'
              return (
                <div
                  key={plan.slug}
                  className={`relative border ${style.color} bg-slate-800/50 p-6 flex flex-col ${isPopular ? 'ring-1 ring-slate-400/50' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-3 py-1 tracking-wider uppercase">
                      Mais Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className={`text-xl font-bold ${style.textColor} mb-1`}>{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">
                        {isFree ? 'Grátis' : formatPrice(plan.price_weekly || 0)}
                      </span>
                      {!isFree && <span className="text-slate-500 text-sm">/semana</span>}
                      {isFree && <span className="text-slate-500 text-sm">para sempre</span>}
                    </div>
                  </div>
                  <ul className="space-y-3 mb-6 flex-grow">
                    {Array.isArray(plan.features) && plan.features.slice(0, 5).map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">{f}</span>
                      </li>
                    ))}
                    {plan.daily_bumps != null && plan.daily_bumps > 0 && (
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">{plan.daily_bumps} bump{plan.daily_bumps > 1 ? 's' : ''}/dia</span>
                      </li>
                    )}
                  </ul>
                  <Link
                    href={isFree ? '/register' : '/planos'}
                    className={`block text-center py-3 text-sm font-bold uppercase tracking-wider transition-all ${
                      isTop
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500'
                        : isPopular
                          ? 'bg-white text-black hover:bg-slate-200'
                          : 'border border-slate-600 text-white hover:bg-slate-700'
                    }`}
                  >
                    {isFree ? 'Criar Perfil' : 'Escolher Plano'}
                  </Link>
                </div>
              )
            })}
          </div>
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
            Trabalhamos com as melhores práticas de segurança digital para garantir sua tranquilidade.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: Lock, title: 'Dados Criptografados', description: 'Todas as suas informações são protegidas com criptografia de ponta a ponta. Nenhum dado é compartilhado com terceiros.' },
              { icon: BadgeCheck, title: 'Verificação de Identidade', description: 'Processo discreto e seguro de verificação. O selo de autenticidade aumenta sua credibilidade junto aos clientes.' },
              { icon: Eye, title: 'Controle de Privacidade', description: 'Você decide o que mostrar, para quem mostrar e quando mostrar. Proteção contra screenshots e controles granulares.' },
              { icon: MessageCircle, title: 'Suporte Dedicado', description: 'Equipe de suporte disponível para ajudar com qualquer dúvida ou necessidade. Atendimento humanizado e rápido.' },
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

      {/* Depoimentos */}
      <section className="py-16 md:py-24 px-4 md:px-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <p className="text-primary-500 tracking-widest uppercase text-sm font-bold mb-4">Depoimentos</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Quem usa, <span className="text-primary-500">recomenda</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mb-16">
            Histórias reais de profissionais que transformaram sua carreira com a CerejaVIP
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t, index) => (
              <div key={index} className="bg-slate-800/50 border border-slate-700 p-8 hover:border-slate-600 transition-all">
                <Quote className="w-8 h-8 text-primary-500/20 mb-4" />
                <p className="text-lg text-slate-300 mb-6 leading-relaxed italic">&quot;{t.text}&quot;</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-white">{t.name}</div>
                      <div className="text-sm text-slate-500">{t.location}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 ${
                    t.plan === 'Ouro' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    t.plan === 'Prata' ? 'bg-slate-500/10 text-slate-300 border border-slate-500/20' :
                    'bg-amber-700/10 text-amber-600 border border-amber-700/20'
                  }`}>
                    {t.plan}
                  </span>
                </div>
                <div className="flex gap-1 mt-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                  ))}
                </div>
              </div>
            ))}
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
          <div className="space-y-3">
            {faqData.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                open={faqOpen === index}
                onToggle={() => setFaqOpen(faqOpen === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-24 px-4 md:px-8 border-t border-slate-800 bg-slate-950 relative">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-primary-400 bg-primary-500/10 border border-primary-500/20 px-4 py-2 mb-8">
            <Zap className="w-4 h-4" />
            Comece em menos de 5 minutos
          </span>
          <h2 className="text-3xl md:text-6xl font-bold mb-6">
            Pronta para elevar seu nível?
          </h2>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Junte-se a mais de 2.500 profissionais que já escolheram a CerejaVIP. Crie seu perfil gratuitamente e comece a receber contatos hoje.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-10 py-5 text-lg font-bold uppercase tracking-widest hover:bg-primary-500 transition-all hover:scale-105"
            >
              <span>Criar Perfil Grátis</span>
              <Zap className="w-5 h-5 transition-transform group-hover:rotate-12" />
            </Link>
            <Link
              href="/planos"
              className="inline-flex items-center justify-center border border-slate-600 text-white px-10 py-5 text-lg font-bold uppercase tracking-widest hover:bg-slate-800 hover:border-slate-500 transition-all"
            >
              Ver Todos os Planos
            </Link>
          </div>
          <p className="text-slate-500 text-sm mt-8">
            Sem cartão de crédito · Sem fidelidade · Cancele quando quiser
          </p>
        </div>
      </section>
    </div>
  )
}
