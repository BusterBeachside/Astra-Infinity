
export type ObstacleType = 'normal' | 'titan' | 'seeker' | 'side-seeker' | 'diagonal';
export type PowerUpType = 'shield' | 'slow' | 'shrink';
export type TrailType = 'default' | 'blue' | 'red' | 'gold' | 'purple' | 'orange' | 'cyan' | 'dashed' | 'dotted' | 'rail' | 'chevron' | 'chain' | 'plasma' | 'rainbow' | 'matrix' | 'fire' | 'water' | 'tron' | 'glitch' | 'lightning';

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
  total: number;
}

export interface GameState {
  isActive: boolean;
  waitingForInput: boolean; // New state for "Click to Start"
  isGameOver: boolean;
  gameMode: 'normal' | 'hardcore' | 'preview';
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
}

export interface UserProgress {
  coins: number;
  upgrades: Upgrades;
  unlockedTrails: TrailType[];
  equippedTrail: TrailType;
}

export interface LoadoutState {
  startShield: boolean;
  rocketBoost: boolean; // Start at 60s
  doubleCoins: boolean;
}

export interface GameSettings {
  reduceMotion: boolean;
  showFps: boolean;
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
