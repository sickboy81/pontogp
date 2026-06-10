# Checklist CerejaVIP – o que existe e o que falta

> **CHECKLIST HISTÓRICO:** este arquivo não representa sozinho o estado atual
> do produto. Use `../AGENTS.md` como ponto de entrada e valide cada item no
> código antes de tratá-lo como pendência.

Lista baseada no escopo do README raiz (produto original) e no estado atual do **next-app** (Next.js 16 + PocketBase).

- **Lista completa do que falta** (comparação com o projeto original em `E:\Vibecode apps\CerejaVIP`): ver **`TUDO_O_QUE_FALTA.md`**.
- **Lógica de negócio** (expiração, bumps, redes sociais em detalhe): ver **`LOGICA_NEGOCIO_FALTANDO.md`**.
- **Bumps e script no Coolify** (alinhamento app ↔ cron): ver **`docs/BUMPS_E_AUTO_BUMP.md`**.

---

## Legenda

- ✅ **Feito** – implementado e funcionando
- 🟡 **Parcial** – existe em parte (API/types) mas não na UI ou incompleto
- ❌ **Falta** – não implementado

---

## 1. Homepage

| Item | Status | Observação |
|------|--------|------------|
| Grid de cards com perfis | ✅ | HomeClient + ProfileCard |
| Filtros avançados (cidade, categoria, idade, etc.) | ✅ | FilterPanel |
| Filtro por preço (mín./máx. 1h) | ✅ | FilterPanel: min_price, max_price; API sort + min/max_price |
| Busca por palavra-chave | ✅ | search + API |
| Paginação infinita | ✅ | IntersectionObserver + loadMore |
| Badge "Online Agora" | ✅ | ProfileCard + filtro "Online agora" |
| Sistema de favoritos | ✅ | FavoritosClient, API, store |
| Hero / destaque no topo | ✅ | Hero com título, descrição, CTAs |
| Empty state da busca | ✅ | Card com ícone e "Limpar filtros" |
| Stories na home | ✅ | StoriesSection + link para perfil?stories=1 |

---

## 2. Página de perfil (`/perfil/[id]`)

| Item | Status | Observação |
|------|--------|------------|
| Galeria de fotos + lightbox | ✅ | ProfileView + Lightbox |
| Player de vídeos | ✅ | profile.videos |
| Áudio de apresentação | ✅ | profile.audio |
| Descrição (bio_title + bio) | ✅ | |
| Lista de serviços | ✅ | ProfileView exibe services[] antes dos preços |
| Tabela de preços | ✅ | price_30min, 1h, 2h, pernoite, prices[] |
| Mapa com localização | ✅ | ProfileMap (OpenStreetMap iframe); exibe quando location_lat/lng; dashboard: campos lat/lng + aproximada |
| Botões de contato (WhatsApp, Telegram, Ligar) | ✅ | |
| Compartilhamento | ✅ | Share2 + navigator.share / clipboard |
| Botão Denunciar | ✅ | Modal motivo + descrição; POST /api/reports (login obrigatório) |
| Badge Verificado / Online | ✅ | |
| Viewer de stories (`?stories=1`) | ✅ | StoryViewer no ProfileView |
| Registro de views ao abrir perfil | ✅ | POST /api/profiles/[id]/view no mount |
| Registro de cliques em contato | ✅ | POST /api/profiles/[id]/click (whatsapp, telegram, phone, message) |

---

## 3. Dashboard do anunciante

