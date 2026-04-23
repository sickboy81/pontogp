# Script para remover API key do historico do Git
# ATENCAO: Isso vai reescrever o historico do Git!

$API_KEY = "re_D9C6LBbj_6WVs5MrWMcuG6dr5j4iYcwW2"
$REPO_DIR = Get-Location

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Remover API Key do Historico do Git" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ATENCAO: Este script vai reescrever o historico do Git!" -ForegroundColor Yellow
Write-Host "A API key sera substituida por 'REMOVIDO_API_KEY' em todo o historico" -ForegroundColor Yellow
Write-Host ""
Write-Host "API Key que sera removida: $API_KEY" -ForegroundColor Cyan
Write-Host ""

$confirm = Read-Host "Deseja continuar? (sim/nao)"

if ($confirm -ne "sim") {
    Write-Host "Operacao cancelada." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Fazendo backup da branch atual..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
git branch "backup-before-cleanup-$timestamp"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup criado!" -ForegroundColor Green
} else {
    Write-Host "Nao foi possivel criar backup (pode ja existir)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Removendo API key do historico usando git filter-branch..." -ForegroundColor Yellow
Write-Host "Isso pode demorar alguns minutos..." -ForegroundColor Gray

# Usar git filter-branch para substituir a API key
# Nota: git filter-branch pode nao funcionar bem no Windows, vamos usar uma abordagem diferente

Write-Host ""
Write-Host "Usando git filter-repo (recomendado) ou BFG..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Para Windows, recomendo usar BFG Repo-Cleaner:" -ForegroundColor Cyan
Write-Host "1. Baixe: https://rtyley.github.io/bfg-repo-cleaner/" -ForegroundColor Gray
Write-Host "2. Crie arquivo passwords.txt com: $API_KEY==>REMOVIDO_API_KEY" -ForegroundColor Gray
Write-Host "3. Execute: java -jar bfg.jar --replace-text passwords.txt .git" -ForegroundColor Gray
Write-Host ""
Write-Host "OU use git filter-branch manualmente:" -ForegroundColor Cyan
Write-Host "git filter-branch --force --index-filter \"git rm --cached --ignore-unmatch -r .\" --prune-empty --tag-name-filter cat -- --all" -ForegroundColor Gray
