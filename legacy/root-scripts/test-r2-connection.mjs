/**
 * Script para testar conexão com Cloudflare R2
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ler variáveis do .env
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env')
  if (!fs.existsSync(envPath)) {
    throw new Error('.env não encontrado')
  }
  
  const content = fs.readFileSync(envPath, 'utf-8')
  const env = {}
  
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
    }
  })
  
  return env
}

// Gerar assinatura AWS Signature V4
function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const kDate = crypto.createHmac('sha256', 'AWS4' + key).update(dateStamp).digest()
  const kRegion = crypto.createHmac('sha256', kDate).update(regionName).digest()
  const kService = crypto.createHmac('sha256', kRegion).update(serviceName).digest()
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest()
  return kSigning
}

function signRequest(method, url, headers, body, accessKeyId, secretAccessKey, region, service) {
  const urlObj = new URL(url)
  const host = urlObj.host
  const path = urlObj.pathname + urlObj.search
  
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)
  
  // Hash do body
  const payloadHash = crypto.createHash('sha256').update(body || '').digest('hex')
  
  // Headers canônicos
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
  
  // Request canônico
  const canonicalRequest = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`
  
  // String to sign
  const algorithm = 'AWS4-HMAC-SHA256'
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest).digest('hex')}`
  
  // Assinatura
  const signingKey = getSignatureKey(secretAccessKey, dateStamp, region, service)
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex')
  
  // Authorization header
  const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  
  return {
    'Authorization': authorization,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
    'Host': host
  }
}

async function testR2Connection() {
  console.log('🔧 Testando conexão com Cloudflare R2...\n')
  
  const env = loadEnv()
  
  // Credenciais R2
  const accessKeyId = env.R2_ACCESS_KEY_ID || env.STORAGE_R2_KEY
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY || env.STORAGE_R2_SECRET
  const bucket = env.R2_BUCKET || env.STORAGE_R2_BUCKET || 'pontogp-media'
  const accountId = env.R2_ACCOUNT_ID || env.STORAGE_R2_ACCOUNT_ID
  const endpoint = env.R2_ENDPOINT || env.STORAGE_R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`
  
  console.log('📋 Configurações:')
  console.log(`  - Endpoint: ${endpoint}`)
  console.log(`  - Bucket: ${bucket}`)
  console.log(`  - Access Key: ${accessKeyId ? accessKeyId.slice(0, 8) + '...' : '❌ Não encontrado'}`)
  console.log(`  - Secret Key: ${secretAccessKey ? '✅ Configurado' : '❌ Não encontrado'}`)
  console.log('')
  
  if (!accessKeyId || !secretAccessKey) {
    console.error('❌ ERRO: Credenciais R2 não encontradas no .env')
    process.exit(1)
  }
  
  // Teste 1: Listar bucket
  console.log('📦 Teste 1: Verificando acesso ao bucket...')
  
  try {
    const listUrl = `${endpoint}/${bucket}?list-type=2&max-keys=5`
    const listHeaders = signRequest('GET', listUrl, {}, '', accessKeyId, secretAccessKey, 'auto', 's3')
    
    const listResponse = await fetch(listUrl, {
      method: 'GET',
      headers: listHeaders
    })
    
    if (listResponse.ok) {
      const xml = await listResponse.text()
      console.log('✅ Conexão com bucket OK!')
      
      // Contar objetos
      const matches = xml.match(/<Key>/g)
      const count = matches ? matches.length : 0
      console.log(`   Objetos encontrados: ${count}`)
    } else {
      const error = await listResponse.text()
      console.log(`❌ Erro ao listar bucket: ${listResponse.status}`)
      console.log(`   ${error.slice(0, 200)}`)
    }
  } catch (err) {
    console.log(`❌ Erro de conexão: ${err.message}`)
  }
  
  // Teste 2: Upload de arquivo de teste
  console.log('\n📤 Teste 2: Enviando arquivo de teste...')
  
  try {
    const testFileName = `test-${Date.now()}.txt`
    const testContent = `Teste de upload - ${new Date().toISOString()}`
    const uploadUrl = `${endpoint}/${bucket}/${testFileName}`
    
    const uploadHeaders = signRequest('PUT', uploadUrl, {}, testContent, accessKeyId, secretAccessKey, 'auto', 's3')
    uploadHeaders['Content-Type'] = 'text/plain'
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: uploadHeaders,
      body: testContent
    })
    
    if (uploadResponse.ok) {
      console.log('✅ Upload de teste OK!')
      console.log(`   Arquivo: ${testFileName}`)
      
      // Deletar arquivo de teste
      console.log('\n🗑️ Limpando arquivo de teste...')
      const deleteHeaders = signRequest('DELETE', uploadUrl, {}, '', accessKeyId, secretAccessKey, 'auto', 's3')
      
      const deleteResponse = await fetch(uploadUrl, {
        method: 'DELETE',
        headers: deleteHeaders
      })
      
      if (deleteResponse.ok || deleteResponse.status === 204) {
        console.log('✅ Arquivo de teste removido!')
      }
    } else {
      const error = await uploadResponse.text()
      console.log(`❌ Erro no upload: ${uploadResponse.status}`)
      console.log(`   ${error.slice(0, 200)}`)
    }
  } catch (err) {
    console.log(`❌ Erro de upload: ${err.message}`)
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 RESUMO:')
  console.log('='.repeat(50))
  console.log('Se os testes passaram, a conexão R2 está funcionando!')
  console.log('Agora verifique se o Directus está usando as variáveis corretas.')
  console.log('')
  console.log('🔧 Variáveis que devem estar no Directus (Coolify):')
  console.log('   STORAGE_LOCATIONS=r2')
  console.log('   STORAGE_R2_DRIVER=s3')
  console.log(`   STORAGE_R2_BUCKET=${bucket}`)
  console.log(`   STORAGE_R2_ENDPOINT=${endpoint}`)
  console.log('   STORAGE_R2_KEY=(seu access key)')
  console.log('   STORAGE_R2_SECRET=(seu secret key)')
  console.log('   STORAGE_R2_REGION=auto')
  console.log('   STORAGE_R2_S3_FORCE_PATH_STYLE=false')
}

testR2Connection().catch(err => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
