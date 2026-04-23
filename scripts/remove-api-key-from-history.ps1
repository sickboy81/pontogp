# Script PowerShell para remover a API key do Resend do histórico do Git
# ATENÇÃO: Isso vai reescrever todo o histórico do Git!

Write-Host "⚠️  ATENÇÃO: Este script vai reescrever o histórico do Git!" -ForegroundColor Yellow
Write-Host "⚠️  Isso requer force push após a execução!" -ForegroundColor Yellow
Write-Host ""
Write-Host "A API key que será removida: re_D9C6LBbj_6WVs5MrWMcuG6dr5j4iYcwW2" -ForegroundColor Cyan
Write-Host ""
$confirm = Read-Host "Deseja continuar? (sim/não)"

if ($confirm -ne "sim") {
    Write-Host "Operação cancelada." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🔍 Removendo API key do histórico do Git usando BFG Repo-Cleaner..." -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  NOTA: Este script requer BFG Repo-Cleaner instalado." -ForegroundColor Yellow
Write-Host "    Download: https://rtyley.github.io/bfg-repo-cleaner/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Alternativa manual:" -ForegroundColor Yellow
Write-Host "1. Instale BFG Repo-Cleaner" -ForegroundColor Gray
Write-Host "2. Execute: java -jar bfg.jar --replace-text passwords.txt" -ForegroundColor Gray
Write-Host "3. Onde passwords.txt contém: re_D9C6LBbj_6WVs5MrWMcuG6dr5j4iYcwW2==>" -ForegroundColor Gray
Write-Host "4. Depois: git reflog expire --expire=now --all && git gc --prune=now --aggressive" -ForegroundColor Gray
Write-Host "5. Force push: git push --force --all" -ForegroundColor Gray
