"use client";

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Capsule } from '@react-three/drei';

interface GameCapsule3DProps {
  color?: string;
  size?: [number, number, number]; // radius, length, capSegments
  rotationSpeed?: number;
}

const RotatingCapsule: React.FC<GameCapsule3DProps> = ({ color = '#00BFFF', size = [0.08, 0.2, 4], rotationSpeed = 0.02 }) => {
  const meshRef = useRef<any>();
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed;
    }
  });

  return (
    <Capsule ref={meshRef} args={size}>
      <meshStandardMaterial color={color} />
    </Capsule>
  );
};

const GameCapsule3D: React.FC<GameCapsule3DProps> = ({ color, size, rotationSpeed }) => {
  return (
    <div className="w-8 h-8 flex items-center justify-center"> {/* Fixed size for the canvas */}
      <Canvas camera={{ position: [0, 0, 0.5], fov: 75 }} flat>
        <ambientLight intensity={0.5} />
        <pointLight position={[1, 1, 1]} intensity={1} />
        <RotatingCapsule color={color} size={size} rotationSpeed={rotationSpeed} />
      </Canvas>
    </div>
  );
};

export default GameCapsule3D;