# Integração PixGo

Fonte oficial: https://pixgo.org/api/v1/docs

Contrato revisado em 13/06/2026. A documentação da PixGo informa que
`receiver_cpf` será obrigatório em todas as cobranças a partir de 25/06/2026.

## Criação da cobrança

- Endpoint: `POST https://pixgo.org/api/v1/payment/create`
- Autenticação: header `X-API-Key`
- Valor mínimo: R$ 10,00
- `receiver_cpf`: CPF ou CNPJ válido, somente números
- O QR Code fica vinculado ao documento informado
- `description`: máximo de 200 caracteres
- `external_id`: máximo de 50 caracteres
- Expiração do QR Code: 20 minutos

O CerejaVIP solicita o documento no modal, valida os dígitos no cliente e no
servidor e não grava esse dado na coleção `payments`.

## Consulta de status

O endpoint `GET /payment/{id}/status` tem limite de 1.000 requisições por
24 horas. O modal consulta a cada 30 segundos enquanto a cobrança está
pendente. O webhook consulta novamente esse endpoint antes de ativar um plano.

## Webhook

Eventos usados:

- `payment.completed`
- `payment.expired`
- `payment.refunded`

Headers obrigatórios para validação:

- `X-Webhook-Timestamp`
- `X-Webhook-Signature`

A assinatura esperada é o HMAC-SHA256 de:

```text
timestamp.corpo_bruto
```

Use `PIXGO_WEBHOOK_SECRET` como chave. O CerejaVIP rejeita assinaturas
inválidas e timestamps com diferença superior a cinco minutos.

## Produção

No Coolify, mantenha:

- `PIXGO_API_KEY`
- `PIXGO_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL=https://cerejavip.com`

`PIXGO_WEBHOOK_SIGNATURE_HEADER` não é mais usado.
