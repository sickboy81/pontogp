# Publicacao de perfil com tres fotos

## Objetivo

Exigir pelo menos tres fotos para publicar um perfil no CerejaVIP. A publicacao
deve depender de uma acao explicita do anunciante e ser validada no servidor.

## Comportamento

- Um novo perfil e criado com `status = "inactive"`.
- Depois da criacao, o anunciante e direcionado para a aba `Midia`.
- A aba mostra o progresso ate o minimo de tres fotos.
- O botao `Publicar perfil` permanece desabilitado com menos de tres fotos.
- Ao clicar em `Publicar perfil`, o servidor consulta o perfil no PocketBase e
  so altera o status para `active` quando existem pelo menos tres fotos.
- A validacao do servidor e obrigatoria mesmo que a interface ja tenha validado
  a quantidade.
- Um perfil ativo com exatamente tres fotos nao pode remover uma delas.
- Para trocar uma das tres fotos, o anunciante deve primeiro adicionar outra e
  depois remover a antiga.
- Perfis antigos que ja estejam ativos com menos de tres fotos nao serao
  despublicados automaticamente.
- Caso um perfil antigo com menos de tres fotos seja desativado, ele precisara
  cumprir o minimo antes de ser publicado novamente.

## Arquitetura

Uma regra de dominio pequena e independente definira:

- quantidade minima de fotos;
- possibilidade de publicar;
- possibilidade de remover uma foto de um perfil ativo.

As rotas de publicacao e remocao usarao essa regra. A interface usara a mesma
constante e os mesmos predicados para informar o progresso e controlar os
botoes. A seguranca nao dependera do estado do navegador.

## API

Sera criada uma operacao explicita de publicacao:

`POST /api/profiles/[id]/publish`

Ela deve:

1. validar o cookie e identificar o usuario;
2. carregar `id`, `user`, `status` e `photos` do perfil;
3. confirmar que o perfil pertence ao usuario;
4. rejeitar com `400` quando houver menos de tres fotos;
5. alterar somente `status` para `active`;
6. retornar o perfil atualizado.

A rota de exclusao de foto passara a carregar tambem o `status`. Quando o
perfil estiver ativo, a exclusao sera rejeitada se o resultado tiver menos de
tres fotos.

## Interface

Depois de criar o registro, o formulario manterá o perfil em tela e abrirá a
aba `Midia`, em vez de voltar imediatamente ao dashboard. A area de fotos
mostrara quantas fotos ainda faltam e exibira o comando `Publicar perfil`.

O botao de publicacao:

- aparece apenas para perfil inativo;
- fica desabilitado ate existirem tres fotos;
- mostra estado de carregamento durante a requisicao;
- atualiza localmente o status retornado pela API;
- exibe a mensagem da API em caso de erro.

Em perfil ativo com tres fotos, o botao de remover foto fica desabilitado e
explica que outra foto deve ser adicionada antes da remocao.

## Compatibilidade

- O schema atual ja aceita os estados `active` e `inactive`; nenhuma colecao
  nova sera criada.
- A listagem publica continua filtrando apenas `status = "active"`.
- O auto bump permanece inalterado e continua processando apenas perfis ativos.
- Uploads, videos, audio, planos e pagamentos nao mudam.
- O fluxo administrativo continua podendo gerenciar status pelas rotas
  administrativas existentes.

## Testes

Os testes da regra de dominio usarao `node:test`, sem dependencia adicional.
Devem cobrir:

- publicacao bloqueada com zero, uma ou duas fotos;
- publicacao permitida com tres ou mais fotos;
- remocao livre em perfil inativo;
- remocao bloqueada quando perfil ativo ficaria com menos de tres fotos;
- remocao permitida quando perfil ativo continuaria com tres ou mais fotos.

Depois da implementacao serao executados:

```bash
cd next-app
npm test
npm run build
npm run schema:check
```

O smoke local deve confirmar criacao como rascunho, upload de tres fotos,
publicacao explicita e bloqueio da remocao da terceira foto.
