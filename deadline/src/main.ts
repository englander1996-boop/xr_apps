import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'
import { loadJson, saveJson } from '../../_lib/storage'

const KEY = 'deadline.v1'
type Stored = { label: string; targetISO: string }
const stored: Stored = loadJson<Stored>(KEY, { label: 'Launch', targetISO: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) })

const preview = setupPreview({
  title: 'Deadline',
  subtitle: 'Countdown to a date',
  buttons: [{ id: 'save', label: 'Save', onClick: () => save() }],
})
preview.appendBody(`
  <label style="display:block;font-size:12px;color:#888;margin-bottom:4px;">Label</label>
  <input id="dl-label" type="text" value="${escape(stored.label)}" style="width:100%;padding:8px;background:#0a0a0a;color:#f0f0f0;border:1px solid #2a2a2a;border-radius:6px;font-size:14px;">
  <label style="display:block;font-size:12px;color:#888;margin:8px 0 4px;">Target date (YYYY-MM-DD)</label>
  <input id="dl-date" type="date" value="${stored.targetISO.slice(0, 10)}" style="width:100%;padding:8px;background:#0a0a0a;color:#f0f0f0;border:1px solid #2a2a2a;border-radius:6px;font-size:14px;">
`)

const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')

function escape(s: string): string { return s.replace(/[<>&"]/g, (c) => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;' }[c]!)) }

function targetMs(): number {
  const d = new Date(stored.targetISO + 'T00:00:00')
  return d.getTime()
}
function fmt(ms: number): { lines: [string, string]; combined: string } {
  if (ms <= 0) return { lines: ['*** PASSED ***', stored.label], combined: `PASSED  ${stored.label}` }
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  return { lines: [`${stored.label}`, `${days}d ${hours}h ${mins}m`], combined: `${stored.label}: ${days}d ${hours}h ${mins}m` }
}

function render() {
  const r = fmt(targetMs() - Date.now())
  preview.setContent(r.combined)
  void app.render(lines(r.lines[0], r.lines[1]))
}

function save() {
  const labelEl = document.getElementById('dl-label') as HTMLInputElement
  const dateEl = document.getElementById('dl-date') as HTMLInputElement
  stored.label = labelEl.value || 'Deadline'
  stored.targetISO = dateEl.value
  saveJson(KEY, stored)
  render()
  preview.log(`saved label=${stored.label} target=${stored.targetISO}`)
}

render()
setInterval(render, 60_000)
