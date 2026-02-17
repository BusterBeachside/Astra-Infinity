
import { HighScoreEntry, UserProgress, GameSettings } from '../types';

const HS_KEY_NORMAL = 'stellar_scores_normal';
const HS_KEY_HARDCORE = 'stellar_scores_hardcore';
const PROGRESS_KEY = 'stellar_user_progress';
const SETTINGS_KEY = 'stellar_game_settings';

// --- High Scores ---

export const getHighScores = (mode: 'normal' | 'hardcore'): HighScoreEntry[] => {
    const key = mode === 'normal' ? HS_KEY_NORMAL : HS_KEY_HARDCORE;
    try {
        const data = localStorage.getItem(key);
        if (data) return JSON.parse(data);
    } catch (e) {
        console.error("Failed to load scores", e);
    }
    return [];
};

export const checkIsHighScore = (score: number, mode: 'normal' | 'hardcore'): boolean => {
    const scores = getHighScores(mode);
    if (scores.length < 10) return true;
    return score > scores[scores.length - 1].score;
};

export const saveHighScore = (entry: HighScoreEntry, mode: 'normal' | 'hardcore') => {
    const key = mode === 'normal' ? HS_KEY_NORMAL : HS_KEY_HARDCORE;
    let scores = getHighScores(mode);
    scores.push(entry);
    scores.sort((a, b) => b.score - a.score);
    if (scores.length > 10) scores = scores.slice(0, 10);
    localStorage.setItem(key, JSON.stringify(scores));
};

// --- User Progress (Shop & Coins) ---

const DEFAULT_PROGRESS: UserProgress = {
    coins: 0,
    upgrades: {
        maxShields: 0,
        durationSlow: 0,
        durationShrink: 0,
        permDoubleCoins: false,
        showboat: false
    },
    unlockedTrails: ['default'],
    equippedTrail: 'default'
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
                upgrades: { ...DEFAULT_PROGRESS.upgrades, ...parsed.upgrades },
                unlockedTrails: parsed.unlockedTrails || DEFAULT_PROGRESS.unlockedTrails,
                equippedTrail: parsed.equippedTrail || DEFAULT_PROGRESS.equippedTrail
            };
        }
    } catch (e) {
        console.error("Failed to load progress", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
};

export const saveUserProgress = (progress: UserProgress) => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

// --- Game Settings ---

const DEFAULT_SETTINGS: GameSettings = {
    reduceMotion: false,
    showFps: false,
    frameLimit: 0 // 0 = Uncapped
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

export const saveGameSettings = (settings: GameSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
