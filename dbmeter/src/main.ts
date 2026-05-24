import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

let opened = false
let lastDb = -Infinity, peak = -Infinity

const preview = setupPreview({
  title: 'dB Meter',
  subtitle: 'Tap = open mic, double = close',
  buttons: [
    { id: 'open', label: 'Open mic', onClick: () => openMic() },
    { id: 'close', label: 'Close mic', variant: 'secondary', onClick: () => closeMic() },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => openMic())
app.on('double', () => closeMic())

// 16-bit signed PCM little-endian assumption (一般的). 違えば調整が必要。
function pcmToDb(pcm: Uint8Array): number {
  if (pcm.length < 2) return -Infinity
  const view = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength)
  const samples = Math.floor(pcm.length / 2)
  let sumSq = 0
  for (let i = 0; i < samples; i += 1) {
    const s = view.getInt16(i * 2, true) / 32768
    sumSq += s * s
  }
  const rms = Math.sqrt(sumSq / samples)
  if (rms === 0) return -Infinity
  return 20 * Math.log10(rms)
}

function bar(db: number): string {
  if (!Number.isFinite(db)) return '░'.repeat(20)
  const filled = Math.max(0, Math.min(20, Math.round((db + 60) / 3)))
  return '█'.repeat(filled) + '░'.repeat(20 - filled)
}

function render() {
  const dbStr = Number.isFinite(lastDb) ? `${lastDb.toFixed(1)} dBFS` : '-'
  const pkStr = Number.isFinite(peak) ? `${peak.toFixed(1)}` : '-'
  preview.setContent(`${dbStr}\n${bar(lastDb)}\nPeak ${pkStr}  ${opened ? 'MIC ON' : 'MIC OFF'}`)
  void app.render(lines(`${dbStr}  ${bar(lastDb)}`, `Peak ${pkStr}  ${opened ? 'ON' : 'OFF'}`))
}

if (app.audio) {
  app.audio.onPcm((pcm) => {
    const db = pcmToDb(pcm)
    if (Number.isFinite(db)) { lastDb = db; if (db > peak) peak = db; render() }
  })
}

async function openMic() {
  if (!app.audio) { preview.log('audio API unavailable (no bridge)'); return }
  const ok = await app.audio.open()
  opened = ok; render()
  preview.log(`audio open → ${ok}`)
}
async function closeMic() {
  if (!app.audio) return
  await app.audio.close()
  opened = false; render()
}
render()
