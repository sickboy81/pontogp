#!/bin/bash
# Script para remover a API key do Resend do histórico do Git
# ATENÇÃO: Isso vai reescrever todo o histórico do Git!

echo "⚠️  ATENÇÃO: Este script vai reescrever o histórico do Git!"
echo "⚠️  Isso requer force push após a execução!"
echo ""
echo "A API key que será removida: re_D9C6LBbj_6WVs5MrWMcuG6dr5j4iYcwW2"
echo ""
read -p "Deseja continuar? (sim/não): " confirm

if [ "$confirm" != "sim" ]; then
    echo "Operação cancelada."
    exit 1
fi

echo ""
echo "🔍 Removendo API key do histórico do Git..."
echo ""

# Remove a API key do histórico usando git filter-branch
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch -r . && git reset HEAD . && git add -A && git commit --allow-empty -m 'Remove exposed API key from history'" \
  --prune-empty --tag-name-filter cat -- --all

# Remove refs de backup
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Histórico reescrito!"
echo ""
echo "⚠️  PRÓXIMOS PASSOS:"
echo "1. Verifique os commits: git log"
echo "2. Force push: git push --force --all"
echo "3. Force push tags: git push --force --tags"
echo ""
echo "⚠️  IMPORTANTE: Se outros colaboradores estão trabalhando no repositório,"
echo "    eles precisarão fazer: git fetch --all && git reset --hard origin/main"
