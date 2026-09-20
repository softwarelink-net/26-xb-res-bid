import initSqlJs from 'sql.js'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const require = createRequire(import.meta.url)
const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm')

const SQL = await initSqlJs({
  locateFile: () => wasmPath,
})

const schema = readFileSync(join(root, 'schema.sql'), 'utf-8')
const db = new SQL.Database()
db.run(schema)

const outDir = join(root, 'public/data')
mkdirSync(outDir, { recursive: true })
const data = db.export()
writeFileSync(join(outDir, 'xbres_database.sqlite'), Buffer.from(data))
db.close()
console.log('SQLite seeded -> public/data/xbres_database.sqlite')
