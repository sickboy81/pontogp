# Operação 100% Next (`next-app`)

Documento para evitar regressões por uso do legado Vite.

## Fonte de verdade

- App oficial: `next-app`
- Rotas públicas/admin oficiais: `next-app/src/app`
- Scripts oficiais: `next-app/scripts`

## Legado Vite

- Pasta `legacy-vite/` existe apenas para referência histórica.
- Não usar `legacy-vite` para build/deploy.
- Não copiar configurações antigas para produção sem revisão.

## Regras de deploy

1. Build sempre dentro de `next-app`:
   - `npm run build`
2. Desenvolvimento/start manual dentro de `next-app`:
   - `npm run dev`
   - `npm run start`
3. Produção Docker/Coolify:
   - build com `output: 'standalone'`;
   - start com `node server.js`;
   - não copiar `/app` inteiro do builder para o runtime.
4. Cron scripts oficiais:
   - bump conforme `next-app/docs/BUMPS_E_AUTO_BUMP.md`;
   - o cleanup de expiração é executado diariamente pelo Dockerfile às 01:00
     no fuso do container; valide os logs após cada deploy.

## Regras de mudança

- Novas features devem entrar somente em `next-app`.
- Qualquer ajuste de segurança deve priorizar APIs em `next-app/src/app/api`.
- Antes de merge/deploy, executar:
  - `npm test`
  - `npm run build`
  - iniciar o servidor;
  - `npm run smoke:critical`

## Rate limit

As APIs usam um limitador de janela fixa em memória. O proxy aplica uma
política geral por IP, e operações sensíveis usam políticas adicionais por
usuário e IP. Os valores ficam centralizados em
`src/lib/api-rate-limit.mjs`.

Um bloqueio retorna `429` com `Retry-After`, `RateLimit-Limit`,
`RateLimit-Remaining` e `RateLimit-Reset`. Monitore picos de `429` para
distinguir abuso de limites insuficientes para uso legítimo.

O estado é local ao processo e reinicia com o container. Não execute múltiplas
réplicas esperando um limite global; antes disso, substitua o armazenamento por
Redis ou serviço equivalente.

## Publicação de perfis

- O POST `/api/profiles` cria novos perfis com `status = "inactive"`.
- O anunciante adiciona pelo menos 3 fotos na aba `Mídia`.
- A publicação só ocorre após a ação explícita
  `POST /api/profiles/[id]/publish`.
- A rota de publicação confere proprietário e quantidade de fotos no
  PocketBase antes de usar o token administrativo para alterar o status para
  `active`.
- Perfil ativo com exatamente 3 fotos não pode excluir nenhuma delas. Para
  trocar uma foto, envie a nova antes de remover a antiga.
- Perfis ativos anteriores à regra não são despublicados automaticamente.
- `getProfile()` rejeita status diferente de `active` para impedir acesso
  público direto a rascunhos.
- `/api/profiles/me` consulta o perfil com credencial administrativa no
  servidor, sempre filtrando pelo ID do usuário autenticado. Isso permite
  recuperar rascunhos sem ampliar a regra pública de listagem.
- A regra compartilhada e seus testes ficam em
  `next-app/src/lib/profile-publication.mjs` e
  `next-app/src/lib/profile-publication.test.mjs`.
- Depois do deploy desta versão, execute uma vez:

```bash
npm run schema:apply-profile-publication
npm run schema
npm run schema:check
```

O primeiro comando impede criação ativa e alteração direta de `status` pelo
JWT do usuário. Não o execute antes de o novo código estar publicado.

## Cleanup tardio de perfis expirados

`npm run cleanup-profiles` arquiva somente perfis com `status = "active"` e
`search_expires_at` anterior ou igual ao cutoff calculado a partir de
`settings.profile_visibility_policy.archive_after_days` (90 dias por padrão).
O job não muda status quando `contact_expires_at` vence e não arquiva no
momento em que `search_expires_at` vence. Dados e uploads são preservados; a
única alteração é `status = "archived"`.

Antes de qualquer ativação:

1. Faça backup do banco e dos uploads do volume PocketBase e valide a
   restauração em ambiente separado.
2. Configure uma instância PocketBase não produtiva com cópia representativa
   dos dados e credenciais administrativas próprias.
3. Execute `CLEANUP_DRY_RUN=true npm run cleanup-profiles`.
4. Verifique por amostragem os IDs listados, as datas `search_expires_at`, o
   cutoff informado no log e a ausência de perfis dentro da janela.
5. Execute sem dry-run primeiro nesse ambiente e confira que dados/uploads
   continuam presentes e apenas o status dos candidatos mudou.
6. O Dockerfile já agenda esse cleanup. No Coolify, confirme que o container
   mantém o cron ativo e monitore `/var/log/cleanup_profiles.log`.

## Email transacional com Resend

O PocketBase continua gerando os tokens de verificacao de email e recuperacao
de senha. A entrega desses emails usa o SMTP da Resend. No Coolify, configure
`RESEND_API_KEY`, `RESEND_FROM_EMAIL` e `CONTACT_EMAIL_TO`; mantenha tambem as
credenciais administrativas do PocketBase. Depois execute, a partir de
`next-app/`:

```bash
npm run email:configure-resend
```

Para validar a entrega, defina temporariamente `RESEND_TEST_EMAIL` antes do
comando. O dominio `cerejavip.com` precisa estar verificado na Resend. O
formulario de contato permanece salvo na colecao `contacts` e tambem envia uma
notificacao para `CONTACT_EMAIL_TO` pela API da Resend.

## Dependências externas críticas

- Site: `https://cerejavip.com`
- PocketBase: `https://pocketbase.cerejavip.com`
- O DNS do subdomínio `pocketbase` precisa apontar para o serviço PocketBase.
- `public/sw.js` e `public/service-worker.js` neutralizam caches/PWAs antigos e
  não devem ser removidos sem planejamento.
