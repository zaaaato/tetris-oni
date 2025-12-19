import { useState, useEffect, useCallback, useRef } from 'react';
import { Scene } from './Scene';
import {
  createInitialGameState,
  moveLeft,
  moveRight,
  moveDown,
  hardDrop,
  resetGame,
  togglePause,
  rotateClockwise,
  rotateCounterClockwise,
  holdTetromino,
} from '../game/gameLogic';
import { GameState } from '../game/types';
import { GAME_CONFIG } from '../game/config';
import {
  playMoveSound,
  playDropSound,
  playClearSound,
  playGameOverSound,
  playLevelUpSound,
  playLockSound,
  playErrorSound,
} from '../sounds/soundEffects';

export function Game() {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [fallSpeed, setFallSpeed] = useState(GAME_CONFIG.INITIAL_FALL_SPEED);
  const previousScoreRef = useRef(0);
  const previousLevelRef = useRef(1);
  const previousGameOverRef = useRef(false);

  // ゲームループ（自動落下）
  useEffect(() => {
    if (gameState.isGameOver || gameState.isPaused) return;

    const interval = setInterval(() => {
      setGameState((prev) => moveDown(prev));
    }, fallSpeed);

    return () => clearInterval(interval);
  }, [gameState.isGameOver, gameState.isPaused, fallSpeed]);

  // スコアに応じて速度を調整
  useEffect(() => {
    const newSpeed = GAME_CONFIG.INITIAL_FALL_SPEED * Math.pow(GAME_CONFIG.SPEED_INCREASE_RATE, gameState.level - 1);
    setFallSpeed(Math.max(newSpeed, 100)); // 最低100ms
  }, [gameState.level]);

  // ゲーム状態の変化を監視して効果音を鳴らす
  useEffect(() => {
    // スコアが上がった（ライン消去）
    if (gameState.score > previousScoreRef.current) {
      const scoreDiff = gameState.score - previousScoreRef.current;
      // スコア差からライン数を推定（簡易的）
      const estimatedLines = scoreDiff >= 1600 ? 4 : scoreDiff >= 900 ? 3 : scoreDiff >= 400 ? 2 : 1;
      playClearSound(estimatedLines);
      playLockSound();
    } else if (gameState.score === previousScoreRef.current && previousScoreRef.current > 0) {
      // スコアが変わらず、テトリミノが変わった（ロックのみ）
      // 自動落下でロックされた場合を検知するため、前のフレームと比較
    }

    // レベルアップ
    if (gameState.level > previousLevelRef.current) {
      playLevelUpSound();
    }

    // ゲームオーバー
    if (gameState.isGameOver && !previousGameOverRef.current) {
      playGameOverSound();
    }

    previousScoreRef.current = gameState.score;
    previousLevelRef.current = gameState.level;
    previousGameOverRef.current = gameState.isGameOver;
  }, [gameState.score, gameState.level, gameState.isGameOver]);

  // キーボード入力
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (gameState.isGameOver) {
        if (event.key === 'r' || event.key === 'R') {
          setGameState(resetGame());
        }
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          setGameState((prev) => {
            const newState = moveLeft(prev);
            if (newState !== prev) playMoveSound();
            return newState;
          });
          break;
        case 'ArrowRight':
          event.preventDefault();
          setGameState((prev) => {
            const newState = moveRight(prev);
            if (newState !== prev) playMoveSound();
            return newState;
          });
          break;
        case 'ArrowDown':
          event.preventDefault();
          setGameState((prev) => {
            const newState = moveDown(prev);
            if (newState !== prev) playMoveSound();
            return newState;
          });
          break;
        case 'ArrowUp':
        case ' ':
          event.preventDefault();
          playDropSound();
          setGameState((prev) => hardDrop(prev));
          break;
        case 'z':
        case 'Z':
          event.preventDefault();
          setGameState((prev) => {
            const newState = rotateCounterClockwise(prev);
            if (newState !== prev) playMoveSound();
            return newState;
          });
          break;
        case 'x':
        case 'X':
          event.preventDefault();
          setGameState((prev) => {
            const newState = rotateClockwise(prev);
            if (newState !== prev) playMoveSound();
            return newState;
          });
          break;
        case 'p':
        case 'P':
          event.preventDefault();
          setGameState((prev) => togglePause(prev));
          break;
        case 'r':
        case 'R':
          event.preventDefault();
          setGameState(resetGame());
          break;
        case 'c':
        case 'C':
        case 'Shift':
          event.preventDefault();
          setGameState((prev) => {
            const newState = holdTetromino(prev);
            if (newState !== prev) {
              playMoveSound();
            } else {
              // 交換できなかった場合はエラー音
              playErrorSound();
            }
            return newState;
          });
          break;
      }
    },
    [gameState.isGameOver]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // テトリミノのプレビュー表示用のヘルパー関数
  const renderTetrominoPreview = (tetromino: typeof gameState.nextTetromino, label: string, opacity: number = 1) => {
    if (!tetromino) return null;

    const minX = Math.min(...tetromino.blocks.map(b => b.x));
    const maxX = Math.max(...tetromino.blocks.map(b => b.x));
    const minY = Math.min(...tetromino.blocks.map(b => b.y));
    const maxY = Math.max(...tetromino.blocks.map(b => b.y));
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const cellSize = 12;

    return (
      <div style={{ marginBottom: '15px', opacity }}>
        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {label}
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.1) 0%, rgba(102, 126, 234, 0.1) 100%)',
          padding: '12px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'inline-block',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
            gap: '2px',
          }}>
            {Array.from({ length: height }).map((_, y) =>
              Array.from({ length: width }).map((_, x) => {
                const hasBlock = tetromino.blocks.some(
                  b => b.x - minX === x && b.y - minY === y
                );
                const block = tetromino.blocks.find(
                  b => b.x - minX === x && b.y - minY === y
                );
                return (
                  <div
                    key={`${x}-${y}`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      background: hasBlock ? block?.color : 'transparent',
                      borderRadius: '3px',
                      boxShadow: hasBlock ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                    }}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Scene gameState={gameState} />

      {/* UI オーバーレイ（左側） */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          padding: '25px 30px',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          pointerEvents: 'none',
          animation: 'fadeIn 0.6s ease-out, float 3s ease-in-out infinite',
        }}
      >
        <div style={{
          fontSize: '32px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '18px',
          fontFamily: 'Poppins, sans-serif',
          letterSpacing: '1px',
          textShadow: '0 2px 10px rgba(102, 126, 234, 0.3)',
        }}>
          ✨ TETRIS ✨
        </div>

        <div style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '20px',
        }}>
          <div style={{
            flex: 1,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.1) 100%)',
            padding: '12px 16px',
            borderRadius: '16px',
            border: '1px solid rgba(102, 126, 234, 0.3)',
          }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Score
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff', fontFamily: 'Poppins, sans-serif' }}>
              {gameState.score}
            </div>
          </div>

          <div style={{
            flex: 1,
            background: 'linear-gradient(135deg, rgba(249, 147, 251, 0.2) 0%, rgba(79, 172, 254, 0.1) 100%)',
            padding: '12px 16px',
            borderRadius: '16px',
            border: '1px solid rgba(249, 147, 251, 0.3)',
          }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Level
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff', fontFamily: 'Poppins, sans-serif' }}>
              {gameState.level}
            </div>
          </div>
        </div>

        <div style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.8)',
          lineHeight: '1.8',
          fontFamily: 'Quicksand, sans-serif',
          fontWeight: '500',
        }}>
          <div style={{ marginBottom: '3px' }}>← → : 移動</div>
          <div style={{ marginBottom: '3px' }}>↓ : 下移動</div>
          <div style={{ marginBottom: '3px' }}>↑/Space : ドロップ</div>
          <div style={{ marginBottom: '3px' }}>Z/X : 回転</div>
          <div style={{ marginBottom: '3px' }}>C/Shift : ホールド</div>
          <div style={{ marginBottom: '3px' }}>P : 停止 | R : リセット</div>
        </div>
      </div>

      {/* ゲームオーバー表示 */}
      {gameState.isGameOver && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)',
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
            padding: '50px 70px',
            borderRadius: '32px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            animation: 'fadeIn 0.5s ease-out, pulse 2s ease-in-out infinite',
            zIndex: 1000,
            width: 'fit-content',
            margin: '0 auto',
          }}
        >
          <div style={{
            fontSize: '64px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 50%, #c44569 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '20px',
            fontFamily: 'Poppins, sans-serif',
            letterSpacing: '2px',
            textShadow: '0 4px 20px rgba(255, 107, 107, 0.4)',
          }}>
            💔 GAME OVER
          </div>
          <div style={{
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '600',
            fontFamily: 'Quicksand, sans-serif',
            marginTop: '10px',
          }}>
            Press <span style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '4px 12px',
              borderRadius: '8px',
              fontWeight: '700',
            }}>R</span> to restart
          </div>
        </div>
      )}

      {/* 一時停止表示 */}
      {gameState.isPaused && !gameState.isGameOver && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)',
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
            padding: '50px 70px',
            borderRadius: '32px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            animation: 'fadeIn 0.5s ease-out, glow 2s ease-in-out infinite',
            zIndex: 1000,
            width: 'fit-content',
            margin: '0 auto',
          }}
        >
          <div style={{
            fontSize: '64px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: 'Poppins, sans-serif',
            letterSpacing: '2px',
            textShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
          }}>
            ⏸️ PAUSED
          </div>
        </div>
      )}

      {/* ホールドプレビュー（左側下） */}
      <div
        style={{
          position: 'absolute',
          top: 480,
          left: 20,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          padding: '25px 30px',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          pointerEvents: 'none',
          animation: 'fadeIn 0.6s ease-out, float 3s ease-in-out infinite 1s',
        }}
      >
        <div style={{
          fontSize: '18px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #ffa726 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '20px',
          fontFamily: 'Poppins, sans-serif',
          letterSpacing: '1px',
        }}>
          HOLD
        </div>
        {gameState.holdTetromino ? (
          renderTetrominoPreview(gameState.holdTetromino, 'Hold', 1)
        ) : (
          <div style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: '600',
            padding: '20px',
            textAlign: 'center',
            fontStyle: 'italic',
          }}>
            C/Shiftで<br />ホールド
          </div>
        )}
      </div>

      {/* ネクストプレビュー（右側） */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          padding: '25px 30px',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          pointerEvents: 'none',
          animation: 'fadeIn 0.6s ease-out, float 3s ease-in-out infinite 0.5s',
        }}
      >
        <div style={{
          fontSize: '18px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '20px',
          fontFamily: 'Poppins, sans-serif',
          letterSpacing: '1px',
        }}>
          NEXT
        </div>
        {renderTetrominoPreview(gameState.nextTetromino, 'Next', 1)}
        {renderTetrominoPreview(gameState.nextNextTetromino, 'After Next', 0.7)}
      </div>
    </div>
  );
}
