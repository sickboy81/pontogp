import Link from 'next/link'
import { AlertTriangle, CheckCircle2, FileVideo, ImageIcon, ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'Diretrizes de Fotos e Vídeos',
  description: 'Orientações do CerejaVIP para publicar fotos e vídeos no perfil.',
}

const photoRules = [
  'Publique imagens suas ou que você tenha autorização para usar.',
  'Use fotos nítidas, bem iluminadas e que representem o perfil atual.',
  'Não inclua menores de idade, situações que simulem menores ou qualquer conteúdo ilegal.',
  'Evite fotos com telefone, endereço, links, marcas d’água ou divulgação de outro site.',
  'Não use montagens enganosas, imagens geradas por inteligência artificial ou fotos de catálogo como se fossem suas.',
]

const videoRules = [
  'Envie apenas vídeos em que você tenha autorização para aparecer e publicar.',
  'O arquivo deve estar em MP4, WebM, MOV ou MKV e ter no máximo 50 MB.',
  'Prefira vídeos nítidos, com boa iluminação e áudio compreensível quando houver som.',
  'Não publique conteúdo com menores, violência, ameaças, exploração ou qualquer prática ilegal.',
  'Não inclua telefone, endereço, links, marcas d’água ou divulgação de outro site.',
]

function RuleList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function DiretrizesPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-xl shadow-slate-950/20 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-400">Publicação responsável</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Fotos e vídeos no seu perfil</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Estas orientações ajudam a manter o conteúdo claro, autêntico e seguro para quem anuncia e para quem visita o CerejaVIP. Leia antes de enviar sua mídia.
            </p>
          </div>
          <ShieldCheck className="hidden h-12 w-12 shrink-0 text-primary-400 sm:block" aria-hidden="true" />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-slate-700 bg-slate-950/30 p-5" aria-labelledby="fotos-title">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-pink-500/15 p-2 text-pink-300"><ImageIcon className="h-5 w-5" /></span>
              <div>
                <h2 id="fotos-title" className="font-semibold text-white">Fotos</h2>
                <p className="text-xs text-slate-500">A primeira imagem será a principal do perfil.</p>
              </div>
            </div>
            <RuleList items={photoRules} />
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-950/30 p-5" aria-labelledby="videos-title">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-violet-500/15 p-2 text-violet-300"><FileVideo className="h-5 w-5" /></span>
              <div>
                <h2 id="videos-title" className="font-semibold text-white">Vídeos</h2>
                <p className="text-xs text-slate-500">Limite técnico de 50 MB por arquivo.</p>
              </div>
            </div>
            <RuleList items={videoRules} />
          </section>
        </div>

        <div className="mt-5 flex gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
          <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-300" />
          <p>O envio não garante a publicação. Conteúdos podem ser recusados ou removidos quando violarem estas regras, os Termos de Uso ou a legislação aplicável.</p>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/dashboard/perfil" className="rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600">
            Voltar para editar perfil
          </Link>
          <Link href="/termos" className="rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-400 hover:text-white">
            Consultar Termos de Uso
          </Link>
        </div>
      </div>
    </div>
  )
}