| Item | Status | Observação |
|------|--------|------------|
| Criar / editar perfil | ✅ | DashboardPerfilForm |
| Upload de fotos | ✅ | até 12 (API + UI) |
| Upload de vídeos | ✅ | API + UI |
| Upload de áudio | ✅ | API + UI |
| Campos: nome, idade, cidade, estado, bio, contatos, preços | ✅ | |
| Categoria, gênero, etnia, slug | ✅ | |
| Campos extras (cabelo, corpo, altura, modo link bio) | ✅ | hair_color, body_type, height, display_mode no form e perfil público |
| **Gerenciar horários** | ✅ | ScheduleManager no DashboardPerfilForm; exibição no ProfileView |
| Toggle "Ficar Online" | ✅ | DashboardClient: toggle + PATCH is_online/online_until |
| Estatísticas (views, cliques, favoritos) | ✅ | Card no dashboard com views, cliques, favoritos |
| Solicitação de verificação | ✅ | VerificationRequestForm |
| Nova story (upload) | ✅ | DashboardClient |
| Link para editar perfil / diretrizes | ✅ | |

---

## 4. Sistema de verificação

| Item | Status | Observação |
|------|--------|------------|
| Upload de documento (frente/verso) | ✅ | VerificationRequestForm |
| Selfie com documento | ✅ | |
| Status da solicitação | ✅ | Exibido no dashboard |
| Badge "Verificado" no perfil | ✅ | ProfileCard + ProfileView |
| Admin: lista de solicitações, aprovar/rejeitar | ✅ | AdminVerificacao |

---

## 5. Planos e pagamento

| Item | Status | Observação |
|------|--------|------------|
| Página de planos | ✅ | PlanosClient |
| Tabela semanal/mensal | ✅ | billingPeriod |
| Plano grátis | ✅ | |
| Integração PIX (PixGo) | ✅ | Gerar cobrança, QR, copia e cola |
| Polling de status do PIX | ✅ | PlanPaymentModal |
| Webhook PIX (confirmar pagamento) | ✅ | /api/payments/pix/webhook |
| Ativar plano no perfil ao pagar | ✅ | Webhook atualiza profile.plan |
| Cupons | ✅ | Validar + aplicar em /api/coupons; campo em /planos; cupom no PIX (modal + webhook); admin /admin/cupons (CRUD) |

---

## 6. Mensagens

| Item | Status | Observação |
|------|--------|------------|
| Lista de conversas | ✅ | MensagensClient |
| Thread entre dois usuários | ✅ | MessageThread |
| Enviar mensagem | ✅ | |
| Marcar como lida | ✅ | API mark-read |
| Botão "Enviar mensagem" no perfil | ✅ | Link para /mensagens?with=... |

---

## 7. Admin

| Item | Status | Observação |
|------|--------|------------|
| Dashboard com métricas | ✅ | AdminDashboard (cards: usuários, perfis, verificações pendentes, etc.) |
| Gerenciamento de usuários | ✅ | /admin/usuarios |
| Gerenciamento de perfis | ✅ | /admin/perfis |
| Verificações (aprovar/rejeitar) | ✅ | /admin/verificacao |
| Mensagens | ✅ | /admin/mensagens + link no menu |
| Denúncias | ✅ | /admin/denuncias + link no menu |
| Configurações (manutenção) | ✅ | /admin/configuracao |
| Lista de pagamentos | ✅ | /admin/pagamentos + GET /api/admin/payments |
| Planos (CRUD) | ✅ | /admin/planos + APIs /api/admin/plans e /api/admin/plans/[id] |
| Assinaturas | ✅ | /admin/assinaturas + APIs /api/admin/subscriptions e /api/admin/subscriptions/[id] |
| Contatos (Fale Conosco) | ✅ | /admin/contatos + APIs /api/admin/contacts e /api/admin/contacts/[id] |
| Métrica de receita no dashboard | ✅ | /api/admin/stats retorna totalRevenue + card no AdminDashboard |
| Broadcast (mensagem para todos) | ✅ | /admin/broadcast; POST /api/admin/broadcast |
| **Cupons (admin)** | ✅ | /admin/cupons: listar, criar, ativar/desativar; GET/POST /api/admin/coupons, PATCH /api/admin/coupons/[id] |
| **Analytics avançado** | ✅ | /admin/analytics: views/cliques totais e por período, por tipo, top perfis |
| Moderação de conteúdo (suspender, arquivar) | ✅ | Denúncias sim; sem “moderar perfil” (ocultar, suspender) em um clique na lista |

