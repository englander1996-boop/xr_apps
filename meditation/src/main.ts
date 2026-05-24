import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const PRESETS = [5, 10, 15, 20]
let presetIdx = 0
let remaining = PRESETS[0] * 60
let running = false, done = false
let t: number | null = null

const preview = setupPreview({
  title: 'Meditation',
  subtitle: 'Tap=cycle preset, double=start/stop',
  buttons: [
    { id: 'cycle', label: '5 min', onClick: () => cyclePreset() },
    { id: 'go', label: 'Start', variant: 'secondary', onClick: () => toggle() },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => cyclePreset())
app.on('double', () => toggle())

function fmt(s: number): string { const m = Math.floor(s / 60), sec = s % 60; return `${m}:${sec.toString().padStart(2, '0')}` }
function render() {
  const status = done ? '*** DONE ***' : running ? 'Sitting...' : 'Ready'
  preview.setContent(`${status}\n${fmt(remaining)}\nPreset: ${PRESETS[presetIdx]} min`)
  preview.setButtonLabel('cycle', `${PRESETS[presetIdx]} min`)
  preview.setButtonLabel('go', running ? 'Stop' : 'Start')
  void app.render(lines(status, `${fmt(remaining)}  (${PRESETS[presetIdx]}m)`))
}
function cyclePreset() {
  if (running) return
  presetIdx = (presetIdx + 1) % PRESETS.length
  remaining = PRESETS[presetIdx] * 60
  done = false
  render()
}
function toggle() {
  if (!running) {
    if (done) { remaining = PRESETS[presetIdx] * 60; done = false }
    running = true
    t = window.setInterval(() => {
      remaining -= 1
      if (remaining <= 0) { running = false; done = true; if (t !== null) clearInterval(t); t = null }
      render()
    }, 1000)
  } else {
    running = false
    if (t !== null) clearInterval(t); t = null
  }
  render()
}
render()
