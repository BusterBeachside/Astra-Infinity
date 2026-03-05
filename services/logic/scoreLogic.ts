import { CoinBreakdown, GameMode, ChaosModules } from '../../types';
import { CONSTANTS } from '../../constants';

export const formatTime = (s: number): string => {
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s * 10) % 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
};

export const calculateCoins = (
    elapsedTime: number, 
    gameMode: GameMode, 
    doubleCoins: boolean, 
    permDouble: boolean, 
    titansSurvived: number = 0, 
    grazeCoins: number = 0, 
    showboatCoins: number = 0,
    chaosModules?: ChaosModules
): CoinBreakdown => {
    if (gameMode === 'preview' || gameMode === 'practice' || gameMode === 'tutorial') {
         return {
            base: 0, checkpoints: 0, checkpointMult: 0, titansSurvived: 0, titanBonus: 0,
            isHardcore: false, isDouble: false, isPermDouble: false, grazeCoins: 0, showboatCoins: 0, total: 0
        };
    }

    // 1 coin per second survived
    const base = Math.floor(elapsedTime);
    let currentTotal = base;
    
    // Checkpoint Multiplier (10% bonus per minute survived)
    const checkpoints = Math.floor(elapsedTime / 60);
    const checkpointMult = 1 + (checkpoints * 0.1);
    
    currentTotal = Math.floor(currentTotal * checkpointMult);

    // Hardcore Multiplier
    if (gameMode === 'hardcore') {
        currentTotal *= 3;
    }

    // Chaos Multipliers
    let chaosMult = 1;
    if (gameMode === 'chaos' && chaosModules) {
        if (chaosModules.brrrrrr) chaosMult *= 2;
        if (chaosModules.theyHateYou) chaosMult *= 5;
        if (chaosModules.onTop) chaosMult *= 3;
        currentTotal = Math.floor(currentTotal * chaosMult);
    }

    // Titan Bonus
    const titanBonus = titansSurvived * CONSTANTS.TITAN_COIN_REWARD;
    currentTotal += titanBonus;

    // Graze Bonus
    currentTotal += Math.floor(grazeCoins);

    if (doubleCoins) {
        currentTotal *= 2;
    }

    // Permanent Upgrade Multiplier
    if (permDouble) {
        currentTotal *= 2;
    }

    return {
        base,
        checkpoints,
        checkpointMult,
        titansSurvived,
        titanBonus,
        isHardcore: gameMode === 'hardcore' || (gameMode === 'chaos' && !!chaosModules?.onTop),
        isDouble: doubleCoins,
        isPermDouble: permDouble,
        chaosMultiplier: gameMode === 'chaos' ? chaosMult : undefined,
        grazeCoins: Math.floor(grazeCoins),
        showboatCoins: Math.floor(showboatCoins),
        total: currentTotal
    };
};
