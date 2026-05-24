import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

let current = draw(), streak = 0, best = 0, lastResult = ''
function draw(): number { return Math.floor(Math.random() * 13) + 1 }

const preview = setupPreview({
  title: 'Hi-Low',
  subtitle: 'Card 1-13. Tap=Higher, Double=Lower.',
  buttons: [
    { id: 'hi', label: 'Higher', onClick: () => guess('hi') },
    { id: 'lo', label: 'Lower', variant: 'secondary', onClick: () => guess('lo') },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => guess('hi'))
app.on('double', () => guess('lo'))

function render() {
  preview.setContent(`Card: ${current}\n${lastResult}\nStreak: ${streak} (best: ${best})`)
  void app.render(lines(`Card: ${current}  ${lastResult}`, `Streak: ${streak} (best: ${best})`))
}
function guess(d: 'hi' | 'lo') {
  const next = draw()
  const won = d === 'hi' ? next > current : next < current
  const tie = next === current
  if (tie) { lastResult = `TIE (${next})`; }
  else if (won) { streak += 1; if (streak > best) best = streak; lastResult = `${d === 'hi' ? '↑' : '↓'} ${next} WIN` }
  else { lastResult = `${d === 'hi' ? '↑' : '↓'} ${next} LOSE`; streak = 0 }
  current = next
  render()
}
render()
