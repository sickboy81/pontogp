# Integração PixGo

Fonte oficial: https://pixgo.org/api/v1/docs

Contrato verificado em 12/08/2026. A documentação da PixGo informa que
`receiver_cpf` é obrigatório em todas as cobranças desde 25/06/2026.

## Criação da cobrança

- Endpoint: `POST https://pixgo.org/api/v1/payment/create`
- Autenticação: header `X-API-Key`
- Valor mínimo: R$ 10,00
- `receiver_cpf`: CPF ou CNPJ válido, somente números
- O QR Code fica vinculado ao documento informado
- `description`: máximo de 200 caracteres
- `external_id`: máximo de 50 caracteres
- Expiração do QR Code: usar sempre o `expires_at` retornado pela PixGo; não
  assumir uma duração fixa
- Limite mínimo: R$ 10,00
- Limite máximo: depende do nível da conta, com máximo de R$ 6.000,00 por QR
  Code e R$ 6.000,00 por dia para o CPF/CNPJ pagador
- Não existe ambiente separado de testes; as cobranças são reais

O CerejaVIP solicita o documento no modal, valida os dígitos no cliente e no
servidor e não grava esse dado na coleção `payments`.

## Consulta de status

O endpoint `GET /payment/{id}/status` tem limite de 1.000 requisições por
24 horas. O modal consulta a cada 30 segundos enquanto a cobrança está
pendente. O webhook consulta novamente esse endpoint antes de ativar um plano.

O endpoint de detalhes `GET /payment/{id}` pode retornar HTTP 410 quando a
cobrança estiver em estado final (`expired`, `cancelled`, `canceled` ou
`refunded`). Esse status significa que a cobrança existe, mas não mudará mais.

## Webhook

Eventos usados:

- `payment.completed`
- `payment.expired`
- `payment.refunded`

Os eventos podem incluir os objetos `customer`, `payer`, `product` e `amounts`.
`payer.cpf` é mascarado; use `status` para confirmar o pagamento, nunca
`payer_euid`.

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
