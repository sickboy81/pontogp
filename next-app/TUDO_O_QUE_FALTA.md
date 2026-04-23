# TUDO o que falta – CerejaVIP (versão Next vs original)

Comparação com o projeto **original** em `E:\Vibecode apps\CerejaVIP`. Nada foi alterado no original; este doc lista **tudo** que existe lá e não foi migrado para o next-app (`CerejaVIP - Versão 3`).

---

## 1. Expiração do anúncio (completa)

| No original | No next-app |
|-------------|-------------|
| **Dois tipos de expiração:** `contact_expires_at` (esconde contato) e `search_expires_at` (sai da listagem). | Só `search_expires_at` é usado (filtro na listagem). **Falta** `contact_expires_at`: não esconde botões de contato quando vence. |
| **Configuração por plano:** `settings.expiration_durations` (ex.: gratis/bronze: contact 7d, search 30d; ouro: 30d/50d). | Não existe; ninguém preenche `search_expires_at` ao pagar. |
| **Aplicação ao criar/atualizar perfil:** `applyExpirationRules` em `directus.ts` define as duas datas conforme plano. | Não existe. |
| **Dashboard:** exibe dias restantes (contact e search). | Não exibe. |
| **Perfil público:** contato bloqueado se `contact_expires_at` vencido (ProfilePage, LinkBioView). | Contato sempre visível. |
| **Script `cleanup_profiles.ts`:** perfis com contact_expires_at vencido → status `muted`; search_expires_at vencido → `archived`. | Não existe; nenhum job que arquiva/muta por expiração. |

**Resumo:** Falta (1) `contact_expires_at` + lógica de esconder contato, (2) config de durações por plano, (3) preencher as duas datas ao ativar/renovar plano, (4) aviso no dashboard, (5) script/cron de cleanup.

---

## 2. Bumps e subidas automáticas (completa)

| No original | No next-app |
|-------------|-------------|
| **Coleção `profile_daily_bumps`:** (profile, date, bumps_used) para cota por dia. | Não usada. |
| **`dailyBumps.ts`:** `canBump`, `getBumpsRemaining`, `incrementBump` (UTC-3). | Não existe. |
| **`dailyBumpReset.ts`:** lógica de reset de data (front); reset real no backend/hooks. | Não existe. |
| **Perfil:** `last_bump_at`, `auto_bump`. Bump atualiza `last_bump_at`. | Campos podem existir no PB; não há API nem UI que os usem. |
| **Listagem:** ordenação “Padrão” = `-last_bump_at,-date_created`. | Listagem só `-created`. Não ordena por bump. |
| **Dashboard:** mostra “subidas usadas hoje” e “restantes”. | Não mostra. |
| **Script `auto_bump.cjs`:** auth admin, percorre perfis ativos, aplica bump respeitando `daily_bumps` e intervalo (24h/daily_bumps), opção `--loop` a cada 5 min. | Não existe. |

**Resumo:** Falta (1) API de bump (consumir cota, atualizar `last_bump_at`), (2) ordenação da listagem por `last_bump_at`, (3) controle de cota diária (profile_daily_bumps ou equivalente), (4) UI no dashboard (bumps restantes, toggle auto_bump, botão subir), (5) script auto_bump.cjs ou equivalente (cron).

---

## 3. Redes sociais e rastreamento

| No original | No next-app |
|-------------|-------------|
| **`profile_clicks`:** registro de clique por tipo de contato (whatsapp, telegram, etc.). `trackProfileClick` em directus. | Não existe; não registra cliques em contato. |
| **`profile_views`:** visualizações de perfil. | Campo `views` no tipo; não há endpoint que incremente ao abrir perfil. |
| **Compartilhamento:** react-share + ShareModal. | Só Web Share API / clipboard; sem ShareModal rico. |
| **Perfil:** campos `privacy`, `onlyfans` e exibição. | Não no next-app (só instagram, twitter, whatsapp, telegram, phone). |

