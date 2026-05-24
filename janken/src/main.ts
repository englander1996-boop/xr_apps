import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const HANDS = ['Rock', 'Paper', 'Scissors'] as const
type Hand = typeof HANDS[number]
let mine: Hand = 'Rock', cpu: Hand | '' = '', result = '', w = 0, l = 0, t = 0

const preview = setupPreview({
  title: 'Janken',
  subtitle: 'Tap = cycle hand, double = commit',
  buttons: [
    { id: 'cycle', label: 'Cycle (Rock→Paper→Scissors)', onClick: () => cycle() },
    { id: 'go', label: 'Commit', variant: 'secondary', onClick: () => commit() },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => cycle())
app.on('double', () => commit())

function render() {
  const summary = cpu ? `vs ${cpu} → ${result}` : '(pick & commit)'
  preview.setContent(`You: ${mine}\n${summary}\nW${w} L${l} T${t}`)
  void app.render(lines(`You: ${mine}  ${cpu ? 'cpu: ' + cpu : ''}`, `${result}  W${w} L${l} T${t}`))
}
function cycle() { mine = HANDS[(HANDS.indexOf(mine) + 1) % 3]; cpu = ''; result = ''; render() }
function commit() {
  cpu = HANDS[Math.floor(Math.random() * 3)]
  if (mine === cpu) { result = 'TIE'; t += 1 }
  else if ((mine === 'Rock' && cpu === 'Scissors') || (mine === 'Paper' && cpu === 'Rock') || (mine === 'Scissors' && cpu === 'Paper')) { result = 'WIN'; w += 1 }
  else { result = 'LOSE'; l += 1 }
  render()
}
render()
