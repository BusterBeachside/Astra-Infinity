
import React, { useEffect, useState } from 'react';
import { LeaderboardEntry, HighScoreEntry } from '../../types';
import { SKIN_CONFIG, TRAIL_CONFIG } from '../../constants';

import { motion } from 'motion/react';

interface ReplayTooltipProps {
    entry: LeaderboardEntry | HighScoreEntry;
    mousePos: { x: number; y: number };
}

export const ReplayTooltip: React.FC<ReplayTooltipProps> = ({ entry, mousePos }) => {
    const metadataRaw = entry.metadata;
    
    useEffect(() => {
        if (!metadataRaw) {
            console.warn(`[Underdog_ID] ReplayTooltip: Mission data archive missing for pilot "${(entry as any).username || (entry as any).name}"`, entry);
        }
    }, [metadataRaw, entry]);

    if (!metadataRaw) return null;

    let metadata: any = metadataRaw;

    // Handle string metadata if it comes back from Supabase as a string
    if (typeof metadataRaw === 'string') {
        try {
            metadata = JSON.parse(metadataRaw);
        } catch (e) {
            return null;
        }
    }

    const skin = SKIN_CONFIG.find((s: any) => s.id === metadata.skinId);
    const trail = TRAIL_CONFIG.find((t: any) => t.id === metadata.trailType);
    const upgrades = metadata.upgrades;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute z-[300] pointer-events-none bg-black/90 border border-yellow-500/50 p-4 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md min-w-[200px]"
            style={{ 
                left: mousePos.x + 20, 
                top: mousePos.y + 20,
            }}
        >
            <div className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest border-b border-yellow-500/20 pb-2 mb-3">
                Mission Data Archive
            </div>

            <div className="space-y-3">
                {/* Loadout */}
                <div className="space-y-1">
                    <div className="text-[9px] font-mono text-gray-500 uppercase">Loadout Configuration</div>
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center bg-white/5 px-2 py-1 rounded">
                            <span className="text-[10px] text-white/70">Skin</span>
                            <span className="text-[10px] font-bold text-white">{skin?.name || 'Standard'}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 px-2 py-1 rounded">
                            <span className="text-[10px] text-white/70">Trail</span>
                            <span className="text-[10px] font-bold text-white">{trail?.name || 'Standard'}</span>
                        </div>
                    </div>
                </div>

                {/* Upgrades */}
                {upgrades && (
                    <div className="space-y-1">
                        <div className="text-[9px] font-mono text-gray-500 uppercase">Upgrade Levels</div>
                        <div className="grid grid-cols-2 gap-1">
                            <UpgradeStat label="Shields" level={upgrades.maxShields} />
                            <UpgradeStat label="Slow" level={upgrades.durationSlow} />
                            <UpgradeStat label="Shrink" level={upgrades.durationShrink} />
                            <UpgradeStat label="Graze" level={upgrades.grazeBonus} />
                        </div>
                    </div>
                )}

                {/* Special */}
                {upgrades && (upgrades.permDoubleCoins || upgrades.showboat) && (
                    <div className="flex gap-2 pt-1">
                        {upgrades.permDoubleCoins && (
                            <span className="text-[8px] font-mono bg-yellow-500/20 text-yellow-500 px-1 border border-yellow-500/30 rounded">2X_COINS</span>
                        )}
                        {upgrades.showboat && (
                            <span className="text-[8px] font-mono bg-blue-500/20 text-blue-400 px-1 border border-blue-500/30 rounded">SHOWBOAT</span>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const UpgradeStat: React.FC<{ label: string; level: number }> = ({ label, level }) => (
    <div className="flex justify-between items-center bg-white/5 px-2 py-1 rounded">
        <span className="text-[9px] text-white/50">{label}</span>
        <span className="text-[10px] font-mono font-bold text-yellow-500">LVL {level}</span>
    </div>
);