**Resumo:** Falta (1) registrar profile_clicks ao clicar em WhatsApp/Telegram/etc., (2) incrementar views ao abrir perfil, (3) ShareModal com opções (se quiser igual), (4) campos onlyfans/privacy se fizer parte do negócio.

---

## 4. Cupons e confirmação de plano

| No original | No next-app |
|-------------|-------------|
| **Coleção `coupons`:** applyCoupon em directus; aplicação de cupom no pagamento/plano. | Não existe. |
| **PIX “confirm-and-apply”:** após pagamento confirmado, aplica plano ao perfil (e expiração). | Webhook atualiza `plan` e status do payment; **não** preenche `search_expires_at` nem `contact_expires_at`. |

**Resumo:** Falta (1) cupons (coleção + apply no fluxo de pagamento), (2) no webhook PIX: ao completar, definir `search_expires_at` e `contact_expires_at` conforme plano/durações.

---

## 5. Mensagens e bloqueio

| No original | No next-app |
|-------------|-------------|
| **`message_blocks`:** blockConversation, isConversationBlocked; bloquear usuário na conversa. | Scripts existem no repo; não integrado no app (sem API nem UI de bloquear). |
| **Notificação ao enviar mensagem:** createNotification. | Não existe (coleção notifications pode existir no PB; não é usada). |
| **Admin:** sendMessageToAll (broadcast). | Não existe. |
| **SendMessageModal** (enviar msg a partir de outro lugar). | Só link para /mensagens?with=; sem modal. |

**Resumo:** Falta (1) bloquear conversa (message_blocks + UI), (2) criar notificação ao receber mensagem, (3) broadcast admin, (4) modal de enviar mensagem (opcional).

---

## 6. Stories (comentários e curtidas)

| No original | No next-app |
|-------------|-------------|
| **story_comments,** **story_likes,** **comment_likes;** createStoryComment, toggleStoryLike. | Só stories básicas (criar, listar, deletar, expiração). Sem comentários nem curtidas. |

**Resumo:** Falta comentários e curtidas em stories (coleções + API + UI no StoryViewer).

---

## 7. Dashboard do anunciante (campos e UI)

| No original | No next-app |
|-------------|-------------|
| **Horários (schedule):** ScheduleManager; campo schedule no perfil. | Não existe (nem campo nem UI). |
| **Localização no mapa:** LocationPicker (lat/lng), ProfileMap (Leaflet). | Não existe; sem mapa, sem location_lat/lng na UI. |
| **Serviços:** ServiceSelector; services, special_services, SERVICES_BY_CATEGORY. | Tipo tem services[]; formulário não tem seletor de serviços por categoria. |
| **Exibir expiração:** dias restantes (contact + search). | Não exibe. |
| **Exibir bumps:** usadas hoje + restantes + auto_bump. | Não exibe. |
| **Toggle “Ficar online”** (is_online / online_until). | Não existe na UI. |
| **Estatísticas:** views, cliques, favoritos. | Não exibe no dashboard. |
| **Link bio / display_mode:** configuração e visualização (LinkBioView). | Existe rota por slug; não há “modo link bio” rico (bio_theme, bio_links, bio_avatar_index). |
| **Campos extras no perfil:** hair_color, height, body_type, breast_type, pubis_type, certified, offers_happy_ending, massage_types, other_services, online_services, virtual_fantasies, for_sale, service_locations, service_to, foot_size, piercings, smoker, tattoos, weight, height_exact, bio_theme, bio_links, bio_avatar_index, accepts_messages. | DashboardPerfilForm não tem a maior parte; só o básico (nome, idade, cidade, bio, contatos, preços, fotos, vídeos, áudio, categoria, gênero, etnia, slug). |

**Resumo:** Falta schedule, mapa/localização, seletor de serviços, expiração/bumps no dashboard, toggle online, estatísticas (views/cliques/favoritos), e dezenas de campos opcionais do perfil (e link bio avançado).

