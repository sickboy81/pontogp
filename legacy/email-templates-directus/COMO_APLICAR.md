# Como Aplicar os Templates de Email no Directus

Os templates personalizados precisam ser copiados para o servidor onde o Directus está rodando.

## Opção 1: Via Coolify (Interface Web)

1. **Acesse o Coolify**
2. **Vá até o serviço do Directus**
3. **Abra o terminal** (se disponível) ou acesse via SSH
4. **Navegue até a pasta do Directus:**
   ```bash
   cd /app  # ou onde o Directus está instalado
   ```
5. **Crie a pasta templates:**
   ```bash
   mkdir -p templates
   ```
6. **Crie os arquivos de template** (copie o conteúdo dos arquivos .liquid)

## Opção 2: Via SSH

1. **Conecte ao servidor:**
   ```bash
   ssh usuario@seu-servidor
   ```

2. **Acesse o container do Directus:**
   ```bash
   docker exec -it <container_id> sh
   ```

3. **Crie a pasta templates:**
   ```bash
   mkdir -p /directus/templates
   ```

4. **Crie os arquivos:**
   ```bash
   # Password Reset
   cat > /directus/templates/password-reset.liquid << 'EOF'
   (cole o conteúdo do arquivo password-reset.liquid aqui)
   EOF

   # User Invitation
   cat > /directus/templates/user-invitation.liquid << 'EOF'
   (cole o conteúdo do arquivo user-invitation.liquid aqui)
   EOF

   # User Registration
   cat > /directus/templates/user-registration.liquid << 'EOF'
   (cole o conteúdo do arquivo user-registration.liquid aqui)
   EOF
   ```

## Opção 3: Volume no Docker Compose

Se você usa Docker Compose, adicione um volume para os templates:

```yaml
services:
  directus:
    image: directus/directus
    volumes:
      - ./templates:/directus/templates
    environment:
      EMAIL_TEMPLATES_PATH: /directus/templates
```

## Opção 4: Variável de Ambiente

Adicione no Directus:
```env
EMAIL_TEMPLATES_PATH=/directus/templates
```

## Arquivos Incluídos

| Arquivo | Descrição |
|---------|-----------|
| `password-reset.liquid` | Email de recuperação de senha |
| `user-invitation.liquid` | Email de convite de usuário |
| `user-registration.liquid` | Email de boas-vindas |

## Após Aplicar

1. **Reinicie o Directus** para carregar os novos templates
2. **Teste** enviando um email de recuperação de senha
3. **Verifique** se o novo design aparece

## Desativar Flows Duplicados

Depois que os templates estiverem funcionando, você pode desativar os Flows que criamos:

1. Acesse: https://base.pontogp.com/admin/settings/flows
2. Edite cada Flow criado
3. Mude o status para "Inactive"

Ou execute:
```bash
node scripts/disable_email_flows.mjs
```
