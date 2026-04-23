export const metadata = {
  title: 'Diretrizes de Fotos e Vídeos',
  description: 'Regras para fotos e vídeos no CerejaVIP.',
}

export default function DiretrizesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-white">Diretrizes de Fotos e Vídeos</h1>
      <p className="mt-4 text-slate-300 leading-relaxed">
        Para manter a qualidade e segurança da plataforma, siga estas diretrizes ao publicar fotos e vídeos.
      </p>

      <section className="mt-8 space-y-6 text-slate-300 leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold text-white">Conteúdo permitido</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Fotos e vídeos que representem você de forma autêntica</li>
            <li>Imagens nítidas e bem iluminadas</li>
            <li>Conteúdo que respeite a legislação vigente</li>
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Não permitido</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Conteúdo de terceiros sem autorização</li>
            <li>Imagens de menores ou que simulem</li>
            <li>Violência, discurso de ódio ou conteúdo ilegal</li>
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Formatos e tamanhos</h2>
          <p className="mt-2">
            Consulte os limites do seu plano quanto ao número de fotos e vídeos. Formatos comuns (JPG, PNG, MP4) são aceitos.
          </p>
        </div>
      </section>
    </div>
  )
}
