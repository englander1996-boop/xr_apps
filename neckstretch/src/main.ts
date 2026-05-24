import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const MOVES = ['Tilt LEFT', 'Hold center', 'Tilt RIGHT', 'Hold center', 'Look UP', 'Look DOWN']
const PER_SEC = 15
let idx = 0, remaining = PER_SEC, running = false, done = false
let t: number | null = null

const preview = setupPreview({
  title: 'Neck Stretch',
  subtitle: `${MOVES.length} moves × ${PER_SEC}s`,
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
  const label = done ? 'Done!' : running ? `${MOVES[idx]}  ${remaining}s` : 'Press Start'
  preview.setContent(`${label}\n(${Math.min(idx + 1, MOVES.length)}/${MOVES.length})`)
  void app.render(lines(label, `${Math.min(idx + 1, MOVES.length)}/${MOVES.length}`))
}
function start() {
  if (running) return
  if (done) reset()
  running = true; render()
  t = window.setInterval(() => {
    remaining -= 1
    if (remaining <= 0) {
      idx += 1
      if (idx >= MOVES.length) { done = true; running = false; if (t !== null) clearInterval(t); t = null }
      else remaining = PER_SEC
    }
    render()
  }, 1000)
}
function reset() { if (t !== null) clearInterval(t); t = null; running = false; done = false; idx = 0; remaining = PER_SEC; render() }
render()
