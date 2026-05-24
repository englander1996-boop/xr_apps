import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

type State = { running: boolean; startedAt: number; accumMs: number; laps: number[] }
const state: State = { running: false, startedAt: 0, accumMs: 0, laps: [] }
let raf: number | null = null

const preview = setupPreview({
  title: 'Stopwatch',
  subtitle: 'Tap = start / lap, double tap = stop+reset',
  buttons: [
    { id: 'go', label: 'Start', onClick: () => lap() },
    { id: 'reset', label: 'Stop & Reset', variant: 'secondary', onClick: () => reset() },
  ],
})

const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => lap())
app.on('double', () => reset())

function elapsedMs(): number {
  return state.accumMs + (state.running ? Date.now() - state.startedAt : 0)
}
function fmt(ms: number): string {
  const total = Math.floor(ms / 10)
  const cs = total % 100
  const s = Math.floor(total / 100) % 60
  const m = Math.floor(total / 6000)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`
}

let lastGlassRender = 0
function render() {
  const ms = elapsedMs()
  const body = `${fmt(ms)}${state.laps.length > 0 ? `\nLast lap: ${fmt(state.laps[state.laps.length - 1])}` : ''}\nLaps: ${state.laps.length}`
  preview.setContent(body)
  preview.setButtonLabel('go', !state.running ? 'Start' : 'Lap')
  const now = Date.now()
  if (now - lastGlassRender > 500) {
    void app.render(lines(fmt(ms), `Laps: ${state.laps.length}`))
    lastGlassRender = now
  }
}

function loop() {
  render()
  if (state.running) raf = requestAnimationFrame(loop)
}

function lap() {
  if (!state.running) {
    state.running = true
    state.startedAt = Date.now()
    raf = requestAnimationFrame(loop)
  } else {
    state.laps.push(elapsedMs())
    render()
  }
}
function reset() {
  state.running = false
  state.accumMs = 0
  state.laps = []
  if (raf !== null) cancelAnimationFrame(raf)
  raf = null
  render()
}

render()
