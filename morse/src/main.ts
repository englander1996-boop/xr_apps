import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const MORSE: [string, string][] = [
  ['A', '.-'], ['B', '-...'], ['C', '-.-.'], ['D', '-..'], ['E', '.'], ['F', '..-.'],
  ['G', '--.'], ['H', '....'], ['I', '..'], ['J', '.---'], ['K', '-.-'], ['L', '.-..'],
  ['M', '--'], ['N', '-.'], ['O', '---'], ['P', '.--.'], ['Q', '--.-'], ['R', '.-.'],
  ['S', '...'], ['T', '-'], ['U', '..-'], ['V', '...-'], ['W', '.--'], ['X', '-..-'],
  ['Y', '-.--'], ['Z', '--..'],
  ['0', '-----'], ['1', '.----'], ['2', '..---'], ['3', '...--'], ['4', '....-'],
  ['5', '.....'], ['6', '-....'], ['7', '--...'], ['8', '---..'], ['9', '----.'],
]
let idx = 0, revealed = true

const preview = setupPreview({
  title: 'Morse',
  subtitle: 'Tap=next, double=reveal toggle',
  buttons: [
    { id: 'next', label: 'Next', onClick: () => { idx = (idx + 1) % MORSE.length; render() } },
    { id: 'reveal', label: 'Reveal', variant: 'secondary', onClick: () => { revealed = !revealed; render() } },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => { idx = (idx + 1) % MORSE.length; render() })
app.on('double', () => { revealed = !revealed; render() })

function render() {
  const [k, v] = MORSE[idx]
  preview.setContent(`${k}  →  ${revealed ? v : '?'}\n(${idx + 1}/${MORSE.length})`)
  void app.render(lines(`${k}  →  ${revealed ? v : '?'}`, `${idx + 1}/${MORSE.length}`))
}
render()
