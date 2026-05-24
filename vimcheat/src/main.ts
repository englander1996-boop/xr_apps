import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const TIPS: [string, string][] = [
  ['ciw', 'change inner word'],
  ['di"', 'delete inside double quotes'],
  ['va{', 'visual around {block}'],
  ['gg=G', 'auto-indent whole file'],
  ['Ctrl-o / Ctrl-i', 'jump back / forward'],
  ['.', 'repeat last change'],
  ['0', 'jump to start of line'],
  ['^', 'jump to first non-blank'],
  ['$', 'jump to end of line'],
  ['%', 'matching bracket'],
  ['ZZ', 'save & quit'],
  ['ZQ', 'quit without save'],
  ['/word + n / N', 'search next / prev'],
  ['*', 'search word under cursor'],
  ['qa ... q', 'record macro to a; @a to play'],
  ['Ctrl-v', 'visual block mode'],
  [':%s/a/b/g', 'replace all a with b'],
  ['gv', 'reselect last visual'],
  ['>>', 'indent current line'],
  ['Ctrl-w hjkl', 'move between splits'],
]
let idx = 0
const preview = setupPreview({
  title: 'Vim Cheat',
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
