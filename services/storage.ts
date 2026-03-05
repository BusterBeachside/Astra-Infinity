
import { HighScoreEntry, UserProgress, GameSettings, ReplayData } from '../types';
import { compressReplay, decompressReplay } from './replayCompression';
import { supabaseService } from './supabaseService';

const HS_KEY_NORMAL = 'stellar_scores_normal';
const HS_KEY_HARDCORE = 'stellar_scores_hardcore';
const HS_KEY_CHAOS = 'stellar_scores_chaos';
const PROGRESS_KEY = 'stellar_user_progress';
const SETTINGS_KEY = 'stellar_game_settings';
const REPLAYS_KEY = 'stellar_replays';

// --- Replays ---

export const saveReplay = (replay: ReplayData) => {
    try {
        const compressed = compressReplay(replay);
        const replays = getReplaysRaw();
        replays.unshift(compressed);
        // Limit to 20 replays to save space
        if (replays.length > 20) replays.pop();
        localStorage.setItem(REPLAYS_KEY, JSON.stringify(replays));
    } catch (e) {
        console.error("Failed to save replay", e);
    }
};

const getReplaysRaw = (): ReplayData[] => {
    try {
        const data = localStorage.getItem(REPLAYS_KEY);
        if (data) return JSON.parse(data);
    } catch (e) {
        console.error("Failed to load replays", e);
    }
    return [];
};

export const getReplays = (): ReplayData[] => {
    const raw = getReplaysRaw();
    return raw.map(decompressReplay);
};

export const deleteReplay = (id: string) => {
    try {
        const replays = getReplaysRaw();
        const filtered = replays.filter(r => r.id !== id);
        localStorage.setItem(REPLAYS_KEY, JSON.stringify(filtered));
    } catch (e) {
        console.error("Failed to delete replay", e);
    }
};

export const getReplay = (id: string): ReplayData | undefined => {
    const replays = getReplays();
    return replays.find(r => r.id === id);
};

// --- High Scores ---

export const getHighScores = (mode: 'normal' | 'hardcore' | 'chaos'): HighScoreEntry[] => {
    let key = HS_KEY_NORMAL;
    if (mode === 'hardcore') key = HS_KEY_HARDCORE;
    if (mode === 'chaos') key = HS_KEY_CHAOS;
    
    try {
        const data = localStorage.getItem(key);
        if (data) return JSON.parse(data);
    } catch (e) {
        console.error("Failed to load scores", e);
    }
    return [];
};

export const checkIsHighScore = (score: number, mode: 'normal' | 'hardcore' | 'chaos'): boolean => {
    const scores = getHighScores(mode);
    if (scores.length < 10) return true;
    return score > scores[scores.length - 1].score;
};

export const saveHighScore = async (entry: HighScoreEntry, mode: 'normal' | 'hardcore' | 'chaos', replay: ReplayData | null = null) => {
    let key = HS_KEY_NORMAL;
    if (mode === 'hardcore') key = HS_KEY_HARDCORE;
    if (mode === 'chaos') key = HS_KEY_CHAOS;
    
    let scores = getHighScores(mode);
    scores.push(entry);
    scores.sort((a, b) => b.score - a.score);
    if (scores.length > 10) scores = scores.slice(0, 10);
    localStorage.setItem(key, JSON.stringify(scores));

    // Sync to Supabase if logged in
    const user = await supabaseService.getCurrentUser();
    if (user) {
        await supabaseService.submitScore(entry.score, mode, entry.metadata || {}, replay);
    }
};

// --- User Progress (Shop & Coins) ---

const DEFAULT_PROGRESS: UserProgress = {
    coins: 0,
    upgrades: {
        maxShields: 0,
        durationSlow: 0,
        durationShrink: 0,
        permDoubleCoins: false,
        showboat: false,
        grazeBonus: 0
    },
    unlockedTrails: ['default'],
    equippedTrail: 'default',
    tutorialsSeen: {},
    equippedSkin: 'default',
    unlockedSkins: ['default'],
    deathHistory: [],
    activeChallenges: [],
    lastChallengeDate: '',
    progressionMissionIndex: 0,
    stats: {
        totalTimeNormal: 0,
        totalTimeHardcore: 0,
        totalRuns: 0,
        lifetimeMissionsCompleted: 0,
        lifetimeCoinsEarned: 0,
        lifetimeCoinsSpent: 0,
        totalShowboats: 0,
        totalTimeGrazed: 0,
        grazingCoinsEarned: 0,
        skinUsage: {},
        trailUsage: {},
        deathCounts: {}
    }
};

export const getUserProgress = (): UserProgress => {
    try {
        const data = localStorage.getItem(PROGRESS_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            // Merge with default to ensure new fields exist if saved data is old
            return { 
                ...DEFAULT_PROGRESS, 
                ...parsed, 
                upgrades: { ...DEFAULT_PROGRESS.upgrades, ...(parsed.upgrades || {}) },
                unlockedTrails: parsed.unlockedTrails || DEFAULT_PROGRESS.unlockedTrails,
                equippedTrail: parsed.equippedTrail || DEFAULT_PROGRESS.equippedTrail,
                tutorialsSeen: parsed.tutorialsSeen || DEFAULT_PROGRESS.tutorialsSeen,
                equippedSkin: parsed.equippedSkin || DEFAULT_PROGRESS.equippedSkin,
                unlockedSkins: parsed.unlockedSkins || DEFAULT_PROGRESS.unlockedSkins,
                deathHistory: parsed.deathHistory || DEFAULT_PROGRESS.deathHistory,
                activeChallenges: parsed.activeChallenges || DEFAULT_PROGRESS.activeChallenges,
                lastChallengeDate: parsed.lastChallengeDate || DEFAULT_PROGRESS.lastChallengeDate,
                stats: { ...DEFAULT_PROGRESS.stats, ...(parsed.stats || {}) }
            };
        }
    } catch (e) {
        console.error("Failed to load progress", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
};

export const saveUserProgress = async (progress: UserProgress) => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    
    // Sync to Supabase if logged in
    const user = await supabaseService.getCurrentUser();
    if (user) {
        const settings = getGameSettings();
        await supabaseService.syncUserData(progress, settings);
    }
};

// --- Game Settings ---

const DEFAULT_SETTINGS: GameSettings = {
    reduceMotion: false,
    showFps: false,
    showHitboxes: false,
    frameLimit: 0, // 0 = Uncapped
    colorBlindMode: 'none'
};

export const getGameSettings = (): GameSettings => {
    try {
        const data = localStorage.getItem(SETTINGS_KEY);
        if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
        console.error("Failed to load settings", e);
    }
    return { ...DEFAULT_SETTINGS };
};

export const saveGameSettings = async (settings: GameSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    // Sync to Supabase if logged in
    const user = await supabaseService.getCurrentUser();
    if (user) {
        const progress = getUserProgress();
        await supabaseService.syncUserData(progress, settings);
    }
};
