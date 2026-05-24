import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const TIPS: [string, string][] = [
  ['.', 'any char (except newline)'],
  ['\\d', 'digit [0-9]'],
  ['\\D', 'non-digit'],
  ['\\w', 'word char [A-Za-z0-9_]'],
  ['\\s', 'whitespace'],
  ['^ / $', 'start / end of line (m flag)'],
  ['*', '0 or more (greedy)'],
  ['+', '1 or more'],
  ['?', '0 or 1'],
  ['{n,m}', 'between n and m times'],
  ['(?:...)', 'non-capturing group'],
  ['(?=...)', 'positive lookahead'],
  ['(?!...)', 'negative lookahead'],
  ['(?<=...)', 'positive lookbehind'],
  ['(?<name>...)', 'named capture group'],
  ['\\1', 'backreference to group 1'],
  ['[^abc]', 'NOT a, b, or c'],
  ['\\b', 'word boundary'],
  ['*? +? ??', 'lazy (non-greedy) quantifiers'],
]
let idx = 0
const preview = setupPreview({
  title: 'Regex',
  subtitle: 'Tap=next, double=random',
  buttons: [
    { id: 'next', label: 'Next', onClick: () => { idx = (idx + 1) % TIPS.length; render() } },
    { id: 'rand', label: 'Random', variant: 'secondary', onClick: () => { idx = Math.floor(Math.random() * TIPS.length); render() } },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => { idx = (idx + 1) % TIPS.length; render() })
app.on('double', () => { idx = Math.floor(Math.random() * TIPS.length); render() })

function render() {
  const [k, v] = TIPS[idx]
  preview.setContent(`${k}\n${v}\n(${idx + 1}/${TIPS.length})`)
  void app.render(lines(k, v))
}
render()
