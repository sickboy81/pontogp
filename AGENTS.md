# CerejaVIP - Guia para IDEs e agentes

Leia este arquivo antes de alterar o projeto. Ele resume as fontes de verdade,
os fluxos críticos e as verificações obrigatórias.

## Fonte de verdade

- Aplicação oficial: `next-app/`
- Framework: Next.js 16 App Router, React 19, TypeScript e Tailwind CSS
- Backend e autenticação: PocketBase
- Produção: Docker no Coolify
- Domínio público: `https://cerejavip.com`
- Backend público: `https://pocketbase.cerejavip.com`
- Branch de produção: `main`

Não existe aplicação Vite ativa. Não recrie configurações, rotas ou service
workers de versões antigas.

Scripts antigos na raiz que citam Directus, `VITE_DIRECTUS_URL` ou migrações
da aplicação anterior são históricos. Não os execute em produção sem auditar
o arquivo e confirmar explicitamente que ele ainda se aplica ao PocketBase.

Configurações antigas de Vercel/Vite, Nixpacks e Nginx SPA foram removidas.
Não as recrie: o único deploy oficial deste repositório é o `Dockerfile`.

## Como executar

```bash
cd next-app
npm ci
cp .env.example .env
npm run dev
```

Verificações antes de enviar mudanças:

```bash
cd next-app
npm run build
```

Para o smoke, o servidor precisa estar ativo:

```bash
npm run start
npm run smoke:critical
```

## Estrutura principal

- `next-app/src/app/(site)`: páginas públicas
- `next-app/src/app/(auth)`: login, cadastro e recuperação de acesso
- `next-app/src/app/(protected)`: dashboard e páginas de usuário autenticado
- `next-app/src/app/(admin)`: painel administrativo
- `next-app/src/app/api`: APIs do servidor
- `next-app/src/components`: componentes React
- `next-app/src/lib`: PocketBase, autenticação, SEO e regras compartilhadas
- `next-app/src/store`: stores Zustand persistidas no navegador
- `next-app/src/proxy.ts`: redirects, proteção inicial e cache do HTML
- `next-app/public`: assets e neutralizadores de service worker legado
- `Dockerfile`: build e runtime oficiais do Coolify

## Autenticação

- O PocketBase fornece o JWT.
- O Zustand persiste `user`, `token` e `isAuthenticated` em
  `auth-storage-pb`.
- `AuthCookieSync` sincroniza o JWT no cookie `cerejavip_token`.
- APIs protegidas leem esse cookie.
- APIs administrativas usam `requireAdmin()` e validam o usuário no
  PocketBase. Um `401` sem sessão admin é comportamento esperado.
- O layout admin deve esperar hidratação, token válido e cookie sincronizado
  antes de montar componentes que chamam `/api/admin/*`.

Nunca confie apenas no papel salvo no navegador para autorizar uma API.
Usuários não podem aplicar planos pagos pelo PATCH genérico do perfil; somente
o plano `gratis` pode ser escolhido diretamente. Planos pagos dependem do
webhook PIX ou de uma operação administrativa.

## PocketBase

- URL padrão: `NEXT_PUBLIC_POCKETBASE_URL=https://pocketbase.cerejavip.com`
- Schema exportado: `next-app/pocketbase-schema.json`
- Guia do schema: `next-app/docs/pocketbase-schema.md`
- Regras: `next-app/docs/REGRAS_POCKETBASE.md`
- Hooks versionados: `pb_hooks/README.md` (não são instalados pelo app)

Antes de alterar campos ou filtros, consulte o schema. Após mudar o banco,
rode `npm run schema` e versione o JSON atualizado.

Depois da exportação, rode `npm run schema:check`. Esse comando valida os
campos e valores mínimos dos fluxos de autenticação, pagamentos e auto bump.

Credenciais administrativas são segredos de runtime. Não as grave em código,
Dockerfile, commits ou logs. Se um segredo aparecer em log, rotacione-o.

Variáveis usadas pela aplicação:

- obrigatórias: `NEXT_PUBLIC_POCKETBASE_URL`;
- necessárias para APIs administrativas e scripts: `POCKETBASE_ADMIN_EMAIL`
  e `POCKETBASE_ADMIN_PASSWORD`;
- produção/SEO: `NEXT_PUBLIC_APP_URL`;
- pagamentos: `PIXGO_API_KEY`, `PIXGO_WEBHOOK_SECRET` e
  `PIXGO_WEBHOOK_SIGNATURE_HEADER`;
