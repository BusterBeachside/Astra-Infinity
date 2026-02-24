
import { Player, Obstacle, Star, GameState, UserProgress, CoinBreakdown, GameMode } from '../types';
import { COLORS, CONSTANTS, GRAZE_CONFIG } from '../constants';
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

export const calculateCoins = (elapsedTime: number, gameMode: GameMode, doubleCoins: boolean, permDouble: boolean, titansSurvived: number = 0, grazeCoins: number = 0, showboatCoins: number = 0): CoinBreakdown => {
    if (gameMode === 'preview' || gameMode === 'practice') {
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
        currentTotal *= 3; // Reduced from 5 to 3
    }

    // Titan Bonus
    const titanBonus = titansSurvived * CONSTANTS.TITAN_COIN_REWARD;
    currentTotal += titanBonus;

    // Graze Bonus (Already calculated and passed in, just add it)
    // Graze coins are affected by multipliers? Usually they are generated with multipliers already applied.
    // Let's assume grazeCoins passed in are raw value and need multipliers?
    // No, in GameCanvas we applied upgrade multiplier.
    // Should we apply Double Coins to graze coins? Yes.
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
        isHardcore: gameMode === 'hardcore',
        isDouble: doubleCoins,
        isPermDouble: permDouble,
        grazeCoins: Math.floor(grazeCoins),
        showboatCoins: Math.floor(showboatCoins),
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
    audioManager.playSfx('spawn_side_seeker');
  }
  else {
    // Weighted Random Selection to ensure variety
    // Seeker/Diagonal chances increase with time, but capped to prevent total dominance
    const seekerWeight = Math.min(40, 5 + (minute * 5)); // Max 40% weight
    const diagonalWeight = Math.min(30, 2 + (minute * 4)); // Max 30% weight
    const normalWeight = 100; // Always significant weight
    
    const totalWeight = normalWeight + (now > 120 ? seekerWeight : 0) + (now > 60 ? diagonalWeight : 0);
    let roll = Math.random() * totalWeight;
    
    if (now > 120 && roll < seekerWeight) {
      type = 'seeker';
      color = COLORS.SEEKER;
      audioManager.playSfx('spawn_seeker');
    } else if (now > 60 && roll < (seekerWeight + diagonalWeight)) {
      type = 'diagonal';
      color = COLORS.DIAGONAL;
      const side = Math.random() > 0.5 ? -50 : width + 50;
      x = side;
      y = -50;
      vx = (side < 0 ? 140 : -140) * speedMultiplier; 
      vy = (180 + Math.random() * 150) * speedMultiplier; 
      audioManager.playSfx('spawn_normal');
    } else {
       // Normal
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

export const updatePlayer = (player: Player, width: number, height: number, dt: number, obstacles: Obstacle[], gameState: GameState, grazeBonusLevel: number = 0): { coins: number, spawnParticle?: any } => {
  // Shrink/Slow Timers
  if (player.shrinkTimer > 0) player.shrinkTimer -= dt;
  if (player.slowTimer > 0) player.slowTimer -= dt;

  // Radius Logic
  const targetRadius = player.shrinkTimer > 0 ? player.baseRadius * 0.5 : player.baseRadius;
  // Radius lerp (frame independent approx)
  const rDiff = targetRadius - player.radius;
  player.radius += rDiff * (1 - Math.exp(-10 * dt));

  // Movement Lerp (Frame independent)
  const lerpFactor = 1 - Math.exp(-17 * dt);
  
  player.x += (player.targetX - player.x) * lerpFactor;
  player.y += (player.targetY - player.y) * lerpFactor;
  
  // Bounds
  player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(height - player.radius, player.y));

  // Trail Logic
  if (!player.trail) player.trail = [];
  player.trail.push({ x: player.x, y: player.y });
  if (player.trail.length > 20) {
      player.trail.shift();
  }

  // Grazing Logic
  let nearestDist = Infinity;
  let nearestObstacle: Obstacle | null = null;

  obstacles.forEach(o => {
      const dist = Math.hypot(player.x - o.x, player.y - o.y) - (player.radius + o.size);
      if (dist < nearestDist) {
          nearestDist = dist;
          nearestObstacle = o;
      }
  });

  let coinsThisFrame = 0;

  if (nearestDist < GRAZE_CONFIG.DISTANCE_THRESHOLD && nearestDist > 0 && nearestObstacle) {
      const intensity = 1 - (nearestDist / GRAZE_CONFIG.DISTANCE_THRESHOLD);
      gameState.currentRisk = Math.min(100, gameState.currentRisk + GRAZE_CONFIG.RISK_GAIN * intensity * dt);
      
      // Spawn Graze Particles
      if (Math.random() < intensity * 0.5) { 
          // Directional sparks:
          // Vector from Obstacle -> Player
          const dx = player.x - (nearestObstacle as any).x;
          const dy = player.y - (nearestObstacle as any).y;
          const angleToPlayer = Math.atan2(dy, dx);
          
          // Spawn on the surface of the player facing the obstacle
          // So angle is angleToPlayer + PI (facing obstacle)? No, we want sparks flying OFF the player
          // Sparks should fly roughly away from the friction point.
          // Friction point is at angleToPlayer + PI.
          // Sparks fly in direction of player movement relative to obstacle?
          // Let's keep it simple: Sparks appear on the side facing the obstacle, and fly OUTWARD (away from obstacle)
          
          // Spawn point: Player edge facing obstacle
          const spawnAngle = angleToPlayer + Math.PI + (Math.random() - 0.5); // Slight spread
          const spawnX = player.x + Math.cos(spawnAngle) * player.radius;
          const spawnY = player.y + Math.sin(spawnAngle) * player.radius;

          // Velocity: Away from contact point (towards player center + random)
          // Actually sparks usually fly TANGENT or REFLECTED.
          // Let's make them fly roughly away from the obstacle (angleToPlayer)
          const velocityAngle = angleToPlayer + (Math.random() - 0.5) * 1.5;

          return {
              coins: coinsThisFrame,
              spawnParticle: {
                  x: spawnX,
                  y: spawnY,
                  vx: Math.cos(velocityAngle) * (50 + Math.random() * 100),
                  vy: Math.sin(velocityAngle) * (50 + Math.random() * 100),
                  size: 1 + Math.random() * 2,
                  life: 0.1 + Math.random() * 0.2, 
                  color: Math.random() > 0.5 ? '#ffff00' : '#ffffff' 
              }
          };
      }
  } else {
      gameState.currentRisk = Math.max(0, gameState.currentRisk - GRAZE_CONFIG.RISK_DECAY * dt);
  }

  if (nearestDist < GRAZE_CONFIG.DISTANCE_THRESHOLD && nearestDist > 0 && nearestObstacle && gameState.isActive && !gameState.isGameOver && gameState.gameMode !== 'practice' && gameState.gameMode !== 'preview') {
      const upgradeMult = 1 + (grazeBonusLevel * CONSTANTS.UPGRADE_BONUS_GRAZE);
      coinsThisFrame = (gameState.currentRisk / 100) * GRAZE_CONFIG.COIN_RATE * upgradeMult * dt;
      gameState.coinsEarned += coinsThisFrame;
      
      if (!gameState.coinBreakdown) {
          gameState.coinBreakdown = { base: 0, checkpoints: 0, checkpointMult: 0, titansSurvived: 0, titanBonus: 0, isHardcore: false, isDouble: false, isPermDouble: false, grazeCoins: 0, showboatCoins: 0, total: 0 };
      }
      gameState.coinBreakdown.grazeCoins += coinsThisFrame;
  }

  return { coins: coinsThisFrame };
};

export const getVisualRadius = (player: Player) => {
  let pulseScale = 1.0;
  if (player.shrinkTimer > 0) {
    if (player.shrinkTimer < 2.5) pulseScale = 1 + Math.sin(Date.now() / 40) * 0.2;
    else if (player.shrinkTimer > 29) pulseScale = 1 + Math.sin(Date.now() / 80) * 0.15;
  }
  return player.radius * pulseScale;
};
