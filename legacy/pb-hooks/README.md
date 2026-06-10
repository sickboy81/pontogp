# Hooks do PocketBase

Estes arquivos pertencem a uma integração anterior e **não são instalados
pelo Dockerfile da aplicação Next.js**.

- `pixgo.pb.js`: rotas PIX antigas no próprio PocketBase. O fluxo oficial
  atual usa `/api/payments/pix`, `/api/payments/pix/status` e
  `/api/payments/pix/webhook` no Next.js.
- `secure_users.pb.js`: proteção adicional contra alteração do campo `role`
  por usuário comum.

Antes de copiar qualquer hook para o volume de produção:

1. confirme a versão do PocketBase e a compatibilidade da API JavaScript;
2. confira se o hook já está instalado no volume real;
3. faça backup do banco e dos hooks atuais;
4. teste cadastro, edição de usuário e pagamento em ambiente separado.

O repositório não confirma sozinho quais hooks estão ativos no servidor.
Regras de acesso da coleção `users` e a proteção do campo `role` precisam ser
auditadas diretamente no painel/volume do PocketBase.
