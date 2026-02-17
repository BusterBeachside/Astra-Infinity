
import { TrailType } from './types';

export const COLORS = {
  PLAYER: '#2ecc71',
  SPIKE: '#e74c3c',
  TITAN: '#8b0000',
  TEXT: '#ffffff',
  WARP: 'rgba(52, 152, 219, 0.4)',
  SEEKER: '#3498db',
  DIAGONAL: '#8e44ad',
  GOLD: '#f1c40f',
  BG: '#050505'
};

export const CONSTANTS = {
  PLAYER_BASE_RADIUS: 20,
  SPAWN_RATE_MIN: 250,
  SPAWN_RATE_MAX: 950,
  POWERUP_INTERVAL: 15000,
  TITAN_START_TIME: 180, // seconds
  FLOOR_RISING_TIME: 300, // seconds
  TITAN_COIN_REWARD: 50,
  
  // Powerup Config
  BASE_DURATION_SLOW: 5,
  BASE_DURATION_SHRINK: 5,
  BASE_MAX_SHIELDS: 1, // Start with max 1 shield
  
  // Upgrades
  UPGRADE_BONUS_DURATION: 2, // +2 seconds per level
  UPGRADE_BONUS_SHIELD: 1, // +1 max shield per level
};

export const SHOP_CONFIG = {
  maxShields: {
    baseCost: 200,
    costMultiplier: 2.0, // 200, 400, 800...
    maxLevel: 99 // Uncapped (effectively)
  },
  durationSlow: {
    baseCost: 100,
    costMultiplier: 1.5, // 100, 150, 225...
    maxLevel: 99
  },
  durationShrink: {
    baseCost: 100,
    costMultiplier: 1.5,
    maxLevel: 99
  },
  permDoubleCoins: {
    baseCost: 50000, 
    costMultiplier: 1,
    maxLevel: 1,
    name: "FORTUNE MODULE",
    desc: "Permanently 2x all coin gains"
  },
  showboat: {
    baseCost: 5000,
    costMultiplier: 1,
    maxLevel: 1,
    name: "SHOWBOAT UNIT",
    desc: "Combo Coins for circling enemies"
  }
};

export interface TrailDef {
    id: TrailType;
    name: string;
    cost: number;
    type: 'solid' | 'pattern' | 'animated';
    color: string;
}

export const TRAIL_CONFIG: TrailDef[] = [
    { id: 'default', name: 'ION STREAM', cost: 0, type: 'solid', color: '#2ecc71' },
    { id: 'blue', name: 'COBALT THRUST', cost: 2000, type: 'solid', color: '#3498db' },
    { id: 'red', name: 'CRIMSON BURN', cost: 2000, type: 'solid', color: '#e74c3c' },
    { id: 'purple', name: 'NEON VIOLET', cost: 2000, type: 'solid', color: '#9b59b6' },
    { id: 'orange', name: 'SOLAR FLARE', cost: 2000, type: 'solid', color: '#e67e22' },
    { id: 'cyan', name: 'CYBER MIST', cost: 2000, type: 'solid', color: '#00e5ff' },
    { id: 'gold', name: 'MIDAS TOUCH', cost: 5000, type: 'solid', color: '#f1c40f' },
    
    { id: 'dashed', name: 'PULSE DATA', cost: 10000, type: 'pattern', color: '#ffffff' },
    { id: 'dotted', name: 'STARDUST', cost: 12000, type: 'pattern', color: '#ecf0f1' },
    { id: 'rail', name: 'HYPER RAIL', cost: 15000, type: 'pattern', color: '#ff7979' },
    { id: 'chain', name: 'STEEL LINK', cost: 16000, type: 'pattern', color: '#bdc3c7' },
    { id: 'chevron', name: 'VELOCITY', cost: 18000, type: 'pattern', color: '#f39c12' },
    { id: 'tron', name: 'THE GRID', cost: 20000, type: 'pattern', color: '#00ffff' },
    
    { id: 'fire', name: 'AFTERBURNER', cost: 25000, type: 'animated', color: '#e67e22' },
    { id: 'water', name: 'AQUA FLOW', cost: 28000, type: 'animated', color: '#3498db' },
    { id: 'plasma', name: 'PLASMA COIL', cost: 30000, type: 'animated', color: '#9b59b6' },
    { id: 'lightning', name: 'THUNDERBOLT', cost: 35000, type: 'animated', color: '#00ccff' },
    { id: 'glitch', name: 'SYSTEM ERROR', cost: 40000, type: 'animated', color: '#ff0055' },
    { id: 'rainbow', name: 'NEON OVERDRIVE', cost: 50000, type: 'animated', color: 'rainbow' },
    { id: 'matrix', name: 'THE SOURCE', cost: 75000, type: 'animated', color: '#00ff00' }
];

export const LOADOUT_CONFIG = {
  startShield: { cost: 50, name: "SHIELD INIT", desc: "Start with 1 Shield" },
  rocketBoost: { cost: 100, name: "WARP START", desc: "Start at 60s mark" },
  doubleCoins: { cost: 150, name: "BOUNTY HUNTER", desc: "2x Coins earned" }
};
