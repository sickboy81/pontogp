# Experiência Premium, Cadastro e Controles Operacionais

Data: 2026-06-14

## Objetivo

Melhorar a apresentação e a experiência dos perfis sem alterar a identidade
visual do CerejaVIP, corrigir comportamentos de presença e stories, separar os
fluxos de cadastro e adicionar controles administrativos seguros para as
mensagens internas.

O trabalho preserva a aplicação Next.js atual, o PocketBase e a paleta
vermelho/slate. Não recria funcionalidades da aplicação Vite legada.

## Escopo

1. Cabeçalho que reage à direção da rolagem.
2. Perfil público com composição Híbrida Premium.
3. Efeitos visuais discretos no perfil.
4. Controle global das mensagens internas no admin.
5. Correção e validação da presença online.
6. Separação clara entre cadastro de anunciante e cliente.
7. Validação das curtidas e comentários dos stories.
8. Bio mínima de 700 caracteres para publicar.
9. Política pública coerente após expiração do perfil.

## Abordagem

A implementação será incremental e centralizada. Reutilizará as coleções,
rotas e componentes existentes, extraindo apenas regras compartilhadas que
precisam ser aplicadas em mais de uma superfície. Regras de segurança e
publicação serão obrigatórias no servidor; a interface apenas antecipará e
explicará essas validações.

Uma solução limitada à interface foi rejeitada porque poderia ser contornada
por chamadas diretas às APIs. Uma reestruturação completa do schema foi
rejeitada por aumentar o risco sem necessidade.

## Cabeçalho por direção de rolagem

`SiteHeader` continuará `sticky`, mas controlará um estado visível/oculto:

- permanece visível no topo da página;
- ao rolar para baixo além de um pequeno limiar, recolhe com transição vertical;
- ao rolar para cima, reaparece imediatamente;
- não recolhe enquanto menu, drawer ou seletor de localização estiver aberto;
- ao mudar de rota, volta ao estado visível;
- o comportamento será priorizado no mobile, mas também funcionará no desktop;
- a transição respeitará `prefers-reduced-motion`.

O detector deve ignorar pequenas oscilações para evitar tremulação em
navegadores móveis.

## Perfil Híbrido Premium

A direção aprovada é a opção C do mockup:

- galeria/foto principal dominante;
- nome, localização, idade, verificação, destaque e presença sobre a imagem;
- resumo de preço, quantidade de mídia e indicadores relevantes logo abaixo;
- ações de contato e mensagem em posição de alta visibilidade;
- painel compacto para disponibilidade e atributos importantes;
- bio e demais informações organizadas em blocos editoriais;
- galeria secundária com melhor ritmo visual;
- barra fixa de contato no mobile preservada e refinada.

As cores atuais serão mantidas. A percepção Premium virá de hierarquia,
espaçamento, tipografia, profundidade, bordas, gradientes e composição, não de
uma nova paleta.

### Efeitos

- entrada escalonada dos blocos na primeira renderização;
- zoom e deslocamento muito leves nas imagens em hover;
- brilho vermelho discreto em perfis de destaque;
- pulso limitado no indicador online;
- transições suaves na galeria e nas ações;
- nenhuma animação deve bloquear interação ou causar mudança de layout;
- com `prefers-reduced-motion`, os efeitos serão removidos ou reduzidos.

Os efeitos não criarão novos campos de personalização por perfil nesta etapa.

## Mensagens internas

Será usada uma configuração em `settings` com a chave
`internal_messages` e valor:

```json
{
  "enabled": true,
  "notice": ""
}
```

O admin poderá:

- ligar ou desligar globalmente o envio de mensagens;
- escrever um aviso livre, como manutenção temporária;
- salvar ambos em uma operação autenticada por `requireAdmin()`.

Quando desativado:

- conversas antigas continuam disponíveis somente para leitura;
- `POST /api/messages` bloqueia novas mensagens no servidor;
- os campos e botões de envio ficam desabilitados;
- botões que iniciam uma conversa exibem ou conduzem ao aviso;
- a página de mensagens mostra o texto configurado;
- leitura, marcação como lida e bloqueio de usuário continuam funcionando;
- o painel administrativo de auditoria continua acessível.

A rota pública de leitura da configuração retornará apenas `enabled` e
`notice`, sem dados sensíveis. Haverá cache curto ou ausência de cache para que
uma manutenção entre em vigor rapidamente.

## Presença online

O modelo atual (`is_online` e `online_until`) será preservado. O estado efetivo
é online somente quando:

```text
is_online = true
e
online_until está vazio ou no futuro
```

Correções:

- centralizar o cálculo para listagem, perfil e dashboard;
- o dashboard atualizará automaticamente quando `online_until` vencer;
- ao ativar, a resposta da API será usada como fonte de verdade;
- ao desativar, `is_online` será falso e `online_until` será limpo;
- datas inválidas serão tratadas como offline;
- a interface mostrará o horário ou tempo restante quando útil;
- nenhuma presença será inferida apenas por login ou atividade no navegador.

Testes cobrirão estado ativo, vencido, sem prazo, data inválida e transição
automática no cliente.

## Cadastro de anunciante e cliente

`/register` começará com uma escolha explícita em dois cartões:

- **Quero anunciar**: explica criação de perfil, fotos, publicação e planos;
- **Quero encontrar anunciantes**: explica favoritos, mensagens e navegação.

Após a escolha:

- o formulário mantém a função selecionada visível;
- textos, título, chamada principal e destino pós-verificação serão específicos;
- será possível voltar e trocar o tipo antes de enviar;
- internamente permanecem os papéis `advertiser` e `user`;
- validação, autenticação e coleção de usuários permanecem unificadas;
- links como “Anunciar grátis” abrirão diretamente o fluxo de anunciante;
- entradas genéricas poderão abrir a escolha inicial.

