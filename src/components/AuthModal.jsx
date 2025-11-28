import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader, AlertCircle } from 'lucide-react';

const AuthModal = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { signIn, signUp } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                await signIn(email, password);
            } else {
                await signUp(email, password);
                if (!error) alert('Check your email for the confirmation link!');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm">
            <div className="w-full max-w-md bg-cyber-gray p-8 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-neon-green blur-[100px] opacity-20 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">
                            {isLogin ? 'Welcome Back' : 'Join the Club'}
                        </h2>
                        <p className="text-zinc-400 text-sm">
                            {isLogin ? 'Sign in to access your workout history' : 'Create an account to start tracking'}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 mb-6 flex items-start space-x-3">
                            <AlertCircle className="text-red-500 shrink-0" size={20} />
                            <p className="text-red-200 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Email</label>
                            <div className="bg-black rounded-xl border border-zinc-800 flex items-center px-4 py-3 focus-within:border-neon-green transition-colors">
                                <Mail className="text-zinc-500 mr-3" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="bg-transparent text-white w-full outline-none placeholder-zinc-700"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Password</label>
                            <div className="bg-black rounded-xl border border-zinc-800 flex items-center px-4 py-3 focus-within:border-neon-green transition-colors">
                                <Lock className="text-zinc-500 mr-3" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="bg-transparent text-white w-full outline-none placeholder-zinc-700"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-neon-green text-black font-bold py-4 rounded-xl hover:bg-emerald-400 transition-all transform active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center"
                        >
                            {loading ? (
                                <Loader className="animate-spin" size={20} />
                            ) : (
                                isLogin ? 'Sign In' : 'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-zinc-500 text-sm">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-neon-green font-bold hover:underline"
                            >
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
