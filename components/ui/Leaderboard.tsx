import React, { useState, useEffect } from 'react';
import { HighScoreEntry, ReplayData } from '../../types';
import { ReplayTooltip } from './ReplayTooltip';
import { AvatarIcon } from './AvatarIcon';
import { motion, AnimatePresence } from 'motion/react';

// We need to import getHighScores from where we put it.
import { getHighScores as fetchScores, getReplay } from '../../services/storage';
import { formatTime as format } from '../../services/gameLogic';
import { Play } from 'lucide-react';

interface LeaderboardProps {
    initialMode: 'normal' | 'hardcore' | 'chaos';
    onModeChange?: (mode: 'normal' | 'hardcore' | 'chaos') => void;
    onClose: () => void;
    onWatchReplay: (replay: ReplayData) => void;
    playClick: () => void;
    playHover: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ initialMode, onModeChange, onClose, onWatchReplay, playClick, playHover }) => {
    const [viewedLeaderboardMode, setViewedLeaderboardMode] = useState<'normal' | 'hardcore' | 'chaos'>(initialMode);
    const [leaderboard, setLeaderboard] = useState<HighScoreEntry[]>([]);
    const [hoveredEntry, setHoveredEntry] = useState<HighScoreEntry | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleModeChange = (mode: 'normal' | 'hardcore' | 'chaos') => {
        playClick();
        setViewedLeaderboardMode(mode);
        if (onModeChange) onModeChange(mode);
    };

    useEffect(() => {
        setLeaderboard(fetchScores(viewedLeaderboardMode));
    }, [viewedLeaderboardMode]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({ 
            x: e.clientX - rect.left, 
            y: e.clientY - rect.top 
        });
    };

    const handleWatch = (replayId: string) => {
        const replay = getReplay(replayId);
        if (replay) {
            playClick();
            onWatchReplay(replay);
        }
    };

    return (
        <div 
            className="absolute inset-0 z-[80] flex flex-col items-center justify-center bg-black/95 text-white p-4"
            onMouseMove={handleMouseMove}
        >
             <h2 className="text-[#3498db] text-3xl font-bold mb-4 tracking-widest pb-2">
                 ARCHIVES
             </h2>
             
             {/* Mode Toggles */}
             <div className="flex gap-4 mb-6">
                 <button 
                      onClick={() => handleModeChange('normal')}
                      onMouseEnter={playHover}
                      className={`px-4 py-2 font-mono text-sm border ${viewedLeaderboardMode === 'normal' ? 'bg-[#2ecc71] text-black border-[#2ecc71]' : 'text-[#2ecc71] border-[#2ecc71] hover:bg-[#2ecc71] hover:text-black'} transition-colors`}
                 >
                     NORMAL
                 </button>
                 <button 
                      onClick={() => handleModeChange('hardcore')}
                      onMouseEnter={playHover}
                      className={`px-4 py-2 font-mono text-sm border ${viewedLeaderboardMode === 'hardcore' ? 'bg-red-600 text-white border-red-600' : 'text-red-500 border-red-600 hover:bg-red-600 hover:text-white'} transition-colors`}
                 >
                     HARDCORE
                 </button>
                 <button 
                      onClick={() => handleModeChange('chaos')}
                      onMouseEnter={playHover}
                      className={`px-4 py-2 font-mono text-sm border ${viewedLeaderboardMode === 'chaos' ? 'bg-orange-600 text-white border-orange-600' : 'text-orange-500 border-orange-600 hover:bg-orange-600 hover:text-white'} transition-colors`}
                 >
                     CHAOS
                 </button>
             </div>

             <div className="w-full max-w-sm font-mono text-lg min-h-[300px]">
                 {leaderboard.length === 0 ? (
                     <div className="text-center text-gray-500 py-10">NO DATA FOUND FOR {viewedLeaderboardMode.toUpperCase()}</div>
                 ) : (
                     leaderboard.map((entry, idx) => (
                        <div 
                            key={idx} 
                            className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-800 text-gray-300 hover:bg-white/5 px-2 transition-colors relative gap-1 sm:gap-0"
                            onMouseEnter={() => setHoveredEntry(entry)}
                            onMouseLeave={() => setHoveredEntry(null)}
                          >

                              <div className="flex items-center gap-2">
                                  <AvatarIcon 
                                      avatarId={(entry.metadata as any)?.avatarId || ''} 
                                      size={24} 
                                      className="ring-1 ring-white/10"
                                  />
                                  <span className="truncate max-w-[200px] sm:max-w-none">{idx + 1}. {entry.name}</span>
                                 {entry.replayId && (
                                     <button 
                                        onClick={() => handleWatch(entry.replayId!)}
                                        onMouseEnter={playHover}
                                        className="p-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-black transition-all rounded-full"
                                        title="Watch Replay"
                                     >
                                         <Play size={10} fill="currentColor" />
                                     </button>
                                 )}
                             </div>
                             <span className="text-sm sm:text-lg font-bold text-[#3498db] sm:text-gray-300">{format(entry.score)}</span>
                         </div>
                     ))
                 )}
             </div>
             <button 
              onClick={() => { playClick(); onClose(); }}
              onMouseEnter={playHover}
              className="mt-8 text-[#3498db] border border-[#3498db] px-6 py-2 hover:bg-[#3498db] hover:text-black transition-colors"
             >
                 RETURN
             </button>

             <AnimatePresence>
                 {hoveredEntry && (
                     <ReplayTooltip entry={hoveredEntry} mousePos={mousePos} />
                 )}
             </AnimatePresence>
        </div>
    );
};

export default Leaderboard;