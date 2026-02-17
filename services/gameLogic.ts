
import { Player, Obstacle, Star, GameState, UserProgress, CoinBreakdown } from '../types';
import { COLORS, CONSTANTS } from '../constants';
import { audioManager } from './audioManager';

export const initStars = (width: number, height: number): Star[] => {
  const stars: Star[] = [];
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2,
      // Scale speed for pixels per second (previously pixels per frame ~1-4)
      speed: (1 + Math.random() * 3) * 60 
    });
  }
  return stars;
};

export const formatTime = (s: number): string => {
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
};

export const calculateCoins = (elapsedTime: number, gameMode: 'normal' | 'hardcore' | 'preview', doubleCoins: boolean, permDouble: boolean, titansSurvived: number = 0): CoinBreakdown => {
    if (gameMode === 'preview') {
         return {
            base: 0, checkpoints: 0, checkpointMult: 0, titansSurvived: 0, titanBonus: 0,
            isHardcore: false, isDouble: false, isPermDouble: false, total: 0
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
        currentTotal *= 3; // Reduced from 5 to 3
    }

    // Titan Bonus
    const titanBonus = titansSurvived * CONSTANTS.TITAN_COIN_REWARD;
    currentTotal += titanBonus;

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
        isHardcore: gameMode === 'hardcore',
        isDouble: doubleCoins,
        isPermDouble: permDouble,
        total: currentTotal
    };
};

export const spawnObstacle = (gameState: GameState, obstacles: Obstacle[]) => {
  const { elapsedTime, width, height, titanCooldown } = gameState;
  const now = elapsedTime;
  const minute = Math.floor(now / 60);
  
  let type: any = 'normal';
  let x = Math.random() * width;
  let y = -50;
  let vx = 0;
  
  // SPEED BALANCING:
  const speedMultiplier = 1 + (now / 800); 
  
  // Base Speed (~3-5 px/frame -> ~180-300 px/sec) -> Increased to ~220-400 px/sec
  let vy = (220 + Math.random() * 180) * speedMultiplier;
  
  let color = COLORS.SPIKE;
  let size = 15;
  let life = 0;
  let maxLife = 0;
  
  const roll = Math.random();

  // Titan Spawn Logic
  if (now > CONSTANTS.TITAN_START_TIME && titanCooldown <= 0 && !obstacles.find(o => o.type === 'titan')) {
    type = 'titan';
    size = 47;
    color = COLORS.TITAN;
    x = Math.random() > 0.5 ? -100 : width + 100;
    y = Math.random() * height * 0.3;
    vy = 0;
    life = 10;
    maxLife = 10;
    gameState.titanCooldown = 20 + Math.random() * 15;
    audioManager.playSfx('spawn_titan');
  }
  // Side Seeker
  else if (now > 240 && roll < 0.2) {
    type = 'side-seeker';
    color = COLORS.SEEKER;
    const side = Math.random() > 0.5 ? -50 : width + 50;
    x = side;
    y = (height * 0.2) + (Math.random() * height * 0.6);
    vx = side < 0 ? 220 : -220; // Increased from 150
    vy = 0;
    audioManager.playSfx('spawn_seeker');
  }
  else {
    const seekerChance = 0.1 + (minute * 0.1);
    const diagonalChance = 0.05 + (minute * 0.08);

    if (now > 120 && roll < diagonalChance) {
      type = 'diagonal';
      color = COLORS.DIAGONAL;
      const side = Math.random() > 0.5 ? -50 : width + 50;
      x = side;
      y = -50;
      vx = (side < 0 ? 140 : -140) * speedMultiplier; // Increased from 90
      vy = (180 + Math.random() * 150) * speedMultiplier; // Increased from 120-240
      audioManager.playSfx('spawn_normal');
    } else if (now > 60 && roll < seekerChance) {
      type = 'seeker';
      color = COLORS.SEEKER;
      audioManager.playSfx('spawn_seeker');
    } else {
       audioManager.playSfx('spawn_normal');
    }
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    x, y, vx, vy, size, type, color, life, maxLife, angle: 0,
    // Showboat init
    accumulatedAngle: 0,
    showboatCount: 0
  } as Obstacle;
};

export const updatePlayer = (player: Player, width: number, height: number, dt: number) => {
  // Shrink/Slow Timers
  if (player.shrinkTimer > 0) player.shrinkTimer -= dt;
  if (player.slowTimer > 0) player.slowTimer -= dt;

  // Radius Logic
  const targetRadius = player.shrinkTimer > 0 ? player.baseRadius * 0.5 : player.baseRadius;
  // Radius lerp (frame independent approx)
  const rDiff = targetRadius - player.radius;
  player.radius += rDiff * (1 - Math.exp(-10 * dt));

  // Movement Lerp (Frame independent)
  // Standard lerp factor 0.25 at 60fps (~16ms) implies decay rate:
  // 0.75 = exp(-k * 0.016) -> k approx 17
  const lerpFactor = 1 - Math.exp(-17 * dt);
  
  player.x += (player.targetX - player.x) * lerpFactor;
  player.y += (player.targetY - player.y) * lerpFactor;
  
  // Bounds
  player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(height - player.radius, player.y));

  // Trail Logic
  if (!player.trail) player.trail = [];
  player.trail.push({ x: player.x, y: player.y });
  // Keep last 20 frames for the tail
  if (player.trail.length > 20) {
      player.trail.shift();
  }
};

export const getVisualRadius = (player: Player) => {
  let pulseScale = 1.0;
  if (player.shrinkTimer > 0) {
    if (player.shrinkTimer < 2.5) pulseScale = 1 + Math.sin(Date.now() / 40) * 0.2;
    else if (player.shrinkTimer > 29) pulseScale = 1 + Math.sin(Date.now() / 80) * 0.15;
  }
  return player.radius * pulseScale;
};
