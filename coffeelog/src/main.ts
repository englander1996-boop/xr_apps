import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'
import { loadJson, saveJson } from '../../_lib/storage'

const KEY = 'coffeelog.v1'
type S = Record<string, number>  // date -> count
const log: S = loadJson<S>(KEY, {})
function today(): string { return new Date().toISOString().slice(0, 10) }
function recentDates(n: number): string[] {
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.now() - i * 86400000)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

const preview = setupPreview({
  title: 'Coffee Log',
  subtitle: 'Tap = +1 cup, double = undo',
  buttons: [
    { id: 'drink', label: '+1 cup', onClick: () => drink() },
    { id: 'undo', label: 'Undo', variant: 'secondary', onClick: () => undo() },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => drink())
app.on('double', () => undo())

function avg7(): number {
  const dates = recentDates(7)
  const sum = dates.reduce((s, d) => s + (log[d] ?? 0), 0)
  return sum / 7
}
function render() {
  const todayN = log[today()] ?? 0
  preview.setContent(`Today: ${todayN} cup${todayN === 1 ? '' : 's'}\n7-day avg: ${avg7().toFixed(1)}`)
  void app.render(lines(`Today: ${todayN}`, `7-day avg: ${avg7().toFixed(1)}`))
}
function drink() { const d = today(); log[d] = (log[d] ?? 0) + 1; saveJson(KEY, log); render() }
function undo() { const d = today(); log[d] = Math.max(0, (log[d] ?? 0) - 1); saveJson(KEY, log); render() }
render()
