'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Mesh, Vector3 } from 'three';
import { Html } from '@react-three/drei';
import type { MarkerData } from '@/stores/useInspectionStore';

interface DamageMarkerProps {
  marker: MarkerData;
  isSelected: boolean;
  onClick: () => void;
}

const DAMAGE_COLORS: Record<string, string> = {
  scratch: '#ef4444', // Red
  dent: '#f97316',    // Orange
  crack: '#eab308',   // Yellow
  paint: '#8b5cf6',   // Purple
};

const SEVERITY_SIZES: Record<number, number> = {
  1: 0.015, // Small
  2: 0.02,  // Medium
  3: 0.03,  // Large
};

export function DamageMarker({ marker, isSelected, onClick }: DamageMarkerProps) {
  const meshRef = useRef<Mesh>(null);
  const { invalidate } = useThree();

  // Animate selected marker
  useFrame((state) => {
    if (!meshRef.current) return;
    
    if (isSelected) {
      // Pulsing animation for selected marker
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
      meshRef.current.scale.setScalar(scale);
      invalidate();
    } else {
      meshRef.current.scale.setScalar(1);
    }
  });

  const color = DAMAGE_COLORS[marker.damageType] || DAMAGE_COLORS.scratch;
  const size = SEVERITY_SIZES[marker.severity] || SEVERITY_SIZES[2];

  // Calculate position with normal offset
  const position = new Vector3(...marker.position);
  const normal = new Vector3(...marker.normal);
  const offsetPosition = position.clone().add(normal.multiplyScalar(0.005));

  return (
    <group position={offsetPosition}>
      {/* Main marker sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        renderOrder={1}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isSelected ? 1 : 0.85}
          depthTest={true}
          depthWrite={true}
        />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.5, size * 2, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
        </mesh>
      )}

      {/* Label when selected - smaller and less intrusive */}
      {isSelected && (
        <Html
          position={[0, size * 2.5, 0]}
          center
          distanceFactor={15}
          occlude
          style={{
            pointerEvents: 'none',
          }}
        >
          <div className="bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
            {getDamageLabel(marker.damageType)}
          </div>
        </Html>
      )}
    </group>
  );
}

function getDamageLabel(type: string): string {
  const labels: Record<string, string> = {
    scratch: 'Arranhão',
    dent: 'Amassado',
    crack: 'Trinca',
    paint: 'Pintura',
  };
  return labels[type] || type;
}
