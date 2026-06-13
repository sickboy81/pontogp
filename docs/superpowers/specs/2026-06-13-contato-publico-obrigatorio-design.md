# Contato Publico Obrigatorio no Perfil

## Objetivo

Garantir que todo perfil publicado tenha pelo menos um meio externo de contato
preenchido e visivel ao publico entre WhatsApp, Telegram e telefone.

## Regra de negocio

Um contato valido para publicacao deve cumprir simultaneamente:

- o campo correspondente possui conteudo apos remover espacos nas extremidades;
- a opcao `show_whatsapp`, `show_telegram` ou `show_phone` correspondente esta
  marcada.

O perfil satisfaz a regra quando pelo menos um dos tres pares campo/visibilidade
e valido.

Exemplos:

- WhatsApp preenchido e `show_whatsapp = true`: valido;
- Telegram preenchido e `show_telegram = false`: nao conta;
- telefone vazio e `show_phone = true`: nao conta;
- todos os campos vazios: invalido;
- dois contatos preenchidos, mas ambos ocultos: invalido.

## Fluxos afetados

### Criacao e rascunho

O formulario deve exigir pelo menos um contato preenchido e publico antes de
criar o perfil. A API de criacao deve repetir a validacao, impedindo que uma
requisicao direta contorne o formulario.

Perfis inativos existentes ainda podem ser editados e salvos sem contato para
que dados legados nao fiquem bloqueados durante uma edicao parcial. Entretanto,
nao podem ser publicados enquanto a regra nao for satisfeita.

### Publicacao

O endpoint de publicacao deve validar:

- pelo menos tres fotos;
- pelo menos um contato preenchido e publico.

Se faltar contato, deve responder com erro claro e manter o perfil inativo.

### Edicao de perfil ativo

Uma edicao nao pode deixar um perfil ativo sem contato publico. A API de
atualizacao deve avaliar o estado final do registro, combinando os valores
enviados com os valores atuais. Isso evita que uma atualizacao parcial oculte
ou apague o ultimo contato disponivel.

O usuario pode trocar de canal, desde que o resultado final mantenha ao menos
um contato preenchido e publico.

## Interface

Na secao `Contato`, o formulario deve informar:

> Preencha e torne publico pelo menos um contato.

Ao tentar criar ou publicar sem cumprir a regra, a mesma mensagem deve aparecer
na area de erro existente. Os campos e checkboxes atuais permanecem; nao sera
adicionado novo componente ou dependencia.

O botao `Publicar perfil` deve ficar indisponivel enquanto faltarem fotos ou
contato publico. O texto de apoio deve indicar especificamente o requisito
pendente.

## Arquitetura

A regra compartilhada ficara em `next-app/src/lib/profile-publication.mjs`,
junto das regras de fotos e status publico. Ela recebera os tres valores e as
tres flags de visibilidade e retornara um booleano.

O formulario usara essa funcao para feedback imediato. As APIs de criacao,
atualizacao e publicacao aplicarao a mesma funcao como fonte de verdade no
servidor.

Nenhuma colecao, regra do PocketBase, cron, Dockerfile ou fluxo de auto bump
sera alterado.

## Tratamento de erros

As APIs retornarao status `400` quando a operacao produzir um perfil sem contato
publico obrigatorio. A mensagem sera:

`Preencha e torne publico pelo menos um contato.`

Falhas de autenticacao e autorizacao manterao os status atuais.

## Testes e verificacao

Os testes unitarios devem cobrir:

- um campo preenchido e publico e aceito;
- campo preenchido, mas oculto, e rejeitado;
- campo vazio, mas marcado como publico, e rejeitado;
- espacos em branco nao contam como contato;
- qualquer um dos tres canais pode satisfazer a regra;
- um perfil ativo nao pode perder seu ultimo contato publico;
- a troca de um contato publico por outro permanece permitida.

Antes do envio:

```bash
cd next-app
npm test
npm run schema:check
npm run build
```

Tambem deve ser feito um teste manual do formulario para criacao, publicacao e
edicao de perfil ativo.
