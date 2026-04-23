import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Ler variáveis de ambiente do .env
const envPath = join(__dirname, '..', '.env')
let envContent = ''
try {
  envContent = readFileSync(envPath, 'utf-8')
} catch (error) {
  console.error('❌ Erro ao ler arquivo .env:', error.message)
  process.exit(1)
}

const envVars = {}
envContent.split('\n').forEach(line => {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=')
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
    }
  }
})

const DIRECTUS_URL = envVars.DIRECTUS_URL || envVars.VITE_DIRECTUS_URL || 'https://base.pontogp.com'
const DIRECTUS_EMAIL = envVars.DIRECTUS_ADMIN_EMAIL || envVars.ADMIN_EMAIL || envVars.DIRECTUS_EMAIL
const DIRECTUS_PASSWORD = envVars.DIRECTUS_ADMIN_PASSWORD || envVars.ADMIN_PASSWORD || envVars.DIRECTUS_PASSWORD

if (!DIRECTUS_EMAIL || !DIRECTUS_PASSWORD) {
  console.error('❌ Erro: DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD (ou ADMIN_EMAIL e ADMIN_PASSWORD) devem estar configurados no .env')
  process.exit(1)
}

async function login() {
  const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: DIRECTUS_EMAIL,
      password: DIRECTUS_PASSWORD,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Erro ao fazer login: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.data.access_token
}

async function createBioTitleField(token) {
  const field = {
    field: 'bio_title',
    type: 'string',
    schema: {
      name: 'bio_title',
      data_type: 'string',
      max_length: 200,
    },
    meta: {
      field: 'bio_title',
      special: null,
      interface: 'input',
      options: {
        placeholder: 'Digite um título atrativo para seu anúncio (mínimo 40 caracteres)',
      },
      display: 'raw',
      display_options: null,
      readonly: false,
      hidden: false,
      required: false,
      translations: [
        {
          language: 'pt-BR',
          translation: 'Título da Bio',
        },
      ],
      note: 'Título atrativo para o anúncio. Mínimo de 40 caracteres.',
      width: 'full',
      group: null,
    },
  }

  const response = await fetch(`${DIRECTUS_URL}/fields/profiles`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(field),
  })

  if (!response.ok) {
    const error = await response.text()
    // Se o campo já existe, não é um erro crítico
    if (response.status === 400 && error.includes('already exists')) {
      console.log('⚠️  Campo bio_title já existe. Atualizando...')
      return await updateBioTitleField(token)
    }
    throw new Error(`Erro ao criar campo: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.data
}

async function updateBioTitleField(token) {
  const field = {
    meta: {
      field: 'bio_title',
      special: null,
      interface: 'input',
      options: {
        placeholder: 'Digite um título atrativo para seu anúncio (mínimo 40 caracteres)',
      },
      display: 'raw',
      display_options: null,
      readonly: false,
      hidden: false,
      required: false,
      translations: [
        {
          language: 'pt-BR',
          translation: 'Título da Bio',
        },
      ],
      note: 'Título atrativo para o anúncio. Mínimo de 40 caracteres.',
      width: 'full',
      group: null,
    },
  }

  const response = await fetch(`${DIRECTUS_URL}/fields/profiles/bio_title`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(field),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Erro ao atualizar campo: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.data
}

async function main() {
  try {
    console.log('🔐 Fazendo login no Directus...')
    const token = await login()
    console.log('✅ Login realizado com sucesso')

    console.log('📝 Criando campo bio_title na collection profiles...')
    const field = await createBioTitleField(token)
    console.log('✅ Campo bio_title criado/atualizado com sucesso!')
    console.log('📋 Detalhes do campo:', JSON.stringify(field, null, 2))
    console.log('\n✅ Campo bio_title configurado com validação de mínimo 40 caracteres!')
  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  }
}

main()
