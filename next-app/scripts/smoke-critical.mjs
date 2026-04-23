/* Smoke test rápido de rotas críticas.
 * Uso:
 *   SMOKE_BASE_URL=https://cerejavip.com npm run smoke:critical
 *   npm run smoke:critical  (usa http://localhost:3000)
 */

const baseUrl = (process.env.SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

const checks = [
  { name: 'home', path: '/', expected: [200] },
  { name: 'anunciantes', path: '/anunciantes', expected: [200] },
  { name: 'planos', path: '/planos', expected: [200] },
  { name: 'contato', path: '/contato', expected: [200] },
  { name: 'admin stats sem auth', path: '/api/admin/stats', expected: [401] },
  // 404 cobre ambiente ainda sem rota publicada; 401 cobre rota protegida já ativa.
  { name: 'admin plans sem auth', path: '/api/admin/plans', expected: [401, 404] },
  { name: 'api plans pública', path: '/api/plans', expected: [200] },
]

async function runCheck(check) {
  const url = `${baseUrl}${check.path}`
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'manual' })
    const ok = check.expected.includes(res.status)
    return { ...check, status: res.status, ok }
  } catch (error) {
    return { ...check, status: 'ERR', ok: false, error: String(error) }
  }
}

const results = []
for (const check of checks) {
  // Sequencial para facilitar leitura de log.
  // eslint-disable-next-line no-await-in-loop
  const result = await runCheck(check)
  results.push(result)
}

const failed = results.filter((r) => !r.ok)

console.log(`\n[smoke] base: ${baseUrl}`)
for (const r of results) {
  const icon = r.ok ? 'OK' : 'FAIL'
  console.log(`[${icon}] ${r.name.padEnd(24)} status=${r.status} expected=${r.expected.join(',')}`)
  if (r.error) console.log(`      ${r.error}`)
}

if (failed.length > 0) {
  console.error(`\n[smoke] falhou: ${failed.length} verificação(ões).`)
  process.exit(1)
}

console.log('\n[smoke] sucesso: todas as verificações passaram.')
