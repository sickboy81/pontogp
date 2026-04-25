# CerejaVIP – Frontend Next.js

Frontend em Next.js 16 (App Router) com SEO por rota, PocketBase como backend e rotas:

- **`/perfil/[id]`** – perfil por ID
- **`/[slug]`** – perfil por slug (link bio). Slugs estáticos (sobre, termos, etc.) retornam 404.

## Setup

1. Copie o env de exemplo e ajuste:
   ```bash
   cp .env.example .env.local
   ```
2. Instale e rode:
   ```bash
   npm install
   npm run dev
   ```
3. Abra [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `NEXT_PUBLIC_POCKETBASE_URL` | Sim | URL da API PocketBase |
| `NEXT_PUBLIC_APP_URL` | Não | URL do site (meta, sitemap). Padrão: cerejavip.com |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Não | Cloudflare Turnstile para formulário de contato |

## Estrutura

- **`app/(site)/`** – home, perfil, planos, contato, páginas estáticas
- **`app/(auth)/`** – login, registro, esqueci-senha, verificar-email
- **`app/(protected)/`** – dashboard, mensagens, favoritos, diretrizes (requer login)
- **`app/(admin)/`** – painel admin (requer role admin)
- **`src/lib/api/`** – chamadas ao PocketBase (servidor)
- **`src/lib/pb.ts`** – cliente PocketBase no browser
- **`src/middleware.ts`** – protege rotas (dashboard, mensagens, favoritos, admin)

## Funcionalidades

- Auth: login, registro, esqueci-senha, verificar-email
- Home: busca, filtros, infinite scroll
- Perfil: galeria, lightbox, contato, botão "Enviar mensagem"
- Favoritos: store Zustand, API, página
- Mensagens: lista de conversas, thread, envio, marcação como lida
- Dashboard: meu perfil, edição (textos, contato, preços)
- Planos: tabela semanal/mensal, plano grátis, simulação de PIX
- Admin: estatísticas, usuários, perfis, configurações (modo manutenção)
- Contato: formulário com Turnstile opcional
- Modo manutenção: config no PocketBase, página /manutencao

## Alterações recentes (Abr/2026)

- **Stories no dashboard**
  - Dashboard principal agora mostra apenas stories recentes para evitar lista infinita.
  - Histórico completo de stories foi movido para a rota protegida `\`/dashboard/stories\``.
  - Nova tela dedicada permite revisar tudo, editar texto e excluir stories antigas.

- **Link na Bio com origem do contato**
  - Links de WhatsApp/Telegram no Link na Bio agora levam mensagem pré-preenchida com origem no CerejaVIP (quando o link não define `text` manualmente).
  - A regra cobre links comuns como `wa.me`, `api.whatsapp.com/send`, `t.me` e `telegram.me`.

- **Mapa no dashboard de perfil**
  - Mapa do editor de perfil passou a consumir tiles via rota interna `\`/api/map-tiles/[z]/[x]/[y]\``.
  - Objetivo: evitar bloqueios de rede/navegador ao domínio externo de tiles e melhorar confiabilidade do carregamento.

- **Estatísticas do anunciante**
  - Adicionada API `\`/api/profiles/me/stats\`` com agregações reais (views, cliques, canais, tendência, stories e horário de pico).
  - Aba de estatísticas no dashboard de perfil foi atualizada para consumir dados reais em vez de placeholders.

- **Hardening de rastreamento de views/cliques**
  - `profile_clicks` agora salva `viewer_ip` e `user_agent`.
  - Endpoint de view teve deduplicação fortalecida para reduzir inflação de contagem.
  - Sincronização de `profiles.views` passou a usar contagem real de `profile_views`.

## Scripts

- `npm run dev` – desenvolvimento
- `npm run build` – build de produção
- `npm run start` – servidor de produção
- `npm run lint` – ESLint
