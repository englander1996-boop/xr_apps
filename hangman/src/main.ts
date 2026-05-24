import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const WORDS = [
  'JAVASCRIPT', 'TYPESCRIPT', 'KEYBOARD', 'MONITOR', 'COMPUTER',
  'GLASSES', 'COFFEE', 'PROGRAM', 'FUNCTION', 'VARIABLE',
  'TERMINAL', 'BROWSER', 'NETWORK', 'PROTOCOL', 'ENCODING',
  'MOUNTAIN', 'OCEAN', 'GUITAR', 'LIBRARY', 'KITCHEN',
  'PUZZLE', 'WIZARD', 'OXYGEN', 'GALAXY', 'ICEBERG',
  'JOURNEY', 'KETTLE', 'LANTERN', 'MUSEUM', 'NEEDLE',
  'OUTPUT', 'PIRATE', 'QUARTZ', 'RABBIT', 'SHADOW',
  'TIGER', 'UNICORN', 'VINEGAR', 'WHISTLE', 'XYLOPHONE',
] as const

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const MAX_WRONG = 6

type State = {
  answer: string
  guessed: Set<string>
  wrongs: number
  cursor: number   // 0..25
  result: 'playing' | 'won' | 'lost'
}

const state: State = {
  answer: '',
  guessed: new Set(),
  wrongs: 0,
  cursor: 0,
  result: 'playing',
}

const preview = setupPreview({
  title: 'Hangman',
  subtitle: 'Scroll = move letter cursor, tap = commit, double = new game',
  buttons: [
    { id: 'left', label: '◀ Cursor', onClick: () => moveCursor(-1) },
    { id: 'right', label: 'Cursor ▶', onClick: () => moveCursor(1) },
    { id: 'commit', label: 'Commit', variant: 'secondary', onClick: () => commit() },
    { id: 'new', label: 'New game', variant: 'secondary', onClick: () => reset() },
  ],
})

const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('up', () => moveCursor(-1))
app.on('down', () => moveCursor(1))
app.on('click', () => commit())
app.on('double', () => reset())

function moveCursor(delta: number): void {
  state.cursor = (state.cursor + delta + ALPHABET.length) % ALPHABET.length
  preview.log(`cursor → ${ALPHABET[state.cursor]}`)
  render()
}

function commit(): void {
  if (state.result !== 'playing') { preview.log('game ended, double-tap for new game'); return }
  const letter = ALPHABET[state.cursor]
  if (state.guessed.has(letter)) { preview.log(`${letter} already guessed`); return }
  state.guessed.add(letter)

  if (state.answer.includes(letter)) {
    preview.log(`✓ ${letter} hit`)
    if (allRevealed()) { state.result = 'won'; preview.log(`*** WON: ${state.answer} ***`) }
  } else {
    state.wrongs += 1
    preview.log(`✗ ${letter} miss (${state.wrongs}/${MAX_WRONG})`)
    if (state.wrongs >= MAX_WRONG) { state.result = 'lost'; preview.log(`*** LOST: answer was ${state.answer} ***`) }
  }
  render()
}

function allRevealed(): boolean {
  return [...state.answer].every((ch) => state.guessed.has(ch))
}

function maskedAnswer(): string {
  return [...state.answer].map((ch) => state.guessed.has(ch) ? ch : '_').join(' ')
}

function reset(): void {
  state.answer = WORDS[Math.floor(Math.random() * WORDS.length)]
  state.guessed = new Set()
  state.wrongs = 0
  state.cursor = 0
  state.result = 'playing'
  preview.log(`new word (${state.answer.length} letters)`)
  render()
}

// アルファベット表示。カーソル位置は [X] で囲む。
function alphabetDisplay(): string {
  return [...ALPHABET].map((ch, i) => {
    if (i === state.cursor) return `[${ch}]`
    if (state.guessed.has(ch)) return state.answer.includes(ch) ? ch : '·'  // 既に推測済み: ヒットならそのまま、ミスなら中点
    return ch
  }).join('')
}

function render(): void {
  const word = maskedAnswer()
  const wrongLetters = [...state.guessed].filter((ch) => !state.answer.includes(ch)).join(',')
  const status =
    state.result === 'won' ? '*** YOU WON ***' :
    state.result === 'lost' ? `*** LOST: ${state.answer} ***` :
    `Tries: ${state.wrongs}/${MAX_WRONG}`

  preview.setContent(`Word:  ${word}\nMisses: ${wrongLetters || '-'}\nCursor: ${ALPHABET[state.cursor]}\n${alphabetDisplay()}\n${status}`)

  // グラス: 4 行構成
  void app.render(lines(
    `${word}`,
    `Cursor:[${ALPHABET[state.cursor]}]  Tries ${state.wrongs}/${MAX_WRONG}`,
    alphabetDisplay(),
    status,
  ))
}

reset()