---

## 8. Filtros e ordenação (listagem)

| No original | No next-app |
|-------------|-------------|
| **Ordenação na API:** “Padrão” (`-last_bump_at,-date_created`), “Recém Chegados” (`-date_created`), “Menor Preço” (`price_1h`), “Maior Preço” (`-price_1h`), “Mais Vistos” (`-views`). | Só `-created` (getProfiles em profiles.ts). |
| **Filtros:** SERVICES_BY_CATEGORY, PRICE_OPTIONS (min_price, max_price), special_services, breast_type. | FilterPanel tem categoria, gênero, estado, cidade, idade, etnia, cabelo, corpo, online, verificado; **não** tem preço nem serviços especiais. |
| **Sort na UI:** usuário escolhe ordenação. | Não existe seletor de ordenação. |

**Resumo:** Falta (1) sort configurável (bump, preço, views, recém-chegados), (2) filtros por preço e por serviços (e special_services se fizer sentido).

---

## 9. Página de perfil pública

| No original | No original | No next-app |
|-------------|-------------|-------------|
| **Contato escondido** se contact_expires_at vencido. | Já citado acima. | Contato sempre visível. |
| **Mapa:** ProfileMap (Leaflet) com localização. | Não existe. | Não existe. |
| **Lista de serviços** (e special_services). | Existe. | Tipo tem services; não exibe na UI. |
| **Watermark** em fotos. | Existe. | Não existe. |
| **LinkBioView:** modo link bio (bio_theme, bio_links, etc.). | Existe. | Só perfil por slug; sem modo “link bio” especial. |
| **ReportButton** (denunciar perfil). | Existe. | Não existe na página de perfil (admin tem denúncias; usuário não tem botão “Denunciar”). |
| **AgeVerificationModal** (se aplicável). | Existe. | Não existe. |

**Resumo:** Falta esconder contato por expiração, mapa, exibir serviços, watermark, link bio avançado, botão denunciar no perfil, e age verification se for regra.

---

## 10. Admin

| No original | No next-app |
|-------------|-------------|
| **Configurações de expiração:** getExpirationSettings, updateExpirationSettings (durações por plano). | Não existe. |
| **Configurações de aviso (announcement):** getAnnouncementConfig, updateAnnouncementConfig; target (all, guests, logged_in, advertiser, user). | Só manutenção (on/off + mensagem); sem announcement com target. |
| **Backups.** | Não existe. |
| **getMostVisitedProfiles.** | Não existe. |
| **Cupons:** CRUD e aplicação. | Não existe. |
| **Pagamentos:** lista de payments. | Não existe (só webhook atualiza; admin não vê lista). |
| **Migração de planos** (em massa?). | Não existe. |
| **EmailMarketing** (admin). | Não existe. |

**Resumo:** Falta config de expiração por plano, announcement com target, backups, perfis mais visitados, cupons, lista de pagamentos, migração de planos, e email marketing.

---

## 11. Contato (formulário site)

| No original | No next-app |
|-------------|-------------|
| **Após enviar:** createNotification para usuários (ex.: admins). | Só cria registro em contacts; não cria notificação. |

**Resumo:** Falta notificar admin (ou usuários) quando chega mensagem de contato.

---

## 12. Auth e registro

| No original | No next-app |
|-------------|-------------|
| **ipinfo.io** no registro (guardar IP na criação de usuário). | Não existe. |

**Resumo:** Falta registrar IP no cadastro (se for requisito de moderação/segurança).

---

## 13. UI/UX e componentes gerais

| No original | No next-app |
|-------------|-------------|
| **AnnouncementBar** (aviso no topo com target). | Não existe. |
| **NotificationBell** (sino de notificações). | Não existe. |
| **ConfirmDialog** (modal de confirmação reutilizável). | Não existe (ou uso pontual). |
| **design-tokens.css, protection.css.** | Só globals.css básico. |
| **Framer Motion** (animações). | Não usado. |
| **react-share** (compartilhar). | Só navigator.share / clipboard. |
| **PWA** (vite-plugin-pwa). | Não configurado. |
| **Theme store** (dark/light). | Não existe (site é dark fixo). |

