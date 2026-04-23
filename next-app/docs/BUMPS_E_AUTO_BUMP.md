# Bumps e subidas automáticas (guia operacional)

Este documento é a referência oficial para evitar quebra no bump em produção.

## Fluxo oficial em produção

Use **somente este conjunto**:

- `auto_bump.cjs` (raiz) -> executa bump automático.
- `scripts/reset-daily-bumps.mjs` (raiz) -> limpa contadores antigos 1x/dia.
- Fonte de cota diária: coleção `profile_daily_bumps`.
- Campo de ordenação/recência: `profiles.last_bump_at`.

Nao use dois mecanismos de bump ao mesmo tempo.

## Regras de negócio do bump atual

- O `auto_bump.cjs` percorre perfis `status = "active"`.
- Para cada perfil:
  - valida plano com `daily_bumps > 0`;
  - consulta uso do dia em `profile_daily_bumps`;
  - respeita intervalo `24h / daily_bumps`;
  - incrementa `bumps_used` e atualiza `last_bump_at`.
- Se faltar plano/cota, nao sobe.

## Anti-concorrencia (proteção contra dupla execução)

`auto_bump.cjs` usa lock local:

- arquivo: `/tmp/cerejavip-auto-bump.lock`;
- se ja existir lock recente, o ciclo atual é ignorado;
- lock "velho" (stale) é substituido automaticamente.

Isso evita corrida entre execuções sobrepostas.

## Variáveis obrigatórias

### Para `auto_bump.cjs`

- URL PB: `NEXT_PUBLIC_POCKETBASE_URL` (ou `VITE_POCKETBASE_URL`)
- Admin:
  - `POCKETBASE_ADMIN_EMAIL` (ou `PB_ADMIN_EMAIL`)
  - `POCKETBASE_ADMIN_PASSWORD` (ou `PB_ADMIN_PASSWORD`)

### Para `scripts/reset-daily-bumps.mjs`

- URL PB (qualquer uma):
  - `POCKETBASE_URL`
  - `NEXT_PUBLIC_POCKETBASE_URL`
  - `VITE_POCKETBASE_URL`
- Admin (qualquer par):
  - `POCKETBASE_ADMIN_EMAIL` + `POCKETBASE_ADMIN_PASSWORD`
  - `PB_ADMIN_EMAIL` + `PB_ADMIN_PASSWORD`
  - `DIRECTUS_ADMIN_EMAIL` + `DIRECTUS_ADMIN_PASSWORD`
  - `ADMIN_EMAIL` + `ADMIN_PASSWORD`

## Cron recomendado

```cron
0 0 * * * . /etc/environment.sh && cd /app && node /app/scripts/reset-daily-bumps.mjs >> /var/log/cron.log 2>&1
*/5 * * * * . /etc/environment.sh && cd /app && node /app/auto_bump.cjs >> /var/log/auto_bump.log 2>&1
```

## Checklist de saúde (produção)

1. Ver cron:
   - `crontab -l` e `/etc/crontabs/root`.
2. Ver envs:
   - admin + URL PB presentes no container.
3. Teste manual:
   - `node /app/auto_bump.cjs`.
4. Ver logs:
   - `/var/log/auto_bump.log` (obrigatório),
   - `/var/log/cron.log` (se habilitado).
5. Validar dados:
   - `profile_daily_bumps` atualiza `bumps_used`,
   - `profiles.last_bump_at` atualiza.

## Troubleshooting rápido

- **"No such container"**: use o nome atual via `docker ps`.
- **"credenciais admin ausentes"**: faltam envs admin no serviço.
- **"POCKETBASE_URL ausente" no reset**: definir `POCKETBASE_URL` ou usar `NEXT_PUBLIC_POCKETBASE_URL`.
- **Bump nao acontece mas sem erro**:
  - perfil sem plano valido,
  - cota diaria esgotada,
  - intervalo entre bumps ainda nao atingido.

## Alinhamento com APIs do next-app

- `GET /api/profiles/me`: calcula bumps usados do dia em `profile_daily_bumps`.
- `POST /api/profiles/me/bump`: consome mesma cota e atualiza `last_bump_at`.
- Listagem padrão usa `-last_bump_at,-created`.

Assim, bump manual + bump automático compartilham a mesma fonte de verdade.
