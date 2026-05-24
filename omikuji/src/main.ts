import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const FORTUNES: [string, string][] = [
  ['大吉', '今日は最高の日。動け。'],
  ['中吉', 'よい兆し。慎重さも忘れずに。'],
  ['小吉', 'ささやかな幸運あり。'],
  ['吉', '平穏無事。'],
  ['末吉', 'これから良くなる。焦らないこと。'],
  ['凶', '無理せず休もう。'],
  ['大凶', '今日は何もしないのが正解。'],
]
let cur = '', desc = '(tap to draw)'

const preview = setupPreview({
  title: 'Omikuji',
  subtitle: 'Tap to draw',
  buttons: [{ id: 'draw', label: 'Draw', onClick: () => draw() }],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => draw())

function draw() {
  const [k, v] = FORTUNES[Math.floor(Math.random() * FORTUNES.length)]
  cur = k; desc = v; render()
}
function render() {
  preview.setContent(`${cur || '???'}\n${desc}`)
  void app.render(lines(cur || '???', desc))
}
render()
