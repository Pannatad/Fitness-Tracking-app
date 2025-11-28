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
    Activity,
    Loader
} from 'lucide-react';
import { exercises as initialExercises } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { workoutService } from '../services/workoutService';

const WorkoutLogger = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    // UI State
    const [activeRoutine, setActiveRoutine] = useState('Push');
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [activeTab, setActiveTab] = useState('Sets');

    // Data State
    const [history, setHistory] = useState({});
    const [customExercises, setCustomExercises] = useState([]);

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

    // Fetch Data from Supabase
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [historyData, customExData] = await Promise.all([
                    workoutService.getHistory(user.id),
                    workoutService.getCustomExercises(user.id)
                ]);
                setHistory(historyData);
                setCustomExercises(customExData);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

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

    const handleSaveLog = async () => {
        if (!selectedExercise || !user) return;

        const s = currentSets[0];
        if (!s.weight || !s.reps) return;

        const validSets = [{
            weight: parseFloat(s.weight),
            reps: parseFloat(s.reps),
            note: s.note,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }];

        const logData = {
            date: logDate,
            startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sets: validSets
        };

        try {
            // Optimistic Update
            setHistory(prev => {
                const exerciseHistory = [...(prev[selectedExercise.id] || [])];
                const existingSessionIndex = exerciseHistory.findIndex(session => session.date === logDate);

                if (existingSessionIndex >= 0) {
                    const updatedSession = { ...exerciseHistory[existingSessionIndex] };
                    updatedSession.sets = [...updatedSession.sets, ...validSets];
                    updatedSession.endTime = logData.endTime;
                    exerciseHistory[existingSessionIndex] = updatedSession;
                    return { ...prev, [selectedExercise.id]: exerciseHistory };
                } else {
                    return { ...prev, [selectedExercise.id]: [...exerciseHistory, logData] };
                }
            });

            // Save to Supabase
            await workoutService.saveLog(user.id, selectedExercise.id, logData);

            setIsLogging(false);
            setCurrentSets([{ weight: '', reps: '', note: '' }]);
            startRestTimer(); // Auto-start timer
        } catch (error) {
            console.error("Error saving log:", error);
            alert(`Failed to save workout: ${error.message || error.error_description || "Unknown error"}`);
        }
    };

    // Add Exercise Handler
    const handleAddExercise = async () => {
        if (!newExerciseName.trim() || !user) return;

        const newExercise = {
            name: newExerciseName,
            category: newExerciseCategory
        };

        try {
            const savedExercise = await workoutService.addCustomExercise(user.id, newExercise);
            setCustomExercises([...customExercises, savedExercise]);
            setNewExerciseName('');
            setIsAddingExercise(false);
        } catch (error) {
            console.error("Error adding exercise:", error);
            alert(`Failed to add exercise: ${error.message || error.error_description || "Unknown error"}`);
        }
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
        if (isLoading) {
            return (
                <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                    <Loader className="animate-spin text-emerald-400" size={32} />
                </div>
            );
        }

        const filteredExercises = allExercises.filter(ex => ex.category === activeRoutine);

        return (
            <div className="p-6 pb-24 space-y-6 animate-fade-in min-h-screen bg-zinc-950">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Workout Logger</h1>
                    <button
                        onClick={() => setIsAddingExercise(true)}
                        className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-emerald-400 hover:bg-zinc-800 transition-colors"
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
                                ? 'bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-900/20'
                                : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300'
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
                            className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center cursor-pointer hover:border-zinc-700 transition-all group"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="bg-zinc-950 p-3 rounded-xl text-emerald-400 group-hover:text-emerald-300 transition-colors">
                                    <Dumbbell size={20} />
                                </div>
                                <span className="text-white font-bold text-lg">{ex.name}</span>
                            </div>
                            <ChevronRight className="text-zinc-600 group-hover:text-zinc-400 transition-colors" size={20} />
                        </div>
                    ))}
                    {filteredExercises.length === 0 && (
                        <div className="text-center text-zinc-600 py-12 flex flex-col items-center">
                            <Dumbbell size={48} className="mb-4 opacity-20" />
                            <p>No exercises found.</p>
                            <button onClick={() => setIsAddingExercise(true)} className="text-emerald-400 font-bold mt-2">Add one?</button>
                        </div>
                    )}
                </div>

                {/* Add Exercise Modal */}
                {isAddingExercise && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
                        <div className="bg-zinc-900 p-6 rounded-3xl w-full max-w-sm border border-zinc-800 space-y-6 shadow-2xl">
                            <h3 className="text-white font-bold text-xl">Add New Exercise</h3>
                            <input
                                type="text"
                                placeholder="Exercise Name"
                                value={newExerciseName}
                                onChange={(e) => setNewExerciseName(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-emerald-500 transition-colors placeholder-zinc-600 font-bold"
                            />
                            <div className="flex space-x-2 overflow-x-auto pb-2">
                                {['Push', 'Pull', 'Legs', 'Other'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setNewExerciseCategory(cat)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${newExerciseCategory === cat
                                            ? 'bg-emerald-400 text-zinc-950 border-emerald-400'
                                            : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={() => setIsAddingExercise(false)}
                                    className="flex-1 py-3 rounded-xl font-bold text-zinc-400 hover:bg-zinc-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddExercise}
                                    disabled={!newExerciseName.trim()}
                                    className={`flex-1 py-3 rounded-xl font-bold text-zinc-950 transition-colors ${newExerciseName.trim() ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-zinc-800 text-zinc-600'}`}
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
        <div className="min-h-screen bg-zinc-950 flex flex-col pb-24 animate-fade-in relative">
            {/* Header */}
            <div className="p-4 flex items-center justify-between bg-zinc-950 sticky top-0 z-10 border-b border-zinc-900/50 backdrop-blur-md bg-opacity-80">
                <button
                    onClick={() => setSelectedExercise(null)}
                    className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-white hover:bg-zinc-800 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-lg font-bold text-white tracking-tight">{selectedExercise.name}</h2>
                <button className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-white hover:bg-zinc-800 transition-colors">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            {/* Tabs */}
            <div className="px-4 mb-6 mt-2">
                <div className="flex space-x-1 bg-zinc-900/50 p-1 rounded-full border border-zinc-800">
                    {['Sets', 'Analyze', '1RM'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${activeTab === tab
                                ? 'bg-white text-zinc-950 shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-300'
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
                        <div className="bg-zinc-900 rounded-3xl p-6 shadow-xl border border-zinc-800">
                            <div className="flex items-center space-x-2 text-zinc-500 text-xs font-bold tracking-wider mb-6 uppercase">
                                <ArrowLeft size={12} className="rotate-45" />
                                <span>Last Session vs Previous</span>
                            </div>

                            <div className="grid grid-cols-2 gap-y-8 gap-x-6">
                                {/* Sets */}
                                <div className="relative pl-3 border-l-2 border-red-400/50">
                                    <div className="text-3xl font-bold text-white leading-none mb-1">{stats.metrics.sets}</div>
                                    <div className="text-zinc-500 text-xs font-bold uppercase mb-1">Sets</div>
                                    <div className={`text-xs font-bold ${stats.diffs.sets.value >= 0 ? "text-zinc-500" : "text-red-400"}`}>
                                        {stats.diffs.sets.value >= 0 ? "▲" : "▼"} {Math.abs(stats.diffs.sets.value)}
                                    </div>
                                </div>

                                {/* Reps */}
                                <div className="relative pl-3 border-l-2 border-emerald-400/50">
                                    <div className="text-3xl font-bold text-white leading-none mb-1">{stats.metrics.reps}</div>
                                    <div className="text-zinc-500 text-xs font-bold uppercase mb-1">Reps</div>
                                    <div className={`text-xs font-bold ${stats.diffs.reps.value >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                        {stats.diffs.reps.value >= 0 ? "▲" : "▼"} {Math.abs(stats.diffs.reps.value)}
                                    </div>
                                </div>

                                {/* Volume */}
                                <div className="relative pl-3 border-l-2 border-blue-400/50">
                                    <div className="text-3xl font-bold text-white leading-none mb-1">{stats.metrics.volume}</div>
                                    <div className="text-zinc-500 text-xs font-bold uppercase mb-1">Vol</div>
                                    <div className={`text-xs font-bold ${stats.diffs.volume.value >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                        {stats.diffs.volume.value >= 0 ? "▲" : "▼"} {Math.abs(stats.diffs.volume.value)}
                                    </div>
                                </div>

                                {/* kg/rep */}
                                <div className="relative pl-3 border-l-2 border-orange-300/50">
                                    <div className="text-3xl font-bold text-white leading-none mb-1">{Math.round(stats.metrics.avgWeight)}</div>
                                    <div className="text-zinc-500 text-xs font-bold uppercase mb-1">kg/avg</div>
                                    <div className={`text-xs font-bold ${stats.diffs.avgWeight.value >= 0 ? "text-zinc-500" : "text-red-400"}`}>
                                        {stats.diffs.avgWeight.value >= 0 ? "▲" : "▼"} {Math.abs(stats.diffs.avgWeight.value)}
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
                                <div className="flex items-center text-zinc-500 text-xs font-bold uppercase tracking-wider mb-4 pl-2">
                                    <span>{formatDate(session.date)}</span>
                                    <ChevronRight size={12} className="ml-1" />
                                </div>

                                {/* Sets List */}
                                <div className="space-y-1">
                                    {session.sets.map((set, setIndex) => (
                                        <div
                                            key={setIndex}
                                            onClick={() => openEditSet(sessionIndex, setIndex, session, set)}
                                            className="flex items-center justify-between py-3 px-4 border-b border-zinc-900 last:border-0 cursor-pointer hover:bg-zinc-900/50 transition-colors rounded-xl"
                                        >
                                            <div className="flex items-center space-x-6 text-zinc-500 text-sm font-mono">
                                                <span className="w-4 text-center">{setIndex + 1}</span>
                                                <span>{set.time || '00:00'}</span>
                                            </div>

                                            <div className="flex items-center space-x-8">
                                                <div className="flex items-center space-x-1">
                                                    <span className="text-emerald-400 font-bold text-lg">{set.reps}</span>
                                                    <span className="text-zinc-600 text-xs font-bold uppercase">rep</span>
                                                </div>
                                                <div className="flex items-center space-x-1 w-16 justify-end">
                                                    <span className="text-orange-300 font-bold text-lg">{set.weight}</span>
                                                    <span className="text-zinc-600 text-xs font-bold uppercase">kg</span>
                                                </div>
                                                <ChevronRight size={16} className="text-zinc-700" />
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
                    <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Activity size={18} className="text-emerald-400" />
                                Volume Progression
                            </h3>
                            <span className="text-xs text-zinc-500 font-bold uppercase">Total Volume (kg)</span>
                        </div>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analyticsData.sessionProgress}>
                                    <defs>
                                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="volume"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorVolume)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Consistency Calendar (GitHub Style) */}
                    <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Calendar size={18} className="text-emerald-400" />
                                Consistency Streak
                            </h3>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {/* Mocking a grid of days */}
                            {Array.from({ length: 50 }).map((_, i) => {
                                // Randomly active for demo purposes if no real data
                                const isReal = i < analyticsData.sessionProgress.length;
                                return (
                                    <div
                                        key={i}
                                        className={`w-3 h-3 rounded-sm ${isReal ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                                        style={{ opacity: isReal ? 1 : 0.5 }}
                                        title={isReal ? "Workout done" : "No workout"}
                                    />
                                );
                            })}
                        </div>
                        <p className="text-xs text-zinc-500 mt-4 font-medium">Visual proof of your "Progressive Overload"</p>
                    </div>

                    {/* Max Weight Trend */}
                    <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <TrendingUp size={18} className="text-orange-400" />
                                Max Weight Trend
                            </h3>
                            <span className="text-xs text-zinc-500 font-bold uppercase">Heaviest Set (kg)</span>
                        </div>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={analyticsData.sessionProgress}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="maxWeight"
                                        stroke="#fb923c"
                                        strokeWidth={3}
                                        dot={{ fill: '#fb923c', r: 4 }}
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
                    className="bg-emerald-400 text-zinc-950 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] pointer-events-auto hover:scale-110 transition-transform"
                >
                    <Plus size={32} />
                </button>
            </div>

            {/* Auto-Rest Timer Overlay */}
            {showTimer && (
                <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4 z-50 flex items-center justify-between animate-slide-up shadow-2xl">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center text-emerald-400 font-mono font-bold text-lg border border-zinc-800">
                            {formatTime(timerTime)}
                        </div>
                        <div>
                            <div className="text-white font-bold text-sm">Rest Timer</div>
                            <div className="text-xs text-zinc-500">Next set in {formatTime(timerTime)}</div>
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
                            className="px-3 py-2 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20"
                        >
                            Skip
                        </button>
                    </div>
                </div>
            )}

            {/* Logging Modal */}
            {isLogging && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
                    <div className="w-full h-full max-w-md bg-zinc-950 flex flex-col">
                        {/* Header */}
                        <div className="p-4 flex items-center justify-between bg-zinc-950 border-b border-zinc-900">
                            <button
                                onClick={() => setIsLogging(false)}
                                className="w-10 h-10 bg-transparent rounded-full flex items-center justify-center text-white hover:bg-zinc-900 transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <h2 className="text-lg font-bold text-white">{selectedExercise.name}</h2>
                            <button
                                onClick={handleSaveLog}
                                disabled={!currentSets[0].weight || !currentSets[0].reps}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg
                                    ${currentSets[0].weight && currentSets[0].reps
                                        ? 'bg-emerald-400 text-zinc-950 hover:bg-emerald-300 shadow-emerald-900/20'
                                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed shadow-none'}`}
                            >
                                <Check size={20} />
                            </button>
                        </div>

                        <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-zinc-950">
                            {/* Inputs Card */}
                            <div className="bg-zinc-900 rounded-3xl p-6 space-y-6 border border-zinc-800 shadow-xl">
                                {/* Reps */}
                                <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={currentSets[0].reps}
                                        onChange={(e) => handleSetChange(0, 'reps', e.target.value)}
                                        className="text-5xl font-bold text-white w-32 outline-none bg-transparent placeholder-zinc-800"
                                        autoFocus
                                    />
                                    <div className="flex items-center space-x-2 text-zinc-500">
                                        <Dumbbell size={18} />
                                        <span className="font-bold uppercase text-xs tracking-wider">Reps</span>
                                    </div>
                                </div>

                                {/* Weight */}
                                <div className="flex justify-between items-center">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={currentSets[0].weight}
                                        onChange={(e) => handleSetChange(0, 'weight', e.target.value)}
                                        className="text-5xl font-bold text-white w-32 outline-none bg-transparent placeholder-zinc-800"
                                    />
                                    <div className="flex items-center space-x-2 text-zinc-500">
                                        <div className="w-4 h-4 rounded-full border-2 border-zinc-500"></div>
                                        <span className="font-bold uppercase text-xs tracking-wider">kg</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes Card */}
                            <div className="space-y-2">
                                <label className="text-zinc-500 font-bold ml-2 text-xs uppercase tracking-wider">Notes</label>
                                <div className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800">
                                    <textarea
                                        value={currentSets[0].note || ''}
                                        onChange={(e) => handleSetChange(0, 'note', e.target.value)}
                                        placeholder="Write a note..."
                                        className="w-full h-24 bg-transparent text-white outline-none resize-none placeholder-zinc-700 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Date Card */}
                            <div className="bg-zinc-900 rounded-2xl p-4 flex justify-between items-center border border-zinc-800">
                                <span className="text-white font-bold">Date</span>
                                <div className="flex items-center space-x-2 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                                    <Calendar size={14} className="text-zinc-500" />
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
                    <div className="w-full h-full max-w-md bg-zinc-950 flex flex-col">
                        {/* Header */}
                        <div className="p-4 flex items-center justify-between bg-zinc-950 border-b border-zinc-900">
                            <button
                                onClick={() => setEditingSet(null)}
                                className="w-10 h-10 bg-transparent rounded-full flex items-center justify-center text-white hover:bg-zinc-900 transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Exercise</span>
                                <h2 className="text-lg font-bold text-white">{selectedExercise.name}</h2>
                            </div>
                            <button
                                onClick={handleUpdateSet}
                                className="w-10 h-10 bg-emerald-400 rounded-full flex items-center justify-center text-zinc-950 hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-900/20"
                            >
                                <Check size={20} />
                            </button>
                        </div>

                        <div className="flex-1 p-6 space-y-8 overflow-y-auto bg-zinc-950">
                            {/* Inputs */}
                            <div className="bg-zinc-900 rounded-3xl p-6 space-y-6 border border-zinc-800 shadow-xl">
                                <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                                    <input
                                        type="number"
                                        value={editingSet.reps}
                                        onChange={(e) => setEditingSet({ ...editingSet, reps: e.target.value })}
                                        className="text-5xl font-bold text-white w-32 outline-none bg-transparent placeholder-zinc-800"
                                    />
                                    <div className="flex items-center space-x-2 text-zinc-500">
                                        <Dumbbell size={18} />
                                        <span className="font-bold uppercase text-xs tracking-wider">Reps</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <input
                                        type="number"
                                        value={editingSet.weight}
                                        onChange={(e) => setEditingSet({ ...editingSet, weight: e.target.value })}
                                        className="text-5xl font-bold text-white w-32 outline-none bg-transparent placeholder-zinc-800"
                                    />
                                    <div className="flex items-center space-x-2 text-zinc-500">
                                        <div className="w-4 h-4 rounded-full border-2 border-zinc-500"></div>
                                        <span className="font-bold uppercase text-xs tracking-wider">kg</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="text-zinc-500 font-bold ml-2 text-xs uppercase tracking-wider">Notes</label>
                                <div className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800">
                                    <textarea
                                        value={editingSet.note}
                                        onChange={(e) => setEditingSet({ ...editingSet, note: e.target.value })}
                                        placeholder="Write a note..."
                                        className="w-full h-24 bg-transparent text-white outline-none resize-none placeholder-zinc-700 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Date/Time Info */}
                            <div className="bg-zinc-900 rounded-3xl p-4 flex justify-between items-center border border-zinc-800">
                                <div className="flex items-center space-x-2">
                                    <span className="text-white font-bold">Date</span>
                                </div>
                                <div className="flex space-x-2">
                                    <span className="bg-zinc-950 px-3 py-1 rounded-lg text-sm font-bold text-zinc-500 border border-zinc-800">
                                        {formatDate(editingSet.date)}
                                    </span>
                                    <span className="bg-zinc-950 px-3 py-1 rounded-lg text-sm font-bold text-zinc-500 border border-zinc-800">
                                        {editingSet.time}
                                    </span>
                                </div>
                            </div>

                            {/* Delete Button */}
                            <button
                                onClick={handleDeleteSet}
                                className="w-full bg-zinc-900 text-red-400 py-4 rounded-3xl font-bold flex items-center justify-center space-x-2 border border-zinc-800 hover:bg-zinc-800 transition-colors"
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
