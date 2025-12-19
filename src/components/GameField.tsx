import { GameState } from '../game/types';
import { Block } from './Block';
import { GAME_CONFIG } from '../game/config';
import * as THREE from 'three';

type GameFieldProps = {
  gameState: GameState;
};

export function GameField({ gameState }: GameFieldProps) {
  const { field, currentTetromino } = gameState;

  return (
    <group>
      {/* フィールドのブロック */}
      {field.map((row, y) =>
        row.map((cell, x) => {
          if (cell !== null) {
            return (
              <Block
                key={`field-${x}-${y}`}
                position={[
                  (x - GAME_CONFIG.FIELD_WIDTH / 2 + 0.5) * GAME_CONFIG.BLOCK_SIZE,
                  (GAME_CONFIG.FIELD_HEIGHT / 2 - y - 0.5) * GAME_CONFIG.BLOCK_SIZE,
                  0,
                ]}
                color={cell}
              />
            );
          }
          return null;
        })
      )}

      {/* 現在のテトリミノ */}
      {currentTetromino &&
        currentTetromino.blocks.map((block, index) => {
          const x = currentTetromino.position.x + block.x;
          const y = currentTetromino.position.y + block.y;

          return (
            <Block
              key={`tetromino-${index}`}
              position={[
                (x - GAME_CONFIG.FIELD_WIDTH / 2 + 0.5) * GAME_CONFIG.BLOCK_SIZE,
                (GAME_CONFIG.FIELD_HEIGHT / 2 - y - 0.5) * GAME_CONFIG.BLOCK_SIZE,
                0,
              ]}
              color={block.color}
              isActive={true}
            />
          );
        })}

      {/* フィールドの枠線 */}
      <lineSegments>
        <edgesGeometry
          args={[
            new THREE.BoxGeometry(
              GAME_CONFIG.FIELD_WIDTH * GAME_CONFIG.BLOCK_SIZE,
              GAME_CONFIG.FIELD_HEIGHT * GAME_CONFIG.BLOCK_SIZE,
              GAME_CONFIG.BLOCK_SIZE
            ),
          ]}
        />
        <lineBasicMaterial color="#00f2fe" linewidth={3} />
      </lineSegments>

      {/* より目立つ外枠 */}
      <mesh position={[0, 0, -GAME_CONFIG.BLOCK_SIZE / 2]}>
        <boxGeometry
          args={[
            GAME_CONFIG.FIELD_WIDTH * GAME_CONFIG.BLOCK_SIZE + 0.2,
            GAME_CONFIG.FIELD_HEIGHT * GAME_CONFIG.BLOCK_SIZE + 0.2,
            0.1,
          ]}
        />
        <meshStandardMaterial
          color="#1a1a2e"
          emissive="#667eea"
          emissiveIntensity={0.3}
          opacity={0.3}
          transparent
        />
      </mesh>
    </group>
  );
}
