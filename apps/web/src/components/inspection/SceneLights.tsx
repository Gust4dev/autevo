'use client';

export function SceneLights() {
  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.4} color="#ffffff" />

      {/* Main key light - simulates softbox from above-front */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.8}
        color="#ffffff"
        castShadow={false}
      />

      {/* Fill light - opposite side to key light */}
      <directionalLight
        position={[-5, 4, -3]}
        intensity={0.4}
        color="#f0f0ff"
        castShadow={false}
      />

      {/* Rim light - from behind for edge definition */}
      <directionalLight
        position={[0, 3, -8]}
        intensity={0.3}
        color="#ffffff"
        castShadow={false}
      />

      {/* Ground bounce - subtle warm fill from below */}
      <directionalLight
        position={[0, -2, 0]}
        intensity={0.15}
        color="#fff5e6"
        castShadow={false}
      />
    </>
  );
}
