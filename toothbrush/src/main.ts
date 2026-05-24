import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const ZONES = ['Upper Left', 'Upper Right', 'Lower Left', 'Lower Right']
const ZONE_SEC = 30
let zone = 0, remaining = ZONE_SEC, running = false, done = false
let t: number | null = null

const preview = setupPreview({
  title: 'Toothbrush',
  subtitle: '2 min × 4 zones',
  buttons: [
    { id: 'go', label: 'Start', onClick: () => start() },
    { id: 'reset', label: 'Reset', variant: 'secondary', onClick: () => reset() },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => start())
app.on('double', () => reset())

function render() {
  const label = done ? '*** DONE ***' : running ? `${ZONES[zone]}  ${remaining}s` : 'Press Start'
  preview.setContent(`${label}\nZone ${Math.min(zone + 1, 4)}/4`)
  void app.render(lines(label, `Zone ${Math.min(zone + 1, 4)}/4`))
}
function start() {
  if (running) return
  if (done) reset()
  running = true; render()
  t = window.setInterval(() => {
    remaining -= 1
    if (remaining <= 0) {
      zone += 1
      if (zone >= ZONES.length) { running = false; done = true; if (t !== null) clearInterval(t); t = null }
      else remaining = ZONE_SEC
    }
    render()
  }, 1000)
}
function reset() { if (t !== null) clearInterval(t); t = null; running = false; done = false; zone = 0; remaining = ZONE_SEC; render() }
render()
