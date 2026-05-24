import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

let result = '-', sides = 6, history: number[] = []

const preview = setupPreview({
  title: 'Dice',
  subtitle: 'Tap=d6, Double=d20',
  buttons: [
    { id: 'd4', label: 'd4', onClick: () => roll(4) },
    { id: 'd6', label: 'd6', onClick: () => roll(6) },
    { id: 'd8', label: 'd8', onClick: () => roll(8) },
    { id: 'd10', label: 'd10', onClick: () => roll(10) },
    { id: 'd12', label: 'd12', variant: 'secondary', onClick: () => roll(12) },
    { id: 'd20', label: 'd20', variant: 'secondary', onClick: () => roll(20) },
    { id: 'd100', label: 'd100', variant: 'secondary', onClick: () => roll(100) },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => roll(6))
app.on('double', () => roll(20))

function roll(s: number) {
  sides = s
  const n = Math.floor(Math.random() * s) + 1
  result = String(n)
  history.unshift(n)
  if (history.length > 5) history.pop()
  render()
}
function render() {
  preview.setContent(`d${sides}: ${result}\nLast 5: ${history.join(' ') || '-'}`)
  void app.render(lines(`d${sides}: ${result}`, `Last: ${history.join(' ') || '-'}`))
}
render()
