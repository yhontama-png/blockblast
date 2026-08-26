# CLAUDE.md

Block Blast 風のパズルゲーム。React 19 + TypeScript + Vite の SPA。
バックエンド・ルーティング・外部 API なし。永続化は localStorage のみ。

## トークン節約のための注意（最初に読むこと）

- **`package-lock.json` を読まない**。約 37,500 トークン(全ソースの 4.4 倍)ある。
  依存関係は `package.json` を見ること。
- **`README.md` は Vite のテンプレートのまま**でプロジェクト情報を含まない。読む価値なし。
- ソース全体でも約 8,600 トークン(984 行)しかないので、迷ったら `src/` を直接読んだほうが
  探索より安い。
- テストは存在しない。検証は `npm run lint` と `npm run build`(tsc 型チェック込み)で行う。

## コマンド

```bash
npm run dev      # Vite 開発サーバー
npm run build    # tsc -b && vite build（型エラーはここで出る）
npm run lint     # eslint
npm run preview  # ビルド結果のプレビュー
```

## ファイル構成

```
src/
  main.tsx        エントリ。StrictMode + createRoot のみ
  App.tsx         (307行) UI とゲーム進行の全て。状態・ドラッグ・描画がここに集中
  App.css         (374行) ゲーム画面のスタイルとアニメーション
  index.css       リセット + CSS 変数(--bg-primary 等) + body/#root レイアウト
  game/
    types.ts      Piece / PlacedCell / Grid / GameState
    logic.ts      (145行) 純粋関数のみ。盤面判定・消去・スコア計算
    pieces.ts     ピース定義 23 種と 10 色のパステルパレット、ランダム生成
```

**責務の分離**: `game/` は React に依存しない純粋関数。副作用と状態は `App.tsx` のみ。
ロジックを追加するときはこの分離を守る。

## ゲーム仕様

- 盤面は 8x8（`GRID_SIZE`、`logic.ts` で定義）。
- トレイに常に 3 ピース。**3 つすべて使い切ったときだけ**次の 3 つを生成する
  （`App.tsx` の `allUsed` 判定）。1 つずつ補充ではない。
- **ピースの回転は未実装**。`PIECE_DEFS` は回転済みの形を個別に列挙している。
- 行・列が埋まると消去。行と列が同時に成立した場合、交差セルは二重カウントしない。
- ゲームオーバーは「残っているピースがどれも盤面のどこにも置けない」とき。

## 重要な注意点（触る前に読む）

- **スコア計算が 2 箇所に分かれている**。基礎点は `logic.ts` の `calculateScore()`、
  コンボ倍率は `App.tsx:103` で `* Math.max(1, newCombo)` として後掛けしている。
  スコアを変更するときは両方を確認すること。
- **コンボはライン消去で加算、消去なしの設置で 0 にリセット**（`App.tsx:133`）。
- **消去処理は 350ms の `setTimeout`**（`App.tsx:131`）で盤面を確定させるが、
  CSS 側の `.cell.clearing` は `cellClear 0.4s`（`App.css:134`）。**既に 50ms ずれており**、
  アニメーション終了前にセルが消える。どちらかを変更する場合は必ず両方を合わせること。
- **ドラッグ中は `isClearing` で入力をブロック**している。非同期の消去処理中に
  盤面が二重更新されるのを防ぐため。この gate を外さないこと。
- **ドラッグの掴み位置はピース中心**（`dragOffsetRef` = `floor(rows/2), floor(cols/2)`）。
  過去にこのオフセットのバグ修正済み。指の位置とセルの対応を変えるときは
  `getBoardCell()` と併せて検証すること。
- **ハイスコアの localStorage キーは `blockblast-highscore`**。書き込みが
  `setScore` の updater 内にあるため、副作用がレンダー中に走る形になっている。
  React の作法としては `useEffect` に出すのが望ましいが、現状は動作している。
- `isGameOver()` は残ピースが 0 個のとき `false` を返す。3 つ使い切った直後は
  必ず補充されるという前提に依存している。

## 既知の問題

- `npm run build` で PostCSS 警告が出る: `index.css` の Google Fonts の `@import` が
  リセット指定より後ろにあるため（`@import must precede all other statements`）。
  ビルドは成功するが、フォント読み込みが無視される可能性がある。修正するなら
  `@import` を `index.css` の 1 行目に移動する。

## 既知の未使用コード

- `App.css:142` の `.cell.ghost-invalid` は定義されているが `App.tsx` から
  一度も付与されていない。無効な配置位置には現在フィードバックが出ない。
- `types.ts` の `CellColor` と `GameState` はどこからも import されていない。

## コーディング規約

- 既存コードに合わせる: 関数コンポーネント + hooks、`useCallback` で依存配列を明示。
- 型は `import type` で分離して import する（既存コードがそうしている）。
- 色は `pieces.ts` の `COLORS` 配列と `index.css` の CSS 変数に集約。
  ハードコードした色を新規に追加しない。
- スタイルは `App.css` のクラスに書く。インラインスタイルは
  「動的な色・opacity・grid のサイズ」のみに限定する（既存の使い分け）。
- モバイル前提。`touch-action: none` と Pointer Events を使用。
  マウス専用イベント（mousedown 等）を追加しない。
