import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'
import { loadJson, saveJson } from '../../_lib/storage'

const KEY = 'sitalert.v1'
type S = { intervalMin: number; lastStoodAt: number; standCount: number }
const state: S = loadJson<S>(KEY, { intervalMin: 60, lastStoodAt: Date.now(), standCount: 0 })

const preview = setupPreview({
  title: 'Sit Alert',
  subtitle: 'Reset when you stand. Glass nags when overdue.',
  buttons: [
    { id: 'stood', label: 'I stood up', onClick: () => stood() },
    { id: 'interval', label: 'Cycle interval', variant: 'secondary', onClick: () => cycleInterval() },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => stood())
app.on('double', () => cycleInterval())

function fmtElapsed(ms: number): string {
  const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000)
  return `${m}m ${s}s`
}
function render() {
  const elapsed = Date.now() - state.lastStoodAt
  const overdue = elapsed > state.intervalMin * 60_000
  const label = overdue ? '** STAND UP **' : 'Sitting OK'
  preview.setContent(`${label}\n${fmtElapsed(elapsed)} sitting (limit ${state.intervalMin}m)\nStood today: ${state.standCount}`)
  void app.render(lines(label, `${fmtElapsed(elapsed)} (lim ${state.intervalMin}m)`))
}
function stood() { state.lastStoodAt = Date.now(); state.standCount += 1; saveJson(KEY, state); render() }
function cycleInterval() {
  const opts = [30, 45, 60, 90, 120]
  state.intervalMin = opts[(opts.indexOf(state.intervalMin) + 1) % opts.length]
  saveJson(KEY, state); render()
}
render()
setInterval(render, 10000)
