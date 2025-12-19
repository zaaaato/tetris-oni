import { GAME_CONFIG } from "./config";
import { GameField, Tetromino, GameState } from "./types";
import { generateRandomTetromino } from "./tetrominoGenerator";

/**
 * 空のフィールドを作成
 */
export function createEmptyField(): GameField {
  return Array(GAME_CONFIG.FIELD_HEIGHT)
    .fill(null)
    .map(() => Array(GAME_CONFIG.FIELD_WIDTH).fill(null));
}

/**
 * 初期ゲーム状態を作成
 */
export function createInitialGameState(): GameState {
  const currentTetromino = generateRandomTetromino();
  const nextTetromino = generateRandomTetromino();
  const nextNextTetromino = generateRandomTetromino();

  return {
    field: createEmptyField(),
    currentTetromino,
    nextTetromino,
    nextNextTetromino,
    holdTetromino: null,
    score: 0,
    level: 1,
    isGameOver: false,
    isPaused: false,
  };
}

/**
 * テトリミノが配置可能かチェック
 */
export function canPlaceTetromino(
  field: GameField,
  tetromino: Tetromino,
  offsetX: number = 0,
  offsetY: number = 0
): boolean {
  const { blocks, position } = tetromino;

  for (const block of blocks) {
    const x = position.x + block.x + offsetX;
    const y = position.y + block.y + offsetY;

    // フィールド外チェック
    if (
      x < 0 ||
      x >= GAME_CONFIG.FIELD_WIDTH ||
      y >= GAME_CONFIG.FIELD_HEIGHT
    ) {
      return false;
    }

    // 上部は許可（まだ画面外）
    if (y < 0) continue;

    // 他のブロックと重なっているかチェック
    if (field[y][x] !== null) {
      return false;
    }
  }

  return true;
}

/**
 * テトリミノをフィールドに固定
 */
export function lockTetromino(
  field: GameField,
  tetromino: Tetromino
): GameField {
  const newField = field.map((row) => [...row]);
  const { blocks, position } = tetromino;

  for (const block of blocks) {
    const x = position.x + block.x;
    const y = position.y + block.y;

    if (
      y >= 0 &&
      y < GAME_CONFIG.FIELD_HEIGHT &&
      x >= 0 &&
      x < GAME_CONFIG.FIELD_WIDTH
    ) {
      newField[y][x] = block.color;
    }
  }

  return newField;
}

/**
 * 完成したラインを検出して消去
 */
export function clearLines(field: GameField): {
  newField: GameField;
  linesCleared: number;
} {
  const newField: GameField = [];
  let linesCleared = 0;

  for (let y = 0; y < field.length; y++) {
    const row = field[y];
    const isComplete = row.every((cell) => cell !== null);

    if (!isComplete) {
      newField.push([...row]);
    } else {
      linesCleared++;
    }
  }

  // 消去した分だけ上に空行を追加
  while (newField.length < GAME_CONFIG.FIELD_HEIGHT) {
    newField.unshift(Array(GAME_CONFIG.FIELD_WIDTH).fill(null));
  }

  return { newField, linesCleared };
}

/**
 * テトリミノを左に移動
 */
export function moveLeft(state: GameState): GameState {
  if (!state.currentTetromino || state.isGameOver || state.isPaused)
    return state;

  if (canPlaceTetromino(state.field, state.currentTetromino, -1, 0)) {
    return {
      ...state,
      currentTetromino: {
        ...state.currentTetromino,
        position: {
          x: state.currentTetromino.position.x - 1,
          y: state.currentTetromino.position.y,
        },
      },
    };
  }

  return state;
}

/**
 * テトリミノを右に移動
 */
export function moveRight(state: GameState): GameState {
  if (!state.currentTetromino || state.isGameOver || state.isPaused)
    return state;

  if (canPlaceTetromino(state.field, state.currentTetromino, 1, 0)) {
    return {
      ...state,
      currentTetromino: {
        ...state.currentTetromino,
        position: {
          x: state.currentTetromino.position.x + 1,
          y: state.currentTetromino.position.y,
        },
      },
    };
  }

  return state;
}

/**
 * テトリミノを時計回りに回転
 */
export function rotateClockwise(state: GameState): GameState {
  if (!state.currentTetromino || state.isGameOver || state.isPaused)
    return state;

  const { currentTetromino } = state;
  const size = currentTetromino.size;

  // ブロックを90度時計回りに回転
  const rotatedBlocks = currentTetromino.blocks.map((block) => ({
    ...block,
    x: size - 1 - block.y,
    y: block.x,
  }));

  const rotatedTetromino = {
    ...currentTetromino,
    blocks: rotatedBlocks,
  };

  // 回転後の位置で配置可能かチェック
  if (canPlaceTetromino(state.field, rotatedTetromino, 0, 0)) {
    return {
      ...state,
      currentTetromino: rotatedTetromino,
    };
  }

  // 配置できない場合は壁蹴り（少し左右にずらして再試行）
  for (let offset = 1; offset <= 2; offset++) {
    // 右にずらす
    if (canPlaceTetromino(state.field, rotatedTetromino, offset, 0)) {
      return {
        ...state,
        currentTetromino: {
          ...rotatedTetromino,
          position: {
            x: rotatedTetromino.position.x + offset,
            y: rotatedTetromino.position.y,
          },
        },
      };
    }
    // 左にずらす
    if (canPlaceTetromino(state.field, rotatedTetromino, -offset, 0)) {
      return {
        ...state,
        currentTetromino: {
          ...rotatedTetromino,
          position: {
            x: rotatedTetromino.position.x - offset,
            y: rotatedTetromino.position.y,
          },
        },
      };
    }
  }

  // どこにも配置できない場合は回転しない
  return state;
}

