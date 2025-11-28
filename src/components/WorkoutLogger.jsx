import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    AreaChart,
    Area
} from 'recharts';
import {
    ArrowLeft,
    MoreHorizontal,
    Plus,
    ChevronRight,
    TrendingUp,
    Calendar,
    Dumbbell,
    History,
    Clock,
    X,
    Save,
    Trash2,
    Check,
    Timer,
    Play,
    Pause,
    RotateCcw,
    Activity
} from 'lucide-react';
import { exercises as initialExercises, workoutHistory as initialMockData } from '../data/mockData';

const WorkoutLogger = () => {
    const [activeRoutine, setActiveRoutine] = useState('Push');
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [activeTab, setActiveTab] = useState('Sets'); // Sets, Analyze, 1RM

    // Data State
    const [history, setHistory] = useState(() => {
        const saved = localStorage.getItem('workoutHistory');
        return saved ? JSON.parse(saved) : initialMockData;
    });

    const [customExercises, setCustomExercises] = useState(() => {
        const saved = localStorage.getItem('customExercises');
        return saved ? JSON.parse(saved) : [];
    });

    // Logging State
    const [isLogging, setIsLogging] = useState(false);
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentSets, setCurrentSets] = useState([{ weight: '', reps: '' }]);

    // Editing State
    const [editingSet, setEditingSet] = useState(null);

    // Add Exercise State
    const [isAddingExercise, setIsAddingExercise] = useState(false);
    const [newExerciseName, setNewExerciseName] = useState('');
    const [newExerciseCategory, setNewExerciseCategory] = useState('Push');

    // Timer State
    const [timerActive, setTimerActive] = useState(false);
    const [timerTime, setTimerTime] = useState(90); // Default 90s
    const [showTimer, setShowTimer] = useState(false);
    const timerRef = useRef(null);

    // Persist history changes
    useEffect(() => {
        localStorage.setItem('workoutHistory', JSON.stringify(history));
    }, [history]);

    // Persist custom exercises
    useEffect(() => {
        localStorage.setItem('customExercises', JSON.stringify(customExercises));
    }, [customExercises]);

    // Timer Logic
    useEffect(() => {
        if (timerActive && timerTime > 0) {
            timerRef.current = setInterval(() => {
                setTimerTime((prev) => prev - 1);
            }, 1000);
        } else if (timerTime === 0) {
            setTimerActive(false);
            clearInterval(timerRef.current);
            // Optional: Play sound
        }
        return () => clearInterval(timerRef.current);
    }, [timerActive, timerTime]);

    const startRestTimer = () => {
        setTimerTime(90);
        setTimerActive(true);
        setShowTimer(true);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Helper to format date like "Mon, 17 Nov"
    const formatDate = (dateString) => {
        const options = { weekday: 'short', day: 'numeric', month: 'short' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    // Combined Exercises List
    const allExercises = useMemo(() => {
        return [...initialExercises, ...customExercises];
    }, [customExercises]);

    // Calculate stats comparing the last two sessions
    const stats = useMemo(() => {
        if (!selectedExercise || !history[selectedExercise.id]) return null;

        const exerciseHistory = history[selectedExercise.id];
        if (exerciseHistory.length < 2) return null;

        const current = exerciseHistory[exerciseHistory.length - 1];
        const previous = exerciseHistory[exerciseHistory.length - 2];

        const calculateMetrics = (session) => {
            const sets = session.sets.length;
            const reps = session.sets.reduce((acc, s) => acc + (parseFloat(s.reps) || 0), 0);
            const volume = session.sets.reduce((acc, s) => acc + ((parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0)), 0);
            const avgWeight = volume / reps || 0;
            return { sets, reps, volume, avgWeight };
        };

        const currMetrics = calculateMetrics(current);
        const prevMetrics = calculateMetrics(previous);

        const getDiff = (curr, prev) => {
            const diff = curr - prev;
            const percent = prev === 0 ? 0 : ((diff / prev) * 100).toFixed(1);
            return { value: diff, percent, isPositive: diff >= 0 };
        };

        return {
            current,
            metrics: currMetrics,
            diffs: {
                sets: getDiff(currMetrics.sets, prevMetrics.sets),
                reps: getDiff(currMetrics.reps, prevMetrics.reps),
                volume: getDiff(currMetrics.volume, prevMetrics.volume),
                avgWeight: getDiff(currMetrics.avgWeight, prevMetrics.avgWeight),
            }
        };
    }, [selectedExercise, history]);

    // Analytics Data Preparation
    const analyticsData = useMemo(() => {
        if (!selectedExercise || !history[selectedExercise.id]) return null;

        const exerciseHistory = history[selectedExercise.id];

        // 1. Session Progress (Last 10 sessions)
        const sessionProgress = exerciseHistory.slice(-10).map(session => {
            const volume = session.sets.reduce((acc, s) => acc + ((parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0)), 0);
            const maxWeight = Math.max(...session.sets.map(s => parseFloat(s.weight) || 0));
            return {
                date: formatDate(session.date),
                rawDate: session.date,
                volume,
                maxWeight
            };
        });

        // 2. Consistency Data (Last 365 days mock - actually just mapping existing history to a calendar format)
        // For a real app, we'd need a full year of days. Here we'll just show the days we have data for.
        const consistency = {};
        exerciseHistory.forEach(session => {
            consistency[session.date] = (consistency[session.date] || 0) + 1;
        });

        return { sessionProgress, consistency };
    }, [selectedExercise, history]);


    // Logging Handlers
    const handleAddSet = () => {
        setCurrentSets([...currentSets, { weight: '', reps: '' }]);
    };

    const handleSetChange = (index, field, value) => {
        const newSets = [...currentSets];
        newSets[index][field] = value;
        setCurrentSets(newSets);
    };

    const handleSaveLog = () => {
        if (!selectedExercise) return;

        const s = currentSets[0];
        if (!s.weight || !s.reps) return;

        const validSets = [{
            weight: parseFloat(s.weight),
            reps: parseFloat(s.reps),
            note: s.note,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }];

        setHistory(prev => {
            const exerciseHistory = [...(prev[selectedExercise.id] || [])];
            const existingSessionIndex = exerciseHistory.findIndex(session => session.date === logDate);

            if (existingSessionIndex >= 0) {
                const updatedSession = { ...exerciseHistory[existingSessionIndex] };
                updatedSession.sets = [...updatedSession.sets, ...validSets];
                updatedSession.endTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                exerciseHistory[existingSessionIndex] = updatedSession;
                return { ...prev, [selectedExercise.id]: exerciseHistory };
            } else {
                const newLog = {
                    date: logDate,
                    startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    sets: validSets
                };
                return { ...prev, [selectedExercise.id]: [...exerciseHistory, newLog] };
            }
        });

        setIsLogging(false);
        setCurrentSets([{ weight: '', reps: '', note: '' }]);
        startRestTimer(); // Auto-start timer
    };

    // Add Exercise Handler
    const handleAddExercise = () => {
        if (!newExerciseName.trim()) return;

        const newExercise = {
            id: `custom-${Date.now()}`,
            name: newExerciseName,
            category: newExerciseCategory
        };

        setCustomExercises([...customExercises, newExercise]);
        setNewExerciseName('');
        setIsAddingExercise(false);
    };

    // Edit Handlers (omitted for brevity, assume same as before or simplified)
    const openEditSet = (sessionIndex, setIndex, session, set) => {
        setEditingSet({
            sessionIndex,
            setIndex,
            weight: set.weight,
            reps: set.reps,
            note: set.note || '',
            date: session.date,
            time: set.time || session.startTime || '00:00'
        });
    };

    const handleUpdateSet = () => {
        if (!editingSet || !selectedExercise) return;
        const newHistory = { ...history };
        const exerciseHistory = [...(newHistory[selectedExercise.id] || [])];
        const realSessionIndex = exerciseHistory.length - 1 - editingSet.sessionIndex;
        const session = { ...exerciseHistory[realSessionIndex] };
        const newSets = [...session.sets];
        newSets[editingSet.setIndex] = {
            ...newSets[editingSet.setIndex],
            weight: parseFloat(editingSet.weight),
            reps: parseFloat(editingSet.reps),
            note: editingSet.note
        };
        session.sets = newSets;
        exerciseHistory[realSessionIndex] = session;
        newHistory[selectedExercise.id] = exerciseHistory;
        setHistory(newHistory);
        setEditingSet(null);
    };

    const handleDeleteSet = () => {
        if (!editingSet || !selectedExercise) return;
        const newHistory = { ...history };
        const exerciseHistory = [...(newHistory[selectedExercise.id] || [])];
        const realSessionIndex = exerciseHistory.length - 1 - editingSet.sessionIndex;
        const session = { ...exerciseHistory[realSessionIndex] };
        const newSets = session.sets.filter((_, i) => i !== editingSet.setIndex);
        if (newSets.length === 0) {
            exerciseHistory.splice(realSessionIndex, 1);
        } else {
            session.sets = newSets;
            exerciseHistory[realSessionIndex] = session;
        }
        newHistory[selectedExercise.id] = exerciseHistory;
        setHistory(newHistory);
        setEditingSet(null);
    };

    // Render Main List
    if (!selectedExercise) {
        const filteredExercises = allExercises.filter(ex => ex.category === activeRoutine);

        return (
            <div className="p-6 pb-24 space-y-6 animate-fade-in min-h-screen bg-cyber-black">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-2xl font-bold text-white">Workout Logger</h1>
                    <button
                        onClick={() => setIsAddingExercise(true)}
                        className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-neon-green hover:bg-zinc-700 transition-colors"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Routine Selector */}
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                    {['Push', 'Pull', 'Legs', 'Other'].map(routine => (
                        <button
                            key={routine}
                            onClick={() => setActiveRoutine(routine)}
                            className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeRoutine === routine
                                ? 'bg-neon-green text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                : 'bg-cyber-gray text-gray-400 hover:text-white'
                                }`}
                        >
                            {routine}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    {filteredExercises.map(ex => (
                        <div
                            key={ex.id}
                            onClick={() => setSelectedExercise(ex)}
                            className="bg-cyber-gray p-4 rounded-xl flex justify-between items-center cursor-pointer hover:bg-opacity-80 transition-colors group"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="bg-black p-2 rounded-lg text-neon-green group-hover:text-white transition-colors">
                                    <Dumbbell size={20} />
                                </div>
                                <span className="text-white font-medium">{ex.name}</span>
                            </div>
                            <ChevronRight className="text-gray-500 group-hover:text-neon-green transition-colors" size={20} />
                        </div>
                    ))}
                    {filteredExercises.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                            No exercises found. Add one!
                        </div>
                    )}
                </div>

                {/* Add Exercise Modal */}
                {isAddingExercise && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                        <div className="bg-cyber-gray p-6 rounded-2xl w-full max-w-sm border border-zinc-700 space-y-4">
                            <h3 className="text-white font-bold text-lg">Add New Exercise</h3>
                            <input
                                type="text"
                                placeholder="Exercise Name"
                                value={newExerciseName}
                                onChange={(e) => setNewExerciseName(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white outline-none focus:border-neon-green transition-colors"
                            />
                            <div className="flex space-x-2 overflow-x-auto pb-2">
                                {['Push', 'Pull', 'Legs', 'Other'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setNewExerciseCategory(cat)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border ${newExerciseCategory === cat
                                            ? 'bg-neon-green text-black border-neon-green'
                                            : 'bg-transparent text-gray-400 border-zinc-700'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={() => setIsAddingExercise(false)}
                                    className="flex-1 py-3 rounded-lg font-bold text-gray-400 hover:bg-zinc-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddExercise}
                                    disabled={!newExerciseName.trim()}
                                    className={`flex-1 py-3 rounded-lg font-bold text-black transition-colors ${newExerciseName.trim() ? 'bg-neon-green hover:bg-emerald-400' : 'bg-zinc-700 text-zinc-500'}`}
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Render Detailed View
    return (
        <div className="min-h-screen bg-cyber-black flex flex-col pb-24 animate-fade-in relative">
            {/* Header */}
            <div className="p-4 flex items-center justify-between bg-cyber-black sticky top-0 z-10">
                <button
                    onClick={() => setSelectedExercise(null)}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-lg font-bold text-white">{selectedExercise.name}</h2>
                <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:bg-gray-200 transition-colors">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            {/* Tabs */}
            <div className="px-4 mb-6">
                <div className="flex space-x-2">
                    {['Sets', 'Analyze', '1RM'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${activeTab === tab
                                ? 'bg-black text-white border border-gray-700'
                                : 'bg-gray-100 text-gray-500'
                                }`}
                        >
                            {tab === 'Sets' && <Dumbbell size={14} className="inline mr-1" />}
                            {tab === 'Analyze' && <TrendingUp size={14} className="inline mr-1" />}
                            {tab === '1RM' && <div className="inline-block w-3 h-3 rounded-full border-2 border-current mr-1" />}
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content - Sets Tab */}
            {activeTab === 'Sets' && (
                <div className="flex-1 px-4 space-y-6">
                    {/* Date Header */}
                    {stats && (
                        <div className="flex items-center text-gray-400 text-sm font-medium">
                            <span>{formatDate(stats.current.date)}</span>
                            <ChevronRight size={14} className="ml-1" />
                        </div>
                    )}

                    {/* Stats Comparison */}
                    {stats && (
                        <div className="bg-white rounded-3xl p-5 shadow-lg">
                            <div className="flex items-center space-x-2 text-gray-400 text-xs font-bold tracking-wider mb-4">
                                <ArrowLeft size={12} className="rotate-45" />
                                <span className="uppercase">Last Session vs Previous</span>
                            </div>

                            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                {/* Sets */}
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <div className="w-1 h-8 bg-neon-red rounded-full"></div>
                                        <div>
                                            <div className="text-gray-500 text-sm font-medium">{stats.metrics.sets} Sets</div>
                                            <div className="flex items-center text-xs text-gray-300">
                                                <span className={stats.diffs.sets.value >= 0 ? "text-gray-400" : "text-red-400"}>
                                                    {stats.diffs.sets.value >= 0 ? "▲" : "▼"} {Math.abs(stats.diffs.sets.value)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Reps */}
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <div className="w-1 h-8 bg-neon-green rounded-full"></div>
                                        <div>
                                            <div className="text-gray-500 text-sm font-medium">{stats.metrics.reps} Reps</div>
                                            <div className="flex items-center text-xs text-neon-green">
                                                <span className={stats.diffs.reps.value >= 0 ? "text-neon-green" : "text-red-400"}>
                                                    {stats.diffs.reps.value >= 0 ? "▲" : "▼"} {Math.abs(stats.diffs.reps.value)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Volume */}
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <div className="w-1 h-8 bg-neon-cyan rounded-full"></div>
                                        <div>
                                            <div className="text-gray-500 text-sm font-medium">{stats.metrics.volume} Vol</div>
                                            <div className="flex items-center text-xs text-neon-green">
                                                <span className={stats.diffs.volume.value >= 0 ? "text-neon-green" : "text-red-400"}>
                                                    {stats.diffs.volume.value >= 0 ? "▲" : "▼"} {Math.abs(stats.diffs.volume.value)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* kg/rep */}
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <div className="w-1 h-8 bg-neon-orange rounded-full"></div>
                                        <div>
                                            <div className="text-gray-500 text-sm font-medium">{Math.round(stats.metrics.avgWeight)} kg/avg</div>
                                            <div className="flex items-center text-xs text-gray-300">
                                                <span className={stats.diffs.avgWeight.value >= 0 ? "text-gray-400" : "text-red-400"}>
                                                    {stats.diffs.avgWeight.value >= 0 ? "▲" : "▼"} {Math.abs(stats.diffs.avgWeight.value)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* History List */}
                    <div className="space-y-8">
                        {history[selectedExercise.id]?.slice().reverse().map((session, sessionIndex) => (
                            <div key={sessionIndex} className="relative">
                                {/* Date Header */}
                                <div className="flex items-center text-gray-400 text-sm font-bold mb-4">
                                    <span>{formatDate(session.date)}</span>
                                    <ChevronRight size={14} className="ml-1" />
                                </div>

                                {/* Sets List */}
                                <div className="space-y-4">
                                    {session.sets.map((set, setIndex) => (
                                        <div
                                            key={setIndex}
                                            onClick={() => openEditSet(sessionIndex, setIndex, session, set)}
                                            className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0 cursor-pointer hover:bg-gray-900 transition-colors rounded-lg px-2 -mx-2"
                                        >
                                            <div className="flex items-center space-x-6 text-gray-400 text-sm">
                                                <span className="w-4 text-center">{setIndex + 1}</span>
                                                <span>{set.time || '18:00'}</span>
                                            </div>

                                            <div className="flex items-center space-x-8">
                                                <div className="flex items-center space-x-1">
                                                    <span className="text-neon-green font-bold text-lg">{set.reps}</span>
                                                    <span className="text-neon-green text-xs font-medium">rep</span>
                                                </div>
                                                <div className="flex items-center space-x-1 w-16 justify-end">
                                                    <span className="text-neon-orange font-bold text-lg">{set.weight}</span>
                                                    <span className="text-neon-orange text-xs font-medium">kg</span>
                                                </div>
                                                <ChevronRight size={16} className="text-gray-600" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Content - Analyze Tab */}
            {activeTab === 'Analyze' && analyticsData && (
                <div className="flex-1 px-4 space-y-8 pb-24">
                    {/* Volume Progression Chart */}
                    <div className="bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Activity size={18} className="text-neon-cyan" />
                                Volume Progression
                            </h3>
                            <span className="text-xs text-gray-500">Total Volume (kg)</span>
                        </div>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analyticsData.sessionProgress}>
                                    <defs>
                                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="volume"
                                        stroke="#06b6d4"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorVolume)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Consistency Calendar (GitHub Style) */}
                    <div className="bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Calendar size={18} className="text-neon-green" />
                                Consistency Streak
                            </h3>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {/* Mocking a grid of days */}
                            {Array.from({ length: 50 }).map((_, i) => {
                                // Randomly active for demo purposes if no real data
                                const isReal = i < analyticsData.sessionProgress.length;
                                const opacity = isReal ? 0.8 : 0.1;
                                return (
                                    <div
                                        key={i}
                                        className="w-3 h-3 rounded-sm bg-neon-green"
                                        style={{ opacity: isReal ? 1 : 0.1 }}
                                        title={isReal ? "Workout done" : "No workout"}
                                    />
                                );
                            })}
                        </div>
                        <p className="text-xs text-gray-500 mt-4">Visual proof of your "Progressive Overload"</p>
                    </div>

                    {/* Max Weight Trend */}
                    <div className="bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <TrendingUp size={18} className="text-neon-orange" />
                                Max Weight Trend
                            </h3>
                            <span className="text-xs text-gray-500">Heaviest Set (kg)</span>
                        </div>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={analyticsData.sessionProgress}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="maxWeight"
                                        stroke="#f97316"
                                        strokeWidth={3}
                                        dot={{ fill: '#f97316', r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Action Button */}
            <div className="fixed bottom-24 left-0 right-0 flex justify-center z-20 pointer-events-none">
                <button
                    onClick={() => setIsLogging(true)}
                    className="bg-neon-green text-white w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)] pointer-events-auto hover:scale-110 transition-transform"
                >
                    <Plus size={32} />
                </button>
            </div>

            {/* Auto-Rest Timer Overlay */}
            {showTimer && (
                <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4 z-50 flex items-center justify-between animate-slide-up">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-neon-green font-mono font-bold text-lg border border-zinc-700">
                            {formatTime(timerTime)}
                        </div>
                        <div>
                            <div className="text-white font-bold text-sm">Rest Timer</div>
                            <div className="text-xs text-gray-400">Next set in {formatTime(timerTime)}</div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setTimerTime(prev => prev + 30)}
                            className="px-3 py-2 bg-zinc-800 rounded-lg text-xs font-bold text-white hover:bg-zinc-700"
                        >
                            +30s
                        </button>
                        <button
                            onClick={() => {
                                setTimerActive(false);
                                setShowTimer(false);
                            }}
                            className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/30"
                        >
                            Skip
                        </button>
                    </div>
                </div>
            )}

            {/* Logging Modal */}
            {isLogging && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-cyber-black animate-fade-in">
                    <div className="w-full h-full max-w-md bg-cyber-gray flex flex-col">
                        {/* Header */}
                        <div className="p-4 flex items-center justify-between bg-cyber-black shadow-md">
                            <button
                                onClick={() => setIsLogging(false)}
                                className="w-10 h-10 bg-transparent rounded-full flex items-center justify-center text-white hover:bg-zinc-800 transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <h2 className="text-lg font-bold text-white">{selectedExercise.name}</h2>
                            <button
                                onClick={handleSaveLog}
                                disabled={!currentSets[0].weight || !currentSets[0].reps}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)]
                                    ${currentSets[0].weight && currentSets[0].reps
                                        ? 'bg-neon-green text-black hover:bg-emerald-400'
                                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none'}`}
                            >
                                <Check size={20} />
                            </button>
                        </div>

                        <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-black">
                            {/* Inputs Card */}
                            <div className="bg-zinc-900 rounded-3xl p-6 space-y-6 border border-zinc-800">
                                {/* Reps */}
                                <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={currentSets[0].reps}
                                        onChange={(e) => handleSetChange(0, 'reps', e.target.value)}
                                        className="text-5xl font-bold text-white w-32 outline-none bg-transparent placeholder-zinc-700"
                                        autoFocus
                                    />
                                    <div className="flex items-center space-x-2 text-zinc-400">
                                        <Dumbbell size={18} />
                                        <span className="font-medium">Repetitions</span>
                                    </div>
                                </div>

                                {/* Weight */}
                                <div className="flex justify-between items-center">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={currentSets[0].weight}
                                        onChange={(e) => handleSetChange(0, 'weight', e.target.value)}
                                        className="text-5xl font-bold text-white w-32 outline-none bg-transparent placeholder-zinc-700"
                                    />
                                    <div className="flex items-center space-x-2 text-zinc-400">
                                        <div className="w-4 h-4 rounded-full border-2 border-zinc-400"></div>
                                        <span className="font-medium">Weight (kg)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes Card */}
                            <div className="space-y-2">
                                <label className="text-zinc-400 font-bold ml-2 text-sm">Notes</label>
                                <div className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800">
                                    <textarea
                                        value={currentSets[0].note || ''}
                                        onChange={(e) => handleSetChange(0, 'note', e.target.value)}
                                        placeholder="Write a note..."
                                        className="w-full h-24 bg-transparent text-white outline-none resize-none placeholder-zinc-600 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Date Card */}
                            <div className="bg-zinc-900 rounded-2xl p-4 flex justify-between items-center border border-zinc-800">
                                <span className="text-white font-bold">Date</span>
                                <div className="flex items-center space-x-2 bg-zinc-800 px-3 py-1.5 rounded-lg">
                                    <Calendar size={14} className="text-zinc-400" />
                                    <input
                                        type="date"
                                        value={logDate}
                                        onChange={(e) => setLogDate(e.target.value)}
                                        className="bg-transparent text-white text-sm outline-none font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Set Modal */}
            {editingSet && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-cyber-black animate-fade-in">
                    <div className="w-full h-full max-w-md bg-cyber-gray flex flex-col">
                        {/* Header */}
                        <div className="p-4 flex items-center justify-between bg-cyber-black shadow-md">
                            <button
                                onClick={() => setEditingSet(null)}
                                className="w-10 h-10 bg-transparent rounded-full flex items-center justify-center text-white hover:bg-zinc-800 transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Exercise</span>
                                <h2 className="text-lg font-bold text-white">{selectedExercise.name}</h2>
                            </div>
                            <button
                                onClick={handleUpdateSet}
                                className="w-10 h-10 bg-neon-green rounded-full flex items-center justify-center text-black hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                            >
                                <Check size={20} />
                            </button>
                        </div>

                        <div className="flex-1 p-6 space-y-8 overflow-y-auto bg-black">
                            {/* Inputs */}
                            <div className="bg-zinc-900 rounded-3xl p-6 space-y-6 border border-zinc-800">
                                <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                                    <input
                                        type="number"
                                        value={editingSet.reps}
                                        onChange={(e) => setEditingSet({ ...editingSet, reps: e.target.value })}
                                        className="text-5xl font-bold text-white w-32 outline-none bg-transparent placeholder-zinc-700"
                                    />
                                    <div className="flex items-center space-x-2 text-zinc-400">
                                        <Dumbbell size={18} />
                                        <span className="font-medium">Repetitions</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <input
                                        type="number"
                                        value={editingSet.weight}
                                        onChange={(e) => setEditingSet({ ...editingSet, weight: e.target.value })}
                                        className="text-5xl font-bold text-white w-32 outline-none bg-transparent placeholder-zinc-700"
                                    />
                                    <div className="flex items-center space-x-2 text-zinc-400">
                                        <div className="w-4 h-4 rounded-full border-2 border-zinc-400"></div>
                                        <span className="font-medium">Weight (kg)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="text-zinc-400 font-bold ml-2 text-sm">Notes</label>
                                <div className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800">
                                    <textarea
                                        value={editingSet.note}
                                        onChange={(e) => setEditingSet({ ...editingSet, note: e.target.value })}
                                        placeholder="Write a note..."
                                        className="w-full h-24 bg-transparent text-white outline-none resize-none placeholder-zinc-600 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Date/Time Info */}
                            <div className="bg-zinc-900 rounded-3xl p-4 flex justify-between items-center border border-zinc-800">
                                <div className="flex items-center space-x-2">
                                    <span className="text-white font-bold">Date</span>
                                </div>
                                <div className="flex space-x-2">
                                    <span className="bg-zinc-800 px-3 py-1 rounded-lg text-sm font-bold text-zinc-400">
                                        {formatDate(editingSet.date)}
                                    </span>
                                    <span className="bg-zinc-800 px-3 py-1 rounded-lg text-sm font-bold text-zinc-400">
                                        {editingSet.time}
                                    </span>
                                </div>
                            </div>

                            {/* Delete Button */}
                            <button
                                onClick={handleDeleteSet}
                                className="w-full bg-zinc-900 text-neon-red py-4 rounded-3xl font-bold flex items-center justify-center space-x-2 border border-zinc-800 hover:bg-zinc-800 transition-colors"
                            >
                                <Trash2 size={20} />
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkoutLogger;
