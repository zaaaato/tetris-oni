import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import { GameField } from './GameField';
import { FloatingHearts } from './FloatingHearts';
import { GameState } from '../game/types';
import { GAME_CONFIG } from '../game/config';
import * as THREE from 'three';

// THREEをグローバルに登録（GameFieldコンポーネントで使用）
(window as any).THREE = THREE;

type SceneProps = {
  gameState: GameState;
};

export function Scene({ gameState }: SceneProps) {
  return (
    <Canvas style={{ width: '100vw', height: '100vh' }}>
      <color attach="background" args={['#1a1a2e']} />
      <fog attach="fog" args={['#16213e', 40, 120]} />

      <PerspectiveCamera
        makeDefault
        position={[0, 0, GAME_CONFIG.CAMERA_DISTANCE]}
        fov={60}
      />

      <OrbitControls
        enablePan={true}
        minDistance={25}
        maxDistance={80}
        enableDamping
        dampingFactor={0.05}
      />

      {/* モダンなライティング */}
      <ambientLight intensity={0.6} color="#c8d6e5" />
      <directionalLight position={[10, 10, 5]} intensity={0.8} color="#667eea" castShadow />
      <pointLight position={[-10, 10, -5]} intensity={0.6} color="#f093fb" />
      <pointLight position={[10, -10, 5]} intensity={0.5} color="#4facfe" />
      <pointLight position={[0, 15, 0]} intensity={0.4} color="#00f2fe" />

      {/* キラキラ星（より多く、より美しく） */}
      <Stars
        radius={120}
        depth={60}
        count={5000}
        factor={5}
        saturation={0.3}
        fade
        speed={1}
      />

      {/* 浮遊するハート */}
      <FloatingHearts />

      <GameField gameState={gameState} />
    </Canvas>
  );
}
