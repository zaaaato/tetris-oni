// ゲームの型定義
export type Position = {
  x: number;
  y: number;
};

export type Block = {
  x: number;
  y: number;
  color: string;
};

export type Tetromino = {
  blocks: Block[];
  position: Position;
  size: number; // テトリミノのサイズ（5-8）
};

export type GameField = (string | null)[][]; // null = 空、string = ブロックの色

export type GameState = {
  field: GameField;
  currentTetromino: Tetromino | null;
  nextTetromino: Tetromino | null;
  nextNextTetromino: Tetromino | null;
  holdTetromino: Tetromino | null;
  score: number;
  level: number;
  isGameOver: boolean;
  isPaused: boolean;
};
