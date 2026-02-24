
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
  UPGRADE_BONUS_GRAZE: 0.2, // +20% coins per level
};

export const GRAZE_CONFIG = {
    DISTANCE_THRESHOLD: 50, // Pixels (Reduced from 100)
    COIN_RATE: 5, // Coins per second at max risk
    RISK_DECAY: 30, // Risk points lost per second (Increased from 20)
    RISK_GAIN: 45, // Risk points gained per second at 0 distance (Decreased from 60)
};

export const SKIN_CONFIG = [
    // SOLIDS
    { id: 'default', name: 'VANGUARD', type: 'solid', cost: 0, shape: 'circle', desc: 'Standard issue interceptor.', themeColor: '#2ecc71' },
    { id: 'dart', name: 'DART', type: 'solid', cost: 1000, shape: 'fighter', desc: 'Aerodynamic high-speed frame.', themeColor: '#3498db' },
    { id: 'tank', name: 'BULLDOG', type: 'solid', cost: 2500, shape: 'bomber', desc: 'Heavily armored chassis.', themeColor: '#e74c3c' },
    { id: 'viper', name: 'VIPER', type: 'solid', cost: 5000, shape: 'viper', desc: 'Aggressive interceptor.', themeColor: '#9b59b6' },
    
    // PATTERNS
    { id: 'shard', name: 'SHARD', type: 'pattern', cost: 12000, shape: 'shard', desc: 'Crystalline energy structure.', themeColor: '#00e5ff' },
    { id: 'hex', name: 'HEX', type: 'pattern', cost: 14000, shape: 'circle', desc: 'Honeycomb lattice armor.', themeColor: '#f39c12' },
    { id: 'circuit', name: 'CIRCUIT', type: 'pattern', cost: 16000, shape: 'fighter', desc: 'Printed circuit board design.', themeColor: '#27ae60' },
    { id: 'zebra', name: 'ZEBRA', type: 'pattern', cost: 18000, shape: 'bomber', desc: 'High contrast dazzle camouflage.', themeColor: '#ffffff' },
    
    // ANIMATED
    { id: 'saucer', name: 'U.F.O.', type: 'animated', cost: 15000, shape: 'saucer', desc: 'Metallic alien craft.', themeColor: '#00ff00' },
    { id: 'ghost', name: 'GHOST', type: 'animated', cost: 20000, shape: 'ghost', desc: 'Semi-transparent stealth ship.', themeColor: '#a0d8ef' },
    { id: 'glitch', name: 'GLITCH', type: 'animated', cost: 35000, shape: 'glitch', desc: 'Unstable digital artifact.', themeColor: '#ff0055' },
    { id: 'gold', name: 'GOLD', type: 'animated', cost: 50000, shape: 'circle', desc: 'Pure animated gold.', themeColor: '#f1c40f' }
];

export const CHALLENGE_TEMPLATES = [
    // BASE TEMPLATES (Scaled by Rarity)
    { id: 'survive_time', desc: 'Survive for {target} seconds', reward: 1000, targetBase: 60, targetScale: 30 },
    { id: 'collect_coins', desc: 'Collect {target} coins', reward: 1200, targetBase: 200, targetScale: 100 },
    { id: 'graze_time', desc: 'Graze for {target} seconds', reward: 1500, targetBase: 15, targetScale: 10 },
    { id: 'graze_time_single', desc: 'Graze for {target}s in one run', reward: 2000, targetBase: 10, targetScale: 5 },
    { id: 'survive_single', desc: 'Survive {target}s in one run', reward: 1500, targetBase: 120, targetScale: 30 },
    { id: 'reach_risk', desc: 'Reach {target}% Risk', reward: 2500, targetBase: 50, targetScale: 10 },
    { id: 'showboat_count', desc: 'Perform {target} Showboats', reward: 2800, targetBase: 10, targetScale: 5 },
    { id: 'collect_coins_single', desc: 'Collect {target} coins in one run', reward: 3500, targetBase: 1000, targetScale: 500 },
    { id: 'collect_powerups', desc: 'Collect {target} Powerups', reward: 1500, targetBase: 5, targetScale: 5 },
    { id: 'collect_powerups_single', desc: 'Collect {target} Powerups in one run', reward: 2500, targetBase: 3, targetScale: 2 },
    { id: 'hardcore_survive', desc: 'Survive {target}s in Hardcore', reward: 5000, targetBase: 60, targetScale: 30 },
    { id: 'titan_slayer', desc: 'Survive {target} Titan Phases', reward: 6000, targetBase: 1, targetScale: 1 }
];

