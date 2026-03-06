
import React from 'react';
import { UserProgress } from '../../types';
import { formatTime } from '../../services/gameLogic';
import { SHOP_CONFIG, TRAIL_CONFIG, SKIN_CONFIG, COLORS } from '../../constants';
import { VisualRNG } from '../../services/rng';

interface StatisticsScreenProps {
    progress: UserProgress;
    onClose: () => void;
    playClick: () => void;
    playHover: () => void;
}

const EnemyIcon: React.FC<{ type: string; size?: number }> = ({ type, size = 20 }) => {
    const s = size;
    
    switch (type) {
        case 'normal':
            return (
                <svg width={s} height={s} viewBox="0 0 40 40">
                    <polygon points="20,35 5,5 35,5" fill={COLORS.SPIKE} />
                </svg>
            );
        case 'diagonal':
            return (
                <svg width={s} height={s} viewBox="0 0 40 40">
                    <polygon points="20,35 5,5 35,5" fill={COLORS.DIAGONAL} transform="rotate(45 20 20)" />
                </svg>
            );
        case 'seeker':
            return (
                <svg width={s} height={s} viewBox="0 0 40 40">
                    <polygon points="20,35 5,5 35,5" fill={COLORS.SEEKER} />
                </svg>
            );
        case 'side-seeker':
            return (
                <svg width={s} height={s} viewBox="0 0 40 40">
                    <polygon points="5,20 35,5 35,35" fill={COLORS.SEEKER} stroke="#f1c40f" strokeWidth="2" />
                </svg>
            );
        case 'titan':
            return (
                <svg width={s} height={s} viewBox="0 0 40 40">
                    <polygon points="20,5 5,35 35,35" fill={COLORS.TITAN} />
                    <polygon points="20,5 5,35 35,35" fill="none" stroke="#ff0000" strokeWidth="2" className="animate-pulse" />
                </svg>
            );
        case 'spikes':
            return (
                <svg width={s} height={s} viewBox="0 0 40 40">
                    <path d="M0,40 L10,10 L20,40 L30,10 L40,40 Z" fill="#ffffff" />
                </svg>
            );
        case 'titan_explosion':
            return (
                <svg width={s} height={s} viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="none" stroke={COLORS.TITAN} strokeWidth="2" strokeDasharray="4 2" />
                    <circle cx="20" cy="20" r="8" fill={COLORS.TITAN} />
                </svg>
            );
        default:
            return <span className="text-[10px] opacity-50">?</span>;
    }
};

