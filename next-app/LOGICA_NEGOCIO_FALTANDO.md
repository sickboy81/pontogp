# Lógica de negócio que não foi migrada

> **DOCUMENTO HISTÓRICO:** este arquivo descreve lacunas observadas durante
> uma etapa anterior da migração. Parte delas já foi resolvida. Não altere
> regras de negócio com base apenas neste texto; confirme em `../AGENTS.md`,
> no schema e no código atual.

Este doc lista **regras e fluxos** que existiam no site antigo e **não foram recriados** no next-app. O PocketBase e a UI já têm campos para isso; falta a **lógica** (quem atualiza, quando, como).

---

## 1. Expiração do anúncio

### O que existe hoje
- **Campo no PocketBase:** `search_expires_at` (data/hora em que o anúncio deixa de aparecer na busca).
- **No next-app:** o filtro de listagem **já usa** essa data: anúncios com `search_expires_at` no passado (ou vazio) não aparecem na home nem no sitemap (`profiles.ts` → `LIFECYCLE`).
- **Dashboard:** o anunciante **pode editar** o perfil mesmo com anúncio “expirado” (a API de “meu perfil” não aplica LIFECYCLE).

### O que falta (lógica)
- **Quem define `search_expires_at`?**
  - Ao **ativar/renovar plano** (pagamento PIX aprovado): definir `search_expires_at = hoje + duração do plano` (ex.: +30 dias para mensal).
  - Ao **criar perfil grátis**: definir expiração padrão (ex.: +7 dias) se houver.
- **Renovação:** botão ou fluxo “Renovar anúncio” (pagar de novo ou usar plano ativo) que atualize `search_expires_at`.
- **Aviso no dashboard:** exibir “Seu anúncio expira em DD/MM” ou “Anúncio expirado – renove para voltar a aparecer”.
- **Cron/job (opcional):** se quiser desativar automaticamente ao expirar (ex.: mudar `status` para `inactive`), isso seria um job no servidor ou uma regra no PocketBase.

**Resumo:** hoje só **escondemos** anúncio expirado na listagem; **não há** quem preencha `search_expires_at` ao pagar nem tela de renovação/aviso.

---

## 2. Subidas automáticas (bumps)

### O que existe hoje
- **Plano (PocketBase):** campo `daily_bumps` (quantos “bumps” o plano dá por dia).
- **Perfil (PocketBase):** no seu PB aparece `auto_bump` (provavelmente “subir automaticamente” quando há cota).
- **UI:** na página de planos aparece “X bumps/dia” por plano. **Nenhuma** lógica de consumo ou subida.

### O que falta (lógica)
- **Ordenação na listagem:** a lista de perfis hoje usa `sort=-created`. Para “subida”, precisa ordenar por uma data de “último bump” (ex.: `bumped_at` ou `last_bump_at`), para quem deu bump aparecer no topo.
- **Consumo de bump (manual):**  
  - Endpoint ex.: `POST /api/profiles/[id]/bump` (ou `/api/profiles/me/bump`).  
  - Regras: (1) perfil é do usuário logado; (2) plano do perfil tem `daily_bumps > 0`; (3) ainda há “bumps usados hoje” (controle por dia).  
  - Ao dar bump: atualizar `bumped_at` (ou equivalente) no perfil e descontar 1 da cota do dia.
- **Controle de cota por dia:**  
  - Ou campo no perfil tipo `bumps_used_at` (última data em que usou bumps) + `bumps_used_today` (número), atualizados ao dar bump.  
  - Ou tabela/coleção “bump_log” (perfil_id, data) e contar por dia.  
  - Comparar com `daily_bumps` do plano para saber se ainda pode subir.
- **Subidas automáticas:**  
  - Se `auto_bump = true`, um **cron/job** (servidor ou PocketBase) roda periodicamente (ex.: a cada hora): para cada perfil com auto_bump e cota disponível, aplicar a mesma lógica do bump (atualizar `bumped_at` e cota).
- **UI no dashboard:**  
  - Botão “Subir anúncio” (usa 1 bump).  
  - Texto “Você tem X subidas hoje” (ou “0 subidas restantes”).  
  - Toggle “Subida automática” (grava `auto_bump` no perfil).

**Resumo:** hoje só **mostramos** “bumps/dia” no plano; **não há** ordenação por bump, nem endpoint de bump, nem cron de auto_bump, nem UI para subir/toggle.

---

## 3. Redes sociais

### O que existe hoje
- **Perfil:** campos `instagram`, `twitter` (e outros) e exibição no `ProfileView` (links para Instagram, Telegram, WhatsApp, etc.).
- **Compartilhar:** botão “Compartilhar” (Web Share API ou copiar link).

### O que pode estar faltando (depende do que você tinha)
- **Login com rede social** (ex.: “Entrar com Instagram/Google”): não existe no next-app; auth é email/senha + PocketBase.
- **Publicar / divulgar em rede social** (ex.: “Compartilhar no Instagram” ou “Publicar história”): não há integração com API do Instagram/etc.
- **Mostrar feed ou contador** de rede social (seguidores, etc.): não há.
- **Outra regra** que você usava (ex.: “perfil só ativo se tiver link do Instagram”): precisa ser redesenhada no PocketBase + next-app.

**Resumo:** “Redes sociais” no next-app hoje = **links no perfil + botão compartilhar**. Qualquer lógica a mais (login social, post automático, feed) precisa ser especificada e implementada.

---

## 4. O que precisa existir no PocketBase

Para implementar a lógica acima, no PocketBase é útil ter (ou criar):

| Coleção  | Campo / ideia |
|----------|----------------|
| `profiles` | `search_expires_at` (date/datetime); `bumped_at` ou `last_bump_at`; `auto_bump` (bool); eventualmente `bumps_used_today` + `bumps_used_date` para cota diária. |
| `plans` | Já tem `daily_bumps`. Pode ter `subscription_days` (ex.: 30 para mensal) para calcular `search_expires_at` ao pagar. |
| (opcional) | Coleção `bump_log` (profile, date) para contar bumps por dia em vez de campos no perfil. |

E no **webhook PIX** (ou no fluxo de “plano ativado”): ao confirmar pagamento, além de `plan`, atualizar `search_expires_at = hoje + subscription_days`.

---

## 5. Ordem sugerida para recriar

1. **Expiração:** no webhook PIX, ao ativar plano, preencher `search_expires_at`. No dashboard, exibir aviso “Expira em DD/MM” e, se quiser, botão “Renovar” (que leva ao fluxo de pagamento de novo).
2. **Bump manual:** criar `POST /api/profiles/me/bump`, regras de cota e `bumped_at`, e ordenar a listagem por `bumped_at` (e depois `created`). No dashboard, botão “Subir anúncio” e “X subidas hoje”.
3. **Bump automático:** cron que, para perfis com `auto_bump` e cota, chama a mesma lógica do bump.
4. **Redes sociais:** depois de você definir exatamente o que quer (login social? post? só links?), implementar em cima do que já existe (links + compartilhar).

Assim você **não recria o site inteiro**; só reativa as regras que movem expiração, subidas e, se fizer sentido, redes sociais.
