// Script para criar Flows de email personalizados no Directus
// Execute: node scripts/setup_email_flows.mjs

const DIRECTUS_URL = 'https://base.pontogp.com';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]';
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]';

let token = null;

async function login() {
    const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    if (!res.ok) throw new Error('Falha no login');
    const data = await res.json();
    token = data.data.access_token;
    console.log('✅ Login realizado!');
}

async function api(path, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    };
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch(`${DIRECTUS_URL}${path}`, options);
    if (res.status === 204) return null;
    const data = await res.json();
    if (!res.ok) {
        console.error('Erro:', data);
        throw new Error(data.errors?.[0]?.message || `HTTP ${res.status}`);
    }
    return data;
}

// Template HTML base para emails
function emailTemplate(title, content, buttonText) {
    return `<!DOCTYPE html>
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
<h2 style="color:#fff;font-size:24px;">${title}</h2>
${content}
<p style="text-align:center;padding:20px 0;">
<a href="{{$trigger.url}}" style="background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:bold;">${buttonText}</a>
</p>
<p style="color:#666;font-size:12px;word-break:break-all;">Link: {{$trigger.url}}</p>
</td></tr>
<tr><td style="background:#232336;padding:25px;text-align:center;border-top:1px solid #3a3a4e;">
<p style="color:#666680;font-size:12px;margin:0;">© 2024 PontoGP - Todos os direitos reservados</p>
<p style="color:#666680;font-size:11px;margin:5px 0 0;">Este é um email automático, por favor não responda.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

async function createEmailFlow(name, scope, subject, title, content, buttonText) {
    console.log(`\n📧 Criando Flow: ${name}...`);
    
    // Verificar se já existe
    try {
        const existing = await api(`/flows?filter[name][_eq]=${encodeURIComponent(name)}`);
        if (existing.data && existing.data.length > 0) {
            console.log(`   ⏭️  Flow "${name}" já existe, deletando para recriar...`);
            // Deletar operations primeiro
            const ops = await api(`/operations?filter[flow][_eq]=${existing.data[0].id}`);
            for (const op of ops.data || []) {
                await api(`/operations/${op.id}`, 'DELETE');
            }
            await api(`/flows/${existing.data[0].id}`, 'DELETE');
            console.log(`   🗑️  Flow antigo deletado`);
        }
    } catch (e) {
        // Ignora erro se não existir
    }

    // Criar o Flow
    const flow = await api('/flows', 'POST', {
        name,
        status: 'active',
        trigger: 'event',
        options: {
            type: 'action',
            scope: [scope]
        }
    });
    
    const flowId = flow.data.id;
    console.log(`   ✅ Flow criado (ID: ${flowId})`);

    // Criar Operation de envio de email
    const emailBody = emailTemplate(title, content, buttonText);
    const opKey = name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 50);
    
    const operation = await api('/operations', 'POST', {
        name: `Enviar Email`,
        key: opKey,
        flow: flowId,
        type: 'mail',
        position_x: 19,
        position_y: 1,
        options: {
            to: '{{$trigger.email}}',
            subject: subject,
            body: emailBody,
            type: 'html'
        }
    });
    
    // Vincular a operation como primeira do flow
    await api(`/flows/${flowId}`, 'PATCH', {
        operation: operation.data.id
    });
    
    console.log(`   ✅ Operation de email criada e vinculada`);
    return flowId;
}

async function main() {
    console.log('🚀 Configurando Flows de Email Personalizados\n');
    console.log('='.repeat(50));
    
    try {
        await login();

        // 1. Password Reset
        await createEmailFlow(
            'Email Personalizado - Password Reset',
            'auth.password.request',
            'Recuperação de Senha - PontoGP',
            '🔐 Recuperação de Senha',
            `<p style="color:#a0a0b0;font-size:16px;line-height:1.6;">Olá,</p>
<p style="color:#a0a0b0;font-size:16px;line-height:1.6;">Recebemos uma solicitação para redefinir sua senha no <strong style="color:#fff;">PontoGP</strong>.</p>
<p style="color:#a0a0b0;font-size:16px;line-height:1.6;">Clique no botão abaixo para criar uma nova senha:</p>
<p style="color:#fbbf24;font-size:14px;font-weight:bold;margin-top:20px;">⚠️ Este link expira em 1 hora.</p>
<p style="color:#a0a0b0;font-size:14px;">Se você não solicitou esta alteração, ignore este email.</p>`,
            'Redefinir Senha'
        );

        // 2. User Invitation
        await createEmailFlow(
            'Email Personalizado - User Invitation',
            'users.invite',
            'Você foi convidado! - PontoGP',
            '🎉 Você foi convidado!',
            `<p style="color:#a0a0b0;font-size:16px;line-height:1.6;">Olá,</p>
<p style="color:#a0a0b0;font-size:16px;line-height:1.6;">Você foi convidado para fazer parte do <strong style="color:#fff;">PontoGP</strong>!</p>
<p style="color:#a0a0b0;font-size:16px;line-height:1.6;">Clique no botão abaixo para aceitar o convite e criar sua conta:</p>
<p style="color:#a0a0b0;font-size:14px;margin-top:20px;">Se você não esperava este convite, pode ignorar este email com segurança.</p>`,
            'Aceitar Convite'
        );

        // 3. User Registration (quando usuário é criado)
        await createEmailFlow(
            'Email Personalizado - User Registration',
            'users.create',
            'Bem-vindo ao PontoGP!',
            '🎊 Bem-vindo ao PontoGP!',
            `<p style="color:#a0a0b0;font-size:16px;line-height:1.6;">Olá,</p>
<p style="color:#a0a0b0;font-size:16px;line-height:1.6;">Sua conta foi criada com sucesso no <strong style="color:#fff;">PontoGP</strong>!</p>
<p style="color:#a0a0b0;font-size:16px;line-height:1.6;">Estamos felizes em tê-lo conosco. Agora você pode:</p>
<ul style="color:#a0a0b0;font-size:14px;line-height:1.8;">
<li>✅ Criar seu perfil completo</li>
<li>✅ Adicionar fotos e vídeos</li>
<li>✅ Definir seus horários e serviços</li>
<li>✅ Começar a receber contatos</li>
</ul>
<p style="color:#a0a0b0;font-size:16px;line-height:1.6;">Acesse sua conta clicando no botão abaixo:</p>`,
            'Acessar Minha Conta'
        );

        console.log('\n' + '='.repeat(50));
        console.log('✅ Todos os Flows de email foram configurados!');
        console.log('\n📋 Flows criados:');
        console.log('   1. Email Personalizado - Password Reset');
        console.log('   2. Email Personalizado - User Invitation');
        console.log('   3. Email Personalizado - User Registration');
        console.log('\n🔗 Verifique em: https://base.pontogp.com/admin/settings/flows');

    } catch (error) {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    }
}

main();
