import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'
import { loadJson, saveJson } from '../../_lib/storage'

const KEY = 'lifesec.dob.v1'
let dob: string = loadJson(KEY, '2000-01-01')
let mode: 'sec' | 'min' | 'hour' | 'day' | 'year' = 'sec'
const MODES: typeof mode[] = ['sec', 'min', 'hour', 'day', 'year']

const preview = setupPreview({
  title: 'Lifesec',
  subtitle: 'Counts time since your birthday',
  buttons: [
    { id: 'cycle', label: 'Cycle unit', onClick: () => cycle() },
    { id: 'save', label: 'Save DOB', variant: 'secondary', onClick: () => saveDob() },
  ],
})
preview.appendBody(`<input id="ls-dob" type="date" value="${dob}" style="width:100%;padding:8px;background:#0a0a0a;color:#f0f0f0;border:1px solid #2a2a2a;border-radius:6px;font-size:14px;">`)

const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => cycle())

function value(): number {
  const ms = Date.now() - new Date(dob + 'T00:00:00').getTime()
  if (ms < 0) return 0
  switch (mode) {
    case 'sec': return Math.floor(ms / 1000)
    case 'min': return Math.floor(ms / 60_000)
    case 'hour': return Math.floor(ms / 3_600_000)
    case 'day': return Math.floor(ms / 86_400_000)
    case 'year': return Math.floor(ms / (365.2425 * 86_400_000))
  }
}

function render() {
  const v = value().toLocaleString()
  const body = `${v} ${mode}\nsince ${dob}`
  preview.setContent(body)
  void app.render(lines(`${v} ${mode}`, `since ${dob}`))
}

function cycle() {
  mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length]
  render()
}
function saveDob() {
  const el = document.getElementById('ls-dob') as HTMLInputElement
  dob = el.value
  saveJson(KEY, dob)
  render()
}

render()
setInterval(render, 1000)
