"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from '@/lib/utils';

interface KpiCardProps {
    title: string;
    value: React.ReactNode; // Allow ReactNode
    description: React.ReactNode; // Allow ReactNode
    icon: React.ReactNode;
    className?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, description, icon, className }) => {
    return (
        <Card className={cn("shadow-lg transition-all duration-300 hover:shadow-xl border-border bg-card/80 backdrop-blur-sm", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-foreground">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </CardContent>
        </Card>
    );
};

export default KpiCard;