#!/usr/bin/env node
/**
 * Script para enviar email através do Resend
 * 
 * Uso:
 *   node scripts/enviar-email-resend.mjs
 * 
 * Requer:
 *   - RESEND_API_KEY no .env ou variável de ambiente
 *   - npm install resend (se ainda não instalado)
 */

import { Resend } from 'resend'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')

// Carregar variáveis de ambiente do .env
let env = {}
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([^=]+?)\s*=\s*(.*)$/)
    if (match && !match[1].startsWith('#')) {
      env[match[1]] = match[2]
    }
  })
}

// Configuração
const RESEND_API_KEY = process.env.RESEND_API_KEY || env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || env.EMAIL_FROM || 'PontoGP <contato@pontogp.com>'

// Verificar se a API key está configurada
if (!RESEND_API_KEY) {
  console.error('❌ ERRO: RESEND_API_KEY não encontrada!')
  console.error('   Adicione RESEND_API_KEY no arquivo .env ou como variável de ambiente')
  process.exit(1)
}

// Inicializar Resend
const resend = new Resend(RESEND_API_KEY)

/**
 * Enviar email simples
 */
async function enviarEmailSimples(destinatario, assunto, html, texto) {
  console.log(`📧 Enviando email para: ${destinatario}`)
  console.log(`   Assunto: ${assunto}`)
  console.log('')

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [destinatario],
      subject: assunto,
      html: html,
      text: texto || html.replace(/<[^>]*>/g, ''), // Remove HTML se não tiver texto
    })

    if (error) {
      console.error('❌ Erro ao enviar email:', error)
      return null
    }

    console.log('✅ Email enviado com sucesso!')
    console.log(`   ID: ${data?.id}`)
    return data
  } catch (error) {
    console.error('❌ Erro:', error.message)
    return null
  }
}

/**
 * Exemplo: Email de boas-vindas
 */
async function exemploBoasVindas() {
  const destinatario = process.env.TEST_EMAIL || 'seu-email@exemplo.com'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>PontoGP</h1>
        </div>
        <div class="content">
          <h2>Bem-vindo ao PontoGP!</h2>
          <p>Olá,</p>
          <p>Sua conta foi criada com sucesso no PontoGP.</p>
          <p>Acesse nossa plataforma e comece a usar:</p>
          <p style="text-align: center;">
            <a href="https://pontogp.com" class="button">Acessar PontoGP</a>
          </p>
          <p>Atenciosamente,<br>Equipe PontoGP</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await enviarEmailSimples(
    destinatario,
    'Bem-vindo ao PontoGP!',
    html,
    'Bem-vindo ao PontoGP!\n\nSua conta foi criada com sucesso. Acesse: https://pontogp.com'
  )
}

/**
 * Exemplo: Email de recuperação de senha
 */
async function exemploRecuperacaoSenha() {
  const destinatario = process.env.TEST_EMAIL || 'seu-email@exemplo.com'
  const token = 'abc123xyz789' // Em produção, gere um token seguro
  const resetUrl = `https://pontogp.com/reset-senha?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
        .warning { color: #dc2626; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>PontoGP</h1>
        </div>
        <div class="content">
          <h2>Recuperação de Senha</h2>
          <p>Olá,</p>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
          <p>Clique no botão abaixo para criar uma nova senha:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Redefinir Senha</a>
          </p>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p class="warning">⚠️ Este link expira em 1 hora.</p>
          <p>Se você não solicitou esta alteração, ignore este email.</p>
          <p>Atenciosamente,<br>Equipe PontoGP</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await enviarEmailSimples(
    destinatario,
    'Recuperação de Senha - PontoGP',
    html,
    `Recuperação de Senha\n\nClique no link: ${resetUrl}\n\nEste link expira em 1 hora.`
  )
}

/**
 * Função principal
 */
async function main() {
  console.log('========================================')
  console.log('Enviar Email via Resend - PontoGP')
  console.log('========================================')
  console.log('')

  // Verificar se há argumentos
  const args = process.argv.slice(2)
  const tipo = args[0] || 'boasvindas'

  let resultado

  switch (tipo) {
    case 'boasvindas':
    case 'welcome':
      resultado = await exemploBoasVindas()
      break
    
    case 'recuperacao':
    case 'reset':
      resultado = await exemploRecuperacaoSenha()
      break
    
    default:
      console.log('Tipos disponíveis:')
      console.log('  - boasvindas (padrão)')
      console.log('  - recuperacao')
      console.log('')
      console.log('Uso: node scripts/enviar-email-resend.mjs [tipo]')
      console.log('')
      resultado = await exemploBoasVindas()
  }

  console.log('')
  console.log('========================================')
  
  if (resultado) {
    console.log('✅ Sucesso! Verifique a caixa de entrada.')
    console.log('   Dashboard: https://resend.com/emails')
  } else {
    console.log('❌ Falha ao enviar email.')
    console.log('   Verifique:')
    console.log('   1. API key está correta')
    console.log('   2. Domínio está verificado no Resend')
    console.log('   3. Email FROM está no domínio verificado')
  }
}

// Executar
main().catch(console.error)
