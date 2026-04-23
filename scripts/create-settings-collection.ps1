# Script PowerShell para criar e configurar a collection settings no Directus
# Executa: .\scripts\create-settings-collection.ps1

# Carregar .env se existir
$envPath = Join-Path $PSScriptRoot "..\.env"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^\s*([^=]+?)\s*=\s*(.*)$' -and -not $_.StartsWith('#')) {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

$directusUrl = $env:VITE_DIRECTUS_URL
if (-not $directusUrl) {
    $directusUrl = "https://base.pontogp.com"
}

$email = $env:DIRECTUS_ADMIN_EMAIL
$password = $env:DIRECTUS_ADMIN_PASSWORD

if (-not $email -or -not $password) {
    Write-Host "ERRO: Variáveis de ambiente nao definidas!" -ForegroundColor Red
    Write-Host "   Defina DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD no .env" -ForegroundColor Yellow
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Criar Collection Settings - Directus" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Login
Write-Host "1. Fazendo login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = $email
        password = $password
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$directusUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop

    $sessionToken = $loginResponse.data.access_token
    Write-Host "   ✅ Login realizado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro no login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $sessionToken"
    "Content-Type" = "application/json"
}

Write-Host ""

# 2. Verificar se collection existe
Write-Host "2. Verificando se collection settings existe..." -ForegroundColor Yellow
try {
    $collectionsResponse = Invoke-RestMethod -Uri "$directusUrl/collections" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop

    $collectionExists = $collectionsResponse.data | Where-Object { $_.collection -eq "settings" }
    
    if ($collectionExists) {
        Write-Host "   ✅ Collection settings já existe!" -ForegroundColor Green
        $createCollection = $false
    } else {
        Write-Host "   📝 Collection não existe, será criada..." -ForegroundColor Yellow
        $createCollection = $true
    }
} catch {
    Write-Host "   ⚠️  Erro ao verificar collections: $($_.Exception.Message)" -ForegroundColor Yellow
    $createCollection = $true
}

Write-Host ""

