import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'
import { fetchJson } from '../../_lib/net'

// Wikipedia REST: https://en.wikipedia.org/api/rest_v1/feed/onthisday/<type>/<MM>/<DD>
// type ∈ { all, selected, events, births, deaths, holidays }
// 'selected' は編集者が手で選んだ目玉ピックなので件数少なめ・質高め
type CategoryKey = 'selected' | 'events' | 'births' | 'deaths' | 'holidays'
const CATEGORIES: CategoryKey[] = ['selected', 'events', 'births', 'deaths', 'holidays']

type WikiEntry = { text: string; year?: number }
type WikiResponse = Partial<Record<CategoryKey, WikiEntry[]>>

type State = { data: WikiResponse | null; categoryIdx: number; itemIdx: number; lastFetched: number | null }
const state: State = { data: null, categoryIdx: 0, itemIdx: 0, lastFetched: null }

const preview = setupPreview({
  title: 'Wiki Today',
  subtitle: 'On this day in history (English Wikipedia)',
  buttons: [
    { id: 'next', label: 'Next item', onClick: () => nextItem() },
    { id: 'cat', label: 'Next category', variant: 'secondary', onClick: () => nextCategory() },
    { id: 'refresh', label: 'Refresh', variant: 'secondary', onClick: () => fetchToday() },
  ],
})

const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => nextItem())
app.on('double', () => nextCategory())

function currentCategory(): CategoryKey { return CATEGORIES[state.categoryIdx] }
function currentList(): WikiEntry[] { return state.data?.[currentCategory()] ?? [] }

async function fetchToday() {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/${mm}/${dd}`

  const data = await fetchJson<WikiResponse>(url, (l) => preview.log(l))
  if (!data) {
    preview.log('  (no data, keeping previous)')
    return
  }
  state.data = data
  state.lastFetched = Date.now()
  state.itemIdx = 0

  const counts = CATEGORIES.map((c) => `${c}=${(data[c] ?? []).length}`).join(', ')
  preview.log(`  extracted: ${counts}`)
  render()
}

function nextItem() {
  const list = currentList()
  if (list.length === 0) return
  state.itemIdx = (state.itemIdx + 1) % list.length
  render()
}
function nextCategory() {
  state.categoryIdx = (state.categoryIdx + 1) % CATEGORIES.length
  state.itemIdx = 0
  preview.log(`category → ${currentCategory()} (${currentList().length} items)`)
  render()
}

function render() {
  const cat = currentCategory()
  const list = currentList()
  const item = list[state.itemIdx]
  if (!item) {
    preview.setContent(`${cat}\n(no data — tap Refresh)`)
    void app.render(lines(cat, '(no data)'))
    return
  }
  const yr = item.year ? `${item.year}: ` : ''
  const body = `[${cat} ${state.itemIdx + 1}/${list.length}]\n${yr}${item.text}`
  preview.setContent(body)
  // グラス側はスペース節約のため 2 行に圧縮
  void app.render(lines(`${cat} ${state.itemIdx + 1}/${list.length}  ${yr}`.trim(), item.text))
}

void fetchToday()
render()