const StatisticsScreen: React.FC<StatisticsScreenProps> = ({ progress, onClose, playClick, playHover }) => {
    const stats = progress.stats;
    const [consoleLog] = React.useState(() => {
        const hex = () => Math.floor(VisualRNG.random() * 16777215).toString(16).toUpperCase();
        return `[STAT_LOG] INITIALIZING DATA_ARCHIVE_V2.4.0\n[STAT_LOG] ACCESSING PILOT_ID: ${progress.equippedSkin || 'DEFAULT'}\n[STAT_LOG] DECRYPTING_HISTORY_0x${hex()}... OK`;
    });

    const getMostUsed = (usageMap: { [key: string]: number } | undefined, type: 'skin' | 'trail') => {
        if (!usageMap) return 'None';
        let max = -1;
        let mostUsedId = 'None';
        for (const key in usageMap) {
            if (usageMap[key] > max) {
                max = usageMap[key];
                mostUsedId = key;
            }
        }
        
        if (mostUsedId === 'None') return 'None';
        
        if (type === 'skin') {
            const skin = SKIN_CONFIG.find(s => s.id === mostUsedId);
            return skin ? skin.name : mostUsedId;
        } else {
            const trail = TRAIL_CONFIG.find(t => t.id === mostUsedId);
            return trail ? trail.name : mostUsedId;
        }
    };

    const getKilledMostBy = () => {
        if (!stats.deathCounts) return 'None';
        let max = -1;
        let mostKilledBy = 'None';
        for (const key in stats.deathCounts) {
            if (stats.deathCounts[key] > max) {
                max = stats.deathCounts[key];
                mostKilledBy = key;
            }
        }
        return mostKilledBy;
    };

    const deathList = [
        { type: 'normal' },
        { type: 'diagonal' },
        { type: 'seeker' },
        { type: 'side-seeker' },
        { type: 'titan' },
        { type: 'titan_explosion' },
        { type: 'spikes' }
    ];

    const killedMostBy = getKilledMostBy();

    return (
        <div className="absolute inset-0 z-[90] flex items-center justify-center backdrop-blur-[1px]">
            <div className="monitor-frame menu-animate-enter relative w-[95%] max-w-2xl h-[90%] py-8 flex flex-col items-center rounded-xl overflow-hidden shadow-2xl">
                
                {/* Background effects */}
                <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none z-0">
                    <div className="text-[#00ff00] font-mono text-[10px] leading-4 whitespace-pre p-2">
                        {consoleLog}
                    </div>
                </div>
                <div className="scanlines absolute inset-0 z-0 opacity-30"></div>

                <div className="relative z-10 w-full px-8 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6 border-b border-blue-500/30 pb-4">
                        <h2 className="text-2xl font-black text-blue-500 tracking-tighter italic uppercase">Pilot Statistics</h2>
                        <button 
                            onClick={() => { playClick(); onClose(); }}
                            onMouseEnter={playHover}
                            className="text-white/50 hover:text-white font-mono text-xs border border-white/20 px-3 py-1 hover:bg-white/10 transition-all"
                        >
                            [ RETURN ]
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                            {/* Survival Section */}
                            <div className="space-y-4">
                                <h3 className="text-blue-400 font-mono text-[10px] font-bold tracking-[0.2em] uppercase opacity-70 border-l-2 border-blue-500 pl-2">Survival Data</h3>
                                <div className="space-y-2">
                                    <StatRow label="Total Time (Normal)" value={formatTime(stats.totalTimeNormal || 0)} />
                                    <StatRow label="Total Time (Hardcore)" value={formatTime(stats.totalTimeHardcore || 0)} />
                                    <StatRow label="Total Runs" value={(stats.totalRuns || 0).toLocaleString()} />
                                    <StatRow label="Missions Completed" value={(stats.lifetimeMissionsCompleted || 0).toLocaleString()} />
                                </div>
                            </div>

                            {/* Economy Section */}
                            <div className="space-y-4">
                                <h3 className="text-blue-400 font-mono text-[10px] font-bold tracking-[0.2em] uppercase opacity-70 border-l-2 border-blue-500 pl-2">Economy</h3>
                                <div className="space-y-2">
                                    <StatRow label="Lifetime Coins" value={(stats.lifetimeCoinsEarned || 0).toLocaleString()} />
                                    <StatRow label="Coins Spent" value={(stats.lifetimeCoinsSpent || 0).toLocaleString()} />
                                    <StatRow label="Trails Owned" value={(progress.unlockedTrails?.length || 0).toString()} />
                                    <StatRow label="Skins Owned" value={(progress.unlockedSkins?.length || 0).toString()} />
                                </div>
                            </div>

                            {/* Skill Section */}
                            <div className="space-y-4">
                                <h3 className="text-blue-400 font-mono text-[10px] font-bold tracking-[0.2em] uppercase opacity-70 border-l-2 border-blue-500 pl-2">Technique</h3>
                                <div className="space-y-2">
                                    <StatRow label="Total Showboats" value={(stats.totalShowboats || 0).toLocaleString()} />
                                    <StatRow label="Time Grazed" value={formatTime(stats.totalTimeGrazed || 0)} />
                                    <StatRow label="Grazing Revenue" value={Math.floor(stats.grazingCoinsEarned || 0).toLocaleString()} />
                                </div>
                            </div>

                            {/* Profile Section */}
                            <div className="space-y-4">
                                <h3 className="text-blue-400 font-mono text-[10px] font-bold tracking-[0.2em] uppercase opacity-70 border-l-2 border-blue-500 pl-2">Pilot Profile</h3>
                                <div className="space-y-2">
                                    <StatRow label="Most Used Skin" value={getMostUsed(stats.skinUsage, 'skin')} />
                                    <StatRow label="Most Used Trail" value={getMostUsed(stats.trailUsage, 'trail')} />
                                    <div className="flex justify-between items-center border-b border-white/5 py-1">
                                        <span className="text-[10px] font-mono text-white/60 uppercase">Killed Most By</span>
                                        <div className="flex items-center gap-2">
                                            <EnemyIcon type={killedMostBy} size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Death List */}
                        <div className="mt-8 pt-6 border-t border-blue-500/20">
                            <h3 className="text-blue-400 font-mono text-[10px] font-bold tracking-[0.2em] uppercase opacity-70 mb-6 text-center">Threat Analysis</h3>
                            <div className="grid grid-cols-7 gap-4">
                                {deathList.map(death => (
                                    <div key={death.type} className="bg-white/5 border border-white/10 p-4 rounded flex flex-col items-center gap-3 hover:bg-white/10 transition-colors">
                                        <EnemyIcon type={death.type} size={24} />
                                        <div className="text-sm font-black text-white">{(stats.deathCounts && stats.deathCounts[death.type]) || 0}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 text-center opacity-30">
                        <span className="text-[10px] font-mono text-gray-600 tracking-[0.2em]">ASTRA_OS // DATA_ARCHIVE_SECURED</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex justify-between items-center border-b border-white/5 py-1">
        <span className="text-xs font-mono text-white/60">{label}</span>
        <span className="text-sm font-bold text-white">{value}</span>
    </div>
);

export default StatisticsScreen;
