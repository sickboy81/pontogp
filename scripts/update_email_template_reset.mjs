// Script para atualizar o template de email password-reset.liquid no servidor
// IMPORTANTE: Este script deve ser executado NO SERVIDOR onde o Directus está rodando
// Execute: node scripts/update_email_template_reset.mjs

const DIRECTUS_URL = 'https://base.pontogp.com';
const FRONTEND_URL = 'https://pontogp.com'; // URL do frontend
const TEMPLATE_PATH = '/var/lib/docker/volumes/qkck08oc0c84g088o0wo8wc8_directus-templates/_data/password-reset.liquid';

// Template atualizado com URL do frontend
const templateContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#1e1e2e;font-family:Arial,sans-serif;">
<table width="100%" style="background:#1e1e2e;padding:40px 20px;">
<tr><td align="center">
<table width="600" style="background:#2a2a3e;border-radius:16px;">
<tr><td style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:30px;text-align:center;">
<h1 style="margin:0;color:#fff;font-size:28px;">PontoGP</h1>
</td></tr>
<tr><td style="padding:40px 30px;">
<h2 style="color:#fff;font-size:24px;">Recuperacao de Senha</h2>
<p style="color:#a0a0b0;font-size:16px;line-height:1.6;">Ola,</p>
<p style="color:#a0a0b0;font-size:16px;line-height:1.6;">Recebemos uma solicitacao para redefinir sua senha no <strong style="color:#fff;">PontoGP</strong>.</p>
<p style="color:#a0a0b0;font-size:16px;line-height:1.6;">Clique no botao abaixo para criar uma nova senha:</p>
<p style="text-align:center;padding:20px 0;">
<a href="${FRONTEND_URL}/redefinir-senha?token={{ url | replace: '/admin/reset-password?token=', '' }}" style="background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Redefinir Senha</a>
</p>
<p style="color:#666;font-size:12px;word-break:break-all;">Ou copie este link: ${FRONTEND_URL}/redefinir-senha?token={{ url | replace: '/admin/reset-password?token=', '' }}</p>
<p style="color:#fbbf24;font-size:14px;font-weight:bold;margin-top:20px;">Este link expira em 1 hora.</p>
<p style="color:#a0a0b0;font-size:14px;">Se voce nao solicitou, ignore este email.</p>
</td></tr>
<tr><td style="background:#232336;padding:25px;text-align:center;border-top:1px solid #3a3a4e;">
<p style="color:#666680;font-size:12px;margin:0;">2024 PontoGP - Todos os direitos reservados</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
`;

const fs = require('fs');

async function main() {
    console.log('📧 Atualizando template de email password-reset.liquid...\n');
    
    try {
        // Verificar se o arquivo existe
        if (!fs.existsSync(TEMPLATE_PATH)) {
            console.error(`❌ Arquivo nao encontrado: ${TEMPLATE_PATH}`);
            console.error('   Verifique o caminho correto do volume Docker');
            process.exit(1);
        }

        // Fazer backup
        const backupPath = `${TEMPLATE_PATH}.backup.${Date.now()}`;
        fs.copyFileSync(TEMPLATE_PATH, backupPath);
        console.log(`✅ Backup criado: ${backupPath}`);

        // Escrever novo template
        fs.writeFileSync(TEMPLATE_PATH, templateContent, 'utf8');
        console.log(`✅ Template atualizado com sucesso!`);
        console.log(`\n📋 URL do frontend: ${FRONTEND_URL}/redefinir-senha`);
        console.log(`\n⚠️  IMPORTANTE: Reinicie o Directus para aplicar as mudanças!`);

    } catch (error) {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    }
}

main();
