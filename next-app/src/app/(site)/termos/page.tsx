import Link from 'next/link'

export const metadata = {
  title: 'Termos de Uso',
  description: 'Leia os termos de uso do CerejaVIP. Ao usar a plataforma, você concorda com nossos termos e condições.',
  alternates: { canonical: '/termos' },
}

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-white">Termos de Uso</h1>
      <p className="mt-4 text-sm text-slate-500">Última atualização: 23/04/2026</p>

      <div className="mt-6 space-y-8 text-slate-300 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-white">1. Aceitação dos Termos</h2>
          <p className="mt-2">
            Ao acessar e utilizar a plataforma CerejaVIP, você concorda com estes Termos de Uso em sua totalidade.
            Caso não concorde com algum dos termos aqui apresentados, solicitamos que não utilize nossos serviços.
            A continuidade do uso da plataforma após eventuais alterações implica na aceitação automática dos novos termos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">2. Natureza do Serviço</h2>
          <p className="mt-2">
            O CerejaVIP é uma plataforma digital de intermediação que permite aos usuários criar perfis, publicar
            informações e estabelecer conexões com outros usuários. A plataforma atua exclusivamente como facilitadora
            do contato entre os usuários, não participando, organizando, validando ou garantindo qualquer interação,
            transação ou relacionamento estabelecido entre eles.
          </p>
          <p className="mt-4">
            Todas as interações, acordos e transações ocorrem diretamente entre os usuários, sendo de responsabilidade
            exclusiva das partes envolvidas.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">3. Limitação de Responsabilidade</h2>
          <p className="mt-2 font-semibold">
            O CerejaVIP, seus proprietários, administradores, desenvolvedores e afiliados não assumem responsabilidade
            por quaisquer eventos, danos ou prejuízos decorrentes do uso da plataforma.
          </p>
          <p className="mt-4">
            Esta limitação de responsabilidade inclui, mas não se limita a:
          </p>
          <ul className="mt-2 list-disc list-inside space-y-2 ml-4">
            <li>Interações entre usuários, incluindo encontros, prestação de serviços, transações comerciais e relacionamentos pessoais</li>
            <li>Veracidade de perfis, identidades falsas ou informações enganosas fornecidas por outros usuários</li>
            <li>Crimes ou contravenções, incluindo furtos, fraudes, agressões físicas ou verbais</li>
            <li>Questões relacionadas à saúde, incluindo doenças sexualmente transmissíveis</li>
            <li>Perdas financeiras ou problemas relacionados a transações de pagamento</li>
            <li>Violações de privacidade ou vazamento de informações pessoais</li>
            <li>Uso indevido de dados por terceiros</li>
            <li>Falhas técnicas, bugs, vulnerabilidades de segurança ou indisponibilidade do serviço</li>
            <li>Danos físicos, psicológicos, emocionais ou financeiros de qualquer natureza</li>
            <li>Decisões tomadas com base em informações obtidas através da plataforma</li>
          </ul>
          <p className="mt-4 font-semibold">
            O uso da plataforma ocorre por conta e risco exclusivos do usuário.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">4. Exclusão de Indenizações</h2>
          <p className="mt-2 font-semibold">
            Na extensão máxima permitida pela legislação aplicável, o CerejaVIP não oferecerá qualquer tipo de
            indenização, compensação, reembolso ou ressarcimento por danos decorrentes do uso da plataforma.
          </p>
          <p className="mt-4">
            Esta cláusula permanece válida independentemente de pagamentos efetuados pelo usuário, da natureza
            ou gravidade do dano, ou de eventuais determinações judiciais. Ao utilizar a plataforma, você
            expressamente concorda com esta limitação.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">5. Responsabilidades do Usuário</h2>
          <p className="mt-2">
            Ao utilizar a plataforma, você assume total responsabilidade por:
          </p>
          <ul className="mt-2 list-disc list-inside space-y-2 ml-4">
            <li>Verificar a identidade e idoneidade de outros usuários antes de estabelecer qualquer tipo de contato presencial</li>
            <li>Adotar todas as medidas de segurança pessoal necessárias</li>
            <li>Tomar precauções adequadas em encontros íntimos, incluindo o uso de proteção</li>
            <li>Confirmar a autenticidade das informações fornecidas por outros usuários</li>
            <li>Avaliar os riscos e decidir sobre encontros presenciais</li>
            <li>Negociar valores, serviços e condições diretamente com outros usuários</li>
            <li>Proteger seus bens pessoais e informações financeiras</li>
            <li>Manter a confidencialidade de suas informações pessoais e de acesso</li>
            <li>Cumprir todas as leis e regulamentações aplicáveis</li>
            <li>Confirmar que possui a maioridade legal e capacidade civil plena</li>
          </ul>
          <p className="mt-4 font-semibold">
            Qualquer violação legal ou problemas decorrentes de suas ações são de sua exclusiva responsabilidade.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">6. Condutas Proibidas</h2>
          <p className="mt-2">
            É expressamente vedado ao usuário:
          </p>
          <ul className="mt-2 list-disc list-inside space-y-2 ml-4">
            <li>Fornecer informações falsas ou criar perfis enganosos</li>
            <li>Utilizar imagens de terceiros sem autorização ou publicar conteúdo envolvendo menores de idade</li>
            <li>Promover, facilitar ou participar de atividades ilegais</li>
            <li>Assediar, ameaçar, intimidar ou agredir outros usuários</li>
            <li>Utilizar identidades falsas ou se passar por outras pessoas</li>
            <li>Tentar comprometer a segurança ou funcionalidade da plataforma</li>
            <li>Utilizar sistemas automatizados para acessar a plataforma sem autorização</li>
            <li>Envolver-se ou promover tráfico de pessoas, exploração ou qualquer forma de trabalho forçado</li>
            <li>Comercializar substâncias ilegais ou produtos proibidos</li>
          </ul>
          <p className="mt-4">
            A violação de qualquer uma destas condutas resultará no banimento imediato da conta, sem prejuízo
            de possível comunicação às autoridades competentes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">7. Moderação de Conteúdo</h2>
          <p className="mt-2">
            Reservamo-nos o direito de remover, sem aviso prévio ou justificativa, qualquer conteúdo publicado
            na plataforma, incluindo perfis, fotografias, vídeos, mensagens ou qualquer outra forma de informação.
            Da mesma forma, podemos suspender ou encerrar contas de usuários a qualquer momento, sem que isso
            gere direito a questionamentos ou reparações.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">8. Idade Mínima</h2>
          <p className="mt-2 font-semibold text-amber-400">
            A utilização da plataforma é restrita a pessoas com idade igual ou superior a 18 anos. Menores de
            idade estão terminantemente proibidos de acessar ou utilizar nossos serviços.
          </p>
          <p className="mt-4">
            Caso seja identificado o acesso ou cadastro de menores de idade, a conta será imediatamente banida
            e o caso será reportado às autoridades competentes. A falsificação de idade constitui violação grave
            destes termos e sujeita o responsável às penalidades legais aplicáveis.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">9. Segurança e Privacidade</h2>
          <p className="mt-2">
            Embora adotemos medidas de segurança razoáveis para proteger as informações dos usuários, não podemos
            garantir a segurança absoluta dos dados. Não nos responsabilizamos por acessos não autorizados,
            vazamentos de dados ou uso indevido de informações por terceiros.
          </p>
          <p className="mt-4">
            É responsabilidade do usuário proteger suas informações pessoais ao interagir com outros usuários
            da plataforma. Para mais detalhes, consulte nossa <Link href="/privacidade" className="text-primary-500 hover:underline">Política de Privacidade</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">10. Indenização</h2>
          <p className="mt-2">
            Ao utilizar a plataforma, você concorda em indenizar, defender e isentar o CerejaVIP, seus proprietários,
            administradores e afiliados de quaisquer reclamações, demandas, perdas, responsabilidades e despesas
            (incluindo honorários advocatícios) decorrentes do seu uso da plataforma ou violação destes termos.
          </p>
          <p className="mt-4">
            Eventuais disputas serão regidas pelas leis da República Federativa do Brasil e submetidas à
            jurisdição dos tribunais brasileiros.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">11. Disponibilidade do Serviço</h2>
          <p className="mt-2">
            A plataforma é fornecida &quot;no estado em que se encontra&quot; (as is), sem garantias de qualquer natureza,
            expressas ou implícitas. Não garantimos que o serviço será ininterrupto, livre de erros, seguro ou
            isento de vírus ou outros componentes prejudiciais.
          </p>
          <p className="mt-4">
            Não nos responsabilizamos por indisponibilidades, falhas técnicas, perda de dados ou qualquer outro
            problema relacionado ao funcionamento da plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">12. Alterações nos Termos</h2>
          <p className="mt-2">
            Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento, sem necessidade de
            aviso prévio. As alterações entrarão em vigor imediatamente após sua publicação na plataforma.
          </p>
          <p className="mt-4">
            O uso continuado da plataforma após alterações nos termos constitui aceitação das modificações.
            Caso não concorde com as alterações, você deve cessar imediatamente o uso da plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">13. Planos e Pagamentos</h2>
          <p className="mt-2">
            O CerejaVIP oferece diferentes modalidades de planos, gratuitos e pagos.
            Reservamo-nos o direito de alterar os preços, características, benefícios e disponibilidade
            de qualquer plano a qualquer momento, sem aviso prévio. Alterações de preço não afetarão
            períodos já pagos, mas serão aplicadas em renovações futuras ou novas contratações.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">14. Declaração de Ciência e Concordância</h2>
          <p className="mt-2 font-semibold">
            Ao utilizar a plataforma CerejaVIP, você declara expressamente que:
          </p>
          <ul className="mt-2 list-disc list-inside space-y-2 ml-4 font-semibold">
            <li>Leu, compreendeu e concorda integralmente com estes Termos de Uso</li>
            <li>Reconhece as limitações de responsabilidade da plataforma</li>
            <li>Aceita que não haverá indenizações ou compensações por danos</li>
            <li>Assume todos os riscos associados ao uso da plataforma</li>
            <li>Responsabiliza-se integralmente por suas ações e decisões</li>
            <li>Possui 18 anos ou mais e capacidade civil plena</li>
          </ul>
          <p className="mt-6 font-semibold">
            Caso não concorde com qualquer dos termos acima, você não está autorizado a utilizar a plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">15. Contato</h2>
          <p className="mt-2">
            Para esclarecimentos sobre estes Termos de Uso, entre em contato através da página de contato da plataforma.
          </p>
          <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <p className="font-semibold text-white">CerejaVIP</p>
            <p className="mt-2 text-slate-300">
              Prima Sursă Holding<br />
              Str. Petru Zadnipru, 7/1<br />
              MD-2044 - CHIȘINĂU<br />
              MOLDOVA
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-primary-500/50 bg-primary-900/20 p-6">
          <h2 className="text-lg font-semibold text-primary-400">Resumo</h2>
          <p className="mt-4 leading-relaxed">
            O CerejaVIP é uma plataforma de intermediação para adultos estabelecerem conexões. Atuamos exclusivamente
            como facilitadores, sem participar, validar ou garantir interações entre usuários.
          </p>
          <p className="mt-4 leading-relaxed">
            Não assumimos responsabilidade por eventos decorrentes do uso da plataforma e não oferecemos qualquer
            tipo de indenização. O usuário é integralmente responsável por suas ações, decisões e segurança.
            Todas as interações ocorrem por conta e risco do usuário.
          </p>
          <p className="mt-4 font-semibold">
            Utilize a plataforma com responsabilidade, adote medidas de segurança adequadas e esteja ciente de
            que todas as interações são exclusivamente entre usuários, sem envolvimento da plataforma.
          </p>
        </section>
      </div>
    </div>
  )
}
