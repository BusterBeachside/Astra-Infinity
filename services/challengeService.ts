
import { Challenge, UserProgress, GameState } from '../types';
import { CHALLENGE_TEMPLATES, PROGRESSION_MISSIONS } from '../constants';

export const ChallengeService = {
    generateDailyChallenges: (lastDate: string, existing: Challenge[] = [], progress?: UserProgress): Challenge[] => {
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (lastDate === today) return [];

        const challenges: Challenge[] = [];
        const combinedExisting = [...existing];

        // Filter templates based on upgrades
        const availableTemplates = CHALLENGE_TEMPLATES.filter(t => {
            if (t.id === 'showboat_count' && (!progress || !progress.upgrades.showboat)) return false;
            return true;
        });

        const addChallenge = (rarity: 'common' | 'rare' | 'legendary') => {
            for(let i=0; i<10; i++) {
                const t = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
                const c = ChallengeService.createChallenge(t, 'daily', rarity, today);
                if (!ChallengeService.isDuplicate(c, combinedExisting)) {
                    challenges.push(c);
                    combinedExisting.push(c);
                    return;
                }
            }
            // Fallback
            const t = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
            challenges.push(ChallengeService.createChallenge(t, 'daily', rarity, today));
        };

        // Generate 3 challenges with weighted rarity
        // Slot 1: Always Common
        addChallenge('common');
        
        // Slot 2: Common or Rare
        addChallenge(Math.random() > 0.7 ? 'rare' : 'common');

        // Slot 3: Rare or Legendary
        addChallenge(Math.random() > 0.8 ? 'legendary' : 'rare');

        return challenges;
    },

    generateRepeatableChallenges: (count: number = 3, existing: Challenge[] = [], progress?: UserProgress): Challenge[] => {
        const challenges: Challenge[] = [];
        const combinedExisting = [...existing];
        for (let i = 0; i < count; i++) {
            const c = ChallengeService.generateSingleRepeatableChallenge(combinedExisting, progress);
            challenges.push(c);
            combinedExisting.push(c);
        }
        return challenges;
    },

    generateSingleRepeatableChallenge: (existing: Challenge[] = [], progress?: UserProgress): Challenge => {
        // Filter templates
        const availableTemplates = CHALLENGE_TEMPLATES.filter(t => {
            if (t.id === 'showboat_count' && (!progress || !progress.upgrades.showboat)) return false;
            return true;
        });

        // Random rarity
        const r = Math.random();
        const rarity = r > 0.9 ? 'legendary' : (r > 0.6 ? 'rare' : 'common');

        for(let i=0; i<10; i++) {
            const t = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
            const c = ChallengeService.createChallenge(t, 'repeatable', rarity);
            if (!ChallengeService.isDuplicate(c, existing)) return c;
        }
        const t = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
        return ChallengeService.createChallenge(t, 'repeatable', rarity);
    },

    rerollChallenge: (challengeId: string, progress: UserProgress): { success: boolean, newChallenge?: Challenge, cost?: number } => {
        const challengeIndex = progress.activeChallenges.findIndex(c => c.id === challengeId);
        if (challengeIndex === -1) return { success: false };

        const challenge = progress.activeChallenges[challengeIndex];
        if (challenge.completed || challenge.claimed) return { success: false };

        // Cost logic: 500 for daily, 250 for repeatable
        const cost = challenge.type === 'daily' ? 500 : 250;

        if (progress.coins < cost) return { success: false, cost };

        // Deduct coins
        progress.coins -= cost;

        // Generate new challenge of same type
        let newChallenge: Challenge;
        if (challenge.type === 'daily') {
            // Pick a random template suitable for daily
            // We need to ensure we don't pick the exact same one if possible, but random is fine for now
            // We need to use the generate logic but just for one
            const availableTemplates = CHALLENGE_TEMPLATES.filter(t => {
                if (t.id === 'showboat_count' && (!progress.upgrades.showboat)) return false;
                return true;
            });
            const t = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
            // Keep same rarity? Or randomize? Let's randomize rarity slightly weighted to current
            const rarity = challenge.rarity || 'common';
            const d = new Date();
            const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            newChallenge = ChallengeService.createChallenge(t, 'daily', rarity, today);
        } else {
            // Repeatable
            newChallenge = ChallengeService.generateSingleRepeatableChallenge(progress.activeChallenges, progress);
        }

        // Replace
        progress.activeChallenges[challengeIndex] = newChallenge;

        return { success: true, newChallenge, cost };
    },

    isDuplicate: (challenge: Challenge, existing: Challenge[]): boolean => {
        return existing.some(e => {
            if (e.templateId !== challenge.templateId) return false;
            if (e.completed || e.claimed) return false; 
            
            // Check target proximity (within 25%)
            const diff = Math.abs(e.target - challenge.target);
            return diff < e.target * 0.25;
        });
    },

    createChallenge: (template: any, type: 'daily' | 'repeatable' | 'progression', rarity: 'common' | 'rare' | 'legendary' = 'common', date?: string): Challenge => {
        const scaleMult = type === 'daily' ? 1.0 : 0.5;
        
        let rarityMult = 1;
        if (rarity === 'rare') rarityMult = 2.5;
        if (rarity === 'legendary') rarityMult = 5.0;

        let target = Math.floor((template.targetBase * rarityMult * scaleMult) + Math.floor(Math.random() * template.targetScale * rarityMult * scaleMult));
        
        // Ensure target is at least 1
        target = Math.max(1, target);

        // Cap Risk at 100
        if (template.id === 'reach_risk') target = Math.min(100, target);

        return {
            id: `${type}_${Math.random().toString(36).substr(2, 9)}`,
            templateId: template.id,
            type,
            rarity,
            description: template.desc.replace('{target}', target.toString()),
            target,
            progress: 0,
            reward: Math.floor(template.reward * rarityMult * (type === 'daily' ? 1 : 0.4)),
            completed: false,
            claimed: false,
            date
        };
    },

    ensureProgressionMission: (progress: UserProgress) => {
        // Check if we have an active progression mission
        const hasActive = progress.activeChallenges.some(c => c.type === 'progression');
        if (hasActive) return;

        // Get next mission based on index
        const idx = progress.progressionMissionIndex || 0;
        if (idx < PROGRESSION_MISSIONS.length) {
            const template = PROGRESSION_MISSIONS[idx];
            const mission: Challenge = {
                id: `prog_${template.id}`,
                templateId: template.templateId,
                type: 'progression',
                rarity: 'legendary', // Progression missions are special
                description: template.desc,
                target: template.target,
                progress: 0,
                reward: template.reward,
                completed: false,
                claimed: false
            };
            progress.activeChallenges.push(mission);
        }
    },

    updateProgress: (progress: UserProgress, gameState: GameState, dt: number): { updated: boolean, completedCount: number } => {
        let completedCount = 0;
        let anyUpdated = false;

        progress.activeChallenges.forEach(c => {
            if (c.completed) return;

            const prevProgress = c.progress;
            let gained = 0;

            switch(c.templateId) {
                case 'survive_time':
                    gained = dt;
                    break;
                case 'survive_single':
                    if (gameState.elapsedTime > c.progress) {
                        c.progress = gameState.elapsedTime;
                    }
                    break;
                case 'collect_coins':
                    // Handled in trackCoinGain, but we can also check gameState.coinsEarned delta if we want
                    // For now, keep it in trackCoinGain
                    break;
                case 'collect_coins_single':
                    if (gameState.coinsEarned > c.progress) {
                        c.progress = gameState.coinsEarned;
                    }
                    break;
                case 'graze_time':
                    if (gameState.currentRisk > 0) gained = dt;
                    break;
                case 'graze_time_single':
                    if (gameState.grazeTime > c.progress) {
                        c.progress = gameState.grazeTime;
                    }
                    break;
                case 'reach_risk':
                    if (gameState.currentRisk > c.progress) {
                        c.progress = gameState.currentRisk;
                    }
                    break;
                case 'hardcore_survive':
                    if (gameState.gameMode === 'hardcore') {
                         gained = dt;
                    }
                    break;
                case 'collect_powerups':
                    // Handled in onCollectPowerup
                    break;
                case 'collect_powerups_single':
                    if (gameState.powerupsCollected > c.progress) {
                        c.progress = gameState.powerupsCollected;
                    }
                    break;
                case 'titan_slayer':
                    if (gameState.titansSurvived > c.progress) {
                        c.progress = gameState.titansSurvived;
                    }
                    break;
                case 'showboat_count':
                case 'showboat_count_single':
                    if (gameState.totalShowboats > c.progress) {
                        c.progress = gameState.totalShowboats;
                    }
                    break;
            }

            if (gained > 0) {
                c.progress = Math.min(c.target, c.progress + gained);
            }

            // Check if progress actually changed significantly (to avoid excessive state updates)
            // Or if it reached target
            if (Math.floor(c.progress) !== Math.floor(prevProgress) || (c.progress >= c.target && prevProgress < c.target)) {
                anyUpdated = true;
            }

            if (c.progress >= c.target && !c.completed) {
                c.completed = true;
                completedCount++;
                anyUpdated = true;
            }
        });

        return { updated: anyUpdated, completedCount };
    },

    trackCoinGain: (progress: UserProgress, amount: number): { updated: boolean, completed: boolean } => {
        let updated = false;
        let completed = false;
        progress.activeChallenges.forEach(c => {
            if (c.templateId === 'collect_coins' && !c.completed) {
                c.progress = Math.min(c.target, c.progress + amount);
                updated = true;
                if (c.progress >= c.target) {
                    c.completed = true;
                    completed = true;
                }
            }
        });
        return { updated, completed };
    },

    onCollectPowerup: (progress: UserProgress, gameState: GameState): { updated: boolean, completed: boolean } => {
        let updated = false;
        let completed = false;
        progress.activeChallenges.forEach(c => {
            if (c.completed) return;

            if (c.templateId === 'collect_powerups') {
                c.progress++;
                updated = true;
                if (c.progress >= c.target) {
                    c.completed = true;
                    completed = true;
                }
            }
        });
        return { updated, completed };
    },

    onPurchase: (progress: UserProgress, itemType: 'upgrade' | 'trail' | 'skin' | 'module', itemId?: string): { updated: boolean, completed: boolean } => {
        let updated = false;
        let completed = false;
        progress.activeChallenges.forEach(c => {
            if (c.completed) return;

            const check = (id: string, type: string, matchId?: string) => {
                if (c.templateId === id && itemType === type && (!matchId || itemId === matchId)) {
                    c.progress++;
                    updated = true;
                    if (c.progress >= c.target) {
                        c.completed = true;
                        completed = true;
                    }
                }
            };

            check('buy_upgrade', 'upgrade');
            check('buy_trail', 'trail');
            check('buy_skin', 'skin');
            check('buy_showboat', 'module', 'showboat');
        });
        return { updated, completed };
    }
};
