# Script simples para remover API key do historico
# Usa git filter-branch

$API_KEY = "COLE_A_API_KEY_EXPOSTA_AQUI"

Write-Host "Removendo API key do historico do Git..." -ForegroundColor Yellow
Write-Host "API Key: $API_KEY" -ForegroundColor Cyan
Write-Host ""

# Criar backup
Write-Host "Criando backup..." -ForegroundColor Yellow
git branch backup-$(Get-Date -Format "yyyyMMdd-HHmmss")

# Substituir usando git filter-branch
Write-Host "Substituindo API key no historico..." -ForegroundColor Yellow
Write-Host "Isso pode demorar alguns minutos..." -ForegroundColor Gray

# Nota: git filter-branch com sed nao funciona bem no Windows
# Vamos usar uma abordagem diferente: usar BFG ou instrucoes manuais

Write-Host ""
Write-Host "Para Windows, use BFG Repo-Cleaner:" -ForegroundColor Cyan
Write-Host "1. Download: https://rtyley.github.io/bfg-repo-cleaner/" -ForegroundColor Gray
Write-Host "2. Crie passwords.txt: $API_KEY==>REMOVIDO" -ForegroundColor Gray
Write-Host "3. java -jar bfg.jar --replace-text passwords.txt" -ForegroundColor Gray
Write-Host "4. git reflog expire --expire=now --all" -ForegroundColor Gray
Write-Host "5. git gc --prune=now --aggressive" -ForegroundColor Gray
Write-Host "6. git push --force --all" -ForegroundColor Yellow
