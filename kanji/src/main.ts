import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const KANJI: [string, string, string][] = [
  ['薔薇', 'ばら', 'rose'],
  ['檸檬', 'レモン', 'lemon'],
  ['鬱', 'うつ', 'depression / gloom'],
  ['憂鬱', 'ゆううつ', 'melancholy'],
  ['朧月夜', 'おぼろづきよ', 'misty moonlit night'],
  ['雪洞', 'ぼんぼり', 'paper lantern'],
  ['天邪鬼', 'あまのじゃく', 'contrarian'],
  ['御御御付', 'おみおつけ', 'miso soup'],
  ['流石', 'さすが', 'as expected'],
  ['玄人', 'くろうと', 'expert / pro'],
  ['素人', 'しろうと', 'amateur / novice'],
  ['麒麟', 'きりん', 'giraffe / kirin'],
  ['鸚鵡', 'おうむ', 'parrot'],
  ['蜻蛉', 'とんぼ', 'dragonfly'],
  ['蟋蟀', 'こおろぎ', 'cricket'],
  ['礎', 'いしずえ', 'foundation stone'],
  ['烏龍茶', 'ウーロンちゃ', 'oolong tea'],
  ['薬缶', 'やかん', 'kettle'],
  ['寿司', 'すし', 'sushi'],
  ['饂飩', 'うどん', 'udon'],
]
let idx = 0, revealed = false

const preview = setupPreview({
  title: 'Kanji',
  subtitle: 'Tap=reveal/next, double=skip',
  buttons: [
    { id: 'reveal', label: 'Reveal', onClick: () => act() },
    { id: 'skip', label: 'Skip', variant: 'secondary', onClick: () => skip() },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => act())
app.on('double', () => skip())

function render() {
  const [k, r, m] = KANJI[idx]
  preview.setContent(`${k}\n${revealed ? `${r} — ${m}` : '？'}\n(${idx + 1}/${KANJI.length})`)
  preview.setButtonLabel('reveal', revealed ? 'Next' : 'Reveal')
  void app.render(lines(k, revealed ? `${r}  ${m}` : '？'))
}
function act() { if (!revealed) revealed = true; else { idx = (idx + 1) % KANJI.length; revealed = false }; render() }
function skip() { idx = (idx + 1) % KANJI.length; revealed = false; render() }
render()
