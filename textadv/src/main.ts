import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

type Node = { text: string; a?: { label: string; to: string }; b?: { label: string; to: string } }
const STORY: Record<string, Node> = {
  start: { text: 'You wake in a dark cave.', a: { label: 'Walk forward', to: 'fork' }, b: { label: 'Stay still', to: 'still' } },
  fork: { text: 'A fork: light right, growl left.', a: { label: 'Right (light)', to: 'light' }, b: { label: 'Left (growl)', to: 'bear' } },
  still: { text: 'Hours pass. Bats fly past.', a: { label: 'Get up', to: 'fork' }, b: { label: 'Sleep', to: 'dream' } },
  light: { text: 'You emerge into a meadow. YOU LIVE.', a: { label: 'Restart', to: 'start' }, b: { label: 'Restart', to: 'start' } },
  bear: { text: 'A bear. You died.', a: { label: 'Restart', to: 'start' }, b: { label: 'Restart', to: 'start' } },
  dream: { text: 'You dream of pancakes. THE END.', a: { label: 'Restart', to: 'start' }, b: { label: 'Restart', to: 'start' } },
}

let cur = 'start'

const preview = setupPreview({
  title: 'Text Adventure',
  subtitle: 'Tap = A, double = B',
  buttons: [
    { id: 'a', label: 'A', onClick: () => choose('a') },
    { id: 'b', label: 'B', variant: 'secondary', onClick: () => choose('b') },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => choose('a'))
app.on('double', () => choose('b'))

function render() {
  const n = STORY[cur]
  const a = n.a?.label ?? ''
  const b = n.b?.label ?? ''
  preview.setContent(`${n.text}\nA: ${a}\nB: ${b}`)
  preview.setButtonLabel('a', `A: ${a}`)
  preview.setButtonLabel('b', `B: ${b}`)
  void app.render(lines(n.text, `A:${a}  B:${b}`))
}
function choose(c: 'a' | 'b') {
  const n = STORY[cur]
  const next = n[c]?.to
  if (next && STORY[next]) cur = next
  render()
}
render()
