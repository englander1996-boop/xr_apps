import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'
import { loadJson, saveJson } from '../../_lib/storage'

const KEY = 'counter.v1'
type S = { label: string; n: number }
const state: S = loadJson<S>(KEY, { label: 'Count', n: 0 })

const preview = setupPreview({
  title: 'Counter',
  subtitle: 'Tap=+1, double=reset',
  buttons: [
    { id: 'plus', label: '+1', onClick: () => inc() },
    { id: 'minus', label: '-1', variant: 'secondary', onClick: () => dec() },
    { id: 'reset', label: 'Reset', variant: 'secondary', onClick: () => reset() },
  ],
})
preview.appendBody(`<input id="ct-label" type="text" value="${state.label}" placeholder="Label" style="width:100%;padding:8px;background:#0a0a0a;color:#f0f0f0;border:1px solid #2a2a2a;border-radius:6px;font-size:14px;">`)
document.getElementById('ct-label')?.addEventListener('change', (e) => { state.label = (e.target as HTMLInputElement).value; saveJson(KEY, state); render() })

const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => inc())
app.on('double', () => reset())

function render() {
  preview.setContent(`${state.label}\n${state.n}`)
  void app.render(lines(state.label, String(state.n)))
}
function inc() { state.n += 1; saveJson(KEY, state); render() }
function dec() { state.n = Math.max(0, state.n - 1); saveJson(KEY, state); render() }
function reset() { state.n = 0; saveJson(KEY, state); render() }
render()
