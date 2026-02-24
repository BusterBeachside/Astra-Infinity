
export type ObstacleType = 'normal' | 'titan' | 'seeker' | 'side-seeker' | 'diagonal';
export type PowerUpType = 'shield' | 'slow' | 'shrink';
export type TrailType = 'default' | 'blue' | 'red' | 'gold' | 'purple' | 'orange' | 'cyan' | 'dashed' | 'dotted' | 'rail' | 'chevron' | 'chain' | 'plasma' | 'rainbow' | 'matrix' | 'fire' | 'water' | 'tron' | 'glitch' | 'lightning' | 'fortune';
export type GameMode = 'normal' | 'hardcore' | 'preview' | 'practice';

export interface ShipSkin {
    id: string;
    name: string;
    type: 'solid' | 'pattern' | 'animated';
    cost: number;
    color?: string; // Optional now as we use themeColor or dynamic
    themeColor?: string; // New
    shape: 'triangle' | 'fighter' | 'interceptor' | 'bomber' | 'circle' | 'shard' | 'saucer' | 'ghost' | 'glitch' | 'viper'; 
}

export interface DeathRecord {
    x: number;
    y: number;
    mode: 'normal' | 'hardcore';
    timestamp: number;
}

export interface Challenge {
    id: string;
    templateId: string;
    type: 'daily' | 'repeatable' | 'progression';
    rarity?: 'common' | 'rare' | 'legendary';
    description: string;
    target: number;
    progress: number;
    reward: number;
    completed: boolean;
    claimed: boolean;
    date?: string; // YYYY-MM-DD for daily
}

export interface Player {
  x: number;
  y: number;
  radius: number;
  baseRadius: number;
  targetX: number;
  targetY: number;
  lerp: number;
  shields: number;
  shrinkTimer: number;
  slowTimer: number;
  trail: {x: number, y: number}[]; // Position history for visual trail
  trailType: TrailType;
  skinId: string;
  // New: Grazing
  grazeMultiplier: number;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  type: ObstacleType;
  color: string;
  life: number;
  maxLife: number;
  angle: number;
  // Showboat Logic
  lastPlayerAngle?: number;
  accumulatedAngle?: number;
  showboatCount: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  // For 3D warp effect
  z?: number;
  ox?: number;
  oy?: number;
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: PowerUpType;
  color: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife?: number;
  color?: string;
  isDangerous?: boolean; // New: If true, player dies on contact
}

export interface CoinBreakdown {
  base: number;
  checkpoints: number;
  checkpointMult: number;
  titansSurvived: number;
  titanBonus: number;
  isHardcore: boolean;
  isDouble: boolean;
  isPermDouble: boolean;
  grazeCoins: number; // New
  showboatCoins: number; // New
  total: number;
}

export interface GameState {
  isActive: boolean;
  waitingForInput: boolean; // New state for "Click to Start"
  isGameOver: boolean;
  gameMode: GameMode;
  width: number;
  height: number;
  startTime: number;
  elapsedTime: number; // in seconds
  timeOffset: number; // for debug adding time
  
  // Timers/Counters
  lastSpawnTime: number;
  lastPowerupTime: number;
  lastCheckpointMinute: number;
  titanCooldown: number;
  titansSurvived: number; // New metric
  
  // Floor mechanics
  compressionState: 0 | 1 | 2; // 0: none, 1: warning, 2: active
  compressionProgress: number; // 0 to 1
  
  // Time scaling (warp effect)
  currentTimeScale: number;
  targetTimeScale: number;
  
  // Highscore
  highScore: number; // Current run's best check
  
  // Run specific stats
  coinsEarned: number;
  coinBreakdown?: CoinBreakdown;
  
  // Visual FX states
  isWarpingIn: boolean;
  isPaused: boolean;
  pauseStartTime?: number; // Track when pause started

  // New: Grazing
  currentRisk: number; // 0 to 100
  showboatCoins: number; // New
  totalShowboats: number; // New: Track count of showboats performed
  powerupsCollected: number; // New: Track collected powerups in run
  grazeTime: number; // New: Track total graze time in run
}

export interface HighScoreEntry {
  name: string;
  score: number;
  date: string;
}

export interface Upgrades {
  maxShields: number; // Level 0-5
  durationSlow: number; // Level 0-5
  durationShrink: number; // Level 0-5
  // One-time upgrades
  permDoubleCoins: boolean;
  showboat: boolean;
  grazeBonus: number; // New: Increases graze coin generation
}

export interface UserProgress {
  coins: number;
  upgrades: Upgrades;
  unlockedTrails: TrailType[];
  equippedTrail: TrailType;
  tutorialsSeen: { [key: string]: boolean };
  
  equippedSkin: string;
  unlockedSkins: string[];
  deathHistory: DeathRecord[];
  activeChallenges: Challenge[];
  lastChallengeDate: string;
  progressionMissionIndex: number; // New: Track one-time mission progress
}

export interface LoadoutState {
  startShield: boolean;
  rocketBoost: boolean; // Start at 60s
  doubleCoins: boolean;
}

export interface GameSettings {
  reduceMotion: boolean;
  showFps: boolean;
  showHitboxes: boolean;
  frameLimit: number; // 0 = uncapped, 30, 60
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  subText?: string;
  color: string;
  life: number; // ms
}