---

## 10. Smoke test obrigatório (pré-deploy)

Objetivo: validar fluxos críticos em 10-15 minutos antes de publicar.

### 1) Build local

- [ ] Rodar `npm run build` em `next-app`
- [ ] Confirmar que as rotas admin novas aparecem no output (`/admin/planos`, `/admin/assinaturas`, `/admin/contatos`)

### 2) Admin: Planos (CRUD)

- [ ] Abrir `/admin/planos`
- [ ] Criar plano de teste (`nome`, `slug`, `preço mensal`)
- [ ] Editar o mesmo plano (mudar preço ou bumps)
- [ ] Excluir o plano de teste
- [ ] Confirmar no reload que não ficou registro órfão

### 3) Admin: Assinaturas

- [ ] Abrir `/admin/assinaturas`
- [ ] Filtrar por status (`active`, `expired`, `canceled`, `pending`)
- [ ] Alterar `auto_renew` de 1 assinatura e confirmar persistência após reload
- [ ] Se ambiente sem `subscriptions`, confirmar fallback sem quebra (lista vazia, página funcional)

### 4) Admin: Contatos (Fale Conosco)

- [ ] Enviar mensagem em `/contato`
- [ ] Verificar entrada em `/admin/contatos`
- [ ] Marcar como lida e depois não lida
- [ ] Excluir mensagem de teste

### 5) Dashboard admin (métricas)

- [ ] Abrir `/admin` e validar cards novos: `Planos`, `Assinaturas`, `Contatos não lidos`, `Receita total`
- [ ] Conferir que `Receita total` não quebra com base vazia (mostrar `R$ 0,00`)

### 6) Regressão mínima essencial

- [ ] `/admin/pagamentos` carrega normalmente
- [ ] `/admin/mensagens` continua listando mensagens internas
- [ ] `/planos` fluxo de compra/cupom segue funcional
- [ ] `/api/contact` continua gravando `contacts`

### 7) Pós-deploy imediato

- [ ] Rodar smoke rápido em produção nas mesmas 4 rotas admin
- [ ] Validar logs por 5 minutos (sem 401/403/500 recorrentes nas APIs admin novas)
- [ ] Se erro crítico: rollback para imagem/tag anterior e reabrir investigação

---

## 8. Outros

| Item | Status | Observação |
|------|--------|------------|
| Contato (formulário + Turnstile) | ✅ | ContatoClient |
| Modo manutenção | ✅ | MaintenanceGate, /manutencao, API |
| Páginas estáticas (sobre, termos, privacidade, segurança, anunciantes) | ✅ | |
| Auth: login, registro, esqueci-senha, redefinir-senha, verificar email | ✅ | |
| Link bio (perfil por slug `/[slug]`) | ✅ | (site)/[slug]/page |
| Header com nav + menu mobile | ✅ | SiteHeader (hamburger) |
| Footer em colunas | ✅ | Layout (site) |
| SEO (metadata, sitemap, robots) | ✅ | Por rota + sitemap.ts, robots.ts |
| AnnouncementBar (aviso no topo) | ✅ | /api/announcement; Admin > Configurações; sessionStorage para fechar |
| NotificationBell + página Notificações | ✅ | Sino no header (logado); GET /api/notifications; /notificacoes; marcar como lida |

---

## 9. Backend / API (PocketBase)

