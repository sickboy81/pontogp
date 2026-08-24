import Link from 'next/link'
import { ArrowRight, BadgeCheck, CircleAlert, LockKeyhole, MapPin, MessageCircle, PhoneCall, ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'Segurança - Dicas para Acompanhantes e Clientes',
  description: 'Orientações práticas para usar a CerejaVIP com mais segurança: proteger sua privacidade, reconhecer golpes, conversar e denunciar problemas.',
  alternates: { canonical: '/seguranca' },
}

export default function SegurancaPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-14">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="bg-gradient-to-br from-rose-50 via-white to-amber-50 px-6 py-10 dark:from-rose-950/50 dark:via-slate-900 dark:to-slate-900 sm:px-10 sm:py-14">
          <div className="flex max-w-3xl items-start gap-4">
            <div className="rounded-2xl bg-rose-600 p-3 text-white shadow-lg shadow-rose-600/20"><ShieldCheck className="h-7 w-7" aria-hidden="true" /></div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">CerejaVIP • Segurança</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">Mais segurança em cada conversa</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">Algumas atitudes simples ajudam a proteger sua privacidade, seu dinheiro e seu bem-estar antes, durante e depois de qualquer encontro.</p>
            </div>
          </div>
          <nav aria-label="Nesta página" className="mt-8 flex flex-wrap gap-2">
            {['Antes de combinar', 'Durante o encontro', 'Golpes e pagamentos', 'Denunciar'].map((item) => <a key={item} href={`#${item.toLowerCase().replaceAll(' ', '-')}`} className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-400 hover:text-rose-700 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:text-rose-300">{item}</a>)}
          </nav>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Princípios de segurança">
        {[
          { icon: LockKeyhole, title: 'Proteja seus dados', text: 'Compartilhe somente o necessário e evite publicar endereço exato ou documentos em conversas.' },
          { icon: MessageCircle, title: 'Converse com calma', text: 'Use o chat interno para alinhar expectativas e manter o histórico da conversa.' },
          { icon: CircleAlert, title: 'Confie no seu alerta', text: 'Se algo parecer estranho, interrompa o contato, bloqueie e denuncie.' },
        ].map(({ icon: Icon, title, text }) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"><Icon className="h-6 w-6 text-rose-600 dark:text-rose-400" aria-hidden="true" /><h2 className="mt-4 font-bold text-slate-950 dark:text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p></div>)}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <SafetyCard id="antes-de-combinar" icon={MapPin} title="Antes de combinar" tone="rose"><Bullet>Confira idade, cidade, fotos, descrição e formas de contato do perfil.</Bullet><Bullet>Prefira perfis com verificação pública quando essa informação estiver disponível.</Bullet><Bullet>Não envie documentos, senhas, códigos de confirmação ou dados bancários.</Bullet><Bullet>Avise uma pessoa de confiança sobre o local e o horário combinados.</Bullet></SafetyCard>
        <SafetyCard id="durante-o-encontro" icon={ShieldCheck} title="Durante o encontro" tone="amber"><Bullet>Escolha um local que você conheça e mantenha uma forma segura de voltar.</Bullet><Bullet>Combine limites e valores antes. Você pode mudar de ideia a qualquer momento.</Bullet><Bullet>Se sentir pressão, ameaça ou desconforto, encerre a situação e procure ajuda.</Bullet><Bullet>Não aceite guardar objetos, transportar valores ou fazer algo que não foi combinado.</Bullet></SafetyCard>
        <SafetyCard id="golpes-e-pagamentos" icon={LockKeyhole} title="Golpes e pagamentos" tone="slate"><Bullet>Desconfie de urgência artificial, promessas irreais e pedidos de pagamento antecipado para liberar um contato.</Bullet><Bullet>Nunca compartilhe códigos recebidos por SMS, email ou aplicativo de banco.</Bullet><Bullet>Confira o destinatário antes de qualquer transferência e guarde comprovantes.</Bullet><Bullet>Se alguém se passar pela CerejaVIP, não pague: salve as provas e denuncie.</Bullet></SafetyCard>
        <SafetyCard id="denunciar" icon={CircleAlert} title="Encontrou um problema?" tone="red"><p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Use o botão <strong className="text-slate-900 dark:text-white">Denunciar perfil</strong> na página do anúncio para enviar o caso à moderação. Inclua o máximo de contexto possível, sem expor dados pessoais desnecessários.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/anunciantes" className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700">Ver anunciantes <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><Link href="/contato" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-rose-400 hover:text-rose-700 dark:border-slate-600 dark:text-slate-200 dark:hover:text-rose-300">Falar com suporte <PhoneCall className="h-4 w-4" aria-hidden="true" /></Link></div></SafetyCard>
      </section>

      <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/60 dark:bg-amber-950/30 sm:p-6"><div className="flex gap-3"><BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" /><div><h2 className="font-bold text-amber-950 dark:text-amber-100">Em uma emergência</h2><p className="mt-1 text-sm leading-6 text-amber-900/80 dark:text-amber-200/80">A CerejaVIP não substitui os serviços de emergência. Em risco imediato, afaste-se do local e procure as autoridades e os serviços públicos da sua região.</p></div></div></section>
    </main>
  )
}

function Bullet({ children }: { children: React.ReactNode }) { return <li className="pl-1 text-sm leading-6 text-slate-600 marker:text-rose-600 dark:text-slate-300">{children}</li> }

function SafetyCard({ id, icon: Icon, title, tone, children }: { id: string; icon: typeof MapPin; title: string; tone: 'rose' | 'amber' | 'slate' | 'red'; children: React.ReactNode }) {
  const toneClasses = { rose: 'border-rose-200 dark:border-rose-900/60', amber: 'border-amber-200 dark:border-amber-900/60', slate: 'border-slate-200 dark:border-slate-700', red: 'border-red-200 dark:border-red-900/60' }[tone]
  return <article id={id} className={`scroll-mt-24 rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-900 ${toneClasses}`}><div className="flex items-center gap-3"><div className="rounded-xl bg-slate-100 p-2.5 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><Icon className="h-5 w-5" aria-hidden="true" /></div><h2 className="text-xl font-bold text-slate-950 dark:text-white">{title}</h2></div><ul className="mt-5 list-disc space-y-2 pl-5">{children}</ul></article>
}
