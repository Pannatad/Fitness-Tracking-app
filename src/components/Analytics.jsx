import React, { useMemo, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from 'recharts';
import { Activity, Calendar, TrendingUp, Zap } from 'lucide-react';
import { exercises, workoutHistory as initialMockData } from '../data/mockData';
import { getConsistencyData, getMuscleRecoveryStatus, getOneRMTrend } from '../utils/statsCalculators';

const Analytics = () => {
    // Load data
    const history = useMemo(() => {
        const saved = localStorage.getItem('workoutHistory');
        return saved ? JSON.parse(saved) : initialMockData;
    }, []);

    const customExercises = useMemo(() => {
        const saved = localStorage.getItem('customExercises');
        return saved ? JSON.parse(saved) : [];
    }, []);

    const allExercises = [...exercises, ...customExercises];

    // State
    const [selectedTrendExercise, setSelectedTrendExercise] = useState(allExercises[0]?.id || '');

    // Derived Data
    const consistencyData = useMemo(() => getConsistencyData(history), [history]);
    const muscleStatus = useMemo(() => getMuscleRecoveryStatus(history), [history]);
    const trendData = useMemo(() => getOneRMTrend(history, selectedTrendExercise), [history, selectedTrendExercise]);

    // Helper for Consistency Grid
    const renderConsistencyGrid = () => {
        const days = [];
        const today = new Date();
        // Generate last 126 days (18 weeks) for mobile fit
        for (let i = 125; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const volume = consistencyData[dateStr] || 0;

            let colorClass = 'bg-zinc-800';
            if (volume > 0) colorClass = 'bg-emerald-900';
            if (volume > 5000) colorClass = 'bg-emerald-700';
            if (volume > 10000) colorClass = 'bg-emerald-500';
            if (volume > 20000) colorClass = 'bg-emerald-400';

            days.push(
                <div
                    key={dateStr}
                    className={`w-3 h-3 rounded-sm ${colorClass}`}
                    title={`${dateStr}: ${volume}kg`}
                />
            );
        }
        return days;
    };

    return (
        <div className="min-h-screen bg-cyber-black pb-24 animate-fade-in p-6 space-y-8">
            <h1 className="text-2xl font-bold text-white mb-6">Analytics</h1>

            {/* Consistency Graph */}
            <div className="bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Calendar size={18} className="text-emerald-400" />
                        Consistency
                    </h3>
                    <span className="text-xs text-zinc-500">Last 18 Weeks</span>
                </div>
                <div className="flex flex-wrap gap-1 justify-center">
                    {renderConsistencyGrid()}
                </div>
            </div>

            {/* Muscle Recovery Heatmap */}
            <div className="bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Zap size={18} className="text-orange-400" />
                        Recovery Heatmap
                    </h3>
                </div>

                <div className="flex justify-center relative z-10">
                    {/* Simple SVG Body Representation */}
                    <svg width="200" height="300" viewBox="0 0 200 300" className="opacity-90">
                        {/* Head */}
                        <circle cx="100" cy="30" r="20" fill="#333" />

                        {/* Chest (Pecs) */}
                        <path d="M70 60 Q100 80 130 60 L120 100 Q100 110 80 100 Z"
                            fill={muscleStatus['Chest'] === 'red' ? '#ef4444' : muscleStatus['Chest'] === 'orange' ? '#f97316' : '#10b981'}
                            className="transition-colors duration-500"
                        />

                        {/* Shoulders */}
                        <circle cx="60" cy="65" r="15"
                            fill={muscleStatus['Shoulders'] === 'red' ? '#ef4444' : muscleStatus['Shoulders'] === 'orange' ? '#f97316' : '#10b981'}
                        />
                        <circle cx="140" cy="65" r="15"
                            fill={muscleStatus['Shoulders'] === 'red' ? '#ef4444' : muscleStatus['Shoulders'] === 'orange' ? '#f97316' : '#10b981'}
                        />

                        {/* Abs */}
                        <rect x="85" y="105" width="30" height="60" rx="5"
                            fill={muscleStatus['Abs'] === 'red' ? '#ef4444' : muscleStatus['Abs'] === 'orange' ? '#f97316' : '#10b981'}
                        />

                        {/* Arms (Biceps/Triceps simplified) */}
                        <rect x="40" y="80" width="15" height="50" rx="5"
                            fill={muscleStatus['Biceps'] === 'red' ? '#ef4444' : muscleStatus['Biceps'] === 'orange' ? '#f97316' : '#10b981'}
                        />
                        <rect x="145" y="80" width="15" height="50" rx="5"
                            fill={muscleStatus['Biceps'] === 'red' ? '#ef4444' : muscleStatus['Biceps'] === 'orange' ? '#f97316' : '#10b981'}
                        />

                        {/* Legs (Quads) */}
                        <rect x="70" y="170" width="25" height="80" rx="5"
                            fill={muscleStatus['Quads'] === 'red' ? '#ef4444' : muscleStatus['Quads'] === 'orange' ? '#f97316' : '#10b981'}
                        />
                        <rect x="105" y="170" width="25" height="80" rx="5"
                            fill={muscleStatus['Quads'] === 'red' ? '#ef4444' : muscleStatus['Quads'] === 'orange' ? '#f97316' : '#10b981'}
                        />
                    </svg>
                </div>

                {/* Legend */}
                <div className="flex justify-center space-x-4 mt-4 text-xs font-bold">
                    <div className="flex items-center space-x-1"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-red-400">Tired (24h)</span></div>
                    <div className="flex items-center space-x-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div><span className="text-orange-400">Recovering</span></div>
                    <div className="flex items-center space-x-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-emerald-400">Ready</span></div>
                </div>
            </div>

            {/* 1RM Trend Chart */}
            <div className="bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-400" />
                        Est. 1RM Trend
                    </h3>
                </div>

                <div className="mb-4">
                    <select
                        value={selectedTrendExercise}
                        onChange={(e) => setSelectedTrendExercise(e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-white text-sm outline-none focus:border-blue-500"
                    >
                        {allExercises.map(ex => (
                            <option key={ex.id} value={ex.id}>{ex.name}</option>
                        ))}
                    </select>
                </div>

                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="date" hide />
                            <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value) => [`${value} kg`, 'Est. 1RM']}
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#60a5fa"
                                strokeWidth={3}
                                dot={{ fill: '#60a5fa', r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-xs text-zinc-500 mt-4 text-center">
                    Based on Epley Formula: 1RM = w(1 + r/30)
                </p>
            </div>
        </div>
    );
};

export default Analytics;
