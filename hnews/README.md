# hnews

Hacker News のトップ 20 記事を取得して表示。

## できること

起動時に HN Firebase API から上位記事の id 一覧 (`topstories.json`) を取得 → 上位 20 件の詳細 (`item/<id>.json`) を **並列で** 取得 → タイトル + スコア + コメント数を表示。10 分ごとに自動更新。

## 操作

| 入力 | 動作 |
|---|---|
| グラス タップ | 次の記事へ |
| グラス ダブルタップ | 前の記事へ |
| ブラウザ Next / Prev story | 同上 |
| ブラウザ Refresh | 即取得 |

## 表示フォーマット

```
#3  812↑  245💬
Show HN: I built a thing
https://example.com/thing
```

## メモ

- API は完全無料・無認証・CORS 開き。レート制限は明示されていないが過剰に叩かないのが礼儀
- 20 件並列取得で typically 1-3 秒、ログには合計時間だけ残す (個別 GET は出さない、ログが騒がしくなるので)
- `Promise.all` で並列化することで逐次 fetch (20 個 × 200ms = 4s) より速い
- 失敗した記事は表示から除外する (null フィルタ)

## カスタマイズ

- `TOP_COUNT = 20` を 5 や 100 に変更可能
- `POLL_MS` でポーリング間隔調整

## 起動

```powershell
xr hnews
```
