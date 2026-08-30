import 'dotenv/config'

const base = String(process.env.NEXT_PUBLIC_POCKETBASE_URL || '').replace(/\/$/, '')
const email = process.env.POCKETBASE_ADMIN_EMAIL || ''
const password = process.env.POCKETBASE_ADMIN_PASSWORD || ''
if (!base || !email || !password) throw new Error('NEXT_PUBLIC_POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL e POCKETBASE_ADMIN_PASSWORD são obrigatórios.')

const auth = await fetch(`${base}/api/collections/_superusers/auth-with-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identity: email, password }) })
if (!auth.ok) throw new Error(`Falha na autenticação administrativa: ${auth.status}`)
const { token } = await auth.json()
const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
const collectionName = process.env.EMAIL_LOGS_COLLECTION || 'email_delivery_logs'
const fields = [
  { name: 'template', type: 'text', required: true, min: 1, max: 100 },
  { name: 'recipient_email', type: 'email', required: true },
  { name: 'profile', type: 'relation', collectionId: 'pbc_3414089001', maxSelect: 1, cascadeDelete: false },
  { name: 'recipient_user', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: false },
  { name: 'sender_admin', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: false },
  { name: 'subject', type: 'text', required: true, max: 300 },
  { name: 'status', type: 'select', required: true, maxSelect: 1, values: ['sent', 'failed'] },
  { name: 'provider_id', type: 'text', max: 200 },
  { name: 'error', type: 'text', max: 2000 },
]
const rules = { listRule: '@request.auth.role = "admin"', viewRule: '@request.auth.role = "admin"', createRule: '@request.auth.role = "admin"', updateRule: null, deleteRule: '@request.auth.role = "admin"' }
const existingRes = await fetch(`${base}/api/collections?filter=${encodeURIComponent(`name = "${collectionName}"`)}&perPage=1`, { headers })
if (!existingRes.ok) throw new Error(`Falha ao consultar coleções: ${existingRes.status}`)
const existing = (await existingRes.json()).items?.[0]
if (!existing) {
  const create = await fetch(`${base}/api/collections`, { method: 'POST', headers, body: JSON.stringify({ name: collectionName, type: 'base', schema: fields, fields, listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null }) })
  if (!create.ok) throw new Error(`Falha ao criar ${collectionName}: ${create.status} ${(await create.text()).slice(0, 300)}`)
  const created = await create.json()
  const rulesResponse = await fetch(`${base}/api/collections/${created.id}`, { method: 'PATCH', headers, body: JSON.stringify(rules) })
  if (!rulesResponse.ok) throw new Error(`Falha ao proteger ${collectionName}: ${rulesResponse.status}`)
  console.log(`Coleção ${collectionName} criada.`)
} else {
  const update = await fetch(`${base}/api/collections/${existing.id}`, { method: 'PATCH', headers, body: JSON.stringify({ schema: fields, fields, ...rules }) })
  if (!update.ok) throw new Error(`Falha ao atualizar ${collectionName}: ${update.status}`)
  console.log(`Coleção ${collectionName} atualizada.`)
}
