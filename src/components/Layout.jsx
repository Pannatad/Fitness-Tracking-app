import React from 'react';
import { Home, Calendar, Dumbbell, BarChart2, User } from 'lucide-react';

const Layout = ({ children, activeTab = 'home', onTabChange }) => {
    const navItems = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'history', icon: Calendar, label: 'History' },
        { id: 'workout', icon: Dumbbell, label: 'Workout', isPrimary: true },
        { id: 'analytics', icon: BarChart2, label: 'Analytics' },
        { id: 'profile', icon: User, label: 'Profile' },
    ];

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-emerald-500/30">
            {/* Top Bar */}
            <div className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50 px-6 py-4 flex justify-between items-center">
                <h1 className="text-lg font-bold tracking-tight">
                    <span className="text-emerald-400">IRON</span> TRACKER
                </h1>
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-emerald-400">
                    JD
                </div>
            </div>

            {/* Main Content Area */}
            <main className="pt-20 pb-28 px-4 max-w-md mx-auto min-h-screen">
                {children}
            </main>

            {/* Bottom Navigation Dock */}
            <div className="fixed bottom-6 left-4 right-4 z-50 max-w-md mx-auto">
                <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-2 shadow-2xl shadow-black/50 flex justify-between items-center px-4">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        const Icon = item.icon;

                        if (item.isPrimary) {
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onTabChange(item.id)}
                                    className={`
                    relative -top-6 
                    w-14 h-14 rounded-full 
                    flex items-center justify-center 
                    shadow-[0_0_20px_rgba(16,185,129,0.4)]
                    transition-all duration-300 hover:scale-105 active:scale-95
                    ${isActive ? 'bg-emerald-400 text-zinc-950' : 'bg-emerald-500 text-zinc-950'}
                  `}
                                >
                                    <Icon size={24} strokeWidth={2.5} />
                                </button>
                            );
                        }

                        return (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                className={`
                  p-3 rounded-2xl transition-all duration-300
                  ${isActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 hover:text-zinc-300'}
                `}
                            >
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Layout;
