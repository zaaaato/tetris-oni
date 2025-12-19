import { useRef } from 'react';
import { Mesh } from 'three';
import { RoundedBox } from '@react-three/drei';
import { GAME_CONFIG } from '../game/config';

type BlockProps = {
  position: [number, number, number];
  color: string;
  isActive?: boolean; // アクティブなテトリミノかどうか（未使用だが互換性のため残す）
};

export function Block({ position, color }: BlockProps) {
  const meshRef = useRef<Mesh>(null);

  return (
    <RoundedBox
      ref={meshRef}
      args={[GAME_CONFIG.BLOCK_SIZE * 0.85, GAME_CONFIG.BLOCK_SIZE * 0.85, GAME_CONFIG.BLOCK_SIZE * 0.85]}
      radius={0.1}
      smoothness={4}
      position={position}
    >
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        roughness={0.2}
        metalness={0.1}
      />
    </RoundedBox>
  );
}
