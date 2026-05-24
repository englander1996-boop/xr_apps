import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const ON_SEC = 20
const OFF_SEC = 10
const ROUNDS = 8

type Phase = 'idle' | 'on' | 'off' | 'done'
type State = { phase: Phase; remaining: number; round: number }

const state: State = { phase: 'idle', remaining: ON_SEC, round: 1 }
let intervalId: number | null = null

const preview = setupPreview({
  title: 'HIIT',
  subtitle: `${ON_SEC}s on / ${OFF_SEC}s off × ${ROUNDS}`,
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

function label(): string {
  return state.phase === 'idle' ? 'READY' : state.phase === 'on' ? 'GO' : state.phase === 'off' ? 'REST' : 'DONE'
}

function render() {
  const body = `${label()}  ${state.remaining}s\nRound ${state.round}/${ROUNDS}`
  preview.setContent(body)
  void app.render(lines(`${label()}  ${state.remaining}s`, `Round ${state.round}/${ROUNDS}`))
}

function tick() {
  state.remaining -= 1
  if (state.remaining <= 0) {
    if (state.phase === 'on') {
      state.phase = 'off'
      state.remaining = OFF_SEC
    } else if (state.phase === 'off') {
      if (state.round >= ROUNDS) {
        state.phase = 'done'
        state.remaining = 0
        stopTick()
      } else {
        state.round += 1
        state.phase = 'on'
        state.remaining = ON_SEC
      }
    }
  }
  render()
}

function startTick() { stopTick(); intervalId = window.setInterval(tick, 1000) }
function stopTick() { if (intervalId !== null) { window.clearInterval(intervalId); intervalId = null } }

function toggle() {
  if (state.phase === 'idle' || state.phase === 'done') {
    state.phase = 'on'; state.remaining = ON_SEC; state.round = 1
    startTick()
  } else if (intervalId !== null) {
    stopTick()
  } else {
    startTick()
  }
  render()
}
function reset() { stopTick(); state.phase = 'idle'; state.remaining = ON_SEC; state.round = 1; render() }

render()
