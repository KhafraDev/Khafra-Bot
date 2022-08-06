import { KhafraClient } from '#khaf/Bot'
import { assets } from '#khaf/utility/Constants/Path.js'
import { env } from 'node:process'
import postgres from 'postgres'

const sqlFiles = KhafraClient.walk(
    assets('SQL/Postgres'),
    p => p.endsWith('.sql')
)

export const sql = postgres({
    user: env.POSTGRES_USER,
    pass: env.POSTGRES_PASS,
    database: 'kb',
    host: '127.0.0.1',
    onnotice: () => {}
})

await Promise.all(
    sqlFiles.map(file => sql.file<unknown[]>(file))
)