import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

// 5 文字の単語リスト。answer / guess どちらにも使う (辞書チェックなし)
const WORDS = [
  'APPLE','BREAD','CHAIR','DREAM','EARTH','FIGHT','GHOST','HEART','IMAGE','JOKER',
  'KNIFE','LIGHT','MUSIC','NIGHT','OCEAN','PIANO','QUIET','RIVER','SMILE','TIGER',
  'UNCLE','VOICE','WATER','YOUNG','ZEBRA','ALPHA','BRAVE','CLOUD','DRIVE','EAGLE',
  'FRUIT','GRAPE','HONEY','INDEX','JUDGE','KARMA','LEMON','MAGIC','NOVEL','ONION',
  'PROUD','QUEEN','ROBOT','SPACE','TRUST','URGED','VIVID','WORLD','YIELD','ZONED',
  'AMBER','BLINK','CRISP','DAISY','EMPTY','FLAME','GLEAM','HASTE','IDEAL','JOLLY',
  'KITES','LATCH','MELON','NOBLE','OFTEN','POINT','QUOTE','ROYAL','SHARP','THUMB',
  'UPSET','VAPOR','WAVES','XENON','YACHT','ZESTY','ABYSS','BISON','CANDY','DROWN',
  'EXTRA','FENCE','GUEST','HUMAN','INERT','JEWEL','KNEEL','LASER','MOIST','NURSE',
  'OBOES','PIXEL','QUEST','RUSTY','SCARF','TWIST','UTTER','VAULT','WIDTH','YEAST',
] as const

const SLOTS = 5
const MAX_ROUNDS = 6
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

type Mark = 'correct' | 'present' | 'absent'
type Guess = { word: string; marks: Mark[] }

type State = {
  answer: string
  guesses: Guess[]
  letterIdx: number[]   // 各スロットの ALPHABET インデックス
  cursor: number        // 0..SLOTS-1 = letter slot、SLOTS = SUBMIT
  result: 'playing' | 'won' | 'lost'
}

const state: State = {
  answer: '',
  guesses: [],
  letterIdx: Array(SLOTS).fill(0),
  cursor: 0,
  result: 'playing',
}

const preview = setupPreview({
  title: 'Wordle',
  subtitle: 'Up/Down=slot, tap=letter+1, double=letter-1, past last slot=SUBMIT',
  buttons: [
    { id: 'sub', label: 'Submit guess', onClick: () => submit() },
    { id: 'new', label: 'New game', variant: 'secondary', onClick: () => reset() },
    { id: 'plus', label: 'Letter +1', variant: 'secondary', onClick: () => stepLetter(1) },
    { id: 'minus', label: 'Letter -1', variant: 'secondary', onClick: () => stepLetter(-1) },
    { id: 'sn', label: 'Slot →', variant: 'secondary', onClick: () => moveSlot(1) },
    { id: 'sp', label: 'Slot ←', variant: 'secondary', onClick: () => moveSlot(-1) },
  ],
})

const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('up', () => moveSlot(-1))
app.on('down', () => moveSlot(1))
app.on('click', () => {
  if (state.cursor === SLOTS) submit()
  else stepLetter(1)
})
app.on('double', () => {
  if (state.cursor === SLOTS) reset()
  else stepLetter(-1)
})

function moveSlot(delta: number): void {
  if (state.result !== 'playing') return
  const max = SLOTS  // SLOTS+1 個のカーソル位置 (0..SLOTS で SUBMIT が SLOTS)
  state.cursor = Math.max(0, Math.min(max, state.cursor + delta))
  preview.log(`cursor → slot ${state.cursor}${state.cursor === SLOTS ? ' (SUBMIT)' : ''}`)
  render()
}

function stepLetter(delta: number): void {
  if (state.result !== 'playing') return
  if (state.cursor === SLOTS) return
  const cur = state.letterIdx[state.cursor]
  state.letterIdx[state.cursor] = (cur + delta + ALPHABET.length) % ALPHABET.length
  const ch = ALPHABET[state.letterIdx[state.cursor]]
  preview.log(`slot ${state.cursor} = ${ch}`)
  render()
}

