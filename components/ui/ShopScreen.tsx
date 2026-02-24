
import React, { useState, useRef, useLayoutEffect } from 'react';
import { UserProgress, TrailType } from '../../types';
import { SHOP_CONFIG, CONSTANTS, TRAIL_CONFIG, SKIN_CONFIG } from '../../constants';
import { audioManager } from '../../services/audioManager';
import { ChallengeService } from '../../services/challengeService';

interface ShopScreenProps {
    progress: UserProgress;
    onUpdateProgress: (p: UserProgress) => void;
    onClose: () => void;
    onPreview: (itemId: string, currentTab: 'modules' | 'trails' | 'skins', currentScroll: number) => void;
    playClick: () => void;
    playHover: () => void;
    initialTab?: 'modules' | 'trails' | 'skins';
    initialScroll?: number;
}

const UpgradeItem: React.FC<{
    name: string;
    desc: string;
    level: number;
    maxLevel: number;
    baseCost: number;
    multiplier: number;
    coins: number;
    onBuy: () => void;
}> = ({ name, desc, level, maxLevel, baseCost, multiplier, coins, onBuy }) => {
    const isMax = level >= maxLevel;
    const cost = Math.floor(baseCost * Math.pow(multiplier, level));
    const canAfford = coins >= cost;

    return (
        <div className="flex flex-col border border-gray-700 bg-black/60 p-4 rounded mb-4 w-full">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="text-[#9b59b6] font-bold text-lg">{name}</div>
                    <div className="text-xs text-gray-400 font-mono">{desc}</div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-500 font-mono">LEVEL</div>
                    <div className="text-[#f1c40f] font-bold">{level} {maxLevel < 99 && `/ ${maxLevel}`}</div>
                </div>
            </div>
            
            {!isMax ? (
                <button
                    onClick={canAfford ? onBuy : undefined}
                    className={`w-full py-2 font-mono font-bold text-sm transition-all border ${
                        canAfford 
                        ? 'border-[#2ecc71] text-[#2ecc71] hover:bg-[#2ecc71] hover:text-black cursor-pointer' 
                        : 'border-gray-700 text-gray-600 cursor-not-allowed'
                    }`}
                >
                    UPGRADE ({cost} COINS)
                </button>
            ) : (
                <div className="w-full py-2 text-center font-mono font-bold text-sm text-[#f1c40f] border border-[#f1c40f]">
                    MAXED OUT
                </div>
            )}
        </div>
    );
};

