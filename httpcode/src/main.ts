import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const CODES: [number, string, string][] = [
  [100, 'Continue', 'client may continue'],
  [200, 'OK', 'request succeeded'],
  [201, 'Created', 'new resource created'],
  [202, 'Accepted', 'queued for processing'],
  [204, 'No Content', 'success, no body'],
  [301, 'Moved Permanently', 'resource permanently relocated'],
  [302, 'Found', 'temporary redirect'],
  [304, 'Not Modified', 'cached copy is fresh'],
  [307, 'Temporary Redirect', 'method preserved'],
  [308, 'Permanent Redirect', 'method preserved'],
  [400, 'Bad Request', 'malformed syntax'],
  [401, 'Unauthorized', 'authentication required'],
  [403, 'Forbidden', 'auth ok but not allowed'],
  [404, 'Not Found', 'resource does not exist'],
  [405, 'Method Not Allowed', 'verb not supported here'],
  [409, 'Conflict', 'state collision'],
  [410, 'Gone', 'permanently removed'],
  [418, "I'm a Teapot", 'short and stout'],
  [422, 'Unprocessable Entity', 'semantic errors'],
  [429, 'Too Many Requests', 'rate limited'],
  [500, 'Internal Server Error', 'unhandled exception'],
  [502, 'Bad Gateway', 'upstream returned invalid response'],
  [503, 'Service Unavailable', 'overloaded or down for maintenance'],
  [504, 'Gateway Timeout', 'upstream timed out'],
]
let idx = 0
const preview = setupPreview({
  title: 'HTTP Codes',
  subtitle: 'Tap=next, double=random',
  buttons: [
    { id: 'next', label: 'Next', onClick: () => { idx = (idx + 1) % CODES.length; render() } },
    { id: 'rand', label: 'Random', variant: 'secondary', onClick: () => { idx = Math.floor(Math.random() * CODES.length); render() } },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => { idx = (idx + 1) % CODES.length; render() })
app.on('double', () => { idx = Math.floor(Math.random() * CODES.length); render() })

function render() {
  const [n, name, desc] = CODES[idx]
  preview.setContent(`${n}  ${name}\n${desc}`)
  void app.render(lines(`${n}  ${name}`, desc))
}
render()
