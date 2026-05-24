# wikitoday

英語版 Wikipedia の「On This Day」(今日は何の日) を取得して表示。

## できること

起動時に英語 Wikipedia REST API を 1 回叩いて、今日の **selected / events / births / deaths / holidays** をまとめて取得。タップで同カテゴリ内の次の項目、ダブルでカテゴリ切替。

## 操作

| 入力 | 動作 |
|---|---|
| グラス タップ | カテゴリ内で次の項目 |
| グラス ダブルタップ | 次のカテゴリへ (selected → events → births → deaths → holidays) |
| ブラウザ Next item | 同上 |
| ブラウザ Next category | カテゴリ切替 |
| ブラウザ Refresh | 再取得 |

## メモ

- API: `https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/MM/DD`
- 日本語版 Wikipedia には同 API がないので英語のみ
- 1 回の取得で全カテゴリ揃うので追加リクエスト不要 (ポーリングなし)
- カテゴリ別件数は Event Log に出る
- `selected` は編集者ピックで件数少なめ・質高め、`events` は網羅的だが冗長

## 起動

```powershell
xr wikitoday
```
