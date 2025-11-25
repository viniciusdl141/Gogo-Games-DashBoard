"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedPanelProps {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}

const AnimatedPanel: React.FC<AnimatedPanelProps> = ({ children, delay = 0, className }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export default AnimatedPanel;