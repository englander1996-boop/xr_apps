import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const QUOTES: [string, string][] = [
  ['"The only way to do great work is to love what you do."', 'Steve Jobs'],
  ['"In the middle of difficulty lies opportunity."', 'Albert Einstein'],
  ['"Done is better than perfect."', 'Sheryl Sandberg'],
  ['"Premature optimization is the root of all evil."', 'Donald Knuth'],
  ['"Talk is cheap. Show me the code."', 'Linus Torvalds'],
  ['"Simplicity is the ultimate sophistication."', 'da Vinci'],
  ['"First, solve the problem. Then, write the code."', 'John Johnson'],
  ['"It always seems impossible until it is done."', 'Nelson Mandela'],
  ['"The unexamined life is not worth living."', 'Socrates'],
  ['"We are what we repeatedly do."', 'Aristotle'],
  ['"Be yourself; everyone else is taken."', 'Oscar Wilde'],
  ['"Tomorrow is the most important thing in life."', 'John Wayne'],
  ['"Whether you think you can or you think you can\'t, you\'re right."', 'Henry Ford'],
  ['"Stay hungry, stay foolish."', 'Whole Earth Catalog'],
  ['"急がば回れ"', '日本のことわざ'],
  ['"継続は力なり"', '日本のことわざ'],
]
let idx = 0
const preview = setupPreview({
  title: 'Quote',
  subtitle: 'Tap=next, double=random',
  buttons: [
    { id: 'next', label: 'Next', onClick: () => { idx = (idx + 1) % QUOTES.length; render() } },
    { id: 'rand', label: 'Random', variant: 'secondary', onClick: () => { idx = Math.floor(Math.random() * QUOTES.length); render() } },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => { idx = (idx + 1) % QUOTES.length; render() })
app.on('double', () => { idx = Math.floor(Math.random() * QUOTES.length); render() })

function render() {
  const [q, who] = QUOTES[idx]
  preview.setContent(`${q}\n— ${who}`)
  void app.render(lines(q, `— ${who}`))
}
render()