# 3. Criar collection se não existir
if ($createCollection) {
    Write-Host "3. Criando collection settings..." -ForegroundColor Yellow
    try {
        $collectionBody = @{
            collection = "settings"
            meta = @{
                collection = "settings"
                icon = "settings"
                note = "Configurações do sistema"
                display_template = "{{key}}"
                hidden = $false
                singleton = $false
            }
            schema = @{
                name = "settings"
            }
        } | ConvertTo-Json -Depth 10

        Invoke-RestMethod -Uri "$directusUrl/collections" `
            -Method POST `
            -Headers $headers `
            -Body $collectionBody `
            -ErrorAction Stop | Out-Null

        Write-Host "   ✅ Collection criada com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Erro ao criar collection: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

# 4. Verificar e criar campos
Write-Host "4. Verificando campos..." -ForegroundColor Yellow
try {
    $fieldsResponse = Invoke-RestMethod -Uri "$directusUrl/fields/settings" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop

    $existingFields = $fieldsResponse.data | ForEach-Object { $_.field }
} catch {
    $existingFields = @()
}

$requiredFields = @(
    @{ field = "key"; type = "string"; meta = @{ required = $true; width = "full"; note = "Chave única da configuração" } },
    @{ field = "value"; type = "json"; meta = @{ width = "full"; note = "Valor da configuração (JSON)" } },
    @{ field = "enabled"; type = "boolean"; meta = @{ width = "half"; note = "Se a configuração está ativa" } },
    @{ field = "message"; type = "text"; meta = @{ width = "full"; note = "Mensagem (para manutenção)" } }
)

foreach ($fieldConfig in $requiredFields) {
    if ($existingFields -contains $fieldConfig.field) {
        Write-Host "   ✅ Campo '$($fieldConfig.field)' já existe" -ForegroundColor Gray
    } else {
        Write-Host "   📝 Criando campo '$($fieldConfig.field)'..." -ForegroundColor Yellow
        try {
            $fieldBody = @{
                field = $fieldConfig.field
                type = $fieldConfig.type
                meta = $fieldConfig.meta
            } | ConvertTo-Json -Depth 10

            Invoke-RestMethod -Uri "$directusUrl/fields/settings" `
                -Method POST `
                -Headers $headers `
                -Body $fieldBody `
                -ErrorAction Stop | Out-Null

            Write-Host "   ✅ Campo '$($fieldConfig.field)' criado!" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Erro ao criar campo '$($fieldConfig.field)': $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}
Write-Host ""

# 5. Configurar permissões para Public
Write-Host "5. Configurando permissões para Public..." -ForegroundColor Yellow
try {
    # Obter role Public
    $rolesResponse = Invoke-RestMethod -Uri "$directusUrl/roles" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop

    $publicRole = $rolesResponse.data | Where-Object { $_.name -eq "Public" -or $_.id -eq "2f24211d-5d52-4b1f-9328-c5f8c89b5a5a" } | Select-Object -First 1

    if ($publicRole) {
        # Verificar permissões existentes
        $permissionsResponse = Invoke-RestMethod -Uri "$directusUrl/permissions?filter[role][_eq]=$($publicRole.id)&filter[collection][_eq]=settings" `
            -Method GET `
            -Headers $headers `
            -ErrorAction Stop

        $readPermission = $permissionsResponse.data | Where-Object { $_.action -eq "read" } | Select-Object -First 1

        if ($readPermission) {
            Write-Host "   ✅ Permissão de leitura já existe para Public" -ForegroundColor Green
        } else {
            $permissionBody = @{
                role = $publicRole.id
                collection = "settings"
                action = "read"
                permissions = @{}
                validation = @{}
                presets = @{}
                fields = @("*")
            } | ConvertTo-Json -Depth 10

            Invoke-RestMethod -Uri "$directusUrl/permissions" `
                -Method POST `
                -Headers $headers `
                -Body $permissionBody `
                -ErrorAction Stop | Out-Null

            Write-Host "   ✅ Permissão de leitura criada para Public" -ForegroundColor Green
        }
    } else {
        Write-Host "   ⚠️  Role Public não encontrada" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Erro ao configurar permissões: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   💡 Configure manualmente em Settings → Access Control → Public" -ForegroundColor Gray
}
Write-Host ""

# 6. Criar registro de manutenção
Write-Host "6. Verificando registro de manutenção..." -ForegroundColor Yellow
try {
    $maintenanceResponse = Invoke-RestMethod -Uri "$directusUrl/items/settings?filter[key][_eq]=maintenance" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop

    if ($maintenanceResponse.data -and $maintenanceResponse.data.Count -gt 0) {
        Write-Host "   ✅ Registro de manutenção já existe" -ForegroundColor Green
    } else {
        Write-Host "   📝 Criando registro de manutenção..." -ForegroundColor Yellow
        $maintenanceBody = @{
            key = "maintenance"
            enabled = $false
            message = "Site em manutenção. Voltaremos em breve!"
            value = @{
                enabled = $false
                message = "Site em manutenção. Voltaremos em breve!"
            }
        } | ConvertTo-Json -Depth 10

        Invoke-RestMethod -Uri "$directusUrl/items/settings" `
            -Method POST `
            -Headers $headers `
            -Body $maintenanceBody `
            -ErrorAction Stop | Out-Null

        Write-Host "   ✅ Registro de manutenção criado!" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Erro ao criar registro de manutenção: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   💡 Crie manualmente em Content → Settings" -ForegroundColor Gray
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Configuração concluída com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Verifique a collection em: Settings → Data Model → settings" -ForegroundColor Gray
Write-Host "   2. Verifique as permissões em: Settings → Access Control → Public" -ForegroundColor Gray
Write-Host "   3. Teste acessando: /items/settings?filter[key][_eq]=maintenance" -ForegroundColor Gray
Write-Host ""
