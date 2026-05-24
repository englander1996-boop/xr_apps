# dbmeter

グラスのマイクで取れる音量をリアルタイム dB 表示。

## できること

`bridge.audioControl(true)` でマイクをオープン → 流れてくる PCM (16-bit signed little-endian 想定) の RMS を計算 → dBFS に換算。`-60 〜 0 dB` の範囲を 20 文字のバーグラフで可視化。ピーク値も保持。

## 操作

| 入力 | 動作 |
|---|---|
| グラス タップ | マイクをオープン |
| グラス ダブルタップ | マイクをクローズ |
| ブラウザ Open mic / Close mic | 同上 |

## メモ

- PCM のサンプルフォーマットを 16-bit signed LE と仮定している。実際の SDK 出力が違うと dB 値が変になる可能性あり。その場合は `pcmToDb()` を調整する
- マイク使用には ブリッジ接続が前提 (preview-only モードでは何も来ない)

## 起動

```powershell
xr dbmeter
```
