import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

type P = { q: string; a: number }
function gen(): P {
  const op = ['+', '-', '×', '÷'][Math.floor(Math.random() * 4)]
  if (op === '+') { const a = rand(2, 50), b = rand(2, 50); return { q: `${a} + ${b}`, a: a + b } }
  if (op === '-') { const a = rand(10, 99), b = rand(2, a - 1); return { q: `${a} - ${b}`, a: a - b } }
  if (op === '×') { const a = rand(2, 12), b = rand(2, 12); return { q: `${a} × ${b}`, a: a * b } }
  const b = rand(2, 12), result = rand(2, 12); return { q: `${b * result} ÷ ${b}`, a: result }
}
function rand(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min }

let current = gen()
let revealed = false
let score = 0, total = 0

const preview = setupPreview({
  title: 'Math Drill',
  subtitle: 'Tap = reveal/next, double = skip',
  buttons: [
    { id: 'reveal', label: 'Reveal', onClick: () => act() },
    { id: 'skip', label: 'Skip', variant: 'secondary', onClick: () => skip() },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => act())
app.on('double', () => skip())

function render() {
  const body = `${current.q} = ${revealed ? current.a : '?'}\nScore: ${score}/${total}`
  preview.setContent(body)
  preview.setButtonLabel('reveal', revealed ? 'Next' : 'Reveal')
  void app.render(lines(`${current.q} = ${revealed ? current.a : '?'}`, `Score: ${score}/${total}`))
}
function act() {
  if (!revealed) { revealed = true } else { score += 1; total += 1; current = gen(); revealed = false }
  render()
}
function skip() { total += 1; current = gen(); revealed = false; render() }
render()
