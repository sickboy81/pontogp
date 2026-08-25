import 'dotenv/config'

const base = String(process.env.NEXT_PUBLIC_POCKETBASE_URL || '').replace(/\/$/, '')
const email = process.env.POCKETBASE_ADMIN_EMAIL
const password = process.env.POCKETBASE_ADMIN_PASSWORD
if (!base || !email || !password) throw new Error('NEXT_PUBLIC_POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL e POCKETBASE_ADMIN_PASSWORD são obrigatórios.')

const auth = await fetch(`${base}/api/collections/_superusers/auth-with-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identity: email, password }) })
if (!auth.ok) throw new Error(`Falha ao autenticar no PocketBase: ${auth.status}`)
const { token } = await auth.json()
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

const definitions = [
  {
    name: 'account_preferences', type: 'base', listRule: '@request.auth.id = user', viewRule: '@request.auth.id = user', createRule: '@request.auth.id = user', updateRule: '@request.auth.id = user', deleteRule: '@request.auth.id = user',
    schema: [
      { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true },
      { name: 'notify_messages', type: 'bool', required: false },
      { name: 'notify_payments', type: 'bool', required: false },
      { name: 'notify_plan_expiry', type: 'bool', required: false },
      { name: 'notify_security', type: 'bool', required: false },
    ],
  },
  {
    name: 'account_events', type: 'base', listRule: '@request.auth.id = user', viewRule: '@request.auth.id = user', createRule: null, updateRule: null, deleteRule: null,
    schema: [
      { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true },
      { name: 'type', type: 'select', required: true, maxSelect: 1, values: ['login', 'password_changed', 'email_change_requested', 'logout_all', 'data_export'] },
      { name: 'ip_address', type: 'text', required: false, max: 80 },
      { name: 'user_agent', type: 'text', required: false, max: 500 },
    ],
  },
]

for (const definition of definitions) {
  const check = await fetch(`${base}/api/collections/${definition.name}/records?perPage=1`, { headers })
  if (check.ok) { console.log(`Coleção ${definition.name} já existe.`); continue }
  if (check.status !== 404) throw new Error(`Falha ao verificar ${definition.name}: ${check.status}`)
  const create = await fetch(`${base}/api/collections`, { method: 'POST', headers, body: JSON.stringify(definition) })
  if (!create.ok) throw new Error(`Falha ao criar ${definition.name}: ${create.status} ${(await create.text()).slice(0, 300)}`)
  console.log(`Coleção ${definition.name} criada.`)
}
