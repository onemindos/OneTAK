import type { ClickHouseResult } from './types'

let _baseUrl = 'http://clickhouse:8123'
let _database = 'onemind'
let _username = 'default'
let _password = ''

export function configureClickHouse(opts: {
    baseUrl?: string
    database?: string
    username?: string
    password?: string
}) {
    if (opts.baseUrl)  _baseUrl  = opts.baseUrl
    if (opts.database) _database = opts.database
    if (opts.username) _username = opts.username
    if (opts.password) _password = opts.password
}

export async function executeQuery(sql: string, queryId: string): Promise<ClickHouseResult> {
    const start = Date.now()
    const url = new URL(`${_baseUrl}/`)
    url.searchParams.set('database', _database)
    url.searchParams.set('default_format', 'JSONCompact')
    url.searchParams.set('query_id', queryId)

    const headers: Record<string, string> = {
        'Content-Type': 'text/plain',
    }

    if (_username) headers['X-ClickHouse-User'] = _username
    if (_password) headers['X-ClickHouse-Key']  = _password

    const res = await fetch(url.toString(), {
        method: 'POST',
        headers,
        body: sql,
    })

    if (!res.ok) {
        const errorText = await res.text()
        return {
            queryId,
            columns: [],
            rows: [],
            rowCount: 0,
            executionMs: Date.now() - start,
            error: errorText,
        }
    }

    const json = await res.json() as {
        meta: { name: string; type: string }[]
        data: unknown[][]
        rows: number
        statistics: { elapsed: number }
    }

    const columns = json.meta.map(m => m.name)
    const rows = json.data.map(row =>
        Object.fromEntries(columns.map((col, i) => [col, row[i]]))
    )

    return {
        queryId,
        columns,
        rows,
        rowCount: json.rows,
        executionMs: Math.round(json.statistics.elapsed * 1000),
    }
}