**Resumo:** Falta barra de aviso, sino de notificações, design tokens/protection, animações, PWA e tema claro/escuro (se quiser).

---

## 14. Scripts e backend (fora do Next)

| No original | No next-app |
|-------------|-------------|
| **auto_bump.cjs:** cron de subidas automáticas. | Não existe. |
| **cleanup_profiles.ts:** arquivar/mutar por expiração. | Não existe. |
| **generate_sitemap.js:** gera sitemap.xml a partir do PB. | Next tem sitemap.ts dinâmico; pode estar ok. |
| **pb_hooks/pixgo.pb.js:** rotas PIX e confirm-and-apply no PocketBase. | Next tem rotas em /api/payments/pix e webhook; lógica de “aplicar plano + expiração” no webhook está incompleta. |

**Resumo:** Falta script auto_bump, script cleanup_profiles e completar webhook PIX (expiração + qualquer lógica que estava em confirm-and-apply).

---

## 15. Coleções / modelos PocketBase (referência)

No original são usadas, entre outras:

- **users, profiles, plans, payments, subscriptions**
- **messages, notifications, favorites**
- **verification_requests, contacts, reports**
- **profile_views, profile_clicks, site_visitors**
- **settings** (maintenance, announcement, expiration_durations)
- **stories, story_comments, story_likes, comment_likes**
- **coupons, profile_daily_bumps, message_blocks**
- **files** (fotos, vídeos, áudio)

No next-app não estão integradas ou estão parciais: **notifications**, **profile_views**, **profile_clicks**, **site_visitors**, **profile_daily_bumps**, **message_blocks**, **coupons**, **story_comments**, **story_likes**, **comment_likes**; e **settings** só para maintenance, não para expiration_durations nem announcement.

---

## Resumo em lista (TUDO que falta)

1. **Expiração:** contact_expires_at + esconder contato; config durações por plano; preencher ao pagar; aviso no dashboard; script cleanup_profiles.
2. **Bumps:** API bump + cota diária; ordenação -last_bump_at; dashboard (restantes, auto_bump, botão subir); script auto_bump.cjs.
3. **Rastreamento:** profile_clicks ao clicar contato; incrementar views ao abrir perfil.
4. **Cupons:** coleção + aplicar no pagamento.
5. **Webhook PIX:** ao completar, definir search_expires_at e contact_expires_at.
6. **Mensagens:** message_blocks (bloquear) + notificação ao receber + broadcast admin; opcional SendMessageModal.
7. **Stories:** comentários e curtidas (coleções + API + UI).
8. **Dashboard:** schedule (horários); LocationPicker + mapa (Leaflet); ServiceSelector; expiração e bumps na tela; toggle online; estatísticas (views, cliques, favoritos); campos extras do perfil (e link bio avançado).
9. **Listagem:** ordenação (bump, preço, views, recém-chegados); filtros preço e serviços.
10. **Perfil público:** esconder contato se expirado; mapa; exibir serviços; watermark; botão denunciar; age verification (se for regra); link bio avançado.
11. **Admin:** config expiração; announcement com target; backups; perfis mais visitados; cupons; lista de pagamentos; migração de planos; EmailMarketing.
12. **Contato:** notificação ao admin ao enviar.
13. **Registro:** ipinfo.io (IP).
14. **UI/geral:** AnnouncementBar; NotificationBell; design tokens; PWA; tema claro/escuro (opcional).
15. **Scripts:** auto_bump.cjs; cleanup_profiles.ts.

---

*Fonte: projeto original em `E:\Vibecode apps\CerejaVIP` (somente leitura). Next-app em `CerejaVIP - Versão 3`.*
