// ゲーム設定（調整可能）
export const GAME_CONFIG = {
  // フィールド設定
  FIELD_WIDTH: 20,
  FIELD_HEIGHT: 40,

  // テトリミノ設定
  MIN_TETROMINO_SIZE: 4, // 最小4x4
  MAX_TETROMINO_SIZE: 8, // 最大8x8

  // ゲーム速度
  INITIAL_FALL_SPEED: 1000, // 初期落下速度（ミリ秒）
  SPEED_INCREASE_RATE: 0.9, // ライン消去時の速度上昇率
  FAST_DROP_SPEED: 50, // 高速落下時の速度

  // 3D表示設定
  BLOCK_SIZE: 1,
  CAMERA_DISTANCE: 40,

  // 色設定（ポップでビビッドなカラー）
  COLORS: [
    '#FF1493', // ディープピンク
    '#00CED1', // ダークターコイズ
    '#7FFF00', // チャートリューズ（蛍光グリーン）
    '#FFD700', // ゴールド
    '#9370DB', // ミディアムパープル
    '#FF6347', // トマトレッド
    '#FF69B4', // ホットピンク
    '#00FA9A', // ミディアムスプリンググリーン
    '#FFA500', // オレンジ
    '#8A2BE2', // ブルーバイオレット
    '#00FFFF', // シアン（アクア）
    '#FF4500', // オレンジレッド
  ],

  // 音量設定
  SOUND_VOLUME: 0.3,
};
