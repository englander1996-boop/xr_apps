import { createEvenApp, type LensTextLine } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'
import { loadJson, saveJson } from '../../_lib/storage'

const SIZE = 4
const KEY_BEST = '2048.best.v1'

type Cell = number | null   // null = 空マス
type Grid = Cell[][]
type Dir = 'up' | 'down' | 'left' | 'right'

// =================== 状態 ===================
let grid: Grid = emptyGrid()
let score = 0
let best: number = loadJson(KEY_BEST, 0)
let won = false   // 2048 タイルが出現したか
let lost = false  // これ以上動かせないか
let lastMove = '-'

// =================== UI ===================
const preview = setupPreview({
  title: '2048',
  subtitle: 'Tap=→ / Double=← / Scroll up=↑ / Scroll down=↓',
  buttons: [
    { id: 'up', label: '↑ Up', onClick: () => move('up') },
    { id: 'down', label: '↓ Down', onClick: () => move('down') },
    { id: 'left', label: '← Left', onClick: () => move('left') },
    { id: 'right', label: '→ Right', onClick: () => move('right') },
    { id: 'new', label: 'New game', variant: 'secondary', onClick: () => reset() },
  ],
})

const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => move('right'))
app.on('double', () => move('left'))
app.on('up', () => move('up'))
app.on('down', () => move('down'))

// =================== ロジック ===================
function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(null))
}

// 空セルにランダムで 2 or 4 を 1 つ出す (10% で 4)
function spawn(): boolean {
  const empties: [number, number][] = []
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c] === null) empties.push([r, c])
  if (empties.length === 0) return false
  const [r, c] = empties[Math.floor(Math.random() * empties.length)]
  grid[r][c] = Math.random() < 0.1 ? 4 : 2
  return true
}

// 1 行を「左にスライドして合体」した結果を返す。スコア差分も返す。
function slideLeft(row: Cell[]): { row: Cell[]; gained: number; changed: boolean } {
  // 1. null を取り除き値だけ並べる
  const compact = row.filter((v): v is number => v !== null)
  // 2. 隣同士で同じ値なら合体
  const merged: number[] = []
  let gained = 0
  for (let i = 0; i < compact.length; i++) {
    if (i + 1 < compact.length && compact[i] === compact[i + 1]) {
      const v = compact[i] * 2
      merged.push(v)
      gained += v
      if (v === 2048) won = true
      i++   // 合体に使ったぶんスキップ
    } else {
      merged.push(compact[i])
    }
  }
  // 3. null で埋め直して SIZE 長に揃える
  const out: Cell[] = [...merged, ...Array<Cell>(SIZE - merged.length).fill(null)]
  // 4. 変化があったかを判定 (元行と比較)
  const changed = out.some((v, i) => v !== row[i])
  return { row: out, gained, changed }
}

// 「全方向 = 左スライドに正規化」のため、向きに応じて行を反転/転置する
function rotateForMove(dir: Dir, fromGrid: Grid): Grid {
  if (dir === 'left') return fromGrid.map((r) => [...r])
  if (dir === 'right') return fromGrid.map((r) => [...r].reverse())
  if (dir === 'up') {
    // 転置して列を行にする (上に詰めるのが左スライドになる)
    const out = emptyGrid()
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) out[c][r] = fromGrid[r][c]
    return out
  }
  // down: 転置 + 反転
  const out = emptyGrid()
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) out[c][SIZE - 1 - r] = fromGrid[r][c]
  return out
}
function rotateBack(dir: Dir, fromGrid: Grid): Grid {
  if (dir === 'left') return fromGrid.map((r) => [...r])
  if (dir === 'right') return fromGrid.map((r) => [...r].reverse())
  if (dir === 'up') {
    const out = emptyGrid()
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) out[c][r] = fromGrid[r][c]
    return out
  }
  const out = emptyGrid()
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) out[SIZE - 1 - c][r] = fromGrid[r][c]
  return out
}

function move(dir: Dir): void {
  if (lost) { preview.log('move blocked (game over). New game?'); return }
  // 1. 向きに応じて回転して左スライドに正規化
  const rotated = rotateForMove(dir, grid)
  // 2. 各行を左スライド
  let totalGained = 0
  let anyChanged = false
  const after = rotated.map((row) => {
    const r = slideLeft(row)
    totalGained += r.gained
    if (r.changed) anyChanged = true
    return r.row
  })
  if (!anyChanged) {
    preview.log(`move ${dir}: no change`)
    return
  }
  // 3. 戻して反映
  grid = rotateBack(dir, after)
  score += totalGained
  if (score > best) { best = score; saveJson(KEY_BEST, best) }
  lastMove = dir
  preview.log(`move ${dir}: +${totalGained}, score=${score}${won ? ', WON!' : ''}`)
  // 4. 新タイル出現
  spawn()
  // 5. 詰みチェック
  if (!hasMoves()) { lost = true; preview.log('GAME OVER (no moves)') }
  render()
}

function hasMoves(): boolean {
  // 空マスがあれば必ず動ける
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c] === null) return true
  // 隣同士に同値があれば合体できる
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return true
    if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return true
  }
  return false
}

function reset(): void {
  grid = emptyGrid()
  score = 0
  won = false
  lost = false
  lastMove = '-'
  spawn()
  spawn()
  preview.log('new game')
  render()
}

// =================== 描画 ===================
function fmtCell(v: Cell): string {
  if (v === null) return '   .'   // 空マス
  return v.toString().padStart(4, ' ')
}
function rowText(row: Cell[]): string {
  return row.map(fmtCell).join(' ')
}

function render(): void {
  // ブラウザ側: グリッド + スコア
  const rows = grid.map(rowText).join('\n')
  const status = lost ? '*** GAME OVER ***' : won ? '*** YOU WIN! ***' : `last: ${lastMove}`
  preview.setContent(`${rows}\n\nScore: ${score}  Best: ${best}\n${status}`)

  // グラス側: 4 行のグリッド + 1 行のスコア = 5 行
  const lensLines: LensTextLine[] = [
    ...grid.map((row, i) => ({
      id: i + 1,
      name: `row-${i + 1}`,
      content: rowText(row),
      x: 8,
      y: 8 + i * 50,
      width: 560,
      height: 48,
    })),
    {
      id: 5,
      name: 'score',
      content: `S:${score} B:${best} ${lost ? 'OVER' : won ? 'WIN' : ''}`,
      x: 8,
      y: 8 + 4 * 50,
      width: 560,
      height: 48,
    },
  ]
  void app.render(lensLines)
}

// =================== 起動 ===================
reset()
