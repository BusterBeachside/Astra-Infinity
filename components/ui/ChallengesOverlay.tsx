
import React, { useState, useEffect } from 'react';
import { Challenge } from '../../types';
import { PROGRESSION_MISSIONS, COLORS } from '../../constants';

interface ChallengesOverlayProps {
    challenges: Challenge[];
    progressionIndex: number;
    userCoins: number;
    onClose: () => void;
    onClaim: (id: string) => void;
    onReroll: (id: string) => void;
}

const ChallengesOverlay: React.FC<ChallengesOverlayProps> = ({ challenges, progressionIndex, userCoins, onClose, onClaim, onReroll }) => {
    const [showAllProgression, setShowAllProgression] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            
            const diff = tomorrow.getTime() - now.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };
        
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, []);
    
    const activeProgression = challenges.find(c => c.type === 'progression');
    const dailyMissions = challenges.filter(c => c.type === 'daily');
    const repeatableMissions = challenges.filter(c => c.type === 'repeatable');

    return (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-6">
            <div className="w-full max-w-4xl border-b-2 border-blue-500 pb-2 mb-6 flex justify-between items-center">
                <h2 className="text-blue-500 text-3xl font-black tracking-tighter italic">MISSION LOG</h2>
                <div className="text-xs font-mono text-blue-500/50 uppercase tracking-widest">Astra_OS // Challenge_Matrix</div>
            </div>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
                
                {/* Progression Column */}
                <div className="col-span-1 md:col-span-2 space-y-4 border-b border-gray-800 pb-6 mb-2">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                            <h3 className="text-purple-500 font-mono font-bold tracking-widest text-sm">PROGRESSION MISSIONS</h3>
                        </div>
                        <button 
                            onClick={() => setShowAllProgression(!showAllProgression)}
                            className="text-[10px] font-mono text-purple-400 border border-purple-500/30 px-2 py-1 hover:bg-purple-500/20 transition-colors uppercase"
                        >
                            {showAllProgression ? 'Show Active Only' : 'View Full Progression'}
                        </button>
                    </div>

                    {showAllProgression ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {PROGRESSION_MISSIONS.map((pm, idx) => {
                                const isCompleted = idx < progressionIndex;
                                const isActive = idx === progressionIndex;
                                const isLocked = idx > progressionIndex;
                                
                                let displayChallenge: Challenge;
                                
                                if (isActive && activeProgression) {
                                    displayChallenge = activeProgression;
                                } else {
                                    displayChallenge = {
                                        id: `mock_${pm.id}`,
                                        templateId: pm.templateId,
                                        type: 'progression',
                                        rarity: 'legendary',
                                        description: pm.desc,
                                        target: pm.target,
                                        progress: isCompleted ? pm.target : 0,
                                        reward: pm.reward,
                                        completed: isCompleted,
                                        claimed: isCompleted,
                                        date: undefined
                                    };
                                }

                                return (
                                    <div key={pm.id} className={isLocked ? 'opacity-50 grayscale pointer-events-none' : ''}>
                                        <ChallengeCard challenge={displayChallenge} onClaim={isActive ? onClaim : () => {}} isLocked={isLocked} onReroll={onReroll} userCoins={userCoins} />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeProgression ? (
                                <ChallengeCard challenge={activeProgression} onClaim={onClaim} onReroll={onReroll} userCoins={userCoins} />
                            ) : (
                                <div className="text-purple-500/50 font-mono text-xs italic p-4 border border-purple-900/30 bg-purple-900/10">
                                    ALL PROGRESSION MISSIONS COMPLETED.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Daily Column */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                            <h3 className="text-orange-500 font-mono font-bold tracking-widest text-sm">DAILY MISSIONS</h3>
                        </div>
                        <div className="text-[10px] font-mono text-orange-500/70 border border-orange-500/30 px-2 py-0.5 rounded bg-orange-500/5">
                            RESET IN: {timeLeft}
                        </div>
                    </div>
                    {dailyMissions.length === 0 && (
                        <div className="text-gray-600 font-mono italic text-xs p-4 border border-gray-800 bg-black/20">
                            NO DAILY MISSIONS ACTIVE.
                        </div>
                    )}
                    {dailyMissions.map(c => (
                        <ChallengeCard key={c.id} challenge={c} onClaim={onClaim} onReroll={onReroll} userCoins={userCoins} />
                    ))}
                </div>

                {/* Repeatable Column */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                        <h3 className="text-blue-400 font-mono font-bold tracking-widest text-sm">REPEATABLE MISSIONS</h3>
                    </div>
                    {repeatableMissions.length === 0 && (
                        <div className="text-gray-600 font-mono italic text-xs p-4 border border-gray-800 bg-black/20">
                            NO REPEATABLE MISSIONS ACTIVE.
                        </div>
                    )}
                    {repeatableMissions.slice(0, 3).map(c => (
                        <ChallengeCard key={c.id} challenge={c} onClaim={onClaim} onReroll={onReroll} userCoins={userCoins} />
                    ))}
                </div>
            </div>

            <button 
                onClick={onClose}
                className="mt-8 px-12 py-3 bg-blue-500/10 border border-blue-500 text-blue-500 font-mono font-bold hover:bg-blue-500 hover:text-black transition-all uppercase tracking-widest"
            >
                RETURN TO BRIDGE
            </button>
        </div>
    );
};

const ChallengeCard: React.FC<{ challenge: Challenge, onClaim: (id: string) => void, onReroll: (id: string) => void, isLocked?: boolean, userCoins: number }> = ({ challenge: c, onClaim, onReroll, isLocked, userCoins }) => {
    // Rarity Colors
    const rarityColor = c.rarity === 'legendary' ? 'text-purple-400' : c.rarity === 'rare' ? 'text-blue-300' : 'text-gray-400';
    const rarityBorder = c.rarity === 'legendary' ? 'border-purple-500/30' : c.rarity === 'rare' ? 'border-blue-500/30' : 'border-gray-800';
    
    const rerollCost = c.type === 'daily' ? 500 : 250;
    const canReroll = !c.completed && !c.claimed && !isLocked && c.type !== 'progression';

    return (
    <div 
        className={`border ${c.completed && !c.claimed ? 'border-yellow-500/50 bg-yellow-500/5 shadow-[0_0_15px_rgba(241,196,15,0.1)]' : c.claimed ? 'border-green-500/30 bg-green-500/5 opacity-60' : `${rarityBorder} bg-black/40`} p-4 rounded relative overflow-hidden transition-all group`}
    >
        {isLocked && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                <div className="text-gray-500 font-mono text-xs uppercase tracking-widest border border-gray-700 px-2 py-1 bg-black">LOCKED</div>
            </div>
        )}

        {c.rarity && c.rarity !== 'common' && !c.completed && !c.claimed && !isLocked && (
            <div className={`absolute top-0 right-0 ${c.rarity === 'legendary' ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200'} text-[8px] font-black px-2 py-0.5 uppercase tracking-widest opacity-80`}>
                {c.rarity}
            </div>
        )}

        {c.completed && !c.claimed && (
            <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-black px-2 py-0.5 uppercase tracking-tighter animate-pulse">
                READY TO CLAIM
            </div>
        )}
        {c.claimed && (
            <div className="absolute top-0 right-0 bg-green-500/50 text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-tighter">
                SECURED
            </div>
        )}
        
        <div className="flex justify-between items-start mb-2">
            <div className="flex-1 pr-4">
                <div className={`text-white text-sm font-bold leading-tight mb-1 ${c.rarity === 'legendary' ? 'text-purple-100' : ''}`}>{c.description}</div>
                <div className="text-[#f1c40f] font-mono text-xs font-bold">+{c.reward} COINS</div>
            </div>
        </div>

        <div className="mt-3">
            <div className="flex justify-between text-[9px] font-mono text-gray-500 mb-1 uppercase tracking-tighter">
                <span>Progress</span>
                <span>{Math.floor(c.progress)} / {c.target}</span>
            </div>
            <div className="h-1 w-full bg-gray-900 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-700 ${c.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, (c.progress / c.target) * 100)}%` }}
                />
            </div>
        </div>

        {c.completed && !c.claimed && (
            <button 
                onClick={() => onClaim(c.id)}
                className="mt-3 w-full py-2 bg-yellow-500 text-black font-black font-mono text-[10px] hover:bg-white transition-all uppercase tracking-widest"
            >
                CLAIM REWARD
            </button>
        )}

        {canReroll && (
            <button
                onClick={() => onReroll(c.id)}
                className={`absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-mono px-2 py-1 border ${userCoins >= rerollCost ? 'border-red-500/50 text-red-400 hover:bg-red-500/20' : 'border-gray-700 text-gray-600 cursor-not-allowed'}`}
                disabled={userCoins < rerollCost}
                title={`Reroll Mission (-${rerollCost} Coins)`}
            >
                REROLL (-{rerollCost})
            </button>
        )}
    </div>
    );
};

export default ChallengesOverlay;