const ShopItem: React.FC<{
    id: string;
    name: string;
    desc: string;
    type: string;
    cost: number;
    color?: string;
    isOwned: boolean;
    isEquipped: boolean;
    coins: number;
    onBuy: () => void;
    onEquip: () => void;
    onPreview: () => void;
}> = ({ id, name, desc, type, cost, color, isOwned, isEquipped, coins, onBuy, onEquip, onPreview }) => {
    const canAfford = coins >= cost;

    return (
        <div className="flex items-center justify-between border border-gray-700 bg-black/60 p-3 rounded mb-3 w-full">
            <div className="flex items-center gap-3">
                 <div 
                    className="w-8 h-8 rounded border border-white/20 cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
                    style={{ background: type === 'animated' ? `linear-gradient(45deg, ${color || '#fff'}, #fff)` : (color || '#333') }}
                    onClick={onPreview}
                    title="Preview"
                 >
                    {/* Simple icon placeholder if needed */}
                 </div>
                 <div>
                    <div className="text-white font-bold font-mono">{name}</div>
                    <div className="text-xs text-gray-500 uppercase">{type} - {desc}</div>
                 </div>
            </div>
            
            <div className="flex items-center gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onPreview(); }}
                    className="p-1 px-2 border border-gray-600 text-gray-400 text-xs hover:text-white hover:border-white transition-colors font-mono"
                    title="Preview"
                >
                    PREVIEW
                </button>

                {isOwned ? (
                    <button
                        onClick={!isEquipped ? onEquip : undefined}
                        className={`px-4 py-1 font-mono text-sm border transition-all ${
                            isEquipped
                            ? 'border-[#f1c40f] text-[#f1c40f] cursor-default'
                            : 'border-gray-500 text-gray-400 hover:border-white hover:text-white'
                        }`}
                    >
                        {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                    </button>
                ) : (
                    <button
                        onClick={canAfford ? onBuy : undefined}
                        className={`px-4 py-1 font-mono text-sm border transition-all ${
                            canAfford 
                            ? 'border-[#2ecc71] text-[#2ecc71] hover:bg-[#2ecc71] hover:text-black' 
                            : 'border-gray-700 text-gray-700 cursor-not-allowed'
                        }`}
                    >
                        {cost} C
                    </button>
                )}
            </div>
        </div>
    );
};

const ShopScreen: React.FC<ShopScreenProps> = ({ progress, onUpdateProgress, onClose, onPreview, playClick, playHover, initialTab, initialScroll }) => {
    const [tab, setTab] = useState<'modules' | 'trails' | 'skins'>(initialTab || 'modules');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Restore scroll position when tab or initialScroll changes
    useLayoutEffect(() => {
        if (scrollContainerRef.current && initialScroll) {
            scrollContainerRef.current.scrollTop = initialScroll;
        }
    }, []);

    const handlePreview = (itemId: string) => {
        playClick();
        const scrollPos = scrollContainerRef.current ? scrollContainerRef.current.scrollTop : 0;
        onPreview(itemId, tab, scrollPos);
    };

    // Generic handler that works for both number and boolean fields in UserProgress['upgrades']
    const buyUpgrade = (key: keyof typeof progress.upgrades, config: any) => {
        // Handle boolean fields by treating them as 0 or 1
        const currentVal = progress.upgrades[key];
        const level = typeof currentVal === 'boolean' ? (currentVal ? 1 : 0) : currentVal;
        
        const cost = Math.floor(config.baseCost * Math.pow(config.costMultiplier, level));
        
        if (progress.coins >= cost && level < config.maxLevel) {
            audioManager.playSfx('coin'); // New coin sound for purchase
            
            let newVal: number | boolean = level + 1;
            // If the original was boolean, cast back to boolean
            if (typeof currentVal === 'boolean') {
                newVal = true;
            }

            const newProgress = {
                ...progress,
                coins: progress.coins - cost,
                upgrades: {
                    ...progress.upgrades,
                    [key]: newVal
                }
            };

            // Check challenges
            const itemType = (key === 'showboat' || key === 'permDoubleCoins') ? 'module' : 'upgrade';
            const itemId = (key === 'showboat') ? 'showboat' : undefined;
            const purchaseResult = ChallengeService.onPurchase(newProgress, itemType, itemId);
            if (purchaseResult.updated) {
                if (purchaseResult.completed) {
                    audioManager.playSfx('challenge_complete');
                }
            }

            onUpdateProgress(newProgress);
        } else {
             audioManager.playSfx('shield_hit'); // Error sound
        }
    };

    const buyTrail = (trailId: TrailType, cost: number) => {
        if (progress.coins >= cost) {
            audioManager.playSfx('coin');
            
            const newProgress = {
                ...progress,
                coins: progress.coins - cost,
                unlockedTrails: [...progress.unlockedTrails, trailId],
                equippedTrail: trailId // Auto equip on buy
            };

            const purchaseResult = ChallengeService.onPurchase(newProgress, 'trail');
            if (purchaseResult.updated) {
                if (purchaseResult.completed) {
                    audioManager.playSfx('challenge_complete');
                }
            }
            
            onUpdateProgress(newProgress);
        } else {
            audioManager.playSfx('shield_hit');
        }
    };

    const equipTrail = (trailId: TrailType) => {
        audioManager.playSfx('ui_click');
        onUpdateProgress({
            ...progress,
            equippedTrail: trailId
        });
    };

    const buySkin = (skinId: string, cost: number) => {
        if (progress.coins >= cost) {
            audioManager.playSfx('coin');
            
            const newProgress = {
                ...progress,
                coins: progress.coins - cost,
                unlockedSkins: [...(progress.unlockedSkins || ['default']), skinId],
                equippedSkin: skinId
            };

            const purchaseResult = ChallengeService.onPurchase(newProgress, 'skin');
            if (purchaseResult.updated) {
                if (purchaseResult.completed) {
                    audioManager.playSfx('challenge_complete');
                }
            }
            
            onUpdateProgress(newProgress);
        } else {
            audioManager.playSfx('shield_hit');
        }
    };

    const equipSkin = (skinId: string) => {
        audioManager.playSfx('ui_click');
        onUpdateProgress({
            ...progress,
            equippedSkin: skinId
        });
    };

    return (
        <div className="absolute inset-0 z-[80] flex flex-col items-center justify-center bg-black/95 text-white p-6">
             <div className="flex justify-between items-center w-full max-w-md mb-6 border-b-2 border-[#9b59b6] pb-2">
                 <h2 className="text-[#9b59b6] text-3xl font-bold tracking-widest">
                     GALACTIC BAZAAR
                 </h2>
                 <div className="flex items-center gap-2 text-[#f1c40f] font-mono font-bold text-xl">
                    <span>{progress.coins}</span>
                    <div className="w-3 h-3 bg-[#f1c40f] rounded-full"></div>
                 </div>
             </div>

             {/* TABS */}
             <div className="flex w-full max-w-md mb-4 gap-2">
                 <button 
                    onClick={() => { setTab('modules'); playClick(); }}
                    className={`flex-1 py-2 font-mono font-bold border-b-2 transition-colors ${tab === 'modules' ? 'text-white border-white' : 'text-gray-500 border-gray-800 hover:text-gray-300'}`}
                 >
                     MODULES
                 </button>
                 <button 
                    onClick={() => { setTab('trails'); playClick(); }}
                    className={`flex-1 py-2 font-mono font-bold border-b-2 transition-colors ${tab === 'trails' ? 'text-white border-white' : 'text-gray-500 border-gray-800 hover:text-gray-300'}`}
                 >
                     TRAILS
                 </button>
                 <button 
                    onClick={() => { setTab('skins'); playClick(); }}
                    className={`flex-1 py-2 font-mono font-bold border-b-2 transition-colors ${tab === 'skins' ? 'text-white border-white' : 'text-gray-500 border-gray-800 hover:text-gray-300'}`}
                 >
                     SKINS
                 </button>
             </div>
             
             <div ref={scrollContainerRef} className="w-full max-w-md overflow-y-auto max-h-[50vh] pr-2 space-scrollbar">
                 
                 {tab === 'modules' && (
                     <>
                        <div className="mb-4 text-[#f1c40f] text-sm font-mono tracking-wider border-b border-gray-800 pb-1">CORE SYSTEMS</div>
                        <UpgradeItem 
                            name="SHIELD CAPACITY"
                            desc={`Increase max shields. Current Max: ${CONSTANTS.BASE_MAX_SHIELDS + (progress.upgrades.maxShields * CONSTANTS.UPGRADE_BONUS_SHIELD)}`}
                            level={progress.upgrades.maxShields}
                            maxLevel={SHOP_CONFIG.maxShields.maxLevel}
                            baseCost={SHOP_CONFIG.maxShields.baseCost}
                            multiplier={SHOP_CONFIG.maxShields.costMultiplier}
                            coins={progress.coins}
                            onBuy={() => buyUpgrade('maxShields', SHOP_CONFIG.maxShields)}
                        />
                        
                        <UpgradeItem 
                            name="WARP EFFICIENCY"
                            desc={`Increase Slow-Mo duration. Current: ${CONSTANTS.BASE_DURATION_SLOW + (progress.upgrades.durationSlow * CONSTANTS.UPGRADE_BONUS_DURATION)}s`}
                            level={progress.upgrades.durationSlow}
                            maxLevel={SHOP_CONFIG.durationSlow.maxLevel}
                            baseCost={SHOP_CONFIG.durationSlow.baseCost}
                            multiplier={SHOP_CONFIG.durationSlow.costMultiplier}
                            coins={progress.coins}
                            onBuy={() => buyUpgrade('durationSlow', SHOP_CONFIG.durationSlow)}
                        />

                        <UpgradeItem 
                            name="COMPRESSION STABILIZER"
                            desc={`Increase Tiny duration. Current: ${CONSTANTS.BASE_DURATION_SHRINK + (progress.upgrades.durationShrink * CONSTANTS.UPGRADE_BONUS_DURATION)}s`}
                            level={progress.upgrades.durationShrink}
                            maxLevel={SHOP_CONFIG.durationShrink.maxLevel}
                            baseCost={SHOP_CONFIG.durationShrink.baseCost}
                            multiplier={SHOP_CONFIG.durationShrink.costMultiplier}
                            coins={progress.coins}
                            onBuy={() => buyUpgrade('durationShrink', SHOP_CONFIG.durationShrink)}
                        />

                        <UpgradeItem 
                            name={SHOP_CONFIG.grazeBonus.name}
                            desc={SHOP_CONFIG.grazeBonus.desc}
                            level={progress.upgrades.grazeBonus}
                            maxLevel={SHOP_CONFIG.grazeBonus.maxLevel}
                            baseCost={SHOP_CONFIG.grazeBonus.baseCost}
                            multiplier={SHOP_CONFIG.grazeBonus.costMultiplier}
                            coins={progress.coins}
                            onBuy={() => buyUpgrade('grazeBonus', SHOP_CONFIG.grazeBonus)}
                        />

                        <div className="mt-8 mb-4 text-[#2ecc71] text-sm font-mono tracking-wider border-b border-gray-800 pb-1">SPECIAL MODULES</div>

                        <UpgradeItem 
                            name={SHOP_CONFIG.permDoubleCoins.name}
                            desc={SHOP_CONFIG.permDoubleCoins.desc}
                            level={progress.upgrades.permDoubleCoins ? 1 : 0}
                            maxLevel={1}
                            baseCost={SHOP_CONFIG.permDoubleCoins.baseCost}
                            multiplier={1}
                            coins={progress.coins}
                            onBuy={() => buyUpgrade('permDoubleCoins', SHOP_CONFIG.permDoubleCoins)}
                        />

                        <UpgradeItem 
                            name={SHOP_CONFIG.showboat.name}
                            desc={SHOP_CONFIG.showboat.desc}
                            level={progress.upgrades.showboat ? 1 : 0}
                            maxLevel={1}
                            baseCost={SHOP_CONFIG.showboat.baseCost}
                            multiplier={1}
                            coins={progress.coins}
                            onBuy={() => buyUpgrade('showboat', SHOP_CONFIG.showboat)}
                        />
                     </>
                 )}

                 {tab === 'trails' && (
                     <>
                        <div className="mb-4 text-[#3498db] text-sm font-mono tracking-wider border-b border-gray-800 pb-1">ENGINE TRAILS</div>
                        {TRAIL_CONFIG.map(trail => (
                            <ShopItem
                                key={trail.id}
                                id={trail.id}
                                name={trail.name}
                                desc={trail.type}
                                type={trail.type}
                                cost={trail.cost}
                                color={trail.color}
                                isOwned={progress.unlockedTrails.includes(trail.id)}
                                isEquipped={progress.equippedTrail === trail.id}
                                coins={progress.coins}
                                onBuy={() => buyTrail(trail.id, trail.cost)}
                                onEquip={() => equipTrail(trail.id)}
                                onPreview={() => handlePreview(trail.id)}
                            />
                        ))}
                     </>
                 )}

                 {tab === 'skins' && (
                     <>
                        <div className="mb-4 text-[#e74c3c] text-sm font-mono tracking-wider border-b border-gray-800 pb-1">SHIP HULLS</div>
                        {SKIN_CONFIG.map(skin => (
                            <ShopItem
                                key={skin.id}
                                id={skin.id}
                                name={skin.name}
                                desc={skin.desc}
                                type={skin.type}
                                cost={skin.cost}
                                color={skin.type === 'animated' ? `hsl(${(Date.now() / 10) % 360}, 70%, 50%)` : '#fff'}
                                isOwned={(progress.unlockedSkins || ['default']).includes(skin.id)}
                                isEquipped={(progress.equippedSkin || 'default') === skin.id}
                                coins={progress.coins}
                                onBuy={() => buySkin(skin.id, skin.cost)}
                                onEquip={() => equipSkin(skin.id)}
                                onPreview={() => handlePreview(skin.id)}
                            />
                        ))}
                     </>
                 )}

             </div>

             <button 
              onClick={() => { playClick(); onClose(); }}
              onMouseEnter={playHover}
              className="mt-6 text-[#9b59b6] border border-[#9b59b6] px-8 py-3 hover:bg-[#9b59b6] hover:text-black transition-colors font-bold font-mono"
             >
                 RETURN
             </button>
        </div>
    );
};

export default ShopScreen;
