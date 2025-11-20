"use client";

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import { Mesh } from 'three';

interface ModelProps {
  path: string;
}

const Model: React.FC<ModelProps> = ({ path }) => {
  const group = useRef<Mesh>(null);
  const { scene } = useGLTF(path);

  useFrame(() => {
    if (group.current) {
      group.current.rotation.y += 0.005; // Adjust rotation speed here
    }
  });

  return (
    <group ref={group} dispose={null} scale={0.5}> {/* Adjust scale as needed */}
      <primitive object={scene} />
    </group>
  );
};

const Controller3D: React.FC = () => {
  return (
    <div className="w-full h-48 md:h-64 lg:h-80 bg-transparent rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 2.5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <Environment preset="city" /> {/* Adds realistic lighting environment */}
        <Model path="/ps5.controller.glb" />
        <OrbitControls enableZoom={false} enablePan={false} /> {/* Allows rotation with mouse, but disables zoom/pan */}
      </Canvas>
    </div>
  );
};

export default Controller3D;