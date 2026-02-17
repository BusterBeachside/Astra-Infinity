
import React, { useState } from 'react';
import { UserProgress, LoadoutState } from '../../types';
import { LOADOUT_CONFIG } from '../../constants';
import { audioManager } from '../../services/audioManager';

interface LoadoutScreenProps {
    progress: UserProgress;
    onUpdateProgress: (p: UserProgress) => void;
    onStart: (loadout: LoadoutState) => void;
    onCancel: () => void;
    playClick: () => void;
    mode: 'normal' | 'hardcore';
}

const LoadoutItem: React.FC<{
    id: keyof LoadoutState;
    config: { cost: number, name: string, desc: string };
    cost: number;
    isSelected: boolean;
    canAfford: boolean;
    onToggle: () => void;
    disabled?: boolean;
}> = ({ config, cost, isSelected, canAfford, onToggle, disabled }) => {
    return (
        <div 
            onClick={(!isSelected && !canAfford) || disabled ? undefined : onToggle}
            className={`
                flex items-center justify-between p-4 border rounded mb-3 transition-all
                ${disabled
                    ? 'border-red-900 bg-red-900/10 opacity-40 cursor-not-allowed'
                    : isSelected 
                        ? 'border-[#2ecc71] bg-[#2ecc71]/20 cursor-pointer' 
                        : canAfford 
                            ? 'border-gray-600 bg-black/60 hover:border-gray-400 cursor-pointer' 
                            : 'border-gray-800 bg-black/40 opacity-50 cursor-not-allowed'}
            `}
        >
            <div>
                <div className={`font-bold ${disabled ? 'text-red-800' : isSelected ? 'text-[#2ecc71]' : 'text-white'}`}>
                    {config.name} {disabled && "(UNAVAILABLE)"}
                </div>
                <div className="text-xs text-gray-400 font-mono">{config.desc}</div>
            </div>
            <div className={`font-mono font-bold ${disabled ? 'text-red-900' : isSelected ? 'text-[#2ecc71]' : 'text-[#f1c40f]'}`}>
                {disabled ? "---" : `${cost} C`}
            </div>
        </div>
    );
};

const LoadoutScreen: React.FC<LoadoutScreenProps> = ({ progress, onUpdateProgress, onStart, onCancel, playClick, mode }) => {
    const [loadout, setLoadout] = useState<LoadoutState>({
        startShield: false,
        rocketBoost: false,
        doubleCoins: false
    });

    const isHardcore = mode === 'hardcore';
    const costMult = isHardcore ? 2.5 : 1;

    const getCost = (key: keyof LoadoutState) => {
        // Special override for Hardcore Bounty Hunter
        if (key === 'doubleCoins' && isHardcore) return 500;
        return Math.floor(LOADOUT_CONFIG[key].cost * costMult);
    };

    const toggleItem = (key: keyof LoadoutState) => {
        if (key === 'startShield' && isHardcore) return;

        if (loadout[key]) {
            setLoadout(prev => ({ ...prev, [key]: false }));
            audioManager.playSfx('ui_click');
        } else {
            // Select: Check affordability of TOTAL selected
            const currentCost = calculateTotalCost(loadout);
            const itemCost = getCost(key);
            if (progress.coins >= currentCost + itemCost) {
                setLoadout(prev => ({ ...prev, [key]: true }));
                audioManager.playSfx('ui_click');
            } else {
                audioManager.playSfx('shield_hit');
            }
        }
    };

    const calculateTotalCost = (l: LoadoutState) => {
        let cost = 0;
        if (l.startShield && !isHardcore) cost += getCost('startShield');
        if (l.rocketBoost) cost += getCost('rocketBoost');
        if (l.doubleCoins) cost += getCost('doubleCoins');
        return cost;
    };

    const handleStart = () => {
        const cost = calculateTotalCost(loadout);
        if (progress.coins >= cost) {
            onUpdateProgress({
                ...progress,
                coins: progress.coins - cost
            });
            playClick();
            onStart(loadout);
        }
    };

    return (
        <div className="absolute inset-0 z-[70] flex flex-col items-center justify-center bg-black/90 text-white p-6 backdrop-blur-sm">
             <div className="w-full max-w-md">
                 <h2 className={`text-2xl font-bold mb-1 tracking-widest text-center ${isHardcore ? 'text-red-500' : 'text-[#2ecc71]'}`}>
                     {isHardcore ? 'HARDCORE LOADOUT' : 'MISSION LOADOUT'}
                 </h2>
                 <p className="text-center text-gray-400 text-xs font-mono mb-6">
                    {isHardcore ? 'INCREASED COSTS // SHIELDS OFFLINE' : 'SELECT ONE-TIME MODULES'}
                 </p>

                 <div className="flex justify-center items-center gap-2 mb-6 text-[#f1c40f] font-mono font-bold text-xl">
                    <span>{progress.coins}</span>
                    <div className="w-3 h-3 bg-[#f1c40f] rounded-full"></div>
                 </div>
                 
                 <div className="mb-6">
                     <LoadoutItem 
                        id="startShield" 
                        config={LOADOUT_CONFIG.startShield} 
                        cost={getCost('startShield')}
                        isSelected={loadout.startShield} 
                        disabled={isHardcore}
                        canAfford={!isHardcore && progress.coins >= calculateTotalCost(loadout) + (loadout.startShield ? 0 : getCost('startShield'))}
                        onToggle={() => toggleItem('startShield')}
                     />
                     <LoadoutItem 
                        id="rocketBoost" 
                        config={LOADOUT_CONFIG.rocketBoost} 
                        cost={getCost('rocketBoost')}
                        isSelected={loadout.rocketBoost} 
                        canAfford={progress.coins >= calculateTotalCost(loadout) + (loadout.rocketBoost ? 0 : getCost('rocketBoost'))}
                        onToggle={() => toggleItem('rocketBoost')}
                     />
                     <LoadoutItem 
                        id="doubleCoins" 
                        config={LOADOUT_CONFIG.doubleCoins} 
                        cost={getCost('doubleCoins')}
                        isSelected={loadout.doubleCoins} 
                        canAfford={progress.coins >= calculateTotalCost(loadout) + (loadout.doubleCoins ? 0 : getCost('doubleCoins'))}
                        onToggle={() => toggleItem('doubleCoins')}
                     />
                 </div>

                 <div className="flex gap-4">
                     <button 
                        onClick={onCancel}
                        className="flex-1 border border-gray-600 text-gray-400 py-3 hover:bg-gray-800 transition-colors font-bold font-mono"
                     >
                         CANCEL
                     </button>
                     <button 
                        onClick={handleStart}
                        className={`flex-1 border py-3 transition-colors font-bold font-mono shadow-[0_0_15px_rgba(46,204,113,0.3)] 
                            ${isHardcore 
                                ? 'border-red-500 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-black' 
                                : 'border-[#2ecc71] bg-[#2ecc71]/20 text-[#2ecc71] hover:bg-[#2ecc71] hover:text-black'}`}
                     >
                         LAUNCH (-{calculateTotalCost(loadout)} C)
                     </button>
                 </div>
             </div>
        </div>
    );
};

export default LoadoutScreen;
