import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WLSalesPlatformEntry } from '@/data/trackingData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatNumber } from '@/lib/utils';
import { DollarSign } from 'lucide-react';

interface SalesByTypeChartProps {
    data: WLSalesPlatformEntry[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const SalesByTypeChart: React.FC<SalesByTypeChartProps> = ({ data }) => {
    const chartData = useMemo(() => {
        const summary = data.reduce((acc, entry) => {
            const type = entry.saleType || 'Padrão';
            acc[type] = (acc[type] || 0) + entry.sales;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(summary).map(([name, value], index) => ({
            name,
            value,
            color: COLORS[index % COLORS.length],
        }));
    }, [data]);

    if (chartData.length === 0 || chartData.every(d => d.value === 0)) {
        return (
            <Card className="shadow-md h-full">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center">
                        <DollarSign className="h-5 w-5 mr-2 text-gogo-green" /> Vendas por Tipo
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-48 text-gray-500">
                    Nenhum dado de vendas disponível.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-md h-full">
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-gogo-green" /> Vendas por Tipo
                </CardTitle>
            </CardHeader>
            <CardContent className="h-64 p-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatNumber(value as number)} />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default SalesByTypeChart;