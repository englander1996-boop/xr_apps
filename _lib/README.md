# `_lib/` — Even G2 アプリ共通ヘルパ

`xr_apps/` 直下の自作アプリが共通で使うライブラリ。各アプリは `import` するだけで:

- Even Hub Bridge への接続 (失敗時 mock モード)
- イベント正規化 + デバウンス + 全画面不可視キャプチャ Text 自動配置 (click/double/up/down)
- ブラウザ側ミニ UI 骨格 (タイトル / ボタン / コンテンツ / Event Log)
- localStorage の JSON 入出力
- HTTP 取得 + 詳細ログ

を一括で得られる。各アプリの `src/main.ts` を 50〜150 行に収めるための「ボイラ削減装置」。

---

## ファイル構成

```
_lib/
├── package.json    # @evenrealities/even_hub_sdk を 1 回だけインストール
├── even.ts         # bridge + イベント + 描画
├── preview.ts      # ブラウザ側 UI 骨格
├── storage.ts      # localStorage ヘルパ
├── net.ts          # 詳細ログ付き fetch
├── node_modules/   # (.gitignore 対象)
└── README.md       # このファイル
```

各アプリからの import パスは `../../_lib/<name>`。例:

```ts
import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'
import { loadJson, saveJson } from '../../_lib/storage'
import { fetchJson } from '../../_lib/net'
```

even-dev の `vite.config.ts` の `server.fs.allow` がアプリ親 (`xr_apps/`) を許可するので、`xr <name>` 経由でも `_lib/` まで配信される。

---

## API リファレンス

### `even.ts`

#### `createEvenApp(options?: ConnectOptions): Promise<EvenApp>`

Bridge への接続を試み、結果として `EvenApp` オブジェクトを返す。失敗時は `bridge = null` のままで preview-only モードになる (アプリは壊れず、ブラウザ側 UI だけ動く)。

```ts
const app = await createEvenApp({
  timeoutMs: 4000,       // bridge 接続待ち上限 (デフォ 4000)
  debounceMs: 250,       // 同 kind イベント連射の抑止間隔 (デフォ 250)
  captureContainer: true // 全画面不可視キャプチャ Text を自動配置 (デフォ true)
})
```

接続が成功すると、内部で `bridge.onEvenHubEvent` が登録され、4 種のジェスチャに分類される。

#### `app.on(kind, handler)`

```ts
app.on('click',  () => { /* シングルタップ */ })
app.on('double', () => { /* ダブルタップ */ })
app.on('up',     () => { /* スクロール上 */ })
app.on('down',   () => { /* スクロール下 */ })
```

> **イベント捕捉方式**: 全画面 (576×136) の content=' ' な不可視 `TextContainerProperty` に `isEventCapture: 1` を付けて sink にしている (`containerID: 99, containerName: 'evn-capture'`)。これは公式 `even-dev/apps/hello` と同じ text-capture 方式で、4 種の入力 (click / double / scroll-up / scroll-down) が `event.textEvent.eventType` に typed な値で届く。
>
> **過去の List-capture 方式は廃止**: 以前は不可視 `ListContainerProperty` で拾っていたが、List の scroll は内部選択 index が変化したときだけ発火し、`rebuildPageContainer` が毎回 index を 0 に戻すため **up が原理的に取れない** という欠陥があった (詳細は memory `even-g2-tap-needs-list-capture`)。text-capture に切り替えて解決。`captureContainer: false` にすると capture text を置かず、入力は一切取れなくなる。

#### `app.render(textLines: LensTextLine[]): Promise<void>`

グラスにテキスト行を描画。**`captureContainer: true`** の場合、自動で全画面不可視 capture Text が `containerID: 99, containerName: 'evn-capture'` で同居する。

```ts
import { lines } from '../../_lib/even'

void app.render(lines('行1', '行2', '行3'))
```

`lines(...contents)` は文字列を `LensTextLine` 形式に変換するヘルパ (y 位置は 56px 刻みで自動配置)。レイアウトを自分で組みたい場合は `LensTextLine` を手で書く:

```ts
void app.render([
  { id: 1, name: 'row-1', content: '...', x: 8, y: 8,  width: 560, height: 48 },
  { id: 2, name: 'row-2', content: '...', x: 8, y: 60, width: 560, height: 48 },
])
```

#### `app.setLogger(logger)`

`_lib` 内部で発生したイベント受信ログを任意の logger に流す。`preview.log` を渡しておくのが定石。

```ts
app.setLogger((line) => preview.log(line))
```

#### `app.audio`

`bridge` が接続できている場合のみ存在する。マイクの開閉と PCM 受信ハンドラ登録。

```ts
if (app.audio) {
  await app.audio.open()
  const unsub = app.audio.onPcm((pcm) => { /* Uint8Array */ })
  // ... 後で
  await app.audio.close()
  unsub()
}
```

