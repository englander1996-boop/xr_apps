import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

type Phase = 'ready' | 'wait' | 'go' | 'result' | 'jumped'
let phase: Phase = 'ready'
let goAt = 0, reactedMs = 0
let best = Infinity, last: number[] = []
let timer: number | null = null

const preview = setupPreview({
  title: 'Reaction',
  subtitle: 'Tap to start. When GO appears, tap as fast as possible.',
  buttons: [{ id: 'go', label: 'Start', onClick: () => act() }],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => act())
app.on('double', () => start())

function render() {
  let txt = 'Tap to start'
  if (phase === 'wait') txt = 'Wait...'
  else if (phase === 'go') txt = '*** GO ***'
  else if (phase === 'jumped') txt = 'Too early! Tap to retry'
  else if (phase === 'result') txt = `${reactedMs} ms`
  const stat = `Best: ${best === Infinity ? '-' : best + ' ms'}  Last: ${last.slice(-3).map((n) => n + 'ms').join(' ') || '-'}`
  preview.setContent(`${txt}\n${stat}`)
  void app.render(lines(txt, stat))
}
function start() {
  if (timer !== null) { clearTimeout(timer); timer = null }
  phase = 'wait'
  render()
  const delay = 1000 + Math.random() * 3000
  timer = window.setTimeout(() => { phase = 'go'; goAt = performance.now(); render() }, delay)
}
function act() {
  if (phase === 'ready' || phase === 'result' || phase === 'jumped') { start() }
  else if (phase === 'wait') { if (timer !== null) clearTimeout(timer); timer = null; phase = 'jumped'; render() }
  else if (phase === 'go') { reactedMs = Math.round(performance.now() - goAt); last.push(reactedMs); if (reactedMs < best) best = reactedMs; phase = 'result'; render() }
}
render()
