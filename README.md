# CerejaVIP - Plataforma de Classificados Premium

Plataforma de classificados para profissionais de entretenimento, construída com **Next.js**, **TypeScript** e **PocketBase**.

## 🚀 Tecnologias

- **Frontend**: Next.js (App Router) + TypeScript
- **Estilização**: Tailwind CSS
- **Backend/API**: PocketBase (backend-as-a-service)
- **Autenticação**: PocketBase Auth (JWT / cookie)
- **Pagamentos**: PIX (integração PixGo)
- **Mapas**: OpenStreetMap (iframe)
- **Deploy**: Docker / Coolify ou Vercel (frontend) + servidor PocketBase

## 📦 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/cerejavip.git
cd cerejavip
```

2. O app principal fica em `next-app`. Entre na pasta e instale as dependências:
```bash
cd next-app
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```
Edite o `.env` com a URL do PocketBase (`NEXT_PUBLIC_POCKETBASE_URL`), credenciais admin (para scripts e APIs server-side), PixGo, etc. Ver `next-app/.env.example` e `next-app/docs/` para detalhes.

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

5. **PocketBase**: rode o PocketBase separadamente (binário ou Docker). Crie as coleções conforme o schema exportado em `next-app/pocketbase-schema.json` ou a documentação em `next-app/docs/pocketbase-schema.md`. Para exportar o schema do seu PB: `npm run schema` (em `next-app`).

## 🏗️ Estrutura do Projeto

```
CerejaVIP - Versão 3/
├── next-app/              # Aplicação Next.js
│   ├── src/
│   │   ├── app/            # App Router (rotas, API routes)
│   │   ├── components/     # Componentes React
│   │   ├── lib/            # Utilitários, tipos, API client
│   │   └── store/          # Estado (Zustand)
│   ├── pocketbase-schema.json
│   ├── scripts/            # Scripts (export schema, auto-bump, cleanup)
│   └── docs/
├── .env                    # Variáveis da raiz (opcional; next-app usa o seu .env)
└── README.md
```

## 🎯 Funcionalidades Principais

### Homepage
- Grid de cards com perfis
- Filtros avançados (cidade, categoria, idade, preço, etc.)
- Busca por palavra-chave
- Paginação infinita
- Badge "Online Agora"
- Sistema de favoritos

### Página de Perfil
- Galeria de fotos com lightbox
- Player de vídeos e áudio de apresentação
- Descrição, serviços, tabela de preços
- Mapa com localização (OpenStreetMap)
- Botões de contato (WhatsApp, Telegram, etc.)
- Registro de views e cliques; compartilhamento; denúncia

### Dashboard do Anunciante
- Criar/editar perfil
- Upload de fotos, vídeos e áudio
- Gerenciar horários de atendimento
- Toggle "Ficar Online"
- Estatísticas (views, cliques, favoritos)
- Solicitação de verificação; stories

### Painel Administrativo
- Dashboard com métricas
- Gerenciamento de usuários e perfis
- Verificações (aprovar/rejeitar)
- Mensagens, denúncias, pagamentos
- **Cupons**: listar, criar, ativar/desativar (`/admin/cupons`)
- Analytics (views/cliques, períodos, top perfis)
- Broadcast (notificação para todos os usuários)
- Configurações (manutenção, aviso do topo)

## 🔧 Configuração do PocketBase

- Coleções principais: `users`, `profiles`, `plans`, `payments`, `coupons`, `verification_requests`, `profile_views`, `profile_clicks`, `messages`, `reports`, `notifications`, etc.
- Schema de referência: `next-app/pocketbase-schema.json` (gerado por `npm run schema` em `next-app`).
- Documentação: `next-app/docs/pocketbase-schema.md` e `next-app/POCKETBASE_SETUP.md` (se existir).

## ⏱ Scripts de cron (Coolify / VPS)

- **Bump automático:** scripts na raiz (`auto_bump.cjs`, `scripts/auto-bump.js`) aplicam subidas e usam `profile_daily_bumps`. Use **apenas um** em produção. Variáveis: `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`. Ver `next-app/docs/BUMPS_E_AUTO_BUMP.md`.
- **Cleanup de expiração:** `next-app/scripts/cleanup_profiles.mjs` (contact_expires_at vencido → status muted; search_expires_at vencido → archived). Agende uma vez ao dia. Mesmas variáveis de ambiente (URL + admin).
- **Smoke/rollback/monitoramento:** ver `next-app/docs/SMOKE_ROLLBACK_MONITORAMENTO.md`.
- **Operação 100% Next:** ver `next-app/docs/OPERACAO_NEXT_APP.md` (o `legacy-vite/` é somente referência histórica).

## 🌐 Deploy

- **Next.js**: Vercel, Coolify/Nixpacks ou Docker. Configure as variáveis de ambiente de produção.
- **PocketBase**: VPS/Docker; use HTTPS e configure CORS e domínio.
- **PIX**: Webhook de confirmação em `/api/payments/pix/webhook`. O usuário pode informar um cupom no modal de pagamento; ao confirmar o PIX, o webhook aplica plano e duração do cupom ao perfil e incrementa `used_count`.

## 📄 Licença

Este projeto é privado e proprietário.

## 📞 Suporte

Para suporte, acesse a página de contato no site ou envie um email para contato@cerejavip.com.
