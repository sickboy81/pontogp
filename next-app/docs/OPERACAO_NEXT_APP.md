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
  - `npm run build`
  - iniciar o servidor;
  - `npm run smoke:critical`

## Dependências externas críticas

- Site: `https://cerejavip.com`
- PocketBase: `https://pocketbase.cerejavip.com`
- O DNS do subdomínio `pocketbase` precisa apontar para o serviço PocketBase.
- `public/sw.js` e `public/service-worker.js` neutralizam caches/PWAs antigos e
  não devem ser removidos sem planejamento.
