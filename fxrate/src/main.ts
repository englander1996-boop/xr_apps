import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'
import { fetchJson } from '../../_lib/net'

// frankfurter.dev は ECB の公開為替を返す無料 API。auth 不要、CORS 開いてる。
// 例: https://api.frankfurter.dev/v1/latest?base=USD&symbols=JPY,EUR,GBP
// → { amount: 1, base: 'USD', date: '2026-05-24', rates: { JPY: 156.3, EUR: 0.92, GBP: 0.78 } }
const BASE = 'USD'
const TARGETS = ['JPY', 'EUR', 'GBP', 'CNY', 'KRW'] as const
const POLL_MS = 60 * 60 * 1000  // 為替は 1 時間ごと更新で十分 (ECB は日次更新)

type FxResponse = { amount: number; base: string; date: string; rates: Record<string, number> }

type State = { rates: Record<string, number | null>; date: string | null; lastFetched: number | null; selected: number }
const state: State = {
  rates: Object.fromEntries(TARGETS.map((t) => [t, null])),
  date: null,
  lastFetched: null,
  selected: 0,
}

const preview = setupPreview({
  title: 'FX Rate',
  subtitle: `${BASE} → ${TARGETS.join(' / ')} (ECB via frankfurter.dev)`,
  buttons: [
    { id: 'next', label: 'Next pair', onClick: () => cycle() },
    { id: 'refresh', label: 'Refresh now', variant: 'secondary', onClick: () => fetchRates() },
  ],
})

const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => cycle())

function cycle() {
  state.selected = (state.selected + 1) % TARGETS.length
  preview.log(`cycled to ${BASE}/${TARGETS[state.selected]}`)
  render()
}

async function fetchRates() {
  const symbols = TARGETS.join(',')
  const url = `https://api.frankfurter.dev/v1/latest?base=${BASE}&symbols=${symbols}`

  const data = await fetchJson<FxResponse>(url, (l) => preview.log(l))
  if (!data) {
    preview.log('  (no data, keeping previous values)')
    return
  }

  const updates: string[] = []
  for (const t of TARGETS) {
    const v = data.rates?.[t] ?? null
    if (v !== null) updates.push(`${t}=${v}`)
    state.rates[t] = v
  }
  state.date = data.date ?? null
  state.lastFetched = Date.now()
  preview.log(`  extracted (date=${state.date}): ${updates.join(', ')}`)
  render()
}

function fmtRate(n: number | null): string {
  if (n === null) return '...'
  // JPY/KRW など値が大きいものは小数を切り捨て、EUR/GBP など 1 付近のものは小数 4 桁
  return n >= 10 ? n.toFixed(2) : n.toFixed(4)
}
function fmtAgo(ms: number | null): string {
  if (ms === null) return 'never'
  const min = Math.floor((Date.now() - ms) / 60_000)
  if (min < 60) return `${min}m ago`
  return `${Math.floor(min / 60)}h ${min % 60}m ago`
}

function render() {
  const cur = TARGETS[state.selected]
  const all = TARGETS.map((t, i) => `${i === state.selected ? '▶' : ' '} ${BASE}/${t}  ${fmtRate(state.rates[t])}`).join('\n')
  preview.setContent(`${all}\n\nDate: ${state.date ?? '-'}  Updated: ${fmtAgo(state.lastFetched)}`)
  void app.render(lines(`${BASE}/${cur}`, fmtRate(state.rates[cur])))
}

void fetchRates()
setInterval(() => { void fetchRates() }, POLL_MS)
render()
