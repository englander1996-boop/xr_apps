import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'
import { loadJson, saveJson } from '../../_lib/storage'

const WORK_SEC = 25 * 60
const BREAK_SEC = 5 * 60
const KEY = 'pomodoro.cycles.v1'

type Phase = 'idle' | 'work' | 'break' | 'paused'
type State = { phase: Phase; remaining: number; cycles: number; pausedFrom: Phase }

const state: State = { phase: 'idle', remaining: WORK_SEC, cycles: loadJson(KEY, 0), pausedFrom: 'work' }
let intervalId: number | null = null

const preview = setupPreview({
  title: 'Pomodoro',
  subtitle: '25 min work / 5 min break',
  buttons: [
    { id: 'toggle', label: 'Start', onClick: () => toggle() },
    { id: 'reset', label: 'Reset', variant: 'secondary', onClick: () => reset() },
  ],
})

const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')

app.on('click', () => toggle())
app.on('double', () => reset())

function fmt(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

function render() {
  const label = state.phase === 'idle' ? 'READY' : state.phase === 'work' ? 'WORK' : state.phase === 'break' ? 'BREAK' : 'PAUSED'
  const body = `${label}  ${fmt(state.remaining)}\nCycles done: ${state.cycles}`
  preview.setContent(body)
  preview.setButtonLabel('toggle', state.phase === 'idle' ? 'Start' : state.phase === 'paused' ? 'Resume' : 'Pause')
  void app.render(lines(`${label}  ${fmt(state.remaining)}`, `Cycles: ${state.cycles}`))
}

function tick() {
  state.remaining -= 1
  if (state.remaining <= 0) {
    if (state.phase === 'work') {
      state.cycles += 1
      saveJson(KEY, state.cycles)
      state.phase = 'break'
      state.remaining = BREAK_SEC
    } else {
      state.phase = 'work'
      state.remaining = WORK_SEC
    }
  }
  render()
}

function startTick() {
  stopTick()
  intervalId = window.setInterval(tick, 1000)
}
function stopTick() {
  if (intervalId !== null) {
    window.clearInterval(intervalId)
    intervalId = null
  }
}

function toggle() {
  if (state.phase === 'idle') {
    state.phase = 'work'
    state.remaining = WORK_SEC
    startTick()
  } else if (state.phase === 'paused') {
    state.phase = state.pausedFrom
    startTick()
  } else {
    state.pausedFrom = state.phase
    state.phase = 'paused'
    stopTick()
  }
  render()
}

function reset() {
  stopTick()
  state.phase = 'idle'
  state.remaining = WORK_SEC
  render()
}

render()
