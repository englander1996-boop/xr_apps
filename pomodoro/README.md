# pomodoro

25 分作業 / 5 分休憩のクラシック・ポモドーロタイマー。

## できること

タップでスタート/一時停止、ダブルタップでリセット。Work → Break → Work … を自動で回し続け、完了サイクル数を localStorage に保存する。残時間と現在フェーズ (`WORK 24:35 / Cycles: 2` 等) を常時グラスに表示。

## 操作

| 入力 | 動作 |
|---|---|
| グラス タップ | 開始 / 一時停止 / 再開 |
| グラス ダブルタップ | 完全リセット (idle へ) |
| ブラウザ Start/Pause/Resume | グラスと同じ |
| ブラウザ Reset | 完全リセット |

## 状態

- `WORK_SEC = 25*60`, `BREAK_SEC = 5*60` (`src/main.ts` 冒頭の定数で調整可)
- 完了サイクル数は `pomodoro.cycles.v1` キーで永続化

## 起動

```powershell
xr pomodoro
```
