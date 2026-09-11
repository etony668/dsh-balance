// DSH 余额插件 host 端：读取本机 DSH 凭证中的 DEEPSEEK_API_KEY，
// 查询官方余额接口并缓存，供浏览器端在输入框下方显示。
// 数据只在浏览器与 DSH 后端之间传递，不写入磁盘、不上报任何第三方。
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const name = 'dsh-balance'
export const inject = ['webServer']

const CACHE_TTL_MS = 60 * 1000
const LOW_BALANCE_THRESHOLD = 2
const BALANCE_URL = 'https://api.deepseek.com/user/balance'

let cache = { value: null, fetchedAt: 0 }

function dshHome() {
  return process.env.DSH_HOME || join(homedir(), '.dsh')
}

async function readApiKey() {
  const file = join(dshHome(), '.credentials.yaml')
  const text = await readFile(file, 'utf8')
  const matched = text.match(/DEEPSEEK_API_KEY:\s*['"]?([^'"\s]+)/)
  if (!matched) throw new Error('credentials 中未找到 DEEPSEEK_API_KEY')
  return matched[1]
}

async function fetchBalance(key) {
  const response = await fetch(BALANCE_URL, { headers: { authorization: `Bearer ${key}` } })
  if (!response.ok) throw new Error('余额接口返回 HTTP ' + response.status)
  const data = await response.json()
  const infos = Array.isArray(data && data.balance_infos) ? data.balance_infos : []
  const pick = infos.find((item) => item.currency === 'CNY') || infos[0] || null
  const num = (value) => (value === undefined || value === null ? null : Number(value))
  return {
    available: data && data.is_available === true,
    currency: pick ? String(pick.currency || '') : '',
    total: pick ? num(pick.total_balance) : null,
    granted: pick ? num(pick.granted_balance) : null,
    toppedUp: pick ? num(pick.topped_up_balance) : null,
    all: infos.map((item) => ({ currency: String(item.currency || ''), total: num(item.total_balance) })),
  }
}

async function getBalance(force) {
  const now = Date.now()
  if (!force && cache.value && now - cache.fetchedAt < CACHE_TTL_MS) {
    return Object.assign({}, cache.value, { cached: true, fetchedAt: cache.fetchedAt })
  }
  try {
    const key = await readApiKey()
    const value = await fetchBalance(key)
    cache = { value, fetchedAt: now }
    return Object.assign({}, value, { cached: false, fetchedAt: now })
  } catch (error) {
    const message = String((error && error.message) || error)
    if (cache.value) {
      return Object.assign({}, cache.value, { cached: true, stale: true, error: message, fetchedAt: cache.fetchedAt })
    }
    throw new Error(message)
  }
}

export function apply(ctx) {
  const webServer = ctx.get('webServer')
  if (webServer === undefined) return () => {}
  return webServer.register({
    kind: 'exact',
    path: '/api/dsh-balance',
    handler: async (req, res) => {
      const send = (status, payload) => {
        res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify(payload))
      }
      try {
        let op = 'get'
        try {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
          if (body && body.op) op = String(body.op)
        } catch (error) { /* 空请求体视为 get */ }
        const data = await getBalance(op === 'refresh')
        send(200, Object.assign({ ok: true, threshold: LOW_BALANCE_THRESHOLD }, data))
      } catch (error) {
        send(200, { ok: false, threshold: LOW_BALANCE_THRESHOLD, error: String((error && error.message) || error) })
      }
    },
  })
}
