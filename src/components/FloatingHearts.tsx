import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

export function FloatingHearts() {
  const pointsRef = useRef<THREE.Points>(null);

  // ランダムなハートの位置を生成
  const particles = useMemo(() => {
    const positions = new Float32Array(50 * 3);
    const velocities = new Float32Array(50);

    for (let i = 0; i < 50; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30; // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20; // z
      velocities[i] = Math.random() * 0.02 + 0.01;
    }

    return { positions, velocities };
  }, []);

  // アニメーション
  useFrame(() => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < 50; i++) {
        positions[i * 3 + 1] += particles.velocities[i]; // y軸方向に上昇

        // 上まで行ったらリセット
        if (positions[i * 3 + 1] > 20) {
          positions[i * 3 + 1] = -20;
        }
      }

      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <Points ref={pointsRef} positions={particles.positions} stride={3}>
      <PointMaterial
        transparent
        color="#FFB3E6"
        size={0.3}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}
