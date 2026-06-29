# Cereja Stories - design

## Objetivo

Padronizar o recurso de stories com o nome comercial **Cereja Stories** e
garantir que cada publicação permaneça visível por 24 horas.

## Escopo

- Trocar os textos visíveis de produto de Story/Stories para Cereja Stories.
- Preservar nomes técnicos existentes, incluindo rotas `/api/stories`, tipos,
  parâmetros de URL e coleções PocketBase.
- Definir uma fonte compartilhada para a duração de 24 horas.
- Usar essa duração na criação, listagem pública, histórico e textos da
  interface.
- Manter o valor `expires_at` de publicações existentes. O fallback aplicado a
  registros antigos sem `expires_at` passa a considerar 24 horas desde a criação.

## Arquitetura

Uma constante compartilhada e segura para cliente e servidor representará a
duração em horas e milissegundos. APIs e componentes importarão essa fonte em
vez de repetir valores literais.

O branding será alterado somente nas superfícies apresentadas ao usuário:
dashboard, home, visualizador, compartilhamento, metadados, mensagens e páginas
comerciais. Termos internos continuarão inalterados para evitar migração de
dados ou quebra de links.

## Compatibilidade

- Nenhuma coleção ou campo do PocketBase será renomeado.
- URLs existentes com `stories=1` e `story=<id>` continuarão funcionando.
- Curtidas, comentários, denúncias e uploads manterão os contratos atuais.
- Stories criados após a mudança receberão `expires_at` em 24 horas.

## Verificação

- Teste automatizado para a duração compartilhada e o cálculo de expiração.
- Busca no código para confirmar que não restam literais funcionais de 12 horas.
- Build de produção do Next.js.
- Teste temporário na API: publicar, listar, curtir e comentar; confirmar
  `expires_at` próximo de 24 horas e remover os registros de teste.

## Fora do escopo

- Renomear APIs, tabelas, tipos TypeScript ou parâmetros de URL.
- Alterar layout, upload, reprodução, curtidas ou comentários.
- Modificar a expiração já gravada em stories existentes.
