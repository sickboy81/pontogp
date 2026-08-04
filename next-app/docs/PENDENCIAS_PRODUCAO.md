# Pendências externas de produção

Itens que não podem ser resolvidos apenas pelo Git porque dependem do painel,
volume ou configuração do servidor.

## Prioridade alta

### Proteção do campo `users.role`

O schema exportado em 10/06/2026 permite que o usuário atualize o próprio
registro. Confirme no PocketBase que usuários comuns não conseguem enviar
`role`, `status`, `verified`, `document_verified`, `plan` ou `chat_blocked`.

O arquivo `legacy/pb-hooks/secure_users.pb.js` tenta bloquear alteração de `role`,
mas o Git não confirma se ele está instalado nem se é compatível com a versão
atual do PocketBase.

Validação recomendada: em ambiente de teste, autentique um usuário comum e
tente alterar cada campo privilegiado diretamente pela API. Todas essas
tentativas devem falhar.

### Planos pagos

O endpoint genérico de perfil foi restringido em 10/06/2026: usuários só
podem aplicar diretamente o plano `gratis`. Planos pagos devem ser aplicados
exclusivamente pelo webhook PIX ou por uma operação administrativa
autorizada. Usuários também não podem mudar `status` ou
`visual_highlight` pelo PATCH genérico. Preserve essa separação em futuras
refatorações.

## Prioridade média

### Campos opcionais de perfil ausentes

O formulário possui controles para os campos abaixo, mas eles não constavam no
schema exportado em 10/06/2026:

- `show_whatsapp`
- `show_telegram`
- `show_phone`
- `bio_show_full_profile`
- `bio_button_color`
- `price_30min`
- `price_1h`
- `price_2h`
- `price_overnight`

Os preços principais também são armazenados no campo JSON `prices`, portanto
os campos individuais podem ser legados. Já os controles de visibilidade e
link bio precisam ser testados para confirmar se persistem após recarregar a
página. Se forem necessários, crie os campos no PocketBase e reexporte o
schema; caso contrário, remova os controles/campos legados do código.

### Cleanup de expiração

`next-app/scripts/cleanup_profiles.mjs` existe, mas não está no cron do
Dockerfile. Defina explicitamente se perfis expirados devem ser
mutados/arquivados automaticamente e, se sim, agende o job com logs.

## Qualidade

`npm run lint` deve permanecer sem erros ou avisos antes do deploy.

## Infraestrutura

- Não há CI versionada em `.github/workflows`; build e smoke dependem do
  processo manual/Coolify.
- O backup interno diário do PocketBase está configurado para 03:00, com
  retenção de 7 cópias. Ainda é necessário manter uma cópia externa e testar
  a restauração em ambiente separado.
- DNS, variáveis do Coolify e hooks instalados devem ser inventariados fora
  do Git, sem incluir segredos.
