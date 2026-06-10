# Regras do PocketBase – recomendações para o CerejaVIP

Este documento descreve as coleções usadas pelo next-app e as regras recomendadas no painel do PocketBase para que as APIs funcionem corretamente.

## Visão geral

- As **API Routes** do Next.js chamam o PocketBase de duas formas: com **token do usuário** (cookie) ou com **token de admin** (`getAdminToken()`).
- Quando a API usa **admin token**, a coleção pode ter regras restritivas (somente admin); quando usa **token do usuário**, a coleção precisa permitir o que o usuário faz (list, create, etc.).

---

## Coleções críticas

### `payments`

- **Uso:** criação de registro ao gerar PIX (token do usuário); leitura/atualização no webhook (token admin).
- **Campos necessários:** `user`, `plan`, `amount`, `status`, `method`,
  `external_id` e `description`. O fluxo atual grava o perfil como metadado
  `PROFILE:<id>` na descrição para permanecer compatível com bancos sem a
  relação `payments.profile`.
- **Campo recomendado:** `profile` como relação com `profiles`. Se ele for
  adicionado no futuro, mantenha a compatibilidade com registros antigos que
  possuem somente o metadado na descrição.
- **Status aceitos pelo contrato atual:** `pending`, `paid`, `failed` e
  `refunded`.
- **Regras sugeridas:** Create com auth (usuário logado); List/View/Update/Delete podem ser apenas admin, pois o webhook usa admin token.

### `coupons`

- **Uso:** listagem, criação e edição em `/admin/coupons`; validação e aplicação em `/api/coupons/validate` e `/api/coupons/apply`; webhook PIX lê e atualiza `used_count`.
- Todas as chamadas do app que tocam em cupons usam **token de admin** (admin auth ou getAdminToken).
- **Regras sugeridas:** List / View / Create / Update / Delete = somente admin. Ou deixe as regras padrão e garanta que apenas as APIs (que usam admin token) acessem a coleção.

### `story_comments`

- **Uso:** GET lista comentários (API usa **admin token** para listar); POST cria comentário (API usa **token do usuário**).
- **Regras sugeridas:**
  - **List:** pode ser restrita (a API usa admin token para listar).
  - **Create:** usuário autenticado, com `user = @request.auth.id`.
  - View/Update/Delete conforme necessidade (ex.: só admin ou dono do comentário).

### `story_likes`

- **Uso:** contagem de curtidas (API usa **admin token** para obter o total); verificação “curtiu” e toggle (create/delete) com **token do usuário**.
- **Regras sugeridas:**
  - **List:** pode ser somente admin (a API usa getAdminToken() para a contagem).
  - **Create:** usuário autenticado, com `user = @request.auth.id` e `story` válido.
  - **Delete:** usuário só pode deletar o próprio like (`user = @request.auth.id`).

---

## Outras coleções

- **users:** o app registra o IP no cadastro via POST /api/auth/registration-ip. Opcional: adicione o campo **registration_ip** (texto) na coleção de autenticação para armazenar o IP do registro.
- **profiles, plans, profile_views, profile_clicks, messages, reports, notifications, verification_requests, profile_daily_bumps, etc.:** siga o schema e as regras conforme o fluxo (auth user vs admin). O app usa admin token para operações de backend (webhooks, analytics, admin panel) e user token para ações do usuário (editar perfil, enviar mensagem, etc.).

---

## Após alterar regras

1. Teste as rotas afetadas (ex.: gerar PIX, webhook, cupom, comentários/curtidas em stories).
2. Reexporte o schema se alterar campos: `npm run schema` em `next-app`.
3. Rode `npm run schema:check` para validar os contratos mínimos usados pelo
   código.
