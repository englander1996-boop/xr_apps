# hello — Even G2 最小 Hello World

Even Realities G2 グラス上に固定テキストを表示し、タップで 5 つのメッセージを循環させるだけの最小アプリ。
**Even G2 アプリの「これだけは必要」を 1 ファイルで確認するためのテンプレ** として置いてある。

## 何ができる

- グラスの 640x200 ディスプレイの中央付近に 1 行テキストを表示する
- グラスをシングルタップ → 次のメッセージへ
- グラスをダブルタップ → 1 番目のメッセージに戻る
- ブラウザ側にも同じメッセージと「Next message」ボタンを出して、グラス非接続でも UI を確認できる

メッセージ一覧は `src/main.ts` の `MESSAGES` 配列にハードコード。

## 起動

ワークスペース直下の `run.ps1` 経由：

```powershell
xr hello
```

これで Vite 開発サーバ → Even Hub Simulator が立ち上がり、シミュレータ画面にメッセージが出る。
詳しい起動フロー・トラブルシューティングは `Y:\xr_apps\README.md` を参照。

スタンドアロンでブラウザだけ確認したい場合：

```powershell
cd Y:\xr_apps\hello
npm install      # 初回のみ
npm run dev      # http://localhost:5180
```

ブラウザ単独だと Bridge への接続は失敗するが、UI の「Browser-only mode」フォールバックが効くので画面遷移は触れる。

## ファイル構成

```
hello/
├── package.json       # 依存は @evenrealities/even_hub_sdk のみ
├── app.json           # evenhub-cli pack 用メタデータ
├── index.html         # エントリ HTML
├── vite.config.ts     # 素の defineConfig（port 5180）
├── .gitignore
└── src/
    ├── main.ts        # 本体（接続・描画・イベントハンドリング・小ヘルパ全部）
    └── styles.css     # ブラウザ側 UI のダークテーマ
```

ワークスペース方針として `xr_apps/<name>/` 直下に置いているため、`even-dev/apps/_shared/` への相対 import は届かない。
このアプリでは `withTimeout` / ログ整形などの小ヘルパは `main.ts` 内にインライン化し、`_shared` 非依存にしてある。

## グラス表示の作り

`src/main.ts` の上の方にある定数で位置とサイズを決めている：

```ts
const LENS_WIDTH = 576       // G2 の表示可能幅（実機 640 - 左右マージン）
const TEXT_X = 8
const TEXT_Y = 80            // 画面の縦中央あたり
const TEXT_WIDTH = LENS_WIDTH - TEXT_X * 2
const TEXT_HEIGHT = 80
```

描画は `@evenrealities/even_hub_sdk` の 2 系統 API を使い分けている：

| タイミング        | API                                          | 役割                                       |
|------------------|----------------------------------------------|-------------------------------------------|
| 初回             | `bridge.createStartUpPageContainer(...)`     | グラス側にページコンテナを作成              |
| 2 回目以降       | `bridge.rebuildPageContainer(...)`           | 既存コンテナの中身だけ差し替え（高速）      |

`startupRendered` フラグで初回かどうかを判定している。

### タップを拾う仕組み（text-capture）

グラスからの `CLICK_EVENT` / `DOUBLE_CLICK_EVENT` / `SCROLL_*_EVENT` は、**表示用の `TextContainerProperty` 自身に `isEventCapture: 1` を付ける** だけで全部届く（公式 `even-dev/apps/hello` と同じ方式）。

```ts
textObject: [
  new TextContainerProperty({
    containerID: TEXT_CONTAINER_ID,
    containerName: TEXT_CONTAINER_NAME,
    content: text,
    xPosition: TEXT_X, yPosition: TEXT_Y,
    width: TEXT_WIDTH, height: TEXT_HEIGHT,
    isEventCapture: 1,   // ← これだけで click/double/scroll が来る
  }),
],
```

`containerTotalNum` は **1**（text だけ）。

> **以前は List 方式だった**（1×1 不可視 `ListContainerProperty` でイベントを拾う）。しかし List の scroll は内部選択 index 依存で **up が原理的に取れない** 欠陥があり、text-capture に切り替えた。`_lib/even.ts` も同じ理由で text-capture を採用している。

## イベント

```ts
bridge.onEvenHubEvent((event) => { ... })
```

`event.listEvent.eventType` / `event.textEvent.eventType` / `event.sysEvent.eventType` のどれに値が来るかはイベント源によって変わる。
さらに値の型も number / string で揺れることがあるので、SDK 同梱の `OsEventTypeList.fromJson(raw)` に通して正規化するのが安全。
このアプリの `getEventType()` がその処理。

扱っているイベント：

- `CLICK_EVENT` — シングルタップ。`messageIndex` を進める
- `DOUBLE_CLICK_EVENT` — ダブルタップ。`messageIndex = 0`

それ以外は無視（ログには残る）。

## 拡張ポイント

- **メッセージを増やす**：`MESSAGES` 配列に追加するだけ
- **複数行 / 複数要素**：`buildPayload` の `textObject` に `TextContainerProperty` を足し、`containerTotalNum` を増やす
- **スワイプにも反応**：`OsEventTypeList.SCROLL_TOP_EVENT`（up）/ `SCROLL_BOTTOM_EVENT`（down）を `handleEvent` に追加（text-capture なら typed eventType で届く）
- **見せる List UI が欲しくなったら**：本物の List を出して `isEventCapture: 1` を付ける。実装例は `even-dev/apps/timer` / `quicktest` / `base_app` が参考になる

## デプロイ（実機 G2 へ）

```powershell
cd Y:\xr_apps\hello
npm run build
npx @evenrealities/evenhub-cli pack app.json dist
# → out.ehpk
npx @evenrealities/evenhub-cli qr out.ehpk
# 出た QR コードをグラスから読む
```

`app.json` の `package_id` (`com.yuisho.hello`) と `edition` (`202601`) のスキーマ検証があるので、いじるときは `even-dev/apps/*/app.json` の値を参考にする。
