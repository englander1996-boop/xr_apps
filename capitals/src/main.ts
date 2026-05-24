import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const C: [string, string][] = [
  ['Japan','Tokyo'],['South Korea','Seoul'],['China','Beijing'],['India','New Delhi'],['Thailand','Bangkok'],['Vietnam','Hanoi'],['Indonesia','Jakarta'],['Philippines','Manila'],
  ['Australia','Canberra'],['New Zealand','Wellington'],['USA','Washington D.C.'],['Canada','Ottawa'],['Mexico','Mexico City'],['Brazil','Brasilia'],['Argentina','Buenos Aires'],
  ['UK','London'],['France','Paris'],['Germany','Berlin'],['Spain','Madrid'],['Italy','Rome'],['Portugal','Lisbon'],['Netherlands','Amsterdam'],['Belgium','Brussels'],
  ['Switzerland','Bern'],['Austria','Vienna'],['Sweden','Stockholm'],['Norway','Oslo'],['Finland','Helsinki'],['Denmark','Copenhagen'],['Iceland','Reykjavík'],
  ['Russia','Moscow'],['Ukraine','Kyiv'],['Poland','Warsaw'],['Greece','Athens'],['Turkey','Ankara'],['Egypt','Cairo'],['South Africa','Pretoria'],['Kenya','Nairobi'],
  ['Nigeria','Abuja'],['Saudi Arabia','Riyadh'],['UAE','Abu Dhabi'],['Israel','Jerusalem'],['Iran','Tehran'],['Pakistan','Islamabad'],['Bangladesh','Dhaka'],['Malaysia','Kuala Lumpur'],
  ['Singapore','Singapore'],['Mongolia','Ulaanbaatar'],['Czechia','Prague'],['Hungary','Budapest'],['Ireland','Dublin'],['Chile','Santiago'],['Peru','Lima'],
]
let idx = 0, revealed = false

const preview = setupPreview({
  title: 'Capitals',
  subtitle: 'Tap=reveal/next, double=next without reveal',
  buttons: [
    { id: 'reveal', label: 'Reveal', onClick: () => act() },
    { id: 'skip', label: 'Skip', variant: 'secondary', onClick: () => skip() },
    { id: 'rand', label: 'Random', variant: 'secondary', onClick: () => rand() },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => act())
app.on('double', () => skip())

function render() {
  const [country, capital] = C[idx]
  preview.setContent(`${country}\n→ ${revealed ? capital : '?'}\n(${idx + 1}/${C.length})`)
  preview.setButtonLabel('reveal', revealed ? 'Next' : 'Reveal')
  void app.render(lines(country, `→ ${revealed ? capital : '?'}`))
}
function act() { if (!revealed) { revealed = true } else { idx = (idx + 1) % C.length; revealed = false }; render() }
function skip() { idx = (idx + 1) % C.length; revealed = false; render() }
function rand() { idx = Math.floor(Math.random() * C.length); revealed = false; render() }
render()
