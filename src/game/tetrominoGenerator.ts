import { GAME_CONFIG } from './config';
import { Tetromino, Block } from './types';

/**
 * 重み付けされたランダムサイズ選択
 * 小さいサイズほど出やすい（4x4が最も出やすく、8x8が最も出にくい）
 */
function getWeightedRandomSize(): number {
  const min = GAME_CONFIG.MIN_TETROMINO_SIZE;
  const max = GAME_CONFIG.MAX_TETROMINO_SIZE;
  const sizeCount = max - min + 1;

  // 重みを計算（小さいサイズほど高い重み）
  // 4x4: weight 5, 5x5: weight 4, 6x6: weight 3, 7x7: weight 2, 8x8: weight 1
  const weights: number[] = [];
  for (let i = 0; i < sizeCount; i++) {
    weights.push(sizeCount - i);
  }

  // 総重量を計算
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // ランダムで重み付き選択
  let random = Math.random() * totalWeight;
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return min + i;
    }
  }

  return max; // フォールバック
}

/**
 * ランダムなテトリミノを生成（4x4から8x8）
 * 空洞がない形を保証する
 * 小さいサイズほど出やすい確率分布
 */
export function generateRandomTetromino(): Tetromino {
  const size = getWeightedRandomSize();

  let grid = generateRandomGrid(size);
  let isConnected = checkConnectivity(grid);

  // 連結されるまで生成を繰り返す
  while (!isConnected) {
    grid = generateRandomGrid(size);
    isConnected = checkConnectivity(grid);
  }

  // グリッドからブロック配列に変換
  const blocks = gridToBlocks(grid);
  const color = GAME_CONFIG.COLORS[Math.floor(Math.random() * GAME_CONFIG.COLORS.length)];

  return {
    blocks: blocks.map(block => ({ ...block, color })),
    position: { x: Math.floor(GAME_CONFIG.FIELD_WIDTH / 2) - Math.floor(size / 2), y: 0 },
    size,
  };
}

/**
 * ランダムなグリッドをランダムウォーク方式で生成
 * より複雑で多様な形を生成する
 */
function generateRandomGrid(size: number): boolean[][] {
  const grid: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  const totalCells = size * size;
  const minFilled = Math.ceil(totalCells / 3);
  const maxFilled = Math.min(totalCells, Math.ceil(totalCells * 0.7)); // 最大70%
  const targetFilled = Math.floor(Math.random() * (maxFilled - minFilled + 1)) + minFilled;

  // ランダムな開始点
  let x = Math.floor(Math.random() * size);
  let y = Math.floor(Math.random() * size);
  grid[y][x] = true;
  let filled = 1;

  // ランダムウォークでセルを追加
  const directions: [number, number][] = [
    [0, 1],  // 下
    [0, -1], // 上
    [1, 0],  // 右
    [-1, 0], // 左
  ];

  const filledCells: [number, number][] = [[x, y]];
  let attempts = 0;
  const maxAttempts = targetFilled * 10; // 無限ループ防止
  let lastDirection: [number, number] | null = null;

  while (filled < targetFilled && attempts < maxAttempts) {
    attempts++;

    // 最近追加したセルから成長させる（80%の確率で直線的に伸びる）
    const useRecent = Math.random() < 0.8;
    const cellIndex = useRecent
      ? Math.max(0, filledCells.length - Math.floor(Math.random() * 3) - 1)
      : Math.floor(Math.random() * filledCells.length);
    const [currentX, currentY] = filledCells[cellIndex];

    // 同じ方向に進み続ける確率を上げる（直線的な形を作りやすくする）
    const direction: [number, number] = lastDirection && Math.random() < 0.6
      ? lastDirection
      : directions[Math.floor(Math.random() * directions.length)];
    const dx = direction[0];
    const dy = direction[1];

    // ロングジャンプの確率を大幅アップ（70%の確率で2マス以上）
    const rand = Math.random();
    const step = rand < 0.3 ? 1 : rand < 0.6 ? 2 : rand < 0.85 ? 3 : 4;

    const newX = currentX + dx * step;
    const newY = currentY + dy * step;

    // グリッド内かつ未使用のセルならセット
    if (newX >= 0 && newX < size && newY >= 0 && newY < size && !grid[newY][newX]) {
      grid[newY][newX] = true;
      filledCells.push([newX, newY]);
      filled++;
      lastDirection = [dx, dy];

      // 分岐の確率を大幅に下げる（10%に）
      if (Math.random() < 0.1 && filled < targetFilled) {
        const [branchDx, branchDy] = directions[Math.floor(Math.random() * directions.length)];
        const branchX = newX + branchDx;
        const branchY = newY + branchDy;

        if (branchX >= 0 && branchX < size && branchY >= 0 && branchY < size && !grid[branchY][branchX]) {
          grid[branchY][branchX] = true;
          filledCells.push([branchX, branchY]);
          filled++;
        }
      }
    } else {
      // 配置できなかったら方向をリセット
      lastDirection = null;
    }
  }

  return grid;
}

