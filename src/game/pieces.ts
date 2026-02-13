import type { Piece } from "./types";

const COLORS = [
  '#FFB3BA', // pastel pink
  '#BAE1FF', // pastel blue
  '#BAFFC9', // pastel green
  '#FFE4BA', // pastel peach
  '#E8BAFF', // pastel lavender
  '#FFBAE1', // pastel rose
  '#BAF2FF', // pastel sky
  '#FFF1BA', // pastel lemon
  '#D4BAFF', // pastel violet
  '#FFD4BA', // pastel coral
];

interface PieceDef {
  shape: boolean[][];
}

const PIECE_DEFS: PieceDef[] = [
  // Single
  { shape: [[true]] },
  // 1x2
  { shape: [[true, true]] },
  // 1x3
  { shape: [[true, true, true]] },
  // 1x4
  { shape: [[true, true, true, true]] },
  // 1x5
  { shape: [[true, true, true, true, true]] },
  // 2x1
  { shape: [[true], [true]] },
  // 3x1
  { shape: [[true], [true], [true]] },
  // 4x1
  { shape: [[true], [true], [true], [true]] },
  // 5x1
  { shape: [[true], [true], [true], [true], [true]] },
  // 2x2
  { shape: [[true, true], [true, true]] },
  // 3x3
  { shape: [[true, true, true], [true, true, true], [true, true, true]] },
  // L-shape
  { shape: [[true, false], [true, false], [true, true]] },
  // Reverse L
  { shape: [[false, true], [false, true], [true, true]] },
  // L-shape rotated
  { shape: [[true, true, true], [true, false, false]] },
  // L-shape rotated 2
  { shape: [[true, true, true], [false, false, true]] },
  // T-shape
  { shape: [[true, true, true], [false, true, false]] },
  // S-shape
  { shape: [[false, true, true], [true, true, false]] },
  // Z-shape
  { shape: [[true, true, false], [false, true, true]] },
  // Small L
  { shape: [[true, true], [true, false]] },
  // Small L reverse
  { shape: [[true, true], [false, true]] },
  // Small L 3
  { shape: [[true, false], [true, true]] },
  // Small L 4
  { shape: [[false, true], [true, true]] },
  // 1x2 vertical + horizontal combo (cross piece)
  { shape: [[false, true, false], [true, true, true], [false, true, false]] },
];

let pieceCounter = 0;

export function randomPiece(): Piece {
  const def = PIECE_DEFS[Math.floor(Math.random() * PIECE_DEFS.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return {
    shape: def.shape,
    color,
    id: `piece-${pieceCounter++}`,
  };
}

export function generatePieces(): Piece[] {
  return [randomPiece(), randomPiece(), randomPiece()];
}
