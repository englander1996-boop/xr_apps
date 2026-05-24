import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const PHASES = [
  { name: 'Inhale', sec: 4 },
  { name: 'Hold',   sec: 4 },
  { name: 'Exhale', sec: 4 },
  { name: 'Hold',   sec: 4 },
]
let idx = 0, remaining = PHASES[0].sec, cycles = 0, running = false
let t: number | null = null

const preview = setupPreview({
  title: 'Breathing',
  subtitle: 'Box breathing 4-4-4-4',
  buttons: [
    { id: 'go', label: 'Start', onClick: () => toggle() },
    { id: 'reset', label: 'Reset', variant: 'secondary', onClick: () => reset() },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => toggle())
app.on('double', () => reset())

function bar(n: number, total: number): string { const filled = Math.round((1 - n / total) * 8); return '█'.repeat(filled) + '-'.repeat(8 - filled) }
function render() {
  const p = PHASES[idx]
  preview.setContent(`${p.name}  ${remaining}s\n${bar(remaining, p.sec)}\nCycles ${cycles}`)
  void app.render(lines(`${p.name}  ${remaining}s`, `${bar(remaining, p.sec)}  cycles ${cycles}`))
}
function tick() {
  remaining -= 1
  if (remaining < 0) {
    idx = (idx + 1) % PHASES.length
    if (idx === 0) cycles += 1
    remaining = PHASES[idx].sec
  }
  render()
}
function toggle() {
  running = !running
  preview.setButtonLabel('go', running ? 'Pause' : 'Start')
  if (running) { t = window.setInterval(tick, 1000) } else if (t !== null) { clearInterval(t); t = null }
}
function reset() { if (t !== null) clearInterval(t); t = null; running = false; idx = 0; remaining = PHASES[0].sec; cycles = 0; preview.setButtonLabel('go', 'Start'); render() }
render()
