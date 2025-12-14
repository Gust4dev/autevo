'use client';

import { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Mesh, MeshMatcapMaterial, Vector3, Matrix3, Object3D } from 'three';
import { useInspectionStore } from '@/stores/useInspectionStore';

interface CarModelProps {
  onSurfaceClick: (point: [number, number, number], normal: [number, number, number]) => void;
}

// Preload texture and model outside component
const TEXTURE_PATH = '/textures/clay-white.png';
const DEFAULT_MODEL_PATH = '/models/sedan.glb';

export function CarModel({ onSurfaceClick }: CarModelProps) {
  const meshRef = useRef<Object3D>(null);
  const vehicleType = useInspectionStore((state) => state.vehicleType);
  const { invalidate } = useThree();
  const [processedScene, setProcessedScene] = useState<Object3D | null>(null);

  // Load model based on vehicle type
  const modelPath = `/models/${vehicleType}.glb`;
  const { scene } = useGLTF(modelPath);
  
  // Load MatCap texture
  const matcapTexture = useTexture(TEXTURE_PATH);

  // Process scene in useEffect to avoid setState during render
  useEffect(() => {
    if (!scene || !matcapTexture) return;

    const material = new MeshMatcapMaterial({
      matcap: matcapTexture,
      color: '#e8e6e1',
    });

    const clone = scene.clone();
    clone.traverse((child) => {
      if (child instanceof Mesh) {
        child.material = material;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    setProcessedScene(clone);

    // Cleanup
    return () => {
      material.dispose();
    };
  }, [scene, matcapTexture]);

  const handleClick = useCallback(
    (event: { stopPropagation: () => void; point: Vector3; face?: { normal: Vector3 } | null }) => {
      event.stopPropagation();

      if (!event.face || !meshRef.current) return;

      // Get the hit point in world coordinates
      const hitPoint = event.point.clone();

      // Get the face normal and transform it to world space
      const normal = event.face.normal.clone();
      
      // Check if the ref has matrixWorld (Object3D always does)
      const normalMatrix = new Matrix3().getNormalMatrix(meshRef.current.matrixWorld);
      normal.applyMatrix3(normalMatrix).normalize();

      // Add small offset along normal to prevent z-fighting
      const offset = normal.clone().multiplyScalar(0.015);
      hitPoint.add(offset);

      onSurfaceClick(
        [hitPoint.x, hitPoint.y, hitPoint.z],
        [normal.x, normal.y, normal.z]
      );

      invalidate(); // Force re-render
    },
    [onSurfaceClick, invalidate]
  );

  if (!processedScene) {
    return null;
  }

  return (
    <primitive
      ref={meshRef}
      object={processedScene}
      onClick={handleClick}
      scale={1}
      position={[0, 0, 0]}
    />
  );
}

// Preload sedan model and texture
useGLTF.preload(DEFAULT_MODEL_PATH);
useTexture.preload(TEXTURE_PATH);

