import Link from 'next/link'
import { getPrioritySeoCities } from '@/lib/seo-cities'
import { SEO_STATES } from '@/lib/seo-states'

const SEO_QUICK_LINKS = [
  { href: '/?category=acompanhante&gender=mulher', label: 'Acompanhantes femininas' },
  { href: '/?category=acompanhante&gender=homem', label: 'Acompanhantes masculinos' },
  { href: '/?category=acompanhante&gender=trans', label: 'Acompanhantes trans' },
  { href: '/?category=massagista&gender=mulher', label: 'Massagistas femininas' },
  { href: '/?category=massagista&gender=homem', label: 'Massagistas masculinos' },
  { href: '/?category=online&gender=mulher', label: 'Atendimento online feminino' },
  { href: '/?category=online&gender=homem', label: 'Atendimento online masculino' },
  { href: '/?verified=true', label: 'Perfis verificados' },
]

export default function HomeSeoSection() {
  const priorityCities = getPrioritySeoCities()

  return (
    <section className="mt-16 border-t border-slate-800 pt-10 md:pt-14">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 md:p-10">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary-400">Explorar com precisão</p>
        <h3 className="text-2xl font-bold text-white md:text-3xl">
          Encontre perfis por <span className="text-primary-500">estado, categoria e estilo de atendimento</span>
        </h3>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-400 md:text-base">
          Use os filtros e atalhos para navegar por regiões do Brasil e refinar sua busca por tipo de serviço, gênero, faixa de preço e verificação.
          A proposta da CerejaVIP é facilitar uma busca mais objetiva, com perfis completos e atualização frequente.
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-500">
          Para conteúdo local e atalhos prontos, abra as páginas de{' '}
          <Link href="/cidade/sao-paulo-sp" className="text-primary-400 hover:text-primary-300">
            São Paulo
          </Link>
          ,{' '}
          <Link href="/cidade/rio-de-janeiro-rj" className="text-primary-400 hover:text-primary-300">
            Rio de Janeiro
          </Link>{' '}
          ou{' '}
          <Link href="/estado/minas-gerais-mg" className="text-primary-400 hover:text-primary-300">
            Minas Gerais
          </Link>
          ; a{' '}
          <Link href="/" className="text-primary-400 hover:text-primary-300">
            busca geral
          </Link>{' '}
          continua nesta página inicial.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold text-white">Buscar por estado</p>
            <div className="flex flex-wrap gap-2">
              {SEO_STATES.map((state) => (
                <Link
                  key={state.uf}
                  href={`/estado/${state.slug}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-primary-500 hover:text-white md:text-sm"
                >
                  <span className="font-semibold">{state.uf}</span>
                  <span className="text-slate-400">{state.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-white">Atalhos populares</p>
            <div className="flex flex-wrap gap-2">
              {SEO_QUICK_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  rel="nofollow"
                  className="inline-flex rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-primary-500 hover:text-white md:text-sm"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold text-white">Buscas por proximidade</p>
          <div className="flex flex-wrap gap-2">
            {[
              { href: '/acompanhantes-perto-de-mim', label: 'Acompanhantes perto de mim' },
              { href: '/massagistas-perto-de-mim', label: 'Massagistas perto de mim' },
              { href: '/acompanhantes-trans-perto-de-mim', label: 'Acompanhantes trans perto de mim' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-primary-500 hover:text-white md:text-sm"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold text-white">Cidades prioritárias</p>
          <div className="flex flex-wrap gap-2">
            {priorityCities.map((item) => (
              <Link
                key={`${item.state}-${item.city}`}
                href={`/cidade/${item.slug}`}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-primary-500 hover:text-white md:text-sm"
              >
                <span>{item.city}</span>
                <span className="font-semibold text-slate-400">{item.state}</span>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Também cobrimos mais cidades em todo o Brasil. Veja todas no rodapé ou pela busca.
          </p>
        </div>

        <div className="mt-8 space-y-3 text-sm leading-relaxed text-slate-400 md:text-base">
          <p>
            Perfis com fotos recentes, descrição clara e selo de verificação tendem a gerar mais confiança e melhores resultados de contato.
            Para quem anuncia, manter informações atualizadas ajuda no posicionamento dentro da plataforma e na conversão de visitas.
          </p>
          <p>
            Para quem busca, recomendamos combinar filtros de localização e categoria para encontrar resultados mais relevantes.
            Se preferir, você pode começar pela listagem completa de <Link href="/anunciantes" className="text-primary-400 hover:text-primary-300">anunciantes</Link> e depois refinar.
          </p>
          <p>
            Para aprender boas práticas de segurança, privacidade e divulgação local, consulte os{' '}
            <Link href="/guia" className="text-primary-400 hover:text-primary-300">
              guias da CerejaVIP
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
