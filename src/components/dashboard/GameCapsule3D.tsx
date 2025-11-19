"use client";

import React from 'react';

interface GameCapsule3DProps {
    color?: string;
    size?: [number, number, number]; // width, height, depth
    rotationSpeed?: number;
}

const GameCapsule3D: React.FC<GameCapsule3DProps> = (props) => {
    return (
        <div className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground">
            3D
        </div>
    );
};

export default GameCapsule3D