| Item | Status | Observação |
|------|--------|------------|
| Perfis (CRUD, listagem, filtros) | ✅ | |
| Fotos, vídeos, áudio em perfis | ✅ | |
| Planos, pagamentos (PIX) | ✅ | |
| Stories (criar, listar, deletar, expiração) | ✅ | |
| Stories: comentários e curtidas | ✅ | story_comments, story_likes; API + StoryViewer |
| Verificação (solicitar, admin aprovar) | ✅ | |
| Mensagens, favoritos | ✅ | |
| Denúncias (reports) | ✅ | |
| Registro de views/cliques no perfil | ✅ | POST /api/profiles/[id]/view e /click; ProfileView chama ao abrir e ao clicar em contato |
| Bloquear conversa (message_blocks) | ✅ | GET/POST /api/messages/block; botão na thread; POST mensagem verifica bloqueio |

---

## Resumo do que ainda falta (prioridade sugerida)

### Pendência bloqueada (resolver por último)

1. ~~**Deploy/Coolify – variáveis admin do bump/reset**~~ – resolvido no container ativo (`aw0wwo0occ4sgkgg0woo840w-152941329511`): `POCKETBASE_ADMIN_EMAIL` e `POCKETBASE_ADMIN_PASSWORD` presentes, `auto_bump.cjs` executando no cron e bump validado em produção.

### Alto impacto (usuário vê)

1. ~~**Dashboard: toggle “Ficar Online”**~~ – feito: DashboardClient toggle is_online/online_until; badge no perfil.
2. ~~**Dashboard: estatísticas**~~ – feito: card com views, cliques e favoritos no DashboardClient.
3. ~~**Perfil: lista de serviços**~~ – feito: ProfileView exibe profile.services quando há itens.
4. ~~**Perfil: mapa**~~ – feito: ProfileMap (OSM iframe) quando há lat/lng; campos no dashboard.

### Médio impacto

5. ~~**Dashboard: horários**~~ – feito: ScheduleManager no form; schedule no Profile e ProfileView.
6. ~~**Admin: moderar perfil**~~ – feito: menu Ações em cada perfil (Reativar, Suspender, Arquivar).
7. ~~**Incrementar views/cliques**~~ – feito: POST /api/profiles/[id]/view e /click; ProfileView integrado.
8. ~~**Ordenação na listagem**~~ – feito: seletor na home (Padrão, Recém chegados, Menor/Maior preço, Mais vistos); API sort.

### Baixo / documentação

9. ~~**README raiz**~~ – feito: atualizado para Next.js + PocketBase (README.md na raiz).
10. ~~**Schema PocketBase**~~ – documentado em next-app/docs/pocketbase-schema.md e pocketbase-schema.json.
11. ~~**Bloquear conversa (message_blocks)**~~ – feito: API block, UI na thread, notificação ao receber; notificação admin no contato.

### Ainda não migrado (ver TUDO_O_QUE_FALTA.md)

- ~~**Expiração completa**~~ – webhook PIX preenche search_expires_at e contact_expires_at; dashboard exibe dias restantes; perfil esconde contato quando contact_expires_at vencido; script next-app/scripts/cleanup_profiles.mjs (muted/archived).
- ~~**Bumps e auto_bump**~~ – API/dashboard usam profile_daily_bumps (alinhado ao script no Coolify); doc docs/BUMPS_E_AUTO_BUMP.md; script raiz com env.
- ~~**Cupons**~~ – GET /api/coupons/validate?code=; POST /api/coupons/apply (aplica plano + dias ao perfil, incrementa used_count); UI em /planos (campo + Aplicar cupom). Aplicação no webhook PIX (cupom no pagamento) opcional.
- ~~**Stories: comentários e curtidas**~~ – GET/POST /api/stories/[id]/comments, GET/POST /api/stories/[id]/likes e /like; StoryViewer com curtir, painel de comentários e enviar comentário (logado).
- ~~**Campos extras do perfil**~~ – hair_color, body_type, height, display_mode no tipo, PATCH, DashboardPerfilForm e exibição no ProfileView; modo "Link bio" no form (visual compacto por slug já existe).
- ~~**Broadcast admin**~~ – feito: POST /api/admin/broadcast; página /admin/broadcast; notificação para todos os usuários.

---

*Última atualização: fev/2025 (next-app).*