---

### `preview.ts`

#### `setupPreview(options): Preview`

ブラウザ側のミニ UI 骨格を `#app` に流し込む。タイトル / 状態 / ボタン / コンテンツ / Event Log の 4 セクション。

```ts
const preview = setupPreview({
  title: 'My App',
  subtitle: 'optional one-liner',
  buttons: [
    { id: 'go',    label: 'Action',  onClick: () => action() },
    { id: 'reset', label: 'Reset',   variant: 'secondary', onClick: () => reset() },
  ],
})
```

#### `preview.setStatus(text)` / `preview.setContent(text)` / `preview.log(line)`

それぞれ「Not connected」表示 / メインコンテンツ / Event Log を更新。

#### `preview.appendBody(html)`

`<input>` 等の追加 UI が要るときに使う。innerHTML として注入される (XSS 注意: 自分で書く HTML 限定)。

```ts
preview.appendBody(`
  <input id="my-input" type="text" placeholder="...">
  <button id="my-save">Save</button>
`)
document.getElementById('my-save')?.addEventListener('click', () => { ... })
```

#### `preview.setButtonLabel(id, label)` / `preview.setButtonEnabled(id, enabled)`

状態に応じて Start/Pause を切り替える、disabled にする等。

---

### `storage.ts`

```ts
import { loadJson, saveJson } from '../../_lib/storage'

const data = loadJson<MyType>('my-app.v1', defaultValue)
saveJson('my-app.v1', data)
```

`localStorage` の薄ラッパ。JSON.parse / stringify 失敗は無視 (古いデータ形式破棄でクラッシュしないように)。

キー命名規則: **`<app-name>.<purpose>.v<schema-version>`**。例: `pomodoro.cycles.v1`, `deadline.v1`, `coffeelog.v1`。アプリ間で衝突しないようにアプリ名を必ず prefix する。

---

### `net.ts`

#### `fetchJson<T>(url, log, options?): Promise<T | null>`

HTTP GET で JSON を取りに行く。**全リクエストの URL / レスポンスコード / バイト数 / 経過 ms / 失敗理由を logger に流す**。

```ts
const data = await fetchJson<MyResponse>(url, (l) => preview.log(l), {
  timeoutMs: 10_000,      // タイムアウト (デフォ 10s)
  headers: { Accept: 'application/json' },
})
if (!data) return  // 失敗時は null。例外は投げない
```

ログのフォーマット:

```
→ GET https://api.coingecko.com/api/v3/simple/price?...
← 200 (124B) in 287ms
```

失敗時は `← 429 Too Many Requests in 187ms` や `✗ timeout after 10003ms (> 10000ms)` のように理由が出る。

`AbortController` で timeoutMs 過ぎたら abort する。 try/catch で例外を吸って null 返却。

---

## 新規アプリでの最小骨格

```ts
import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const preview = setupPreview({
  title: 'My App',
  buttons: [
    { id: 'go', label: 'Do thing', onClick: () => action() },
  ],
})

const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')

let state = 0
app.on('click', () => action())
app.on('double', () => reset())

function action() { state += 1; render() }
function reset()  { state  = 0; render() }
function render() {
  preview.setContent(`State: ${state}`)
  void app.render(lines(`State: ${state}`))
}
render()
```

これで `xr my-app` で起動 → ブラウザ + グラスの両方に UI が出る。

---

## カスタマイズが必要になったケース

- **入力を一切取らない (表示専用)**: `createEvenApp({ captureContainer: false })` で capture Text を置かない
- **画面いっぱいに 5 行表示したい**: `lines()` ではなく自前で `LensTextLine[]` を組み立てる (y 位置 48px 刻み等)
- **画像表示したい**: `bridge.updateImageRawData(...)` を直接呼ぶ (現状 `_lib` 未対応)
- **マイクで連続録音したい**: `app.audio.onPcm(handler)` で PCM チャンクを受け、WAV ヘッダを自前で組む (`dbmeter` が参考)
- **IMU 取りたい**: `_lib` 未対応。直接 `bridge.imuControl(true, ImuReportPace.P100)` + `bridge.onEvenHubEvent` で `event.sysEvent.imuData` を拾う

---

## メンテナンス

`_lib/` を変更したら全アプリに即反映される (Vite が共有しているため)。これは便利だけど **後方互換性を壊さないよう注意**。`createEvenApp` の戻り値型に新フィールド足すのは OK、必須引数増やすのは NG (全アプリで型エラーが出る)。

`@evenrealities/even_hub_sdk` の更新は `_lib/package.json` の `latest` を一度固定にしてから `npm update` する流儀でやる:

```powershell
cd Y:\xr_apps\_lib
npm install @evenrealities/even_hub_sdk@latest
# 動作確認後 commit
```
