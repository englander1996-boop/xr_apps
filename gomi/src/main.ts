import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'
import { loadJson, saveJson } from '../../_lib/storage'

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const KEY = 'gomi.v1'
type S = { schedule: string[] }
const state: S = loadJson<S>(KEY, {
  schedule: ['', 'Burnable', 'Plastic', '', 'Burnable', 'Cans/Bottles', ''],
})

const preview = setupPreview({
  title: 'Gomi',
  subtitle: 'Configure schedule per weekday',
  buttons: [{ id: 'save', label: 'Save schedule', onClick: () => save() }],
})
preview.appendBody(DAYS.map((d, i) =>
  `<div style="display:flex;gap:6px;align-items:center;margin-bottom:4px;">
    <span style="width:36px;font-size:13px;color:#888;">${d}</span>
    <input id="gm-${i}" type="text" value="${state.schedule[i]}" style="flex:1;padding:6px;background:#0a0a0a;color:#f0f0f0;border:1px solid #2a2a2a;border-radius:4px;font-size:13px;">
  </div>`).join(''))

let offset = 0  // 0 = today, 1 = tomorrow, ... 6 = a week away

const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => { offset = (offset + 1) % 7; render() })
app.on('double', () => { offset = 0; render() })

function render() {
  const now = new Date()
  const idx = (now.getDay() + offset) % 7
  const trash = state.schedule[idx] || '(no trash)'
  const nextTrash = state.schedule[(idx + 1) % 7] || '(no trash)'
  const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : `+${offset}d`
  preview.setContent(`${label} (${DAYS[idx]}): ${trash}\nNext (${DAYS[(idx + 1) % 7]}): ${nextTrash}`)
  void app.render(lines(`${label} ${DAYS[idx]}: ${trash}`, `Next: ${nextTrash}`))
}
function save() {
  for (let i = 0; i < 7; i++) {
    state.schedule[i] = (document.getElementById(`gm-${i}`) as HTMLInputElement).value
  }
  saveJson(KEY, state)
  render()
}
render()
setInterval(render, 60_000 * 30)
