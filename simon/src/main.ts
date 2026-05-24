import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

type Beat = 'S' | 'D'
let seq: Beat[] = []
let inputIndex = 0
let phase: 'idle' | 'showing' | 'input' | 'lost' = 'idle'
let showing = ''
let level = 0, best = 0

const preview = setupPreview({
  title: 'Simon',
  subtitle: 'S=tap, D=double tap. Reproduce the sequence.',
  buttons: [
    { id: 'start', label: 'Start round', onClick: () => start() },
    { id: 's', label: 'Input S', variant: 'secondary', onClick: () => input('S') },
    { id: 'd', label: 'Input D', variant: 'secondary', onClick: () => input('D') },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => input('S'))
app.on('double', () => input('D'))

function render(msg = '') {
  const showText = phase === 'showing' ? `Watch: ${showing}` : phase === 'input' ? `Repeat (${inputIndex}/${seq.length})` : phase === 'lost' ? `LOST at ${level}` : 'Press Start'
  preview.setContent(`${showText}\nLevel ${level}  Best ${best}\n${msg}`)
  void app.render(lines(showText, `Level ${level}  Best ${best}`))
}

function start() {
  level = 0; seq = []; nextRound()
}
function nextRound() {
  level += 1
  seq.push(Math.random() < 0.5 ? 'S' : 'D')
  phase = 'showing'
  showing = ''
  let i = 0
  render()
  const id = setInterval(() => {
    if (i >= seq.length) { clearInterval(id); phase = 'input'; inputIndex = 0; render(); return }
    showing = seq.slice(0, i + 1).join(' ')
    i += 1
    render()
  }, 700)
}
function input(b: Beat) {
  if (phase !== 'input') return
  if (seq[inputIndex] === b) {
    inputIndex += 1
    if (inputIndex === seq.length) { if (level > best) best = level; setTimeout(nextRound, 500) }
    render()
  } else {
    phase = 'lost'; render('expected ' + seq[inputIndex] + ' got ' + b)
  }
}
render()
