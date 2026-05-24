# toothbrush

2 分歯磨きタイマー (4 ゾーン × 30 秒)。

## できること

Upper-Left → Upper-Right → Lower-Left → Lower-Right を 30 秒ずつガイド。現在ゾーン名と残秒、進捗 (`Zone 2/4`) を表示。終了時 `*** DONE ***`。

## 操作

| 入力 | 動作 |
|---|---|
| グラス タップ | 開始 (動作中は無視) |
| グラス ダブルタップ | リセット |
| ブラウザ Start / Reset | 同上 |

## カスタマイズ

`ZONES` 配列を編集すれば前歯/奥歯/裏側みたいな分け方にも変更可。

## 起動

```powershell
xr toothbrush
```
