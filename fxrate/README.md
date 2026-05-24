# fxrate

為替レート (USD ベース → JPY/EUR/GBP/CNY/KRW) を ECB 公式の `api.frankfurter.dev` から取得。

## できること

1 時間ごとに自動更新 (ECB 自体は日次更新)。タップで通貨ペアを切替。ブラウザは全ペアを並べて、グラスは選択中の 1 ペアを大きく表示。レートの取得日付も合わせて表示する。

## 操作

| 入力 | 動作 |
|---|---|
| グラス タップ | 表示ペアを次へ循環 |
| ブラウザ Next pair | 同上 |
| ブラウザ Refresh now | 即取得 |

## カスタマイズ

`src/main.ts` 冒頭の `BASE` と `TARGETS` を編集。例：

```ts
const BASE = 'JPY'
const TARGETS = ['USD', 'EUR', 'GBP'] as const
```

## メモ

- frankfurter.dev は無料・無認証・CORS 開きの ECB rate proxy。レート制限はあるが個人用途では事実上当たらない
- `permissions.network` に `api.frankfurter.dev` を申告済み
- ECB レートは平日のみ更新。週末は金曜の値が表示される

## 起動

```powershell
xr fxrate
```
