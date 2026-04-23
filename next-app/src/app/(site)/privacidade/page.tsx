export const metadata = {
  title: 'Política de Privacidade',
  description: 'Política de privacidade do CerejaVIP. Saiba como coletamos, usamos e protegemos suas informações.',
}

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-white">Política de Privacidade</h1>
      <p className="mt-4 text-sm text-slate-500">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

      <div className="mt-6 space-y-8 text-slate-300 leading-relaxed">
        <section>
          <p>
            Esta Política de Privacidade descreve como o CerejaVIP coleta, utiliza, armazena e protege suas
            informações pessoais. Ao utilizar nossa plataforma, você concorda com as práticas descritas neste documento.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">1. Informações Coletadas</h2>
          <p className="mt-2">
            Coletamos as seguintes categorias de informações durante o uso da plataforma:
          </p>
          <ul className="mt-2 list-disc list-inside space-y-2 ml-4">
            <li><strong>Dados de cadastro:</strong> nome, endereço de e-mail, senha criptografada e data de nascimento</li>
            <li><strong>Dados de perfil:</strong> informações fornecidas voluntariamente, incluindo descrição pessoal, preferências, localização e dados de contato</li>
            <li><strong>Conteúdo publicado:</strong> fotografias, vídeos e mensagens enviadas através da plataforma</li>
            <li><strong>Dados de pagamento:</strong> informações processadas por provedores de pagamento terceirizados (não armazenamos dados completos de cartão de crédito)</li>
            <li><strong>Dados de navegação:</strong> endereço IP, tipo de navegador, sistema operacional, páginas visitadas e horários de acesso</li>
            <li><strong>Cookies e tecnologias similares:</strong> dados coletados automaticamente para melhorar a experiência do usuário</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">2. Finalidade do Tratamento de Dados</h2>
          <p className="mt-2">
            Utilizamos suas informações para as seguintes finalidades:
          </p>
          <ul className="mt-2 list-disc list-inside space-y-2 ml-4">
            <li>Criar, gerenciar e autenticar sua conta de usuário</li>
            <li>Possibilitar a publicação de perfis e conteúdo na plataforma</li>
            <li>Facilitar a comunicação entre usuários através de sistema de mensagens</li>
            <li>Processar transações e gerenciar assinaturas premium</li>
            <li>Personalizar sua experiência e exibir conteúdo relevante</li>
            <li>Enviar notificações importantes sobre sua conta e atualizações do serviço</li>
            <li>Garantir a segurança da plataforma e prevenir fraudes</li>
            <li>Cumprir obrigações legais e regulatórias</li>
            <li>Analisar o uso da plataforma para realizar melhorias técnicas e funcionais</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">3. Compartilhamento de Informações</h2>
          <p className="mt-2">
            Suas informações pessoais podem ser compartilhadas nas seguintes situações:
          </p>
          <ul className="mt-2 list-disc list-inside space-y-2 ml-4">
            <li><strong>Outros usuários:</strong> informações de perfil são visíveis para outros usuários conforme suas configurações de privacidade</li>
            <li><strong>Prestadores de serviços:</strong> compartilhamos dados com provedores de hospedagem, processamento de pagamentos, análise de dados e outros serviços essenciais</li>
            <li><strong>Obrigações legais:</strong> quando exigido por lei, ordem judicial ou requisição de autoridades competentes</li>
            <li><strong>Proteção de direitos:</strong> para proteger nossos direitos, segurança e propriedade, bem como de nossos usuários</li>
            <li><strong>Reorganização empresarial:</strong> em caso de fusão, aquisição ou venda de ativos, suas informações podem ser transferidas</li>
          </ul>
          <p className="mt-4 font-semibold">
            Não vendemos nem comercializamos suas informações pessoais para fins de marketing a terceiros.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">4. Cookies e Tecnologias de Rastreamento</h2>
          <p className="mt-2">
            Utilizamos cookies e tecnologias similares para:
          </p>
          <ul className="mt-2 list-disc list-inside space-y-2 ml-4">
            <li>Manter sua sessão ativa e recordar suas preferências</li>
            <li>Analisar padrões de uso e tráfego da plataforma</li>
            <li>Personalizar conteúdo e funcionalidades</li>
            <li>Garantir a segurança e prevenir acessos não autorizados</li>
          </ul>
          <p className="mt-4">
            Você pode configurar seu navegador para recusar cookies, porém isso pode prejudicar a funcionalidade
            completa da plataforma. Ao continuar navegando, você consente com o uso de cookies conforme descrito.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">5. Segurança dos Dados</h2>
          <p className="mt-2">
            Adotamos medidas técnicas e administrativas apropriadas para proteger suas informações contra acesso
            não autorizado, alteração, divulgação ou destruição. Estas medidas incluem criptografia de senhas,
            conexões seguras (HTTPS), controles de acesso e monitoramento de segurança.
          </p>
          <p className="mt-4">
            Entretanto, nenhum sistema de transmissão ou armazenamento de dados é completamente seguro. Embora
            nos esforcemos para proteger suas informações, não podemos garantir segurança absoluta contra todas
            as ameaças.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">6. Retenção de Dados</h2>
          <p className="mt-2">
            Mantemos suas informações pessoais pelo tempo necessário para cumprir as finalidades descritas nesta
            política, atender requisitos legais, resolver disputas e fazer cumprir nossos acordos.
          </p>
          <p className="mt-4">
            Quando você solicita a exclusão de sua conta, removeremos ou anonimizaremos suas informações pessoais,
            exceto quando a retenção for exigida por lei ou para fins legítimos de negócio.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">7. Direitos do Titular de Dados</h2>
          <p className="mt-2">
            De acordo com a Lei Geral de Proteção de Dados (LGPD), você possui os seguintes direitos:
          </p>
          <ul className="mt-2 list-disc list-inside space-y-2 ml-4">
            <li><strong>Acesso:</strong> solicitar informações sobre quais dados pessoais estão sendo tratados</li>
            <li><strong>Correção:</strong> requisitar a atualização ou correção de dados incompletos ou incorretos</li>
            <li><strong>Exclusão:</strong> solicitar a eliminação de dados pessoais, exceto quando a retenção for obrigatória</li>
            <li><strong>Portabilidade:</strong> requisitar a transferência de seus dados a outro prestador de serviço</li>
            <li><strong>Revogação de consentimento:</strong> retirar o consentimento para tratamento de dados, quando aplicável</li>
            <li><strong>Oposição:</strong> opor-se ao tratamento de dados em certas circunstâncias</li>
            <li><strong>Informação:</strong> receber informações sobre entidades com as quais compartilhamos seus dados</li>
          </ul>
          <p className="mt-4">
            Para exercer esses direitos, entre em contato através da página de contato da plataforma. Poderemos
            solicitar verificação de identidade antes de processar sua solicitação. Responderemos em prazo razoável,
            conforme estabelecido pela legislação aplicável.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">8. Proteção de Menores</h2>
          <p className="mt-2 font-semibold text-amber-400">
            A plataforma é destinada exclusivamente a pessoas com 18 anos ou mais. Não coletamos intencionalmente
            informações de menores de idade.
          </p>
          <p className="mt-4">
            Caso tomemos conhecimento de que coletamos dados de menores sem a devida autorização legal, tomaremos
            medidas imediatas para remover essas informações de nossos sistemas e encerrar a conta associada.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">9. Transferência Internacional de Dados</h2>
          <p className="mt-2">
            Seus dados podem ser transferidos e armazenados em servidores localizados fora do Brasil. Nesses casos,
            asseguramos que os provedores de serviço adotem medidas de proteção adequadas, em conformidade com as
            normas brasileiras de proteção de dados.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">10. Limitação de Responsabilidade</h2>
          <p className="mt-2">
            Embora adotemos medidas de segurança apropriadas, na extensão máxima permitida pela legislação aplicável,
            nossa responsabilidade em relação a:
          </p>
          <ul className="mt-2 list-disc list-inside space-y-2 ml-4">
            <li>Violações de segurança causadas por terceiros</li>
            <li>Acessos não autorizados resultantes de vulnerabilidades externas</li>
            <li>Uso indevido de informações compartilhadas voluntariamente com outros usuários</li>
            <li>Danos decorrentes do compartilhamento voluntário de informações sensíveis</li>
          </ul>
          <p className="mt-4">
            é limitada ao ressarcimento de danos diretos e comprovados, excluindo-se danos indiretos, lucros cessantes
            ou danos punitivos. O valor máximo de responsabilidade não excederá o valor pago pelo usuário nos últimos
            12 meses de uso da plataforma.
          </p>
          <p className="mt-4 font-semibold">
            Você é responsável por proteger suas credenciais de acesso e informações compartilhadas com outros usuários.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">11. Alterações nesta Política</h2>
          <p className="mt-2">
            Reservamo-nos o direito de modificar esta Política de Privacidade periodicamente para refletir mudanças
            em nossas práticas, legislação aplicável ou por outros motivos operacionais.
          </p>
          <p className="mt-4">
            Alterações significativas serão comunicadas através de aviso na plataforma ou por e-mail. O uso continuado
            da plataforma após alterações constitui aceitação da política revisada. Caso não concorde com as modificações,
            você deve cessar o uso e solicitar a exclusão de sua conta.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">12. Legislação Aplicável</h2>
          <p className="mt-2">
            Esta Política de Privacidade é regida pela Lei Geral de Proteção de Dados (Lei nº 13.709/2018) e demais
            normas aplicáveis da República Federativa do Brasil. Eventuais disputas serão submetidas à jurisdição
            dos tribunais brasileiros.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">13. Contato e Encarregado de Dados</h2>
          <p className="mt-2">
            Para questões relacionadas a esta Política de Privacidade, tratamento de dados pessoais ou exercício de
            seus direitos, entre em contato através da página de contato da plataforma ou pelos dados abaixo:
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

        <section>
          <h2 className="text-lg font-semibold text-white">14. Consentimento</h2>
          <p className="mt-2 font-semibold">
            Ao utilizar a plataforma CerejaVIP, você declara ter lido, compreendido e concordado com esta Política
            de Privacidade, consentindo com a coleta, uso e compartilhamento de suas informações conforme descrito.
          </p>
          <p className="mt-4">
            Caso não concorde com qualquer termo desta política, solicitamos que não utilize nossos serviços.
          </p>
        </section>
      </div>
    </div>
  )
}