- Turnstile: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY`;
- opcionais: `POCKETBASE_COUPONS_COLLECTION` e `FFMPEG_PATH`.

Consulte `next-app/.env.example` antes de configurar outro ambiente.

## Subidas automáticas de perfis

Este fluxo é crítico. Leia `next-app/docs/BUMPS_E_AUTO_BUMP.md` antes de
alterá-lo.

- Script oficial em produção: `auto_bump.cjs`
- Reset diário: `scripts/reset-daily-bumps.mjs`
- Cron: bump a cada 5 minutos e reset à meia-noite
- Fonte da cota: `profile_daily_bumps`
- Ordenação dos perfis: `profiles.last_bump_at`
- Apenas perfis `status = "active"` e `auto_bump = true` participam
- O lock `/tmp/cerejavip-auto-bump.lock` evita execuções sobrepostas

Não crie um segundo agendador e não troque nomes de arquivos ou caminhos sem
atualizar o Dockerfile e testar dentro do container.

## SEO

- Páginas de cidades são estratégicas e devem continuar indexáveis mesmo sem
  perfis.
- Rotas principais: `/cidade/[citySlug]`, `/estado/[stateSlug]`,
  `/anunciar-em/[citySlug]` e `/guia/[guideSlug]`.
- Sitemaps ficam em `next-app/src/app` e são expostos por `/sitemap.xml` e
  sitemaps derivados.
- Não aplique `noindex`, redirect ou 404 a páginas de cidade vazias sem uma
  decisão explícita.
- URLs com filtros antigos devem apontar por canonical/redirect à rota limpa,
  sem criar páginas duplicadas indexáveis.

## Deploy no Coolify

- O Dockerfile usa `output: 'standalone'` para reduzir a imagem.
- Runtime inicia com `node server.js`.
- O pacote `pocketbase` é copiado explicitamente porque os cron jobs rodam
  fora do servidor Next.
- Não volte a copiar `/app` inteiro do builder: isso aumenta muito a imagem e
  já causou `no space left on device`.
- Não remova `auto_bump.cjs`, `scripts/reset-daily-bumps.mjs` ou `dcron`.
- O servidor precisa manter o DNS `pocketbase.cerejavip.com`.
- `next-app/scripts/cleanup_profiles.mjs` não está agendado no Dockerfile
  atual. Se a expiração automática for necessária, configure um job separado
  e monitore seus logs.

Após deploy, valide:

```bash
SMOKE_BASE_URL=https://cerejavip.com npm run smoke:critical
```

Também confirme:

- `/` responde 200
- `/sw.js` e `/service-worker.js` respondem 200
- login admin funciona
- APIs admin respondem 401 sem sessão e 200 com sessão válida
- cron do auto bump está ativo e sem execução duplicada

## Service worker e tela branca

O site atual não instala PWA/service worker. Os arquivos `public/sw.js` e
`public/service-worker.js` existem apenas para desregistrar workers antigos e
limpar caches da versão Vite.

Não remova esses arquivos enquanto houver usuários antigos. Eles devem ser
servidos com `Cache-Control: no-store`.

## Dados, mídia e backup

O Git não contém os dados de produção nem os uploads. Eles vivem no serviço e
volume do PocketBase. Um clone do repositório sozinho não restaura o site.

Antes de manutenção no servidor:

- identifique o volume usado pelo PocketBase;
- faça backup do banco e da pasta de uploads;
- teste restauração em ambiente separado;
- nunca execute `docker volume prune` sem mapear todos os volumes;
- mantenha cópia externa ao mesmo servidor.

Também preserve fora do Git as variáveis do Coolify, configuração DNS,
credenciais PixGo/Turnstile e regras configuradas no painel do PocketBase.

## Regras para mudanças

- Preserve alterações do usuário e mantenha o escopo pequeno.
- Prefira padrões já existentes.
- Não altere coleções PocketBase por suposição.
- Não mexa no auto bump em refatorações não relacionadas.
- Não envie `.env`, senhas, tokens ou chaves.
- Não use `docker volume prune` em produção sem identificar cada volume.
- Para mudanças em auth, deploy, pagamentos, SEO ou bump, execute build e
  smoke.

## Documentos complementares

- `README.md`: visão geral e instalação
- `next-app/docs/OPERACAO_NEXT_APP.md`: operação da aplicação
- `next-app/docs/BUMPS_E_AUTO_BUMP.md`: regra completa de subidas
- `next-app/docs/REGRAS_POCKETBASE.md`: permissões e coleções
- `next-app/docs/pocketbase-schema.md`: atualização do schema
- `next-app/docs/SMOKE_ROLLBACK_MONITORAMENTO.md`: deploy e rollback
- `next-app/docs/PENDENCIAS_PRODUCAO.md`: verificações externas ainda abertas
