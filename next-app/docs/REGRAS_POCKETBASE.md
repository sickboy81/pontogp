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
- **Campos obrigatórios pelo contrato atual:** `story`, `user` e `content`.
- **Contrato de interação:** a API só aceita comentário em story existente, `active = true` e com `expires_at` futuro.
- **Regras sugeridas:**
  - **List:** pode ser restrita (a API usa admin token para listar).
  - **Create:** usuário autenticado, com `user = @request.auth.id`.
  - **Update/Delete:** somente dono do comentário (`user = @request.auth.id`) ou admin.
  - View/Update/Delete conforme necessidade (ex.: só admin ou dono do comentário).

### `story_likes`

- **Uso:** contagem de curtidas (API usa **admin token** para obter o total); verificação “curtiu” e toggle (create/delete) com **token do usuário**.
- **Campos obrigatórios pelo contrato atual:** `story` e `user`.
- **Contrato de interação:** a API só aceita curtida em story existente, `active = true` e com `expires_at` futuro.
- **Regras sugeridas:**
  - **List:** pode ser somente admin (a API usa getAdminToken() para a contagem).
  - **Create:** usuário autenticado, com `user = @request.auth.id` e `story` válido.
  - **Delete:** usuário só pode deletar o próprio like (`user = @request.auth.id`).

### `profiles`

- **Create:** `user = @request.auth.id && @request.body.status = "inactive"`
- **Update:** `(user = @request.auth.id && @request.body.status:changed = false) || @request.auth.role = "admin"`
- O usuário pode editar os dados e as relações do próprio perfil, mas não pode
  alterar `status` diretamente no PocketBase.
- A publicação passa por `POST /api/profiles/[id]/publish`, que valida
  propriedade e mínimo de 3 fotos antes de usar o token administrativo.
- A regra de Create impede a criação direta de um perfil já ativo.
- Após publicar a versão do app que cria rascunhos, aplique as regras com:

```bash
npm run schema:apply-profile-publication
npm run schema
npm run schema:check
```

Não aplique a regra de Create antes do deploy desta versão, pois versões
anteriores do app tentam criar o perfil diretamente como `active`.

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
