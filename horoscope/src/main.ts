import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'
import { loadJson, saveJson } from '../../_lib/storage'

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
const MESSAGES = [
  'Take the longer route today.',
  "Don't reply to that DM until tomorrow.",
  'A small purchase brings disproportionate joy.',
  'Someone you trust is overthinking. Be patient.',
  'Re-read something from a year ago.',
  'Eat the thing you keep postponing.',
  'A boring win is still a win.',
  'Energy is high. Spend it on people.',
  'Energy is low. Spend it alone.',
  'Be early.',
  'Be late.',
  'Compliment someone unexpectedly.',
  'A loose end resolves itself.',
  'Refuse one small obligation.',
  'You will lose to a tie.',
]

let sign: string = loadJson('horoscope.sign.v1', SIGNS[0])

function hash(s: string): number {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h)
}
function todayMsg(): string {
  const key = sign + '|' + new Date().toISOString().slice(0, 10)
  return MESSAGES[hash(key) % MESSAGES.length]
}

const preview = setupPreview({
  title: 'Horoscope',
  subtitle: 'Tap=cycle sign',
  buttons: [
    { id: 'cycle', label: 'Cycle sign', onClick: () => cycle() },
  ],
})
preview.appendBody(`<label style="display:block;font-size:12px;color:#888;margin-bottom:4px;">Save current sign</label>`)
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => cycle())

function render() {
  preview.setContent(`${sign}\n${todayMsg()}`)
  void app.render(lines(sign, todayMsg()))
}
function cycle() {
  sign = SIGNS[(SIGNS.indexOf(sign) + 1) % SIGNS.length]
  saveJson('horoscope.sign.v1', sign)
  render()
}
render()
