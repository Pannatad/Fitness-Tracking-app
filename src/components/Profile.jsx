import React, { useMemo, useState } from 'react';
import { User, Settings, LogOut, Download, Trash2, Trophy, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { workoutHistory as initialMockData } from '../data/mockData';
import { calculateUserLevel } from '../utils/statsCalculators';

import { workoutService } from '../services/workoutService';

const Profile = () => {
    const { user, signOut } = useAuth();
    const [theme, setTheme] = useState('gym'); // 'gym' or 'cozy'
    const [history, setHistory] = useState({});

    // Load history for gamification
    React.useEffect(() => {
        if (!user) return;
        workoutService.getHistory(user.id).then(setHistory).catch(console.error);
    }, [user]);

    const userStats = useMemo(() => calculateUserLevel(history), [history]);

    const handleExportData = () => {
        const dataStr = JSON.stringify(history, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `workout_data_${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleClearData = async () => {
        if (window.confirm("Are you sure? This will delete ALL your workout history permanently from the cloud.")) {
            if (window.confirm("Really? There is no going back.")) {
                try {
                    await workoutService.clearData(user.id);
                    setHistory({});
                    alert("Data cleared.");
                } catch (error) {
                    console.error("Error clearing data:", error);
                    alert("Failed to clear data.");
                }
            }
        }
    };

    return (
        <div className={`min-h-screen pb-24 animate-fade-in p-6 space-y-8 ${theme === 'gym' ? 'bg-cyber-black' : 'bg-stone-900'}`}>
            <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>

            {/* User Info */}
            <div className="flex items-center space-x-4 mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg border-2 border-white/20">
                    {user?.email?.[0].toUpperCase() || 'U'}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">{user?.email?.split('@')[0] || 'User'}</h2>
                    <p className="text-zinc-400 text-sm">{user?.email}</p>
                </div>
            </div>

            {/* Gamification Card */}
            <div className="bg-gradient-to-br from-zinc-900 to-black rounded-3xl p-6 border border-zinc-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Trophy size={100} />
                </div>

                <div className="relative z-10">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-emerald-400 font-bold tracking-wider text-sm uppercase">Current Level</span>
                        <span className="text-4xl font-black text-white italic">LVL {userStats.level}</span>
                    </div>

                    <div className="w-full h-4 bg-zinc-800 rounded-full overflow-hidden mb-2 border border-zinc-700">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-1000"
                            style={{ width: `${userStats.progress}%` }}
                        ></div>
                    </div>

                    <div className="flex justify-between text-xs text-zinc-500 font-mono">
                        <span>{userStats.xp} XP</span>
                        <span>NEXT: {userStats.nextLevelXp} XP</span>
                    </div>

                    <div className="mt-6 pt-6 border-t border-zinc-800 grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-zinc-500 text-xs uppercase">Lifetime Volume</div>
                            <div className="text-white font-bold text-lg">{(userStats.totalVolume / 1000).toFixed(1)}k kg</div>
                        </div>
                        <div>
                            <div className="text-zinc-500 text-xs uppercase">Workouts</div>
                            <div className="text-white font-bold text-lg">
                                {Object.values(history).reduce((acc, sessions) => acc + sessions.length, 0)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
                <h3 className="text-zinc-500 font-bold text-sm uppercase tracking-wider ml-2">Settings</h3>

                <div className="bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-800">
                    <button
                        onClick={() => setTheme(theme === 'gym' ? 'cozy' : 'gym')}
                        className="w-full p-4 flex items-center justify-between hover:bg-zinc-800 transition-colors"
                    >
                        <div className="flex items-center space-x-3 text-white">
                            {theme === 'gym' ? <Moon size={20} /> : <Sun size={20} />}
                            <span>Theme Mode</span>
                        </div>
                        <span className="text-xs font-bold text-zinc-500 uppercase">{theme}</span>
                    </button>

                    <div className="h-px bg-zinc-800"></div>

                    <button
                        onClick={handleExportData}
                        className="w-full p-4 flex items-center justify-between hover:bg-zinc-800 transition-colors"
                    >
                        <div className="flex items-center space-x-3 text-white">
                            <Download size={20} />
                            <span>Export Data (JSON)</span>
                        </div>
                    </button>

                    <div className="h-px bg-zinc-800"></div>

                    <button
                        onClick={handleClearData}
                        className="w-full p-4 flex items-center justify-between hover:bg-red-900/20 transition-colors group"
                    >
                        <div className="flex items-center space-x-3 text-red-400 group-hover:text-red-300">
                            <Trash2 size={20} />
                            <span>Clear All Data</span>
                        </div>
                    </button>
                </div>

                <button
                    onClick={signOut}
                    className="w-full bg-zinc-900 text-zinc-400 p-4 rounded-2xl font-bold flex items-center justify-center space-x-2 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>
            </div>

            <div className="text-center text-zinc-600 text-xs pt-8">
                Antigravity Fitness v1.2.0
            </div>
        </div>
    );
};

export default Profile;