/**
 * テトリミノを反時計回りに回転
 */
export function rotateCounterClockwise(state: GameState): GameState {
  if (!state.currentTetromino || state.isGameOver || state.isPaused)
    return state;

  const { currentTetromino } = state;
  const size = currentTetromino.size;

  // ブロックを90度反時計回りに回転
  const rotatedBlocks = currentTetromino.blocks.map((block) => ({
    ...block,
    x: block.y,
    y: size - 1 - block.x,
  }));

  const rotatedTetromino = {
    ...currentTetromino,
    blocks: rotatedBlocks,
  };

  // 回転後の位置で配置可能かチェック
  if (canPlaceTetromino(state.field, rotatedTetromino, 0, 0)) {
    return {
      ...state,
      currentTetromino: rotatedTetromino,
    };
  }

  // 配置できない場合は壁蹴り（少し左右にずらして再試行）
  for (let offset = 1; offset <= 2; offset++) {
    // 右にずらす
    if (canPlaceTetromino(state.field, rotatedTetromino, offset, 0)) {
      return {
        ...state,
        currentTetromino: {
          ...rotatedTetromino,
          position: {
            x: rotatedTetromino.position.x + offset,
            y: rotatedTetromino.position.y,
          },
        },
      };
    }
    // 左にずらす
    if (canPlaceTetromino(state.field, rotatedTetromino, -offset, 0)) {
      return {
        ...state,
        currentTetromino: {
          ...rotatedTetromino,
          position: {
            x: rotatedTetromino.position.x - offset,
            y: rotatedTetromino.position.y,
          },
        },
      };
    }
  }

  // どこにも配置できない場合は回転しない
  return state;
}

/**
 * テトリミノを下に移動
 */
export function moveDown(state: GameState): GameState {
  if (!state.currentTetromino || state.isGameOver || state.isPaused)
    return state;

  if (canPlaceTetromino(state.field, state.currentTetromino, 0, 1)) {
    return {
      ...state,
      currentTetromino: {
        ...state.currentTetromino,
        position: {
          x: state.currentTetromino.position.x,
          y: state.currentTetromino.position.y + 1,
        },
      },
    };
  }

  // 下に移動できない場合は固定
  const newField = lockTetromino(state.field, state.currentTetromino);
  const { newField: clearedField, linesCleared } = clearLines(newField);

  // テトリミノをシフト: next → current, nextNext → next, 新規 → nextNext
  const newTetromino = state.nextTetromino;
  const nextTetromino = state.nextNextTetromino;
  const nextNextTetromino = generateRandomTetromino();

  // 新しいテトリミノが配置できない場合はゲームオーバー
  const isGameOver = newTetromino
    ? !canPlaceTetromino(clearedField, newTetromino)
    : true;

  // スコア計算: テトリミノ配置で10点 + ライン消去ボーナス
  const placementBonus = 10; // テトリミノを置いた基本点
  const lineClearBonus = calculateScore(linesCleared, state.level);

  return {
    ...state,
    field: clearedField,
    currentTetromino: newTetromino,
    nextTetromino,
    nextNextTetromino,
    score: state.score + placementBonus + lineClearBonus,
    level: state.level + Math.floor(linesCleared / 3),
    isGameOver,
  };
}

/**
 * テトリミノを一番下まで落とす
 */
export function hardDrop(state: GameState): GameState {
  if (!state.currentTetromino || state.isGameOver || state.isPaused)
    return state;

  let newState = state;
  while (
    newState.currentTetromino &&
    canPlaceTetromino(newState.field, newState.currentTetromino, 0, 1)
  ) {
    newState = moveDown(newState);
  }

  // 最後にもう一度下に移動して固定
  return moveDown(newState);
}

/**
 * スコア計算
 */
function calculateScore(linesCleared: number, level: number): number {
  const baseScores = [0, 100, 400, 900, 1600, 2500, 3600, 5000];
  return (baseScores[linesCleared] || linesCleared * 1000) * level;
}

/**
 * ゲームをリセット
 */
export function resetGame(): GameState {
  return createInitialGameState();
}

/**
 * ゲームを一時停止/再開
 */
export function togglePause(state: GameState): GameState {
  return {
    ...state,
    isPaused: !state.isPaused,
  };
}

/**
 * 現在のテトリミノをホールドする
 */
export function holdTetromino(state: GameState): GameState {
  if (!state.currentTetromino || state.isGameOver || state.isPaused)
    return state;

  // ホールドがある場合は交換（位置はそのまま）
  if (state.holdTetromino) {
    const currentPosition = state.currentTetromino.position;
    const newCurrent = {
      ...state.holdTetromino,
      position: currentPosition,
    };

    // 交換後のテトリミノが配置可能かチェック
    if (!canPlaceTetromino(state.field, newCurrent)) {
      // 配置できない場合は交換しない
      return state;
    }

    const newHold = state.currentTetromino;

    return {
      ...state,
      currentTetromino: newCurrent,
      holdTetromino: newHold,
    };
  }

  // ホールドがない場合は、現在のをホールドして次のを出す
  const newHold = state.currentTetromino;
  const newCurrent = state.nextTetromino;
  const newNext = state.nextNextTetromino;
  const newNextNext = generateRandomTetromino();

  return {
    ...state,
    currentTetromino: newCurrent,
    nextTetromino: newNext,
    nextNextTetromino: newNextNext,
    holdTetromino: newHold,
  };
}
