# Arquivos legados

Esta pasta preserva material histórico que não participa do build, runtime ou
deploy atual do CerejaVIP.

## Conteúdo

- `root-scripts/`: migrações, diagnósticos e scripts pontuais das fases
  Directus/PocketBase anteriores.
- `email-templates-directus/`: templates Liquid do antigo Directus.
- `pb-hooks/`: hooks antigos do PocketBase, incluindo o fluxo PIX anterior.
- `project-audits/`: checklists e levantamentos produzidos durante a migração.

## Regras

- Não execute arquivos desta pasta em produção sem auditar o código inteiro.
- Não importe módulos daqui na aplicação oficial.
- Não configure Coolify/Docker para copiar esta pasta.
- Se uma rotina voltar a ser necessária, reimplemente ou mova apenas o arquivo
  necessário para uma área oficial, documente e teste.

A aplicação oficial permanece em `next-app/`. Os únicos scripts operacionais
da raiz são `auto_bump.cjs` e `scripts/reset-daily-bumps.mjs`.
