'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useProgress, Html } from '@react-three/drei';
import { useInspectionStore } from '@/stores/useInspectionStore';
import { CarModel } from './CarModel';
import { DamageMarker } from './DamageMarker';
import { SceneLights } from './SceneLights';

interface CarViewerShellProps {
  orderId: string;
  inspectionId?: string;
  vehicleType?: 'sedan' | 'suv' | 'hatch';
  onError?: (error: Error) => void;
}

function LoadingPlaceholder() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">
          Carregando modelo 3D... {progress.toFixed(0)}%
        </p>
      </div>
    </Html>
  );
}

function CarScene() {
  const markers = useInspectionStore((state) => state.markers);
  const selectedMarkerId = useInspectionStore((state) => state.selectedMarkerId);
  const isAddingMarker = useInspectionStore((state) => state.isAddingMarker);
  const addMarker = useInspectionStore((state) => state.addMarker);
  const selectMarker = useInspectionStore((state) => state.selectMarker);

  const handleCarClick = useCallback(
    (point: [number, number, number], normal: [number, number, number]) => {
      if (isAddingMarker) {
        addMarker(point, normal);
      }
    },
    [isAddingMarker, addMarker]
  );

  const handleMarkerClick = useCallback(
    (markerId: string) => {
      selectMarker(markerId);
    },
    [selectMarker]
  );

  return (
    <>
      <SceneLights />
      
      <CarModel onSurfaceClick={handleCarClick} />
      
      {markers.map((marker) => (
        <DamageMarker
          key={marker.id}
          marker={marker}
          isSelected={marker.id === selectedMarkerId}
          onClick={() => handleMarkerClick(marker.id)}
        />
      ))}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={10}
        maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going below ground
        minPolarAngle={0.2} // Prevent going completely overhead
        enablePan={false} // Keep car centered
      />

      {/* Ground plane for visual reference */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a1a1a" transparent opacity={0.3} />
      </mesh>
    </>
  );
}

export function CarViewerShell({
  orderId,
  inspectionId,
  vehicleType = 'sedan',
  onError,
}: CarViewerShellProps) {
  const [webglSupported, setWebglSupported] = useState(true);
  const setInspectionContext = useInspectionStore((state) => state.setInspectionContext);
  const setVehicleType = useInspectionStore((state) => state.setVehicleType);

  useEffect(() => {
    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        setWebglSupported(false);
      }
    } catch {
      setWebglSupported(false);
    }

    // Set context
    setInspectionContext(inspectionId ?? null, orderId);
    setVehicleType(vehicleType);
  }, [orderId, inspectionId, vehicleType, setInspectionContext, setVehicleType]);

  if (!webglSupported) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/50 p-8">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">
            WebGL não suportado
          </p>
          <p className="text-sm text-muted-foreground">
            Seu navegador não suporta visualização 3D.
            Use a vistoria 2D alternativa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full min-h-[400px] bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-lg overflow-hidden">
      <Canvas
        dpr={[1, 2]} // Limit pixel ratio for performance
        frameloop="demand" // Only render when needed
        gl={{
          powerPreference: 'high-performance',
          antialias: false,
          stencil: false,
          depth: true,
          alpha: false,
        }}
        camera={{
          fov: 45,
          near: 0.1,
          far: 100,
          position: [2.5, 1.2, 2.5],
        }}
        onError={(error) => {
          console.error('[CarViewer] Canvas error:', error);
          onError?.(new Error('Erro ao renderizar visualização 3D'));
        }}
      >
        <Suspense fallback={<LoadingPlaceholder />}>
          <CarScene />
        </Suspense>
      </Canvas>


    </div>
  );
}


