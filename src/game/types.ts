export type CellColor = string | null;

export interface Piece {
  shape: boolean[][];
  color: string;
  id: string;
}

export interface PlacedCell {
  color: string;
  clearing?: boolean;
}

export type Grid = (PlacedCell | null)[][];

export interface GameState {
  grid: Grid;
  score: number;
  highScore: number;
  pieces: (Piece | null)[];
  gameOver: boolean;
}
