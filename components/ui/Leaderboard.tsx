import React, { useState, useEffect } from 'react';
import { HighScoreEntry } from '../../types';

// We need to import getHighScores from where we put it.
import { getHighScores as fetchScores } from '../../services/storage';
import { formatTime as format } from '../../services/gameLogic';

interface LeaderboardProps {
    initialMode: 'normal' | 'hardcore';
    onClose: () => void;
    playClick: () => void;
    playHover: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ initialMode, onClose, playClick, playHover }) => {
    const [viewedLeaderboardMode, setViewedLeaderboardMode] = useState<'normal' | 'hardcore'>(initialMode);
    const [leaderboard, setLeaderboard] = useState<HighScoreEntry[]>([]);

    useEffect(() => {
        setLeaderboard(fetchScores(viewedLeaderboardMode));
    }, [viewedLeaderboardMode]);

    return (
        <div className="absolute inset-0 z-[80] flex flex-col items-center justify-center bg-black/95 text-white p-4">
             <h2 className="text-[#3498db] text-3xl font-bold mb-4 tracking-widest pb-2">
                 ARCHIVES
             </h2>
             
             {/* Mode Toggles */}
             <div className="flex gap-4 mb-6">
                 <button 
                      onClick={() => { playClick(); setViewedLeaderboardMode('normal'); }}
                      onMouseEnter={playHover}
                      className={`px-4 py-2 font-mono text-sm border ${viewedLeaderboardMode === 'normal' ? 'bg-[#2ecc71] text-black border-[#2ecc71]' : 'text-[#2ecc71] border-[#2ecc71] hover:bg-[#2ecc71] hover:text-black'} transition-colors`}
                 >
                     NORMAL
                 </button>
                 <button 
                      onClick={() => { playClick(); setViewedLeaderboardMode('hardcore'); }}
                      onMouseEnter={playHover}
                      className={`px-4 py-2 font-mono text-sm border ${viewedLeaderboardMode === 'hardcore' ? 'bg-red-600 text-white border-red-600' : 'text-red-500 border-red-600 hover:bg-red-600 hover:text-white'} transition-colors`}
                 >
                     HARDCORE
                 </button>
             </div>

             <div className="w-full max-w-sm font-mono text-lg min-h-[300px]">
                 {leaderboard.length === 0 ? (
                     <div className="text-center text-gray-500 py-10">NO DATA FOUND FOR {viewedLeaderboardMode.toUpperCase()}</div>
                 ) : (
                     leaderboard.map((entry, idx) => (
                         <div key={idx} className="flex justify-between py-2 border-b border-gray-800 text-gray-300">
                             <span>{idx + 1}. {entry.name}</span>
                             <span>{format(entry.score)}</span>
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
        </div>
    );
};

export default Leaderboard;