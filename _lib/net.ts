// HTTP 経由で JSON を取りに行く共通ヘルパ。
// - URL / レスポンスのステータス / バイト数 / 経過時間 / 失敗理由を全部 logger に流す
// - 失敗時は null を返す (例外は投げない)。呼ぶ側は null チェックだけで済む
// - 任意でタイムアウト指定可

export type Logger = (line: string) => void

export type FetchJsonOptions = {
  timeoutMs?: number          // タイムアウト (デフォ 10000ms)
  headers?: Record<string, string>
}

export async function fetchJson<T>(
  url: string,
  log: Logger,
  options: FetchJsonOptions = {},
): Promise<T | null> {
  const { timeoutMs = 10_000, headers } = options
  const start = performance.now()
  log(`→ GET ${url}`)

  // タイムアウト機構: AbortController を timeoutMs 後に abort する
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)

  try {
    const res = await fetch(url, { signal: ctrl.signal, headers })
    const elapsed = Math.round(performance.now() - start)

    if (!res.ok) {
      log(`← ${res.status} ${res.statusText} in ${elapsed}ms`)
      return null
    }

    // res.text() でレスポンスボディを文字列で受け、サイズをログに残してから JSON.parse する
    // (CORS の都合で Content-Length が読めないことがあるので自前で測る)
    const text = await res.text()
    log(`← ${res.status} (${text.length}B) in ${elapsed}ms`)

    try {
      return JSON.parse(text) as T
    } catch (err) {
      log(`✗ JSON parse failed: ${(err as Error).message}`)
      return null
    }
  } catch (err) {
    const elapsed = Math.round(performance.now() - start)
    const e = err as Error
    if (e.name === 'AbortError') {
      log(`✗ timeout after ${elapsed}ms (> ${timeoutMs}ms)`)
    } else {
      log(`✗ ${e.name}: ${e.message} after ${elapsed}ms`)
    }
    return null
  } finally {
    clearTimeout(timer)
  }
}
