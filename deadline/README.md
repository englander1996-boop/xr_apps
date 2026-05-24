# deadline

任意の日付までのカウントダウン。

## できること

ブラウザでラベルと目標日 (YYYY-MM-DD) を入力すると、グラスに `Launch: 7d 4h 23m` のように残時間を表示。1 分ごとに自動更新。過ぎたら `*** PASSED ***`。

## 操作

| 入力 | 動作 |
|---|---|
| グラス タップ | 目標日を +1 日 |
| グラス ダブルタップ | 目標日を -1 日 |
| ブラウザ Label / Date | 入力欄。Save で確定 |
| ブラウザ Save | localStorage に保存して即反映 |

## 状態

- 保存キー: `deadline.v1` (`{ label, targetISO }`)

## 起動

```powershell
xr deadline
```
