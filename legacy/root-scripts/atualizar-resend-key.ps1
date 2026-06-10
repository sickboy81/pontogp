# Script para atualizar a API key do Resend no servidor
# Este script ajuda a verificar e atualizar a configuração

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Atualizar API Key do Resend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   Este script é um guia. A API key precisa ser atualizada" -ForegroundColor Yellow
Write-Host "   no servidor onde o Directus está rodando." -ForegroundColor Yellow
Write-Host ""

# Verificar se há .env local
$envPath = ".env"
if (Test-Path $envPath) {
    Write-Host "📄 Arquivo .env encontrado localmente" -ForegroundColor Green
    Write-Host ""
    
    $envContent = Get-Content $envPath -Raw
    if ($envContent -match "RESEND_API_KEY|EMAIL_SMTP_PASSWORD") {
        Write-Host "⚠️  ATENÇÃO: Encontrada referência à API key no .env local" -ForegroundColor Yellow
        Write-Host "   Isso é apenas para referência local." -ForegroundColor Gray
        Write-Host "   A configuração real está no SERVIDOR do Directus." -ForegroundColor Gray
        Write-Host ""
    }
}

Write-Host "📋 Passos para Atualizar:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Obter a nova API key do Resend:" -ForegroundColor Yellow
Write-Host "   - Acesse: https://resend.com/api-keys" -ForegroundColor Gray
Write-Host "   - Copie a API key ativa (começa com 're_')" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Atualizar no servidor do Directus:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Se usar Docker/Coolify/CloudPanel:" -ForegroundColor Cyan
Write-Host "   - Acesse o painel de controle" -ForegroundColor Gray
Write-Host "   - Vá em Settings → Environment Variables" -ForegroundColor Gray
Write-Host "   - Atualize: EMAIL_SMTP_PASSWORD=re_sua-nova-key" -ForegroundColor Gray
Write-Host "   - REINICIE o serviço Directus" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Se usar VPS/Linux:" -ForegroundColor Cyan
Write-Host "   - Acesse via SSH" -ForegroundColor Gray
Write-Host "   - Edite docker-compose.yml ou .env do servidor" -ForegroundColor Gray
Write-Host "   - Atualize: EMAIL_SMTP_PASSWORD=re_sua-nova-key" -ForegroundColor Gray
Write-Host "   - Execute: docker-compose restart directus" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Testar o envio:" -ForegroundColor Yellow
Write-Host "   - Execute: .\test-resend-email.ps1" -ForegroundColor Gray
Write-Host "   - Ou teste via interface do Directus" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Perguntar se quer testar
$testar = Read-Host "Deseja testar o envio de email agora? (s/n)"
if ($testar -eq "s" -or $testar -eq "S") {
    Write-Host ""
    Write-Host "Executando teste..." -ForegroundColor Yellow
    Write-Host ""
    
    if (Test-Path ".\test-resend-email.ps1") {
        & .\test-resend-email.ps1
    } else {
        Write-Host "❌ Script de teste não encontrado: test-resend-email.ps1" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Lembre-se:" -ForegroundColor Green
Write-Host "   - A API key deve ser atualizada no SERVIDOR" -ForegroundColor Gray
Write-Host "   - SEMPRE reinicie o Directus após atualizar" -ForegroundColor Yellow
Write-Host "   - Verifique os logs se não funcionar" -ForegroundColor Gray
Write-Host ""
