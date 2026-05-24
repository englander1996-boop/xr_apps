import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

let lo = 1, hi = 100, guess = 50, tries = 0, done = false

const preview = setupPreview({
  title: 'Number Guess',
  subtitle: 'Think of 1-100. Tap=higher, double=lower.',
  buttons: [
    { id: 'hi', label: 'Higher', onClick: () => higher() },
    { id: 'lo', label: 'Lower', variant: 'secondary', onClick: () => lower() },
    { id: 'reset', label: 'Reset', variant: 'secondary', onClick: () => reset() },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => higher())
app.on('double', () => lower())

function render() {
  const body = done ? `Got it: ${guess}!\nTries: ${tries}` : `Is it ${guess}?\nRange: ${lo}-${hi} · Tries: ${tries}`
  preview.setContent(body)
  void app.render(lines(done ? `Got it: ${guess}` : `Is it ${guess}?`, `Range ${lo}-${hi}  Tries ${tries}`))
}
function higher() { if (done) return reset(); lo = guess + 1; nextGuess() }
function lower() { if (done) return reset(); hi = guess - 1; nextGuess() }
function nextGuess() {
  tries += 1
  if (lo > hi) { done = true } else { guess = Math.floor((lo + hi) / 2); if (lo === hi) done = true }
  render()
}
function reset() { lo = 1; hi = 100; guess = 50; tries = 0; done = false; render() }
render()
