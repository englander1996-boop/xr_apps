import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const PI = '3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982148086513282306647093844609550582231725359408128481117450284102701938521105559644622948954930381964428810975665933446128475648233786783165271201909145648566923460348610454326648213393607260249141273724587006606315588174881520920962829254091715364367892590360011330530548820466521384146951941511609'
const KEY = 'pi.revealed.v1'
import { loadJson, saveJson } from '../../_lib/storage'
let revealed: number = loadJson(KEY, 5)

const preview = setupPreview({
  title: 'Pi',
  subtitle: 'Tap=show one more digit, double=hide last',
  buttons: [
    { id: 'more', label: 'Show next digit', onClick: () => more() },
    { id: 'less', label: 'Hide last', variant: 'secondary', onClick: () => less() },
    { id: 'reset', label: 'Reset to 5', variant: 'secondary', onClick: () => reset() },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => more())
app.on('double', () => less())

function display(): string {
  const r = Math.min(revealed, PI.length)
  return PI.slice(0, r)
}
function render() {
  preview.setContent(`${display()}\n(${revealed} digits)`)
  void app.render(lines(display(), `${revealed} digits`))
}
function more() { revealed = Math.min(PI.length, revealed + 1); saveJson(KEY, revealed); render() }
function less() { revealed = Math.max(2, revealed - 1); saveJson(KEY, revealed); render() }
function reset() { revealed = 5; saveJson(KEY, revealed); render() }
render()
