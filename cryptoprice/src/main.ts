import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'
import { fetchJson } from '../../_lib/net'

// 取得する通貨。CoinGecko の id は https://api.coingecko.com/api/v3/coins/list で調べられる。
const COINS = ['bitcoin', 'ethereum', 'solana'] as const
const VS = 'usd'  // 'jpy' にすれば円表示
const POLL_MS = 60_000  // 60 秒ごとに更新 (無料枠 10-30 req/min なので余裕)

// CoinGecko レスポンスの想定形
type PriceResponse = Record<string, Record<string, number>>

type State = { prices: Record<string, number | null>; lastFetched: number | null; selected: number }
const state: State = {
  prices: Object.fromEntries(COINS.map((c) => [c, null])),
  lastFetched: null,
  selected: 0,
}

const preview = setupPreview({
  title: 'Crypto Price',
  subtitle: `CoinGecko (${VS.toUpperCase()}), 60s polling`,
  buttons: [
    { id: 'next', label: 'Next coin', onClick: () => cycle() },
    { id: 'refresh', label: 'Refresh now', variant: 'secondary', onClick: () => fetchPrices() },
  ],
})

const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => cycle())

function cycle() {
  state.selected = (state.selected + 1) % COINS.length
  preview.log(`cycled to ${COINS[state.selected]}`)
  render()
}

async function fetchPrices() {
  const ids = COINS.join(',')
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${VS}`

  const data = await fetchJson<PriceResponse>(url, (l) => preview.log(l))
  if (!data) {
    preview.log('  (no data, keeping previous values)')
    return
  }

  const updates: string[] = []
  for (const coin of COINS) {
    const v = data[coin]?.[VS] ?? null
    if (v !== null) updates.push(`${coin}=${v}`)
    state.prices[coin] = v
  }
  state.lastFetched = Date.now()
  preview.log(`  extracted: ${updates.join(', ')}`)
  render()
}

function fmtPrice(n: number | null): string {
  if (n === null) return '...'
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtAgo(ms: number | null): string {
  if (ms === null) return 'never'
  const sec = Math.floor((Date.now() - ms) / 1000)
  if (sec < 60) return `${sec}s ago`
  return `${Math.floor(sec / 60)}m ago`
}

function render() {
  const coin = COINS[state.selected]
  const price = fmtPrice(state.prices[coin])
  const ago = fmtAgo(state.lastFetched)
  const allLines = COINS.map((c, i) => `${i === state.selected ? '▶' : ' '} ${c.padEnd(10)} ${VS.toUpperCase()} ${fmtPrice(state.prices[c])}`).join('\n')
  preview.setContent(`${allLines}\n\nUpdated: ${ago}`)
  void app.render(lines(`${coin.toUpperCase()}`, `${VS.toUpperCase()} ${price}`))
}

void fetchPrices()
setInterval(() => { void fetchPrices() }, POLL_MS)
render()
