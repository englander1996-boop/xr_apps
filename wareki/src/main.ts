import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

type Era = { name: string; startYear: number }
const ERAS: Era[] = [
  { name: '令和', startYear: 2019 },
  { name: '平成', startYear: 1989 },
  { name: '昭和', startYear: 1926 },
  { name: '大正', startYear: 1912 },
  { name: '明治', startYear: 1868 },
]

let year = new Date().getFullYear()

const preview = setupPreview({
  title: 'Wareki',
  subtitle: 'Seireki ↔ Japanese era converter',
  buttons: [
    { id: 'now', label: 'Now', onClick: () => { year = new Date().getFullYear(); render() } },
    { id: 'set', label: 'Set year', variant: 'secondary', onClick: () => setYear() },
  ],
})
preview.appendBody(`<input id="wk-year" type="number" value="${year}" min="1868" max="2200" style="width:100%;padding:8px;background:#0a0a0a;color:#f0f0f0;border:1px solid #2a2a2a;border-radius:6px;font-size:14px;">`)

const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => { year += 1; (document.getElementById('wk-year') as HTMLInputElement).value = String(year); render() })
app.on('double', () => { year -= 1; (document.getElementById('wk-year') as HTMLInputElement).value = String(year); render() })

function toWareki(y: number): string {
  for (const era of ERAS) {
    if (y >= era.startYear) {
      const n = y - era.startYear + 1
      return `${era.name}${n === 1 ? '元' : n}年`
    }
  }
  return '(out of range)'
}

function render() {
  const w = toWareki(year)
  const body = `西暦 ${year}年\n${w}`
  preview.setContent(body)
  void app.render(lines(`西暦 ${year}年`, w))
}

function setYear() {
  const el = document.getElementById('wk-year') as HTMLInputElement
  const v = Number(el.value)
  if (Number.isFinite(v)) year = v
  render()
}

render()
