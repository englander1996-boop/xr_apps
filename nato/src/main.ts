import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const NATO: [string, string][] = [
  ['A', 'Alpha'], ['B', 'Bravo'], ['C', 'Charlie'], ['D', 'Delta'], ['E', 'Echo'],
  ['F', 'Foxtrot'], ['G', 'Golf'], ['H', 'Hotel'], ['I', 'India'], ['J', 'Juliett'],
  ['K', 'Kilo'], ['L', 'Lima'], ['M', 'Mike'], ['N', 'November'], ['O', 'Oscar'],
  ['P', 'Papa'], ['Q', 'Quebec'], ['R', 'Romeo'], ['S', 'Sierra'], ['T', 'Tango'],
  ['U', 'Uniform'], ['V', 'Victor'], ['W', 'Whiskey'], ['X', 'X-ray'], ['Y', 'Yankee'], ['Z', 'Zulu'],
]
let idx = 0, revealed = true

const preview = setupPreview({
  title: 'NATO Phonetic',
  subtitle: 'Tap = next, double = toggle reveal',
  buttons: [
    { id: 'next', label: 'Next', onClick: () => next() },
    { id: 'reveal', label: 'Reveal', variant: 'secondary', onClick: () => toggle() },
    { id: 'rand', label: 'Random', variant: 'secondary', onClick: () => rand() },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => next())
app.on('double', () => toggle())

function render() {
  const [k, v] = NATO[idx]
  preview.setContent(`${k} = ${revealed ? v : '?'}\n(${idx + 1}/${NATO.length})`)
  void app.render(lines(`${k} = ${revealed ? v : '?'}`, `${idx + 1}/${NATO.length}`))
}
function next() { idx = (idx + 1) % NATO.length; render() }
function toggle() { revealed = !revealed; render() }
function rand() { idx = Math.floor(Math.random() * NATO.length); revealed = false; render() }
render()