export const PROGRESSION_MISSIONS = [
    { id: 'm1', desc: "Survive for 60 seconds", templateId: 'survive_time', target: 60, reward: 500 },
    { id: 'm2', desc: "Buy an Upgrade", templateId: 'buy_upgrade', target: 1, reward: 500 },
    { id: 'm3', desc: "Reach 50% Risk", templateId: 'reach_risk', target: 50, reward: 750 },
    { id: 'm4', desc: "Survive for 120 seconds", templateId: 'survive_time', target: 120, reward: 1000 },
    { id: 'm5', desc: "Buy a new Trail", templateId: 'buy_trail', target: 1, reward: 1000 },
    { id: 'm6', desc: "Collect 500 coins in one run", templateId: 'collect_coins_single', target: 500, reward: 1500 },
    { id: 'm7', desc: "Buy the Showboat Unit", templateId: 'buy_showboat', target: 1, reward: 2000 },
    { id: 'm8', desc: "Perform 10 Showboats in one run", templateId: 'showboat_count_single', target: 10, reward: 2500 },
    { id: 'm9', desc: "Buy a new Skin", templateId: 'buy_skin', target: 1, reward: 3000 },
    { id: 'm10', desc: "Survive 300 seconds (5 mins)", templateId: 'survive_time', target: 300, reward: 5000 },
    { id: 'm11', desc: "Collect 1000 coins in one run", templateId: 'collect_coins_single', target: 1000, reward: 6000 },
    { id: 'm12', desc: "Survive 2 Titan Phases", templateId: 'titan_slayer', target: 2, reward: 7000 },
    { id: 'm13', desc: "Reach 80% Risk", templateId: 'reach_risk', target: 80, reward: 8000 },
    { id: 'm14', desc: "Buy 3 Trails", templateId: 'buy_trail', target: 3, reward: 9000 },
    { id: 'm15', desc: "Survive 600 seconds (10 mins)", templateId: 'survive_time', target: 600, reward: 10000 },
    { id: 'm16', desc: "Perform 25 Showboats in one run", templateId: 'showboat_count_single', target: 25, reward: 12000 },
    { id: 'm17', desc: "Buy 3 Skins", templateId: 'buy_skin', target: 3, reward: 15000 },
    { id: 'm18', desc: "Survive 60s in Hardcore", templateId: 'hardcore_survive', target: 60, reward: 20000 },
    { id: 'm19', desc: "Collect 5000 coins in one run", templateId: 'collect_coins_single', target: 5000, reward: 25000 },
    { id: 'm20', desc: "Survive 5 Titan Phases", templateId: 'titan_slayer', target: 5, reward: 50000 }
];

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
  grazeBonus: {
    baseCost: 300,
    costMultiplier: 1.8,
    maxLevel: 99,
    name: "RISK MODULE",
    desc: "Earn more coins from grazing enemies"
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
    { id: 'matrix', name: 'THE SOURCE', cost: 75000, type: 'animated', color: '#00ff00' },
    { id: 'fortune', name: 'FORTUNE', cost: 100000, type: 'animated', color: '#f1c40f' }
];

export const LOADOUT_CONFIG = {
  startShield: { cost: 50, name: "SHIELD INIT", desc: "Start with 1 Shield" },
  rocketBoost: { cost: 100, name: "WARP START", desc: "Start at 60s mark" },
  doubleCoins: { cost: 150, name: "BOUNTY HUNTER", desc: "2x Coins earned" }
};
