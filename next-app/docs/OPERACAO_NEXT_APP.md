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
2. Start sempre via Next:
   - `npm run start`
3. Cron scripts oficiais:
   - bump/cleanup conforme `next-app/docs/BUMPS_E_AUTO_BUMP.md`

## Regras de mudança

- Novas features devem entrar somente em `next-app`.
- Qualquer ajuste de segurança deve priorizar APIs em `next-app/src/app/api`.
- Antes de merge/deploy, executar:
  - `npm run build`
  - `npm run smoke:critical`
