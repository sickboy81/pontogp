import test from 'node:test'
import assert from 'node:assert/strict'
import { percentageChange, summarizeFullAnalytics } from './profile-analytics.mjs'

test('analytics Ouro compara períodos sem dividir por zero', () => {
  assert.equal(percentageChange(20, 10), 100)
  assert.equal(percentageChange(0, 0), null)
  assert.equal(percentageChange(7, 0), null)
})

test('analytics Ouro resume visitantes únicos e conversão de contato', () => {
  const result = summarizeFullAnalytics({ views: 40, clicks: 10, messages: 4, uniqueVisitors: 25 })
  assert.deepEqual(result, { ctr: 25, messageRate: 40, uniqueVisitors: 25 })
})
