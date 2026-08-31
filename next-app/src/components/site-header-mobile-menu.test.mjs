import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('keeps the authenticated mobile advertiser CTA readable', async () => {
  const source = await readFile(new URL('./SiteHeader.tsx', import.meta.url), 'utf8')

  assert.match(
    source,
    /href="\/register\?tipo=advertiser" className="rounded-lg bg-primary-600 px-4 py-2 text-center font-semibold text-white hover:bg-primary-500" onClick=\{closeAll\}>Anunciar grátis<\/Link>/,
  )
})
