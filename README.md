# xr_apps — Even G2 開発ワークスペース

[Even Realities G2](https://www.evenrealities.com/) スマートグラス向けアプリを開発するための個人ワークスペース。
[even-dev](https://github.com/even-dev) ランチャーフレームワークを土台に、自作アプリをワークスペース直下に並べて管理する構成にしてある。

```
xr_apps/  ← ワークスペースルート（git 管理外）
  ├── even-dev/    ← ランチャー本体（clone した OSS）
  ├── sandbox/     ← 自作アプリ #1
  ├── <next-app>/  ← 以降の自作アプリはここに並ぶ
  ├── run.ps1      ← PowerShell ネイティブランチャー
  └── README.md    ← このファイル
```

---

## 目次

- [ワークスペースの方針](#ワークスペースの方針)
- [技術スタック](#技術スタック)
- [クイックスタート](#クイックスタート)
- [ランチャー xr の使い方](#ランチャー-xr-の使い方)
- [新しいアプリを追加する](#新しいアプリを追加する)
- [アプリの最小構成](#アプリの最小構成)
- [even-dev の中身ガイド](#even-dev-の中身ガイド)
- [ビルドとパッケージング](#ビルドとパッケージング)
- [トラブルシューティング](#トラブルシューティング)
- [新しいマシンへの移行](#新しいマシンへの移行)

---

## ワークスペースの方針

### 自作アプリは `xr_apps` 直下に置く

even-dev の慣習どおりに `even-dev/apps/<name>/` に置くと、自分の作業対象が「他人の OSS の中の `apps/` フォルダのさらに中」に埋もれてしまい、エクスプローラでもエディタでも触りづらい。

そこで `even-dev/apps.json` の **ローカルパス対応** を使って、アプリ本体は `xr_apps/<name>/` に置き、`apps.json` には相対パスで登録する：

```jsonc
// even-dev/apps.json
{
  "sandbox": "../sandbox",         // ← 自作アプリ（xr_apps 直下を指す）
  "chess":   "https://github.com/dmyster145/EvenChess",
  ...
}
```

これは even-dev が公式にサポートしている形式（README 内 "Local paths – resolved relative to the even-dev root"）なので、ハックではない。
`even-dev/apps/` 配下を一切汚さないので、even-dev 側を `git pull` してもコンフリクトしない。

### ランチャーは PowerShell ネイティブ

even-dev 本体は `start-even.sh`（bash, 709 行）で起動するが、Windows 環境では Git Bash や WSL への依存を避けたいため、必要な部分だけ抜き出した **PowerShell 版ランチャー** (`run.ps1`) を用意してある。これにより：

- どの Windows マシンでも PowerShell + Node.js さえあれば動く
- どこからでも `xr <app>` で起動できる（PROFILE 経由）

`start-even.sh` の `--update` / `--reset` / `--evenhub-cli` 等の大物機能は今のところ移植していない（必要になったら足す）。基本動線（vite 起動 → simulator 起動）だけカバー。

---

## 技術スタック

| カテゴリ        | ツール / バージョン                                     | 役割                                                                 |
|-----------------|--------------------------------------------------------|----------------------------------------------------------------------|
| Runtime         | Node.js v24+                                           | アプリ実行・ツールチェイン                                            |
| 言語            | TypeScript ^5.9                                        | 全アプリ・プラグインの実装言語                                        |
| バンドラ        | [Vite](https://vitejs.dev/) ^7.3                       | 開発サーバ・HMR・ビルド                                               |
| グラス SDK      | `@evenrealities/even_hub_sdk`                          | Even Hub ブリッジ経由でグラスに UI / イベントをやりとりする公式 SDK   |
| パッケージング  | `@evenrealities/evenhub-cli`                           | `.ehpk` 形式でアプリを梱包・Even Hub にデプロイする公式 CLI           |
| シミュレータ    | `@evenrealities/evenhub-simulator`                     | グラス実機の代わりにデスクトップ上で UI を確認できるシミュレータ      |
| 補助 SDK        | `@jappyjan/even-better-sdk`                            | コミュニティ製の使いやすいラッパ SDK                                  |
| UI コンポーネント | `@jappyjan/even-realities-ui`                        | 設定画面などで使えるコミュニティ製 UI コンポーネント集                |
| ランチャー      | PowerShell 5.1+ (`run.ps1`)                            | アプリ選択・vite と simulator の起動・終了時のプロセス tree kill      |

### グラス側通信のフロー

```
[ブラウザの index.html]  ← Vite 開発サーバが配信
    ↓ TypeScript
[@evenrealities/even_hub_sdk]
    ↓ waitForEvenAppBridge()
[Even Hub Bridge (WebSocket的なやつ)]
    ↓
[Even Hub Simulator (or 実機)]  ← npx で起動、URL を引数に取る
    ↓
[グラスの 640x200 ディスプレイ]
```

開発時は **実機接続 / Simulator** のどちらでも同じコードが走る。`bridge.sendStartUpPage(container)` でグラス側に UI を流し、`bridge.onEvenHubEvent(cb)` でタップ・スワイプ等のイベントを受ける。

---

## クイックスタート

### 前提

- Windows 10/11
- [Node.js](https://nodejs.org/) v20+（推奨 v24+）
- PowerShell 5.1+（Windows 標準）
- `Y:\xr_apps\` 配下に `even-dev` と `run.ps1` が配置済み（このリポジトリ）
- PowerShell の `$PROFILE` に `function xr { & Y:\xr_apps\run.ps1 @args }` が登録済み

### sandbox を起動する

新しい PowerShell ウィンドウで、どのディレクトリにいても：

```powershell
xr sandbox
```

これだけで：

1. （初回のみ）`even-dev/` と `sandbox/` の `npm install` が走る
2. Vite 開発サーバが `http://127.0.0.1:5173` で立ち上がる
3. 起動完了を待って Even Hub Simulator が同 URL を指して起動する
4. シミュレータ画面に sandbox の UI が表示される
5. ターミナルで `Ctrl+C` するか Simulator を閉じると、Vite も自動で停止する

引数なし `xr` で対話的にアプリ選択ができる。

---

## ランチャー `xr` の使い方

実体は `Y:\xr_apps\run.ps1`。PowerShell プロファイル経由で `xr` というショート名で呼べる。

### コマンド一覧

| コマンド                | 動作                                                          |
|------------------------|--------------------------------------------------------------|
| `xr`                   | 認識されているアプリ一覧を表示し、対話的に選択して起動         |
| `xr <app>`             | `<app>` を起動（Vite + Simulator）                            |
| `xr <app> -WebOnly`    | Vite だけ起動（ブラウザで確認したいとき）                     |
| `xr <app> -SimOnly`    | Simulator だけ起動（別ウィンドウで vite を回しているとき）    |
| `xr -List`             | 認識されているアプリ一覧（パス付き）を表示して終了            |
| `xr -Help`             | ヘルプを表示                                                 |

### 環境変数オーバーライド

| 変数         | デフォルト                | 意味                                              |
|--------------|--------------------------|---------------------------------------------------|
| `PORT`       | `5173`                   | Vite が listen するポート                          |
| `SIM_HOST`   | `127.0.0.1`              | Simulator が接続する Vite のホスト                |
| `VITE_HOST`  | `0.0.0.0`                | Vite が listen するホスト（LAN 公開なら 0.0.0.0） |
| `URL`        | `http://$SIM_HOST:$PORT` | Simulator に渡す URL                               |

例：別ポートで起動したいとき
```powershell
$env:PORT = 5180; xr sandbox
```

### アプリの探索ルール

`run.ps1` は次の順で「使えるアプリ」を洗い出す：

1. `even-dev/apps/<name>/` の中身（`_` や `.` で始まるディレクトリは除外）
2. `even-dev/apps.json` のエントリのうち、値がローカルパスのもの（git URL は無視）

`apps.json` のエントリは even-dev 側で `.apps-cache/<name>/` への clone が必要なため、`run.ps1` は **clone は行わない**。git URL のアプリを動かしたい場合は素直に `start-even.sh` を使う（Git Bash あり前提）か、`run.ps1` を拡張する。

### 内部動作

```
xr sandbox
  → run.ps1 がアプリを発見
  → 必要なら npm install
  → Start-Process npx.cmd vite ...  ← バックグラウンド
  → Invoke-WebRequest で URL を polling（最大 90 秒）
  → & npx --yes @evenrealities/evenhub-simulator@latest <URL>  ← フォアグラウンド
  → simulator が exit したら finally で taskkill /T /F /PID <vitePid>
```

ポイントは **vite のプロセスツリーを taskkill `/T` で確実に殺す** こと。
`npx.cmd` → `node` → vite というプロセスツリーになるので、親だけ殺しても子の node が残る。
Windows PowerShell 5.1 では `Process.Kill($true)` が使えないので taskkill 経由にしてある。

---

## 新しいアプリを追加する

最短手順（`new-app` という名前で作る例）：

```powershell
# 1. base_app をテンプレにコピー
robocopy Y:\xr_apps\even-dev\apps\base_app Y:\xr_apps\new-app /E /XD node_modules dist /XF package-lock.json
```

```powershell
# 2. package.json の "name" を変える
#    Y:\xr_apps\new-app\package.json:
#      "name": "new-app-g2"
```

```powershell
# 3. app.json を新アプリ用に書き換える
#    Y:\xr_apps\new-app\app.json:
#      "package_id": "com.<yourname>.newapp",
#      "name": "New App",
#      "tagline": "...",
#      "description": "...",
#      "author": "<yourname>"
```

```powershell
# 4. apps.json に登録（先頭がおすすめ：自作アプリが上に来る）
#    Y:\xr_apps\even-dev\apps.json:
#      {
#        "sandbox": "../sandbox",
#        "new-app": "../new-app",   ← 追加
#        ...
#      }
```

```powershell
# 5. 起動
xr new-app
```

初回起動時に `new-app/` 配下で `npm install` が自動で走る。

---

## アプリの最小構成

`sandbox/` を例にすると、Even G2 アプリに最低限必要なのは以下：

```
sandbox/
├── index.html          # エントリ HTML（<script type="module" src="/src/main.ts">）
├── package.json        # 依存と scripts.dev / scripts.build
├── vite.config.ts      # Vite 設定（基本デフォルトでOK）
├── app.json            # evenhub-cli pack 用のメタデータ
├── .gitignore          # node_modules / dist / package-lock.json
└── src/
    ├── main.ts         # エントリポイント。グラスへの接続・UI 初期化
    ├── styles.css      # スタイル
    └── （任意）         # 機能別モジュール
```

### `app.json` の役割

`evenhub-cli pack` がこのファイルを読んで `.ehpk` を作る。スキーマバリデーションがあるので適当な値だと弾かれる。
重要なのは `package_id`（一意な逆ドメイン形式）と `permissions`（必要なネットワーク先・FS パス）。

### グラスへの接続コード（最小例）

```ts
import { waitForEvenAppBridge } from '@evenrealities/even_hub_sdk'

const bridge = await waitForEvenAppBridge()

bridge.onEvenHubEvent((event) => {
  // タップ / ダブルタップ / スワイプ等のハンドリング
  console.log(event)
})

// グラス側の UI 構築（CreateStartUpPageContainer など）
bridge.sendStartUpPage(container)
```

`base_app/src/main.ts` と `base_app/src/base-template.ts` を読むと、ブラウザ側 UI とグラス側 UI を両方更新する典型パターンが学べる。

### `apps/_shared/` のヘルパ群

自作アプリが `xr_apps/<name>/` にあると `apps/_shared/...` への相対 import パスが届かない（`../../_shared/...` ではない）ので注意。
共通化したいヘルパは、

- 自分の `xr_apps/_shared/` を作って各アプリから import する、または
- 各アプリ内に必要分だけコピーする

のどちらか。今のところ sandbox は base_app をベースに `_shared` を相対参照しているので、**そのままだと壊れる**。最初に sandbox を本格的に書き始める段で、_shared を切り離す or コピーする判断をする必要がある。

---

## even-dev の中身ガイド

主要ファイルだけ、何をしているかを書いておく。詳しいことは `even-dev/README.md` も参照。

### `even-dev/start-even.sh` (709 行)

bash 版ランチャー。`run.ps1` は本ファイルの最低限部分の PS 移植。bash 版にしかない機能：

- `--update` : `apps.json` の git URL エントリを `.apps-cache/<name>/` に最新版で clone / pull する
- `--update <name>` : 1 つだけ更新
- `--devenv-update` : even-dev ルートと `apps/*` の `node_modules` をすべて入れ直す
- `--reset` : `node_modules`, `dist`, `.apps-cache`, プラグイン symlink を削除
- `--evenhub-cli <args...>` : `npx @evenrealities/evenhub-cli` の薄い wrapper
- `--web-only` / `--sim-only` : `run.ps1` にも同等機能あり
- `sync_app_vite_plugin_links` : 各アプリディレクトリ内の `vite-plugin.ts` を `vite-plugins/<name>-plugin.ts` に symlink して自動ロードする仕組み（Windows では権限的につらいので使わない方針）

### `even-dev/vite.config.ts`

ルートの Vite 設定。これがランチャーの心臓部：

- `apps.json` を読んで `{ <name>: <absPath> }` のマップを作る
- `APP_NAME` / `APP_PATH` 環境変数で選択中のアプリを特定
- カスタムプラグイン `standaloneAppHtmlPlugin` が、ルート URL `/` へのアクセスを **選択中アプリの `index.html`** にすり替えて返す
- そのとき `src="/foo.js"` のような絶対パス参照は `src="/@fs/<absAppDir>/foo.js"` に書き換える（Vite の fs 制限を回避）
- `server.fs.allow` に各アプリのディレクトリを足してファイルアクセスを許可

これにより、`Y:\xr_apps\sandbox\index.html` が「even-dev ルートを CWD として起動された Vite」から正しく配信できる。

### `even-dev/vite-plugins/`

| ファイル              | 役割                                                                                |
|----------------------|------------------------------------------------------------------------------------|
| `index.ts`           | プラグインローダ本体。DEFAULT_PLUGIN_FACTORIES と動的ロードを管理                    |
| `types.ts`           | `PluginContext` 型定義（`externalApps`, `selectedApp`, `selectedAppDir`）          |
| `app-server.ts`      | 選択中アプリに `server/package.json` があれば `npx tsx src/index.ts` で自動起動    |
| `browser-launcher.ts`| `/edit?path=...` 等の便利ルートを追加（ホストからエディタ/ブラウザを叩ける）        |
| `chess-plugin.ts`    | chess アプリ専用。Stockfish の WASM 資産を配信                                      |
| `epub-plugin.ts`     | epub アプリ専用。Gutenberg のリクエストをプロキシして CORS を回避                   |
| `reddit-plugin.ts`   | reddit アプリ専用。Reddit API を CORS 回避のためプロキシ                            |
| `restapi-plugin.ts`  | restapi アプリ専用。任意の REST API をプロキシ                                      |
| `worldclock-plugin.ts` | worldclock アプリ専用                                                            |

`app-server.ts` と `browser-launcher.ts` は常時ロード、それ以外は **選択中のアプリ名に対応するものだけ** ロードされる。

### `even-dev/apps/_shared/`

組み込みアプリ間で共有するヘルパ群：

| ファイル              | 役割                                                                                |
|----------------------|------------------------------------------------------------------------------------|
| `async.ts`           | 非同期ユーティリティ                                                                |
| `autoconnect.ts`     | 接続ボタンの「進行中」状態管理（連打防止）                                          |
| `connection-pill.ts` | 接続状態を示す UI ピル（Ready / Connecting / Connected / Error）の DOM 操作        |
| `even-events.ts`     | Even Hub イベントの正規化                                                          |
| `log.ts`             | ログ用ヘルパ                                                                       |
| `standalone-vite.ts` | スタンドアロンモード判定                                                            |
| `styles.css`         | 共通スタイル                                                                       |

繰り返しになるが、**`xr_apps/sandbox/` からは `../../_shared/...` という相対パスでこれらに届かない**。
最初の本格開発のタイミングで「コピーする」or「`xr_apps/_shared/` を作って参照を張り直す」の判断が要る。

### `even-dev/apps.json`

外部アプリレジストリ。値は次のどちらか：

```jsonc
{
  "chess":   "https://github.com/dmyster145/EvenChess",  // git URL → .apps-cache に clone
  "chess":   "https://github.com/x/y#some/subdir",        // # 以降はサブパス
  "sandbox": "../sandbox"                                 // ローカルパス → そのまま使う
}
```

### `even-dev/scripts/pack-app.sh`

組み込みアプリを `.ehpk` に梱包する bash スクリプト。中身は：

```bash
cd apps/<name>
npm run build
npx @evenrealities/evenhub-cli pack app.json dist
```

自作アプリ（`xr_apps/<name>/`）に対しては、同等のことを直接やるのが楽：

```powershell
cd Y:\xr_apps\sandbox
npm run build
npx @evenrealities/evenhub-cli pack app.json dist
# → Y:\xr_apps\sandbox\out.ehpk が生成される
```

### `even-dev/misc/editor/` と `editor.sh`

UI を視覚的に組んで TypeScript を吐く補助エディタ（git submodule）。`quicktest` アプリと組み合わせて、組んだ UI をその場で simulator に流すワークフロー用。
sandbox 開発では当面使わなくて OK。

---

## ビルドとパッケージング

### 開発ビルド（vite preview で確認）

```powershell
cd Y:\xr_apps\sandbox
npm run build      # dist/ にプロダクション JS / CSS が出る
npm run preview    # http://localhost:4173 で配信
```

ただしこれはブラウザ確認用。グラスにデプロイするには次の手順。

### Even Hub にデプロイ

```powershell
# 初回のみログイン
npx @evenrealities/evenhub-cli login

# パッケージング
cd Y:\xr_apps\sandbox
npm run build
npx @evenrealities/evenhub-cli pack app.json dist
# → out.ehpk

# QR コードでグラスに転送
npx @evenrealities/evenhub-cli qr out.ehpk
```

`evenhub-cli pack` は `app.json` のスキーマをかなり厳しく検証する。`package_id` が `com.example.foo` 形式じゃないと弾かれる、など。

---

## トラブルシューティング

### `xr sandbox` で Vite が立ち上がらない

- `even-dev/node_modules` が壊れている可能性。`Remove-Item -Recurse Y:\xr_apps\even-dev\node_modules` → `xr sandbox` で再 `npm install`
- ポート 5173 が使われていないか確認：`Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue`
- 別ポートで試す：`$env:PORT = 5180; xr sandbox`

### Vite は立ったけど Simulator が起動しない

- `npx --yes @evenrealities/evenhub-simulator@latest http://127.0.0.1:5173` を単独で実行してエラーを確認
- 初回は npm registry から数十 MB のダウンロードがある（待つ）

### Ctrl+C 後に node プロセスが残っている

- `run.ps1` の `taskkill /T /F` で殺し切れていない場合：`Get-Process node | Stop-Process -Force`
- 再現するなら `run.ps1` の finally ブロックを調査

### `xr` コマンドが見つからない

- 新しい PowerShell ウィンドウを開いていないと PROFILE が読まれない
- 既存ウィンドウで試すなら：`. $PROFILE`
- ExecutionPolicy が Restricted だと PROFILE すら読まれない：`Get-ExecutionPolicy -List` で確認、必要なら `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### sandbox 内で `import '../../_shared/...'` が解決されない

- 既知の制約。sandbox は `xr_apps/sandbox/` にあるので、`even-dev/apps/_shared/` には `../../_shared/` では届かない（届くのは `../even-dev/apps/_shared/` だが汚い）
- 解決策：必要な _shared ファイルを `sandbox/src/_shared/` にコピーする、または `xr_apps/_shared/` を作って各アプリから参照する

### `app.json` 検証エラー

- `package_id` は小文字＋ドット区切り（`com.foo.bar`）
- `edition` は数値文字列（`"202601"` 等）
- 詳しくは `evenhub-cli` のエラーメッセージに従う

---

## 新しいマシンへの移行

このワークスペース構成を別の Windows マシンに持っていく手順：

```powershell
# 1. Node.js を入れる（v20+ 推奨）
#    https://nodejs.org/ から MSI 取ってきてインストール

# 2. Y:\xr_apps\ を丸ごとコピー（or git で管理しているならクローン）
#    even-dev/node_modules と各 app/node_modules は持っていかなくて OK（初回起動で入る）
#    .apps-cache/ も不要

# 3. PowerShell プロファイルに xr 関数を登録
$profileDir = Split-Path $PROFILE -Parent
New-Item -ItemType Directory -Force -Path $profileDir | Out-Null
Add-Content $PROFILE 'function xr { & Y:\xr_apps\run.ps1 @args }'

# 4. ExecutionPolicy 確認（最低 RemoteSigned）
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

# 5. 新しいシェルで動作確認
xr -List
xr sandbox
```

ドライブレターが `F:` 以外になる場合は `run.ps1` 内の `$Root = 'Y:\xr_apps'` と PROFILE の `Y:\xr_apps\run.ps1` を直すだけで済む。

### 移行時にハマりやすいポイント

Node.js のバージョン・ポート競合・`even-dev` の所在は `run.ps1` の preflight が起動時に検出してメッセージを出す。以下は **preflight では検出できない** けど別マシンでよくハマるやつ。

#### 高優先度（先に潰しておきたい）

**ExecutionPolicy が Restricted だと PROFILE すら読まれない**
新規 PC や会社管理 PC は `Restricted` のことが多く、その場合 `xr` 関数が登録されないまま起動する。
```powershell
Get-ExecutionPolicy -List              # 確認
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned   # 直す
```
GPO で固定されている場合は変更不可。回避策：
```powershell
pwsh -ExecutionPolicy Bypass -File Y:\xr_apps\run.ps1 sandbox
```

**PowerShell 5.1 と 7（Core）でプロファイルパスが違う**
| シェル | `$PROFILE` の場所 |
|---|---|
| Windows PowerShell 5.1 | `Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1` |
| PowerShell 7+（pwsh） | `Documents\PowerShell\Microsoft.PowerShell_profile.ps1` |

VS Code の統合ターミナルはデフォルトで pwsh のことが多い。両方使うなら両方のプロファイルに `function xr` を書く。

**Windows Defender Firewall の初回ダイアログ**
初めて Vite を 5173 で起動するときに Windows がダイアログを出す。
- LAN 公開不要（自分の PC で確認するだけ）→ そのまま閉じて OK
- 別端末や Simulator が同 PC 内じゃないところから繋ぐ → 「許可」を押さないと届かない

#### 中優先度（地味に詰まる）

**初回起動の `npx --yes` ダウンロードが長い**
Even Hub Simulator のパッケージは数十 MB あり、初回は registry から落とすため数十秒〜分かかる。「起動しない」と勘違いしやすいが、`npx` の進行表示が出ていれば待つだけで OK。オフライン環境では事前にキャッシュを持ち込むか、`npm config set cache <path>` で共有キャッシュを指定。

**アンチウイルスの `node_modules` スキャンで遅くなる**
Windows Defender や企業 EDR が `node_modules/.bin/` 配下を毎回スキャンし、`npm install` や Vite 起動が異常に遅くなることがある。`Y:\xr_apps\` を除外フォルダに追加すると劇的に改善する（自己責任）。

**コンソール出力の文字化け**
Windows PowerShell 5.1 はデフォルトの出力エンコーディングが Shift-JIS。Vite や Simulator のログ（CJK・絵文字含む）が化けることがある。気になるなら PROFILE に追記：
```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

---

## 参考リンク

- [Even Realities 公式](https://www.evenrealities.com/)
- [@evenrealities/even_hub_sdk (npm)](https://www.npmjs.com/package/@evenrealities/even_hub_sdk)
- [@evenrealities/evenhub-cli (npm)](https://www.npmjs.com/package/@evenrealities/evenhub-cli)
- [@evenrealities/evenhub-simulator (npm)](https://www.npmjs.com/package/@evenrealities/evenhub-simulator)
- [@jappyjan/even-better-sdk (コミュニティ SDK)](https://www.npmjs.com/package/@jappyjan/even-better-sdk)
- [@jappyjan/even-realities-ui (コミュニティ UI)](https://www.npmjs.com/package/@jappyjan/even-realities-ui)
- [G2 開発ノート (nickustinov)](https://github.com/nickustinov/even-g2-notes)
- [UIUX ガイドライン (Figma)](https://www.figma.com/design/X82y5uJvqMH95jgOfmV34j/Even-Realities---Software-Design-Guidelines--Public-)
- 参考実装：[chess](https://github.com/dmyster145/EvenChess), [reddit](https://github.com/fuutott/rdt-even-g2-rddit-client)
