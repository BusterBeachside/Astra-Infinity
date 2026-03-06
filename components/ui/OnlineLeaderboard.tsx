import React, { useState, useEffect } from 'react';
import { supabaseService } from '../../services/supabaseService';
import { LeaderboardEntry } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Clock, User, Play, Download, RefreshCw, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { AvatarIcon } from './AvatarIcon';
import { ReplayTooltip } from './ReplayTooltip';

interface OnlineLeaderboardProps {
    initialMode?: 'normal' | 'hardcore' | 'chaos';
    onModeChange?: (mode: 'normal' | 'hardcore' | 'chaos') => void;
    onClose: () => void;
    onWatchReplay: (replayPath: string) => void;
}

const OnlineLeaderboard: React.FC<OnlineLeaderboardProps> = ({ initialMode, onModeChange, onClose, onWatchReplay }) => {
    const [mode, setMode] = useState<'normal' | 'hardcore' | 'chaos'>(initialMode || 'normal');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredEntry, setHoveredEntry] = useState<LeaderboardEntry | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleModeChange = (m: 'normal' | 'hardcore' | 'chaos') => {
        setMode(m);
        if (onModeChange) onModeChange(m);
    };

    useEffect(() => {
        fetchLeaderboard();
    }, [mode]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({ 
            x: e.clientX - rect.left, 
            y: e.clientY - rect.top 
        });
    };

    const fetchLeaderboard = async () => {
        setIsLoading(true);
        const data = await supabaseService.getLeaderboard(mode);
        setEntries(data);
        setIsLoading(false);
    };

    return (
        <div 
            className="absolute inset-0 z-[150] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-6"
            onMouseMove={handleMouseMove}
        >
            <div className="w-full max-w-4xl border-b-2 border-yellow-500 pb-2 mb-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                    <h2 className="text-yellow-500 text-3xl font-black tracking-tighter italic uppercase">Global Hall of Fame</h2>
                </div>
                <div className="text-xs font-mono text-yellow-500/50 uppercase tracking-widest">Underdog_ID // Top_Pilots</div>
            </div>

            {/* Mode Selector */}
            <div className="flex gap-2 mb-6">
                {(['normal', 'hardcore', 'chaos'] as const).map(m => (
                    <button
                        key={m}
                        onClick={() => handleModeChange(m)}
                        className={`px-6 py-2 font-mono text-xs font-bold uppercase tracking-widest border transition-all ${
                            mode === m 
                            ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_15px_rgba(241,196,15,0.3)]' 
                            : 'bg-black text-yellow-500/50 border-yellow-500/20 hover:border-yellow-500/50'
                        }`}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {/* Table Header */}
            <div className="w-full max-w-4xl grid grid-cols-12 gap-4 px-4 py-2 bg-yellow-500/10 border-y border-yellow-500/20 text-[10px] font-mono text-yellow-500 uppercase tracking-widest mb-2">
                <div className="col-span-1">Rank</div>
                <div className="col-span-5">Pilot Callsign</div>
                <div className="col-span-3">Time Survived</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-1 text-right">Replay</div>
            </div>

            {/* Entries */}
            <div className="w-full max-w-4xl flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-1">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20 gap-4"
                        >
                            <RefreshCw className="w-8 h-8 text-yellow-500 animate-spin" />
                            <div className="text-yellow-500 font-mono text-xs animate-pulse">QUERYING GLOBAL DATABASE...</div>
                        </motion.div>
                    ) : entries.length === 0 ? (
                        <motion.div 
                            key="empty"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20 text-gray-600 font-mono italic"
                        >
                            NO RECORDS FOUND FOR THIS SECTOR.
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="list"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="space-y-1"
                        >
                            {entries.map((entry, idx) => (
                                <motion.div 
                                    key={entry.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className={`grid grid-cols-12 gap-4 px-4 py-3 items-center border border-white/5 hover:border-yellow-500/30 hover:bg-yellow-500/5 transition-all group relative ${
                                        idx === 0 ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-black/40'
                                    }`}
                                    onMouseEnter={() => {
                                        console.log("[Underdog_ID] Hovered entry:", entry.username, "Metadata:", entry.metadata);
                                        setHoveredEntry(entry);
                                    }}
                                    onMouseLeave={() => setHoveredEntry(null)}
                                >
                                    <div className={`col-span-1 font-mono text-sm font-bold ${
                                        idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-orange-400' : 'text-gray-600'
                                    }`}>
                                        #{idx + 1}
                                    </div>
                                    <div className="col-span-5 flex items-center gap-3">
                                        <AvatarIcon 
                                            avatarId={entry.avatar_id || ''} 
                                            avatarUrl={entry.avatar_url}
                                            size={32} 
                                            className="ring-2 ring-yellow-500/20 shadow-[0_0_10px_rgba(241,196,15,0.2)]"
                                        />
                                        <div className="font-bold text-white tracking-tight">{entry.username}</div>
                                    </div>
                                    <div className="col-span-3 font-mono text-yellow-500 font-bold">
                                        {Math.floor(entry.score / 60)}m {Math.floor(entry.score % 60)}s
                                    </div>
                                    <div className="col-span-2 text-[10px] font-mono text-gray-500">
                                        {format(new Date(entry.created_at), 'MMM dd, yyyy')}
                                    </div>
                                    <div className="col-span-1 text-right">
                                        {entry.replay_path && (
                                            <button 
                                                onClick={() => onWatchReplay(entry.replay_path!)}
                                                className="p-2 text-yellow-500/50 hover:text-yellow-500 hover:bg-yellow-500/20 rounded transition-all"
                                                title="Watch Replay"
                                            >
                                                <Play className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <button 
                onClick={onClose}
                className="mt-8 px-12 py-3 bg-yellow-500/10 border border-yellow-500 text-yellow-500 font-mono font-bold hover:bg-yellow-500 hover:text-black transition-all uppercase tracking-widest"
            >
                EXIT HALL OF FAME
            </button>

            <AnimatePresence>
                {hoveredEntry && (
                    <ReplayTooltip entry={hoveredEntry} mousePos={mousePos} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default OnlineLeaderboard;
