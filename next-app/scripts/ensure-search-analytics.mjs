import 'dotenv/config'

const base = process.env.NEXT_PUBLIC_POCKETBASE_URL
const email = process.env.POCKETBASE_ADMIN_EMAIL
const password = process.env.POCKETBASE_ADMIN_PASSWORD
if (!base || !email || !password) throw new Error('NEXT_PUBLIC_POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL e POCKETBASE_ADMIN_PASSWORD são obrigatórios.')

const auth = await fetch(`${base}/api/collections/_superusers/auth-with-password`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identity: email, password }),
})
if (!auth.ok) throw new Error(`Falha ao autenticar no PocketBase: ${auth.status}`)
const { token } = await auth.json()
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
const existing = await fetch(`${base}/api/collections/search_events/records?perPage=1`, { headers })
if (existing.ok || existing.status !== 404) {
  console.log(existing.ok ? 'Coleção search_events já existe.' : `Coleção search_events respondeu ${existing.status}; nenhuma alteração aplicada.`)
  process.exit(0)
}
const create = await fetch(`${base}/api/collections`, {
  method: 'POST', headers,
  body: JSON.stringify({
    name: 'search_events', type: 'base', listRule: "@request.auth.role = 'admin'", viewRule: "@request.auth.role = 'admin'", createRule: '', updateRule: null, deleteRule: "@request.auth.role = 'admin'",
    schema: [
      { name: 'location_query', type: 'text', required: false, max: 80 },
      { name: 'content_query', type: 'text', required: false, max: 240 },
      { name: 'result_count', type: 'number', required: true, min: 0, max: 10000 },
      { name: 'ip_hash', type: 'text', required: false, max: 64 },
    ],
  }),
})
if (!create.ok) throw new Error(`Falha ao criar search_events: ${create.status} ${(await create.text()).slice(0, 300)}`)
console.log('Coleção search_events criada com regras administrativas.')
