import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Clock, Flame, ChevronRight, Play, BarChart2, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format, subDays, startOfDay, isSameDay, parseISO } from 'date-fns';
import Card from './ui/Card';
import Button from './ui/Button';
import StatBadge from './ui/StatBadge';
import DataRow from './ui/DataRow';
import { workoutHistory as initialMockData } from '../data/mockData';

const Dashboard = () => {
    const [history, setHistory] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('workoutHistory');
        if (saved) {
            setHistory(JSON.parse(saved));
        } else {
            setHistory(initialMockData);
        }
        setLoading(false);
    }, []);

    // Process data for charts
    const chartData = useMemo(() => {
        if (loading) return [];

        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = subDays(new Date(), 6 - i);
            return {
                date: d,
                label: format(d, 'EEE'), // Mon, Tue...
                volume: 0,
                reps: 0,
                sets: 0
            };
        });

        // Flatten history into a list of sessions
        const allSessions = [];
        Object.values(history).forEach(sessions => {
            sessions.forEach(session => {
                allSessions.push(session);
            });
        });

        // Aggregate data
        allSessions.forEach(session => {
            const sessionDate = parseISO(session.date);
            const dayStat = last7Days.find(d => isSameDay(d.date, sessionDate));

            if (dayStat) {
                const sessionVolume = session.sets.reduce((acc, set) => acc + (parseFloat(set.weight) * parseFloat(set.reps)), 0);
                const sessionReps = session.sets.reduce((acc, set) => acc + parseFloat(set.reps), 0);

                dayStat.volume += sessionVolume;
                dayStat.reps += sessionReps;
                dayStat.sets += session.sets.length;
            }
        });

        return last7Days;
    }, [history, loading]);

    // Calculate total stats
    const stats = useMemo(() => {
        let totalWorkouts = 0;
        let totalVolume = 0;

        Object.values(history).forEach(sessions => {
            totalWorkouts += sessions.length;
            sessions.forEach(session => {
                totalVolume += session.sets.reduce((acc, set) => acc + (parseFloat(set.weight) * parseFloat(set.reps)), 0);
            });
        });

        return { totalWorkouts, totalVolume };
    }, [history]);

    if (loading) return <div className="p-8 text-center text-zinc-500">Loading stats...</div>;

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            {/* Welcome Section */}
            <div>
                <h2 className="text-3xl font-bold text-white mb-1">Good Evening,</h2>
                <p className="text-zinc-400">Ready to crush your goals?</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="space-y-2">
                    <div className="flex items-center space-x-2 text-emerald-400">
                        <Activity size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Workouts</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.totalWorkouts}</p>
                </Card>
                <Card className="space-y-2">
                    <div className="flex items-center space-x-2 text-orange-400">
                        <Flame size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Volume (kg)</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{(stats.totalVolume / 1000).toFixed(1)}k</p>
                </Card>
            </div>

            {/* Volume Chart */}
            <Card className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <BarChart2 size={20} className="text-emerald-400" />
                        Weekly Volume
                    </h3>
                </div>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis
                                dataKey="label"
                                stroke="#52525b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                cursor={{ fill: '#27272a' }}
                            />
                            <Bar
                                dataKey="volume"
                                fill="#10b981"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Reps Chart */}
            <Card className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <TrendingUp size={20} className="text-orange-400" />
                        Activity (Reps)
                    </h3>
                </div>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorReps" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="label"
                                stroke="#52525b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="reps"
                                stroke="#fb923c"
                                fillOpacity={1}
                                fill="url(#colorReps)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Active Workout Card */}
            <Card className="relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Flame size={120} />
                </div>
                <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <StatBadge label="Next Up" value="Push Day" color="emerald" />
                            <h3 className="text-xl font-bold text-white mt-2">Chest & Triceps</h3>
                        </div>
                    </div>

                    <div className="flex space-x-4 text-sm text-zinc-400">
                        <div className="flex items-center space-x-1">
                            <Clock size={14} />
                            <span>45 min</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <TrendingUp size={14} />
                            <span>5 Exercises</span>
                        </div>
                    </div>

                    <Button variant="primary" className="w-full" icon={Play}>
                        Start Workout
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;
