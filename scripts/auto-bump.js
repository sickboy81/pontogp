#!/usr/bin/env node
/**
 * Wrapper legado. A lógica oficial de subida automática fica em `../auto_bump.cjs`.
 * Mantemos este arquivo para compatibilidade com crons antigos sem duplicar regra.
 */

const { spawnSync } = require('child_process')
const { join } = require('path')

const script = join(__dirname, '..', 'auto_bump.cjs')
const result = spawnSync(process.execPath, [script, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env,
})

process.exit(result.status ?? 1)