function currentWord(): string {
  return state.letterIdx.map((i) => ALPHABET[i]).join('')
}

// 標準的な Wordle マーキング: 同じ文字が答えに複数ある場合の処理に注意
function markGuess(guess: string, answer: string): Mark[] {
  const marks: Mark[] = Array(SLOTS).fill('absent')
  const answerArr = [...answer]
  // 1 周目: 完全一致 (correct) を先に判定して answerArr から消す
  for (let i = 0; i < SLOTS; i++) {
    if (guess[i] === answer[i]) { marks[i] = 'correct'; answerArr[i] = '' }
  }
  // 2 周目: 残った answerArr で present を判定
  for (let i = 0; i < SLOTS; i++) {
    if (marks[i] === 'correct') continue
    const idx = answerArr.indexOf(guess[i])
    if (idx >= 0) { marks[i] = 'present'; answerArr[idx] = '' }
  }
  return marks
}

function submit(): void {
  if (state.result !== 'playing') { preview.log('game ended, double-tap (on SUBMIT) for new game'); return }
  const guess = currentWord()
  const marks = markGuess(guess, state.answer)
  state.guesses.push({ word: guess, marks })
  preview.log(`submit "${guess}" → ${marks.map((m) => m[0]).join('')} ${state.guesses.length}/${MAX_ROUNDS}`)

  if (guess === state.answer) {
    state.result = 'won'
    preview.log(`*** WON in ${state.guesses.length} ***`)
  } else if (state.guesses.length >= MAX_ROUNDS) {
    state.result = 'lost'
    preview.log(`*** LOST: answer was ${state.answer} ***`)
  } else {
    // 次の入力用にスロット 0 へカーソル戻す
    state.cursor = 0
  }
  render()
}

function reset(): void {
  state.answer = WORDS[Math.floor(Math.random() * WORDS.length)]
  state.guesses = []
  state.letterIdx = Array(SLOTS).fill(0)
  state.cursor = 0
  state.result = 'playing'
  preview.log(`new word`)
  render()
}

function markSym(m: Mark): string {
  return m === 'correct' ? 'X' : m === 'present' ? '.' : '_'   // X=完全一致 .=位置違い _=なし
}

function render(): void {
  // 履歴
  const historyText = state.guesses.map((g) =>
    `${g.word} ${g.marks.map(markSym).join('')}`
  ).join('\n') || '(no guesses yet)'

  // 現在の入力。スロット番号にカーソル → 角括弧で囲む
  const cur = state.letterIdx.map((i, idx) => {
    const ch = ALPHABET[i]
    return idx === state.cursor ? `[${ch}]` : ` ${ch} `
  }).join('')
  const submitMarker = state.cursor === SLOTS ? ' >SUBMIT<' : '  submit'

  const status =
    state.result === 'won' ? '*** YOU WON ***' :
    state.result === 'lost' ? `*** LOST: ${state.answer} ***` :
    `Round ${state.guesses.length + 1}/${MAX_ROUNDS}`

  preview.setContent(`History:\n${historyText}\n\nCurrent: ${cur}${submitMarker}\n${status}\n\nLegend: X=correct .=present _=absent`)

  // グラス: 5 行
  void app.render(lines(
    status,
    `${cur}${submitMarker}`,
    state.guesses[0] ? `${state.guesses[0].word} ${state.guesses[0].marks.map(markSym).join('')}` : '',
    state.guesses[1] ? `${state.guesses[1].word} ${state.guesses[1].marks.map(markSym).join('')}` : '',
    state.guesses[state.guesses.length - 1] && state.guesses.length > 2
      ? `${state.guesses[state.guesses.length - 1].word} ${state.guesses[state.guesses.length - 1].marks.map(markSym).join('')}`
      : '',
  ))
}

reset()
