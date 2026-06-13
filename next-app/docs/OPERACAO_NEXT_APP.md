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
   - bump/cleanup conforme `next-app/docs/BUMPS_E_AUTO_BUMP.md`

## Regras de mudança

- Novas features devem entrar somente em `next-app`.
- Qualquer ajuste de segurança deve priorizar APIs em `next-app/src/app/api`.
- Antes de merge/deploy, executar:
  - `npm test`
  - `npm run build`
  - iniciar o servidor;
  - `npm run smoke:critical`

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

## Dependências externas críticas

- Site: `https://cerejavip.com`
- PocketBase: `https://pocketbase.cerejavip.com`
- O DNS do subdomínio `pocketbase` precisa apontar para o serviço PocketBase.
- `public/sw.js` e `public/service-worker.js` neutralizam caches/PWAs antigos e
  não devem ser removidos sem planejamento.
