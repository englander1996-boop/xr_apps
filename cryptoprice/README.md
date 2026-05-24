# cryptoprice

CoinGecko の無料 API から仮想通貨価格を取って表示。

## できること

60 秒ごとに BTC / ETH / SOL の価格 (USD) を取得。ブラウザ側は 3 通貨を一覧表示、グラスは選択中の 1 通貨を大きく表示。タップで選択通貨を切替。

## 操作

| 入力 | 動作 |
|---|---|
| グラス タップ | 表示通貨を次へ循環 |
| ブラウザ Next coin | 同上 |
| ブラウザ Refresh now | 待たずに即取得 |

## カスタマイズ

`src/main.ts` 冒頭の定数を編集:

- `COINS` — 表示する通貨 (CoinGecko の id 形式)。例: `['bitcoin', 'cardano', 'ripple']`
- `VS` — 通貨単位。`'jpy'` にすれば円
- `POLL_MS` — 更新間隔 (ミリ秒)。無料枠は 10-30 req/min なので 60s 以上推奨

## メモ

- CoinGecko 無料枠はレート制限ありなので攻めすぎると HTTP 429 が返る
- 通信先は `app.json` の `permissions.network` に `api.coingecko.com` を申告済み
- `Bridge unavailable (preview only)` モードでもブラウザでは動く

## 起動

```powershell
xr cryptoprice
```
