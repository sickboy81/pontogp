# Smoke, Rollback e Monitoramento (produção)

Guia curto para publicação segura sem quebrar fluxos críticos.

## 1) Pré-deploy (obrigatório)

1. Build local:
   - `npm run build`
2. Smoke local:
   - `npm run smoke:critical`
   - ou com URL específica: `SMOKE_BASE_URL=https://cerejavip.com npm run smoke:critical`
3. Verificar variáveis críticas:
   - `NEXT_PUBLIC_POCKETBASE_URL`
   - `POCKETBASE_ADMIN_EMAIL`
   - `POCKETBASE_ADMIN_PASSWORD`
   - `PIXGO_WEBHOOK_SECRET`
   - `TURNSTILE_SECRET_KEY`

## 2) Pós-deploy (primeiros 5-10 min)

1. Rodar smoke em produção:
   - `SMOKE_BASE_URL=https://cerejavip.com npm run smoke:critical`
2. Validar manualmente no painel:
   - `/admin/planos`
   - `/admin/assinaturas`
   - `/admin/contatos`
   - `/admin` (cards de receita/assinaturas/contatos)
3. Inspecionar logs:
   - Buscar picos de `401`, `403`, `429`, `500`
   - Garantir ausência de erro recorrente em:
     - `/api/admin/*`
     - `/api/contact`
     - `/api/payments/pix/webhook`

## 3) Critério de rollback

Fazer rollback imediato se ocorrer qualquer um dos cenários:

- rota crítica indisponível por mais de 5 minutos
- erro 500 recorrente em APIs admin
- falha de autenticação admin após deploy
- falha de recebimento de webhook PIX

## 4) Procedimento de rollback

1. Reverter para imagem/tag anterior no Coolify
2. Confirmar serviço saudável (`/` e `/anunciantes`)
3. Rodar smoke novamente
4. Abrir investigação em branch separada antes de novo deploy

## 5) Observabilidade mínima recomendada

- Alertar quando `5xx` > 2% por 5 minutos
- Alertar quando `/api/payments/pix/webhook` tiver 401/429 anormal
- Acompanhar volume de `contacts` e `payments` após deploy
