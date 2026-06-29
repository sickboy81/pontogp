#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import PocketBase from 'pocketbase'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const nextAppRoot = join(scriptDir, '..')
const repoRoot = join(nextAppRoot, '..')
const defaultSchemaPath = join(nextAppRoot, 'pocketbase-schema.json')

function loadEnv(dir) {
  const path = join(dir, '.env')
  if (!existsSync(path)) return
  for (const rawLine of readFileSync(path, 'utf8').split('\n')) {
    const line = rawLine.replace(/^\uFEFF/, '').trim()
    if (!line || line.startsWith('#')) continue
    const separator = line.indexOf('=')
    if (separator <= 0) continue
    const key = line.slice(0, separator).trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key]) continue
    const value = line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
    process.env[key] = value
  }
}

function normalizeCollection(collection) {
  const fields = Array.isArray(collection.schema) ? collection.schema : []
  return {
    id: collection.id,
    name: collection.name,
    type: collection.type,
    listRule: collection.listRule ?? null,
    viewRule: collection.viewRule ?? null,
    createRule: collection.createRule ?? null,
    updateRule: collection.updateRule ?? null,
    deleteRule: collection.deleteRule ?? null,
    schema: fields,
    fields,
  }
}

function clearRules(collection) {
  return {
    ...collection,
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  }
}

function buildIdToNameMap(collections) {
  return new Map(collections.map((collection) => [collection.id, collection.name]))
}

function getDependencyNames(collection, idToName) {
  const dependencies = new Set()
  for (const field of collection.schema || []) {
    if (field.type !== 'relation' || !field.collectionId) continue
    const targetName = idToName.get(field.collectionId)
    if (targetName && targetName !== collection.name && !targetName.startsWith('_')) {
      dependencies.add(targetName)
    }
  }
  return dependencies
}

function sortCollectionsByDependencies(collections) {
  const idToName = buildIdToNameMap(collections)
  const remaining = new Map(collections.map((collection) => [collection.name, collection]))
  const resolved = new Set()
  const sorted = []

  while (remaining.size > 0) {
    let progressed = false

    for (const [name, collection] of remaining) {
      const dependencies = getDependencyNames(collection, idToName)
      const ready = [...dependencies].every((dependency) => resolved.has(dependency))
      if (!ready) continue

      sorted.push(collection)
      resolved.add(name)
      remaining.delete(name)
      progressed = true
    }

    if (!progressed) {
      sorted.push(...remaining.values())
      break
    }
  }

  return sorted
}

async function importCollections(baseUrl, token, collections) {
  const response = await fetch(`${baseUrl}/api/collections/import`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify({
      collections,
      deleteMissing: false,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Falha ao importar schema: ${response.status} ${error}`)
  }
}

async function main() {
  loadEnv(nextAppRoot)
  loadEnv(repoRoot)

  const baseUrl = (process.env.NEXT_PUBLIC_POCKETBASE_URL || '').replace(/\/$/, '')
  const email = process.env.POCKETBASE_ADMIN_EMAIL || ''
  const password = process.env.POCKETBASE_ADMIN_PASSWORD || ''
  if (!baseUrl || !email || !password) {
    throw new Error(
      'Defina NEXT_PUBLIC_POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL e POCKETBASE_ADMIN_PASSWORD.'
    )
  }

  const schemaPath = process.env.POCKETBASE_SCHEMA_FILE || defaultSchemaPath
  if (!existsSync(schemaPath)) {
    throw new Error(`Schema não encontrado em ${schemaPath}.`)
  }

  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'))
  const collections = sortCollectionsByDependencies((schema.collections || [])
    .filter((collection) => !String(collection.name || '').startsWith('_'))
    .map(normalizeCollection))

  if (!collections.length) {
    throw new Error('Nenhuma coleção de aplicação encontrada no pocketbase-schema.json.')
  }

  const pb = new PocketBase(baseUrl)
  await pb.collection('_superusers').authWithPassword(email, password)
  await importCollections(baseUrl, pb.authStore.token, collections.map(clearRules))
  await importCollections(baseUrl, pb.authStore.token, collections)

  console.log(
    `[pocketbase-import] ${collections.length} coleções importadas: ${collections
      .map((collection) => collection.name)
      .join(', ')}`
  )
}

main().catch((error) => {
  console.error(`[pocketbase-import] ${error.message}`)
  process.exit(1)
})
