import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const WORDS: [string, string][] = [
  ['ubiquitous', 'どこにでもある'],
  ['ephemeral', '儚い、短命の'],
  ['perpetuate', '永続させる'],
  ['mundane', '平凡な'],
  ['quintessential', '典型的な、まさに本質の'],
  ['serendipity', '偶然の幸運'],
  ['eloquent', '雄弁な'],
  ['arduous', '困難な、骨の折れる'],
  ['conducive', '助けになる、〜に資する'],
  ['cumbersome', '面倒な、扱いにくい'],
  ['exacerbate', '悪化させる'],
  ['mitigate', '緩和する'],
  ['precarious', '不安定な、危うい'],
  ['salient', '顕著な、目立つ'],
  ['nuance', '微妙な差異'],
  ['vicarious', '間接的に体験する'],
  ['ostensible', '表向きの、見せかけの'],
  ['paradigm', 'パラダイム、枠組み'],
  ['ramification', '影響、結果'],
  ['scrutinize', '精査する'],
  ['ambivalent', '相反する感情を持つ'],
  ['caveat', '警告、ただし書き'],
  ['intricate', '複雑な、入り組んだ'],
  ['lucid', '明快な、はっきりした'],
  ['pragmatic', '実用的な'],
  ['superfluous', '余分な、不必要な'],
  ['tantamount', '〜に等しい'],
  ['veracity', '真実性'],
  ['conundrum', '難問'],
  ['amenable', '〜の気がある、従順な'],
  ['austere', '質素な、厳格な'],
  ['benign', '害のない、穏やかな'],
  ['cogent', '説得力のある'],
  ['discrepancy', '食い違い'],
  ['extant', '現存する'],
  ['hegemony', '覇権、支配'],
  ['indelible', '消えない'],
  ['juxtapose', '並置する'],
  ['myriad', '無数の'],
  ['nascent', '生まれたばかりの'],
]
let idx = 0, revealed = false

const preview = setupPreview({
  title: 'Eitan',
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
  const [w, m] = WORDS[idx]
  preview.setContent(`${w}\n${revealed ? m : '？'}\n(${idx + 1}/${WORDS.length})`)
  preview.setButtonLabel('reveal', revealed ? 'Next' : 'Reveal')
  void app.render(lines(w, revealed ? m : '？'))
}
function act() { if (!revealed) revealed = true; else { idx = (idx + 1) % WORDS.length; revealed = false }; render() }
function skip() { idx = (idx + 1) % WORDS.length; revealed = false; render() }
render()
