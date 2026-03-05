import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { supabaseService } from '../../services/supabaseService';
import { UserProgress, OnlineProfile } from '../../types';
import { SKIN_CONFIG } from '../../constants';
import { AvatarIcon } from './AvatarIcon';
import { motion, AnimatePresence } from 'motion/react';
import { User, LogIn, LogOut, Shield, Trophy, Settings, Mail, Lock, UserPlus, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthOverlayProps {
    onClose: () => void;
    onLoginSuccess: () => void;
    userProgress: UserProgress;
    onShowLeaderboard?: () => void;
    onPlayOffline?: () => void;
    isInitialGate?: boolean;
}

const AuthOverlay: React.FC<AuthOverlayProps> = ({ onClose, onLoginSuccess, userProgress, onShowLeaderboard, onPlayOffline, isInitialGate }) => {
    const [view, setView] = useState<'login' | 'signup' | 'profile' | 'loading' | 'otp' | 'forgot_password'>('loading');
    const [loadingMessage, setLoadingMessage] = useState('SYNCHRONIZING WITH UNDERDOG_ID...');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [tempUsername, setTempUsername] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [profile, setProfile] = useState<OnlineProfile | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const initialized = React.useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            checkUser();
        }
    }, []);

    const checkUser = async () => {
        setLoadingMessage('SYNCHRONIZING WITH UNDERDOG_ID...');
        setView('loading');
        const user = await supabaseService.getCurrentUser();
        if (user) {
            const profileData = await supabaseService.getProfile(user.id);
            setProfile(profileData);
            if (profileData) {
                setUsername(profileData.username);
                setTempUsername(profileData.username);
            }
            setView('profile');
        } else {
            setView('login');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        setLoadingMessage('AUTHORIZING PILOT...');
        const { error } = await supabaseService.signIn(email, password);
        if (error) {
            setError(error.message);
            setIsSubmitting(false);
        } else {
            await onLoginSuccess();
            checkUser();
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        setLoadingMessage('REGISTERING NEW PILOT...');
        const { data, error } = await supabaseService.signUp(email, password, username);

        if (error) {
            setError(error.message);
            setIsSubmitting(false);
        } else {
            if (data.user) {
                // Create profile (optimistic, Supabase might not have user in 'profiles' yet if trigger isn't set up)
                await supabaseService.updateProfile({ id: data.user.id, username });
                setMessage("An OTP code has been sent to your email.");
                setView('otp');
            }
            setIsSubmitting(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        setLoadingMessage('VERIFYING OTP...');
        const { error } = await supabaseService.verifyOtp(email, otpCode, 'signup');
        if (error) {
            setError(error.message);
            setIsSubmitting(false);
        } else {
            setMessage("Account verified! You can now log in.");
            setView('login');
            setIsSubmitting(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        setLoadingMessage('SENDING RESET LINK...');
        const { error } = await supabaseService.resetPassword(email);
        if (error) {
            setError(error.message);
        } else {
            setMessage("Password reset link sent to your email.");
            setView('login');
        }
        setIsSubmitting(false);
    };

    const handleLogout = async () => {
        setLoadingMessage('DEAUTHORIZING...');
        setView('loading');
        await supabaseService.signOut();
        setProfile(null);
        setView('login');
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        setLoadingMessage('UPDATING CALLSIGN...');
        const { error } = await supabaseService.updateProfile({ username: tempUsername });
        if (error) {
            setError(error.message);
        } else {
            setMessage("Callsign updated!");
            setUsername(tempUsername);
            setIsEditingUsername(false);
            checkUser();
        }
        setIsSubmitting(false);
    };

    const handleUpdateAvatar = async (avatarId: string) => {
        setError(null);
        setIsSubmitting(true);
        setLoadingMessage('UPDATING AVATAR...');
        const result = await supabaseService.updateProfile({ avatar_id: avatarId });
        if (result.error) {
            setError(result.error.message);
        } else if ((result as any).columnMissing) {
            setError("Database update required: Please add 'avatar_id' column to 'profiles' table in Supabase.");
        } else {
            setMessage("Avatar updated!");
            checkUser();
        }
        setIsSubmitting(false);
    };

    const availableAvatars = [
        { id: 'enemy_normal', label: 'Spike' },
        { id: 'enemy_diagonal', label: 'Diagonal' },
        { id: 'enemy_seeker', label: 'Seeker' },
        { id: 'enemy_side_seeker', label: 'Side Seeker' },
        { id: 'enemy_titan', label: 'Titan' },
        { id: 'enemy_spikes', label: 'Floor Spikes' },
        { id: 'enemy_titan_explosion', label: 'Titan Core' },
        ...SKIN_CONFIG.filter((s: any) => userProgress.unlockedSkins.includes(s.id)).map((s: any) => ({ id: s.id, label: s.name }))
    ];

    return (
        <div className="absolute inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm p-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md bg-[#0a0a0a] border border-blue-500/30 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            >
                {/* Header */}
                <div className="bg-blue-600/10 border-b border-blue-500/20 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-400" />
                        <h2 className="text-blue-400 font-mono font-bold tracking-widest uppercase">Underdog ID</h2>
                    </div>
                    {!isInitialGate && (
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="p-6">
                    <AnimatePresence mode="wait">
                        {view === 'loading' && (
                            <motion.div 
                                key="loading"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-12 gap-4"
                            >
                                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                                <div className="text-blue-500 font-mono text-xs animate-pulse uppercase">{loadingMessage}</div>
                            </motion.div>
                        )}

                        {view === 'login' && (
                            <motion.form 
                                key="login"
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleLogin}
                                className="space-y-4"
                            >
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-gray-500 uppercase">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                        <input 
                                            type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                            className="w-full bg-black border border-gray-800 rounded p-2 pl-10 text-sm focus:border-blue-500 outline-none transition-colors"
                                            placeholder="pilot@underdog.id"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-mono text-gray-500 uppercase">Security Key</label>
                                        <button 
                                            type="button" 
                                            onClick={() => setView('forgot_password')}
                                            className="text-[9px] font-mono text-blue-400 hover:text-blue-300 uppercase"
                                        >
                                            Forgot?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                        <input 
                                            type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                            className="w-full bg-black border border-gray-800 rounded p-2 pl-10 text-sm focus:border-blue-500 outline-none transition-colors"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/30 p-2 rounded flex items-center gap-2 text-red-400 text-xs">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {message && (
                                    <div className="bg-green-500/10 border border-green-500/30 p-2 rounded flex items-center gap-2 text-green-400 text-xs">
                                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                                        <span>{message}</span>
                                    </div>
                                )}

                                {isInitialGate && (
                                    <div className="bg-blue-500/5 border border-blue-500/20 p-3 rounded-lg">
                                        <div className="flex items-center gap-2 text-blue-400 text-[10px] font-mono uppercase mb-1">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>Cloud Sync Information</span>
                                        </div>
                                        <p className="text-[9px] text-gray-500 leading-relaxed">
                                            Underdog ID enables cross-game progression and global leaderboard eligibility. 
                                            Offline progress is saved locally but cannot be recovered if local data is cleared.
                                        </p>
                                    </div>
                                )}

                                <button 
                                    type="submit" disabled={isSubmitting}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white font-bold py-3 rounded transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                                    AUTHORIZE PILOT
                                </button>

                                {onPlayOffline && (
                                    <button 
                                        type="button" onClick={onPlayOffline}
                                        className="w-full bg-transparent border border-gray-800 hover:border-gray-600 text-gray-400 font-mono text-xs py-3 rounded transition-all flex items-center justify-center gap-2"
                                    >
                                        PLAY OFFLINE (LOCAL ONLY)
                                    </button>
                                )}

                                <div className="text-center">
                                    <button 
                                        type="button" onClick={() => setView('signup')}
                                        className="text-[10px] font-mono text-gray-500 hover:text-blue-400 transition-colors uppercase"
                                    >
                                        New Pilot? Create Underdog ID
                                    </button>
                                </div>
                            </motion.form>
                        )}

                        {view === 'signup' && (
                            <motion.form 
                                key="signup"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSignUp}
                                className="space-y-4"
                            >
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-gray-500 uppercase">Callsign (Username)</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                        <input 
                                            type="text" required value={username} onChange={e => setUsername(e.target.value)}
                                            className="w-full bg-black border border-gray-800 rounded p-2 pl-10 text-sm focus:border-blue-500 outline-none transition-colors"
                                            placeholder="ACE_PILOT"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-gray-500 uppercase">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                        <input 
                                            type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                            className="w-full bg-black border border-gray-800 rounded p-2 pl-10 text-sm focus:border-blue-500 outline-none transition-colors"
                                            placeholder="pilot@underdog.id"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-gray-500 uppercase">Security Key</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                        <input 
                                            type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                            className="w-full bg-black border border-gray-800 rounded p-2 pl-10 text-sm focus:border-blue-500 outline-none transition-colors"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/30 p-2 rounded flex items-center gap-2 text-red-400 text-xs">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button 
                                    type="submit" disabled={isSubmitting}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white font-bold py-3 rounded transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                    REGISTER UNDERDOG ID
                                </button>

                                <div className="text-center">
                                    <button 
                                        type="button" onClick={() => setView('login')}
                                        className="text-[10px] font-mono text-gray-500 hover:text-blue-400 transition-colors uppercase"
                                    >
                                        Already Registered? Authorize
                                    </button>
                                </div>
                            </motion.form>
                        )}

                        {view === 'otp' && (
                            <motion.form 
                                key="otp"
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
                                onSubmit={handleVerifyOtp}
                                className="space-y-4"
                            >
                                <div className="text-center space-y-2">
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                                        <Mail className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h3 className="text-white font-bold">Verify Your Identity</h3>
                                    <p className="text-[10px] text-gray-500 font-mono">
                                        Enter the verification code sent to <span className="text-blue-400">{email}</span>
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-gray-500 uppercase">OTP Code</label>
                                    <input 
                                        type="text" required value={otpCode} onChange={e => setOtpCode(e.target.value)}
                                        className="w-full bg-black border border-gray-800 rounded p-3 text-center text-2xl font-mono tracking-[0.5em] focus:border-blue-500 outline-none transition-colors"
                                        placeholder="00000000"
                                        maxLength={8}
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/30 p-2 rounded flex items-center gap-2 text-red-400 text-xs">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button 
                                    type="submit" disabled={isSubmitting}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white font-bold py-3 rounded transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    VERIFY ACCOUNT
                                </button>

                                <div className="text-center">
                                    <button 
                                        type="button" onClick={() => setView('signup')}
                                        className="text-[10px] font-mono text-gray-500 hover:text-blue-400 transition-colors uppercase"
                                    >
                                        Back to Registration
                                    </button>
                                </div>
                            </motion.form>
                        )}

                        {view === 'forgot_password' && (
                            <motion.form 
                                key="forgot_password"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                onSubmit={handleForgotPassword}
                                className="space-y-4"
                            >
                                <div className="text-center space-y-2">
                                    <h3 className="text-white font-bold">Recover Underdog ID</h3>
                                    <p className="text-[10px] text-gray-500 font-mono">
                                        Enter your email and we'll send you a recovery link.
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-gray-500 uppercase">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                        <input 
                                            type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                            className="w-full bg-black border border-gray-800 rounded p-2 pl-10 text-sm focus:border-blue-500 outline-none transition-colors"
                                            placeholder="pilot@underdog.id"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/30 p-2 rounded flex items-center gap-2 text-red-400 text-xs">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button 
                                    type="submit" disabled={isSubmitting}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white font-bold py-3 rounded transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                    SEND RECOVERY LINK
                                </button>

                                <div className="text-center">
                                    <button 
                                        type="button" onClick={() => setView('login')}
                                        className="text-[10px] font-mono text-gray-500 hover:text-blue-400 transition-colors uppercase"
                                    >
                                        Back to Authorization
                                    </button>
                                </div>
                            </motion.form>
                        )}

                        {view === 'profile' && profile && (
                            <motion.div 
                                key="profile"
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center border-2 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] overflow-hidden">
                                        <AvatarIcon 
                                            avatarId={profile.avatar_id || ''} 
                                            avatarUrl={profile.avatar_url}
                                            size={64} 
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[10px] font-mono text-blue-400 uppercase tracking-widest flex justify-between items-center">
                                            <span>Pilot Callsign</span>
                                            {!isEditingUsername && (
                                                <button 
                                                    onClick={() => setIsEditingUsername(true)}
                                                    className="text-gray-500 hover:text-blue-400 transition-colors"
                                                >
                                                    <Settings className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                        
                                        {isEditingUsername ? (
                                            <form onSubmit={handleUpdateProfile} className="mt-1 flex gap-2">
                                                <input 
                                                    autoFocus
                                                    type="text" value={tempUsername} onChange={e => setTempUsername(e.target.value)}
                                                    className="bg-black border border-blue-500/50 rounded px-2 py-1 text-sm text-white w-full outline-none"
                                                />
                                                <button 
                                                    type="submit" disabled={isSubmitting}
                                                    className="bg-blue-600 p-1 rounded hover:bg-blue-500 disabled:opacity-50"
                                                >
                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                </button>
                                                <button 
                                                    type="button" onClick={() => { setIsEditingUsername(false); setTempUsername(username); }}
                                                    className="bg-gray-800 p-1 rounded hover:bg-gray-700"
                                                >
                                                    <RefreshCw className="w-4 h-4 text-gray-400" />
                                                </button>
                                            </form>
                                        ) : (
                                            <div className="text-xl font-bold text-white tracking-tight">{profile.username}</div>
                                        )}
                                        <div className="text-[10px] font-mono text-gray-500">Underdog_ID: {profile.id.slice(0, 8)}...</div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/30 p-2 rounded flex items-center gap-2 text-red-400 text-xs">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {message && (
                                    <div className="bg-green-500/10 border border-green-500/30 p-2 rounded flex items-center gap-2 text-green-400 text-xs">
                                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                                        <span>{message}</span>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-mono text-blue-400 uppercase tracking-widest border-b border-blue-500/20 pb-1">Select Avatar</h3>
                                    <div className="grid grid-cols-5 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                        {availableAvatars.map(avatar => (
                                            <button 
                                                key={avatar.id}
                                                onClick={() => handleUpdateAvatar(avatar.id)}
                                                disabled={isSubmitting}
                                                className={`p-1 rounded border transition-all flex flex-col items-center gap-1 ${
                                                    profile.avatar_id === avatar.id 
                                                    ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                                                    : 'bg-black border-gray-800 hover:border-blue-500/50'
                                                }`}
                                                title={avatar.label}
                                            >
                                                <AvatarIcon avatarId={avatar.id} size={32} />
                                                <span className="text-[8px] font-mono text-gray-500 truncate w-full text-center">{avatar.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => {
                                            onLoginSuccess(); // Trigger sync
                                            checkUser(); // Refresh profile
                                        }}
                                        className="p-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded flex flex-col items-center gap-1 transition-colors"
                                    >
                                        <RefreshCw className="w-4 h-4 text-blue-400" />
                                        <span className="text-[9px] font-mono text-gray-400 uppercase">Sync Data</span>
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (onShowLeaderboard) onShowLeaderboard();
                                        }}
                                        className="p-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded flex flex-col items-center gap-1 transition-colors"
                                    >
                                        <Trophy className="w-4 h-4 text-yellow-500" />
                                        <span className="text-[9px] font-mono text-gray-400 uppercase">Leaderboard</span>
                                    </button>
                                </div>

                                {isInitialGate && (
                                    <button 
                                        onClick={onClose}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2"
                                    >
                                        <LogIn className="w-4 h-4" />
                                        PROCEED TO ASTRA INFINITY
                                    </button>
                                )}

                                <div className="pt-4 border-t border-gray-800">
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full py-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    >
                                        <LogOut className="w-3 h-3" />
                                        Deauthorize Pilot
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                {!isInitialGate && (
                    <div className="p-4 bg-black/50 border-t border-gray-900 flex justify-center">
                        <button 
                            onClick={onClose}
                            className="text-[10px] font-mono text-gray-600 hover:text-white transition-colors uppercase tracking-widest"
                        >
                            Close Underdog ID
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default AuthOverlay;
