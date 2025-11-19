"use client";

import React from 'react';
// As importações de @react-three/fiber, @react-three/drei e three foram comentadas temporariamente.
// import { Canvas, useFrame } from '@react-three/fiber';
// import { OrbitControls } from '@react-three/drei';
// import { Mesh } from 'three';

interface GameCapsule3DProps {
    color?: string;
    size?: [number, number, number]; // width, height, depth
    rotationSpeed?: number;
}

// O componente Capsule foi comentado temporariamente.
// const Capsule: React.FC<GameCapsule3DProps> = ({ color = '#00BFFF', size = [0.1, 0.2, 0.05], rotationSpeed = 0.01 }) => {
//     const meshRef = useRef<Mesh>(null);

//     useFrame(() => {
//         if (meshRef.current) {
//             meshRef.current.rotation.y += rotationSpeed;
//             meshRef.current.rotation.x += rotationSpeed / 2;
//         }
//     });

//     return (
//         <mesh ref={meshRef}>
//             <capsuleGeometry args={[size[0], size[1], 4, 8]} /> {/* radius, length, capSegments, radialSegments */}
//             <meshStandardMaterial color={color} />
//         </mesh>
//     );
// };

const GameCapsule3D: React.FC<GameCapsule3DProps> = (props) => {
    return (
        <div className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground">
            3D
        </div>
    );
};

export default GameCapsule3