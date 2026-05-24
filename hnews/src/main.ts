import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'
import { fetchJson } from '../../_lib/net'

// HN Firebase API:
//   topstories.json     → 上位記事の id 配列 (最大 500)
//   item/<id>.json      → 1 記事の詳細 { id, title, by, score, descendants, url, ... }
const TOP_COUNT = 20  // 上位 N 件だけ取る
const POLL_MS = 10 * 60 * 1000  // 10 分ごと再取得

type Item = { id: number; title?: string; by?: string; score?: number; descendants?: number; url?: string }

type State = { items: Item[]; idx: number; lastFetched: number | null }
const state: State = { items: [], idx: 0, lastFetched: null }

const preview = setupPreview({
  title: 'Hacker News',
  subtitle: `Top ${TOP_COUNT} stories, refresh every 10min`,
  buttons: [
    { id: 'next', label: 'Next story', onClick: () => next() },
    { id: 'prev', label: 'Prev story', variant: 'secondary', onClick: () => prev() },
    { id: 'refresh', label: 'Refresh', variant: 'secondary', onClick: () => fetchAll() },
  ],
})

const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => next())
app.on('double', () => prev())

function next() { if (state.items.length === 0) return; state.idx = (state.idx + 1) % state.items.length; render() }
function prev() { if (state.items.length === 0) return; state.idx = (state.idx - 1 + state.items.length) % state.items.length; render() }

async function fetchAll() {
  // Step 1: id 一覧を取る
  const idsUrl = 'https://hacker-news.firebaseio.com/v0/topstories.json'
  const ids = await fetchJson<number[]>(idsUrl, (l) => preview.log(l))
  if (!ids) return

  const top = ids.slice(0, TOP_COUNT)
  preview.log(`  got ${ids.length} ids, taking top ${top.length}`)

  // Step 2: 各 id の詳細を並列取得 (Promise.all で 20 個まとめて)
  const start = performance.now()
  const items = await Promise.all(
    top.map((id) => fetchJson<Item>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, () => { /* 個別ログは出さない、騒がしくなるので */ })),
  )
  const elapsed = Math.round(performance.now() - start)

  // null は失敗したやつ。フィルタして残す
  state.items = items.filter((it): it is Item => it !== null && Boolean(it.title))
  state.lastFetched = Date.now()
  state.idx = 0
  preview.log(`  fetched ${state.items.length}/${top.length} items in ${elapsed}ms`)
  render()
}

function fmtAgo(ms: number | null): string {
  if (ms === null) return 'never'
  const min = Math.floor((Date.now() - ms) / 60_000)
  if (min < 60) return `${min}m ago`
  return `${Math.floor(min / 60)}h ${min % 60}m ago`
}

function render() {
  if (state.items.length === 0) {
    preview.setContent('(no stories — tap Refresh)')
    void app.render(lines('Hacker News', '(loading...)'))
    return
  }
  const it = state.items[state.idx]
  const rank = state.idx + 1
  const score = it.score ?? 0
  const comments = it.descendants ?? 0
  const title = it.title ?? '(no title)'
  const meta = `#${rank}  ${score}↑  ${comments}💬`
  preview.setContent(`${meta}\n${title}\n${it.url ? `\n${it.url}` : ''}\n\nUpdated: ${fmtAgo(state.lastFetched)}`)
  void app.render(lines(meta, title))
}

void fetchAll()
setInterval(() => { void fetchAll() }, POLL_MS)
render()
