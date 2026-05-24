import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'
import { loadJson, saveJson } from '../../_lib/storage'

const KEY = 'water.v1'
type S = { date: string; count: number; lastAt: number; goal: number }
function today(): string { return new Date().toISOString().slice(0, 10) }
let state: S = loadJson<S>(KEY, { date: today(), count: 0, lastAt: 0, goal: 8 })
if (state.date !== today()) { state = { date: today(), count: 0, lastAt: 0, goal: state.goal } }

const preview = setupPreview({
  title: 'Water',
  subtitle: 'Tap = drank a cup',
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

function fmtSince(ms: number): string {
  if (ms === 0 || !ms) return '-'
  const elapsed = Date.now() - ms
  const m = Math.floor(elapsed / 60000)
  return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ${m % 60}m ago`
}
function render() {
  const bars = '█'.repeat(Math.min(state.count, state.goal)) + '░'.repeat(Math.max(0, state.goal - state.count))
  preview.setContent(`Today: ${state.count}/${state.goal} cups\n${bars}\nLast sip: ${fmtSince(state.lastAt)}`)
  void app.render(lines(`Water ${state.count}/${state.goal}`, `${bars}  last ${fmtSince(state.lastAt)}`))
}
function drink() { state.count += 1; state.lastAt = Date.now(); saveJson(KEY, state); render() }
function undo() { if (state.count > 0) state.count -= 1; saveJson(KEY, state); render() }
render()
setInterval(render, 60_000)