Não haverá duas implementações de autenticação.

## Stories

As rotas existentes de curtidas e comentários serão mantidas, mas receberão
contratos e testes explícitos:

- visitante pode consultar contagens e comentários permitidos;
- somente usuário autenticado pode curtir ou comentar;
- curtir funciona como alternância idempotente por usuário e story;
- não pode existir mais de uma curtida do mesmo usuário na mesma story;
- comentário vazio ou acima de 500 caracteres é rejeitado;
- story inexistente ou indisponível não aceita nova interação;
- contagens do viewer e do dashboard permanecem consistentes;
- erros do PocketBase não devem ser convertidos silenciosamente em sucesso.

As regras reais das coleções `story_likes` e `story_comments` serão comparadas
com `pocketbase-schema.json`. Se precisarem mudar, o schema será aplicado,
reexportado e validado pelos scripts oficiais.

## Bio mínima para publicação

Rascunhos podem ser salvos com bio vazia ou incompleta. Publicação exige pelo
menos 700 caracteres úteis após `trim`.

A regra será centralizada junto às regras de publicação:

- constante compartilhada `MIN_PROFILE_BIO_LENGTH = 700`;
- validação obrigatória em `POST /api/profiles/[id]/publish`;
- a rota carregará a bio atual diretamente do PocketBase;
- o formulário mostrará contador e mensagem do que falta;
- o botão de publicação explicará todas as pendências;
- editar um perfil já ativo não o despublicará automaticamente por possuir bio
  antiga menor que 700 caracteres;
- se um perfil ativo antigo for despublicado e voltar a publicar, a nova regra
  será exigida.

Fotos mínimas e contato público obrigatório continuam válidos.

## Expiração e visibilidade pública

`search_expires_at` define a idade da expiração da busca. A política aprovada é:

- de 0 até completar 7 dias: perfil continua nas buscas e no link direto com
  fotos normais;
- após completar 7 dias e até completar 30 dias: continua nas buscas e no link
  direto como indisponível, com fotos desfocadas;
- ao completar 30 dias: sai de todas as buscas, páginas de cidade, estado,
  sitemaps e listagens relacionadas;
- de 30 até completar 90 dias: o link direto continua acessível como perfil
  indisponível, com fotos desfocadas;
- ao completar 90 dias: deixa de ser servido publicamente e pode ser marcado
  como `archived`, preservando dados para administração e eventual renovação.

`contact_expires_at` é independente:

- enquanto estiver válido, contatos permanecem visíveis, inclusive nos
  primeiros sete dias após vencer a busca;
- quando vencer, contatos e início de mensagem pelo perfil ficam indisponíveis;
- contatos nunca reaparecem apenas porque o perfil ainda está na janela pública.

A política armazenada em `settings.profile_visibility_policy` passará a
representar explicitamente as três janelas, evitando nomes ambíguos. A
implementação deve distinguir filtro de listagem, apresentação indisponível e
janela de link direto.

O script `next-app/scripts/cleanup_profiles.mjs` atualmente arquiva no primeiro
instante após `search_expires_at` e muda status após `contact_expires_at`. Ele
não está agendado no Dockerfile e não deve ser ativado como está. Antes de
qualquer agendamento, será reescrito para obedecer às janelas acima e testado
sem apagar uploads ou registros.

## Componentes e limites

Unidades previstas:

- hook isolado para direção de rolagem do cabeçalho;
- componentes de hero, resumo, ações e seções do perfil;
- helper compartilhado para presença efetiva;
- helper compartilhado para publicação da bio;
- helper compartilhado para ciclo de visibilidade;
- serviço de configuração das mensagens;
- componentes de seleção e formulário de cadastro;
- contratos testáveis das interações de stories.

Não será feita refatoração ampla do dashboard, autenticação, pagamentos ou
auto bump. O auto bump continuará usando suas regras atuais de elegibilidade.

## Erros e estados vazios

- Falha ao carregar uma configuração global não deve liberar envio se o
  servidor souber que o recurso está desligado.
- Falhas de envio de mensagem, curtida ou comentário mostrarão erro acionável.
- O formulário de publicação exibirá conjuntamente bio, fotos e contato
  pendentes.
- Perfis indisponíveis manterão contexto suficiente para renovação, sem expor
  contatos vencidos.
- A interface de cadastro preservará os dados já preenchidos ao voltar para a
  escolha de papel.

## Verificação

Verificações obrigatórias:

```bash
cd next-app
npm run test
npm run lint
npm run build
```

Também serão realizados:

- testes unitários das regras de publicação, presença e expiração;
- testes das APIs administrativas e públicas de configuração de mensagens;
- testes das APIs de stories;
- validação manual mobile e desktop do cabeçalho, perfil e cadastro;
- validação de `prefers-reduced-motion`;
- smoke local com servidor ativo;
- após deploy, `SMOKE_BASE_URL=https://cerejavip.com npm run smoke:critical`;
- confirmação de que as listagens e o link direto respeitam exatamente 7, 30
  e 90 dias;
- confirmação de que mensagens desligadas não podem ser enviadas por chamada
  direta à API.

Mudanças de schema exigirão `npm run schema`, versionamento do JSON e
`npm run schema:check`.

## Fora do escopo

- chat em tempo real por WebSocket;
- presença automática baseada em atividade;
- temas de cor novos;
- efeitos configuráveis individualmente pelo anunciante;
- reescrita do sistema de autenticação;
- exclusão automática de dados ou uploads aos 90 dias;
- mudanças no pagamento PIX, planos ou cotas de bump.
