import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'
import { loadJson, saveJson } from '../../_lib/storage'

const KEY = 'lastsince.v1'
type Item = { name: string; at: number }
const items: Item[] = loadJson<Item[]>(KEY, [
  { name: 'Coffee', at: Date.now() },
  { name: 'Water', at: Date.now() },
  { name: 'Stretch', at: Date.now() },
])
let selected = 0

const preview = setupPreview({
  title: 'Lastsince',
  subtitle: 'Tap = next item, double tap = mark now',
  buttons: [
    { id: 'mark', label: 'Mark now', onClick: () => markNow() },
    { id: 'next', label: 'Next item', variant: 'secondary', onClick: () => next() },
  ],
})

const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => next())
app.on('double', () => markNow())

function fmtElapsed(ms: number): string {
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ${sec % 60}s`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h ${min % 60}m`
  const d = Math.floor(h / 24)
  return `${d}d ${h % 24}h`
}
function render() {
  const item = items[selected]
  const elapsed = fmtElapsed(Date.now() - item.at)
  preview.setContent(`${item.name}: ${elapsed} ago\n(${selected + 1}/${items.length})`)
  void app.render(lines(`${item.name}`, `${elapsed} ago`))
}
function next() { selected = (selected + 1) % items.length; render() }
function markNow() { items[selected].at = Date.now(); saveJson(KEY, items); render() }

render()
setInterval(render, 1000)