/**
 * グリッドの連結性と空洞なしをチェック
 * 1. すべての埋まったセルが連結されているか
 * 2. 空洞がないか（すべての空セルが外側から到達可能か）
 */
function checkConnectivity(grid: boolean[][]): boolean {
  const size = grid.length;

  // 1. すべての埋まっているセルが連結されているかチェック
  const visited: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  let startX = -1;
  let startY = -1;
  let totalFilled = 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x]) {
        totalFilled++;
        if (startX === -1) {
          startX = x;
          startY = y;
        }
      }
    }
  }

  if (totalFilled === 0) return false;

  const reachable = floodFill(grid, visited, startX, startY);
  if (reachable !== totalFilled) return false;

  // 2. 空洞がないかチェック（外側から到達できない空セルがあればNG）
  return !hasHoles(grid);
}

/**
 * 空洞があるかチェック
 * 外側から到達できない空セルがあればtrue
 */
function hasHoles(grid: boolean[][]): boolean {
  const size = grid.length;
  const visited: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));

  // 外側の境界から空セルに対してflood fillを実行
  // 上下左右の端から開始
  for (let i = 0; i < size; i++) {
    // 上端
    if (!grid[0][i]) {
      floodFillEmpty(grid, visited, i, 0);
    }
    // 下端
    if (!grid[size - 1][i]) {
      floodFillEmpty(grid, visited, i, size - 1);
    }
    // 左端
    if (!grid[i][0]) {
      floodFillEmpty(grid, visited, 0, i);
    }
    // 右端
    if (!grid[i][size - 1]) {
      floodFillEmpty(grid, visited, size - 1, i);
    }
  }

  // 外側から到達できない空セルがあるかチェック
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // 空セルなのに訪問されていない = 空洞
      if (!grid[y][x] && !visited[y][x]) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Flood fill アルゴリズム（埋まっているセル用）
 */
function floodFill(grid: boolean[][], visited: boolean[][], x: number, y: number): number {
  const size = grid.length;
  if (x < 0 || x >= size || y < 0 || y >= size) return 0;
  if (visited[y][x] || !grid[y][x]) return 0;

  visited[y][x] = true;
  let count = 1;

  // 4方向に探索
  count += floodFill(grid, visited, x + 1, y);
  count += floodFill(grid, visited, x - 1, y);
  count += floodFill(grid, visited, x, y + 1);
  count += floodFill(grid, visited, x, y - 1);

  return count;
}

/**
 * Flood fill アルゴリズム（空セル用）
 */
function floodFillEmpty(grid: boolean[][], visited: boolean[][], x: number, y: number): void {
  const size = grid.length;
  if (x < 0 || x >= size || y < 0 || y >= size) return;
  if (visited[y][x] || grid[y][x]) return; // 既に訪問済み or 埋まっている

  visited[y][x] = true;

  // 4方向に探索
  floodFillEmpty(grid, visited, x + 1, y);
  floodFillEmpty(grid, visited, x - 1, y);
  floodFillEmpty(grid, visited, x, y + 1);
  floodFillEmpty(grid, visited, x, y - 1);
}

/**
 * グリッドをブロック配列に変換
 */
function gridToBlocks(grid: boolean[][]): Omit<Block, 'color'>[] {
  const blocks: Omit<Block, 'color'>[] = [];

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x]) {
        blocks.push({ x, y });
      }
    }
  }

  return blocks;
}
