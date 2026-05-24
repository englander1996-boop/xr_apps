import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

type Phase = 'idle' | 'wait' | 'mole'
let phase: Phase = 'idle'
let score = 0, misses = 0, best = 0
let t: number | null = null

const preview = setupPreview({
  title: 'Whack-a-Mole',
  subtitle: 'Tap when MOLE shows. Tapping during WAIT loses.',
  buttons: [
    { id: 'go', label: 'Start round', onClick: () => start() },
    { id: 'whack', label: 'Whack', variant: 'secondary', onClick: () => whack() },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => whack())
app.on('double', () => start())

function render() {
  const txt = phase === 'idle' ? 'Press Start' : phase === 'wait' ? '... wait ...' : '*** MOLE ***'
  preview.setContent(`${txt}\nScore ${score}  Misses ${misses}  Best ${best}`)
  void app.render(lines(txt, `Score ${score}  Best ${best}`))
}
function clear() { if (t !== null) { clearTimeout(t); t = null } }
function scheduleMole() {
  clear()
  phase = 'wait'; render()
  t = window.setTimeout(() => { phase = 'mole'; render(); t = window.setTimeout(() => { misses += 1; scheduleMole() }, 1200) }, 800 + Math.random() * 2500)
}
function start() { score = 0; misses = 0; scheduleMole() }
function whack() {
  if (phase === 'mole') { score += 1; if (score > best) best = score; clear(); scheduleMole() }
  else if (phase === 'wait') { misses += 1; clear(); scheduleMole() }
}
render()
