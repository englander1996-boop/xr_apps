import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'
import { loadJson, saveJson } from '../../_lib/storage'

const KEY = 'multitimer.v1'
type Slot = { name: string; totalSec: number; remaining: number; running: boolean }
const slots: Slot[] = loadJson<Slot[]>(KEY, [
  { name: 'A', totalSec: 60, remaining: 60, running: false },
  { name: 'B', totalSec: 180, remaining: 180, running: false },
  { name: 'C', totalSec: 300, remaining: 300, running: false },
])
let selected = 0

const preview = setupPreview({
  title: 'Multitimer',
  subtitle: 'Three parallel timers. Tap=next slot, double=toggle.',
  buttons: [
    { id: 'toggle', label: 'Start/Stop selected', onClick: () => toggle() },
    { id: 'next', label: 'Next slot', variant: 'secondary', onClick: () => next() },
    { id: 'reset', label: 'Reset selected', variant: 'secondary', onClick: () => reset() },
  ],
})
preview.appendBody(slots.map((s, i) => `
  <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px;">
    <input id="mt-name-${i}" type="text" value="${s.name}" style="flex:1;padding:6px;background:#0a0a0a;color:#f0f0f0;border:1px solid #2a2a2a;border-radius:4px;font-size:13px;">
    <input id="mt-sec-${i}" type="number" value="${s.totalSec}" min="1" style="width:80px;padding:6px;background:#0a0a0a;color:#f0f0f0;border:1px solid #2a2a2a;border-radius:4px;font-size:13px;">
    <button id="mt-set-${i}" style="padding:6px 10px;background:#2a2a2a;color:#f0f0f0;border:none;border-radius:4px;cursor:pointer;font-size:13px;">Set</button>
  </div>
`).join(''))

slots.forEach((_, i) => {
  document.getElementById(`mt-set-${i}`)?.addEventListener('click', () => {
    const n = (document.getElementById(`mt-name-${i}`) as HTMLInputElement).value
    const t = Number((document.getElementById(`mt-sec-${i}`) as HTMLInputElement).value)
    slots[i].name = n
    slots[i].totalSec = t
    slots[i].remaining = t
    slots[i].running = false
    saveJson(KEY, slots)
    render()
  })
})

const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => next())
app.on('double', () => toggle())

function fmt(s: number): string { const m = Math.floor(s / 60), sec = s % 60; return `${m}:${sec.toString().padStart(2, '0')}` }
function render() {
  const head = slots.map((s, i) => `${i === selected ? '▶' : ' '}${s.name}${s.running ? '*' : ''} ${fmt(s.remaining)}`).join(' | ')
  preview.setContent(head)
  void app.render(lines(
    slots.slice(0, 2).map((s, i) => `${i === selected ? '>' : ' '}${s.name}${s.running ? '*' : ''} ${fmt(s.remaining)}`).join('  '),
    slots.length > 2 ? `${selected === 2 ? '>' : ' '}${slots[2].name}${slots[2].running ? '*' : ''} ${fmt(slots[2].remaining)}` : '',
  ))
}
function next() { selected = (selected + 1) % slots.length; render() }
function toggle() { slots[selected].running = !slots[selected].running; render() }
function reset() { slots[selected].remaining = slots[selected].totalSec; slots[selected].running = false; render() }

render()
setInterval(() => {
  let dirty = false
  for (const s of slots) {
    if (s.running && s.remaining > 0) { s.remaining -= 1; dirty = true; if (s.remaining === 0) s.running = false }
  }
  if (dirty) render()
}, 1000)
