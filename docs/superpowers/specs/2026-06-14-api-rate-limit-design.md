# Rate limit da API

## Objetivo

Reduzir abuso que alcance a aplicacao, como spam, automacao de acoes, criacao
repetida de cobrancas e processamento excessivo de uploads. O rate limit da
aplicacao complementa a protecao da Cloudflare, mas nao substitui mitigacao de
DDoS volumetrico no proxy ou firewall.

## Arquitetura

O projeto tera um modulo compartilhado de rate limit em memoria, adequado ao
deploy atual com uma unica instancia Next.js. O modulo deve:

- usar janelas fixas por chave;
- retornar limite, quantidade restante e instante de reset;
- remover buckets expirados para impedir crescimento indefinido;
- permitir relogio injetavel nos testes;
- gerar respostas HTTP 429 com `Retry-After` e cabecalhos informativos.

O armazenamento ficara isolado da interface usada pelas rotas para permitir
migracao futura para Redis sem alterar cada endpoint.

## Identificacao do cliente

O identificador por IP deve priorizar `cf-connecting-ip`, pois a producao usa
Cloudflare. Na ausencia dele, usar o primeiro endereco de `x-forwarded-for`,
depois `x-real-ip`. Valores ausentes ou malformados devem cair em uma chave
controlada, sem permitir que cabecalhos arbitrarios criem buckets ilimitados.

Quando houver usuario autenticado, operacoes sensiveis devem combinar o escopo
da rota com o ID do usuario. O IP permanece como protecao secundaria para
reduzir abuso distribuido entre contas.

## Politicas

As paginas e assets publicos nao serao limitados pelo Next.js.

As APIs terao uma camada geral por IP com margem para navegacao normal. Rotas
de leitura frequente, como perfis, notificacoes e estatisticas, devem evitar
limites agressivos.

Operacoes caras ou sensiveis terao politicas especificas:

- contato e cadastro: limite baixo por IP;
- criacao e consulta de PIX: limite por usuario e IP;
- mensagens, denuncias, cupons, publicacao e bump: limite por usuario;
- uploads de foto, video, audio e story: limite baixo por usuario e IP;
- administracao: limite amplo por sessao/IP;
- webhook PIX: politica propria e permissiva, preservando retries legitimos.

Uma politica especifica substitui a geral quando for mais restritiva. Os
valores devem ficar centralizados e nomeados, sem numeros espalhados nas rotas.

## Respostas e falhas

Quando o limite for excedido, a API retorna:

- status `429`;
- JSON com mensagem curta e consistente;
- `Retry-After` em segundos;
- cabecalhos `RateLimit-Limit`, `RateLimit-Remaining` e `RateLimit-Reset`.

O limitador deve falhar aberto apenas em erro interno inesperado, registrando o
problema sem impedir operacoes legitimas.

## Testes

Os testes unitarios devem cobrir:

- primeira requisicao permitida;
- bloqueio apos o limite;
- renovacao depois da janela;
- contagem restante e reset;
- extracao de IP com prioridade para Cloudflare;
- normalizacao de IP invalido ou ausente;
- resposta 429 e `Retry-After`;
- limpeza de buckets expirados.

Testes de integracao focados devem confirmar pelo menos uma rota publica
sensivel e uma rota autenticada usando o modulo compartilhado.

## Limitacoes operacionais

O estado em memoria e perdido em restart ou redeploy e nao e compartilhado
entre replicas. Isso e aceitavel no deploy atual de instancia unica. Antes de
escalar horizontalmente, o armazenamento deve migrar para Redis ou equivalente.

Os limites devem ser monitorados nos logs apos o deploy. Picos de 429 em uso
legitimo exigem ajuste das politicas, nao remocao da protecao.
