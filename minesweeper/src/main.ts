import { createEvenApp, type LensTextLine } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const SIZE = 4
const MINE_COUNT = 3

type Cell = { mine: boolean; revealed: boolean; nearby: number }
type Grid = Cell[][]
type State = {
  grid: Grid
  cursor: { r: number; c: number }
  result: 'playing' | 'won' | 'lost'
  revealedCount: number
}

const state: State = {
  grid: [],
  cursor: { r: 0, c: 0 },
  result: 'playing',
  revealedCount: 0,
}

const preview = setupPreview({
  title: 'Minesweeper',
  subtitle: `${SIZE}x${SIZE}, ${MINE_COUNT} mines. Scroll=row, tap=col, double=reveal`,
  buttons: [
    { id: 'up', label: '↑', onClick: () => moveCursor(-1, 0) },
    { id: 'down', label: '↓', onClick: () => moveCursor(1, 0) },
    { id: 'left', label: '←', onClick: () => moveCursor(0, -1) },
    { id: 'right', label: '→', onClick: () => moveCursor(0, 1) },
    { id: 'reveal', label: 'Reveal', variant: 'secondary', onClick: () => reveal() },
    { id: 'new', label: 'New game', variant: 'secondary', onClick: () => reset() },
  ],
})

const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('up', () => moveCursor(-1, 0))
app.on('down', () => moveCursor(1, 0))
app.on('click', () => moveCursor(0, 1))   // tap = 横移動 (折返し)
app.on('double', () => reveal())

function inBounds(r: number, c: number): boolean { return r >= 0 && r < SIZE && c >= 0 && c < SIZE }

function newGrid(): Grid {
  const g: Grid = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ mine: false, revealed: false, nearby: 0 } as Cell)))
  // 地雷をランダム配置
  let placed = 0
  while (placed < MINE_COUNT) {
    const r = Math.floor(Math.random() * SIZE), c = Math.floor(Math.random() * SIZE)
    if (!g[r][c].mine) { g[r][c].mine = true; placed += 1 }
  }
  // 各セルの隣接地雷数を計算
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    if (g[r][c].mine) continue
    let n = 0
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const rr = r + dr, cc = c + dc
      if (inBounds(rr, cc) && g[rr][cc].mine) n += 1
    }
    g[r][c].nearby = n
  }
  return g
}

function moveCursor(dr: number, dc: number): void {
  if (state.result !== 'playing') return
  let { r, c } = state.cursor
  // tap (dc=1) は折返しで次行へ。それ以外は素直に
  if (dc !== 0) {
    c += dc
    if (c >= SIZE) { c = 0; r = (r + 1) % SIZE }
    else if (c < 0) { c = SIZE - 1; r = (r - 1 + SIZE) % SIZE }
  } else if (dr !== 0) {
    r = (r + dr + SIZE) % SIZE
  }
  state.cursor = { r, c }
  render()
}

// 連鎖開示: 0 隣接セルなら周囲も自動で開ける (BFS)
function cascadeReveal(r0: number, c0: number): void {
  const queue: [number, number][] = [[r0, c0]]
  while (queue.length > 0) {
    const [r, c] = queue.shift()!
    const cell = state.grid[r][c]
    if (cell.revealed || cell.mine) continue
    cell.revealed = true
    state.revealedCount += 1
    if (cell.nearby === 0) {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue
        const rr = r + dr, cc = c + dc
        if (inBounds(rr, cc) && !state.grid[rr][cc].revealed) queue.push([rr, cc])
      }
    }
  }
}

function reveal(): void {
  if (state.result !== 'playing') { preview.log('game ended, click New game'); return }
  const { r, c } = state.cursor
  const cell = state.grid[r][c]
  if (cell.revealed) { preview.log(`(${r},${c}) already revealed`); return }

  if (cell.mine) {
    state.result = 'lost'
    cell.revealed = true
    preview.log(`*** BOOM at (${r},${c}) ***`)
    render()
    return
  }

  cascadeReveal(r, c)
  preview.log(`revealed ${state.revealedCount} cells`)
  if (state.revealedCount === SIZE * SIZE - MINE_COUNT) {
    state.result = 'won'
    preview.log('*** YOU WON ***')
  }
  render()
}

function reset(): void {
  state.grid = newGrid()
  state.cursor = { r: 0, c: 0 }
  state.result = 'playing'
  state.revealedCount = 0
  preview.log(`new game, ${MINE_COUNT} mines hidden`)
  render()
}

// 1 セルの表示。カーソル位置は [...] で囲む。
function cellText(r: number, c: number): string {
  const cell = state.grid[r][c]
  const isCursor = state.cursor.r === r && state.cursor.c === c
  let inner: string
  if (state.result === 'lost' && cell.mine) inner = '*'
  else if (!cell.revealed) inner = '·'
  else if (cell.mine) inner = '*'
  else if (cell.nearby === 0) inner = ' '
  else inner = String(cell.nearby)
  return isCursor ? `[${inner}]` : ` ${inner} `
}

function gridText(): string[] {
  const rows: string[] = []
  for (let r = 0; r < SIZE; r++) {
    rows.push(Array.from({ length: SIZE }, (_, c) => cellText(r, c)).join(''))
  }
  return rows
}

function render(): void {
  const rows = gridText()
  const status =
    state.result === 'won' ? '*** YOU WON ***' :
    state.result === 'lost' ? '*** GAME OVER ***' :
    `Revealed ${state.revealedCount}/${SIZE * SIZE - MINE_COUNT}  Cursor(${state.cursor.r},${state.cursor.c})`

  preview.setContent(`${rows.join('\n')}\n${status}\n\nLegend: ·=hidden  digit=adj mines  *=mine  [ ]=cursor`)

  // グラス: 4 行のグリッド + 1 行ステータス
  const lensLines: LensTextLine[] = [
    ...rows.map((row, i) => ({
      id: i + 1,
      name: `row-${i + 1}`,
      content: row,
      x: 8,
      y: 8 + i * 50,
      width: 560,
      height: 48,
    })),
    {
      id: 5,
      name: 'status',
      content: status,
      x: 8,
      y: 8 + 4 * 50,
      width: 560,
      height: 48,
    },
  ]
  void app.render(lensLines)
}

reset()
