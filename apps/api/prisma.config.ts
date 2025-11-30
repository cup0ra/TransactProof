import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// Prefer explicit DATABASE_URL; fall back to local sqlite for dev if unset.
const rawUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'
const isSqlite = rawUrl.startsWith('file:')

export default defineConfig({
  schema: isSqlite ? 'prisma/schema.sqlite.prisma' : 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: isSqlite ? rawUrl : env('DATABASE_URL') },
})
