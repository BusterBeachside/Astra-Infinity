import { Player, Obstacle, GameState } from '../../types';
import { CONSTANTS, GRAZE_CONFIG } from '../../constants';
import { RNG, VisualRNG } from '../rng';

export const updatePlayer = (player: Player, width: number, height: number, dt: number, realDt: number, obstacles: Obstacle[], gameState: GameState, grazeBonusLevel: number = 0): { coins: number, spawnParticle?: any } => {
  // Shrink/Slow Timers
  if (player.shrinkTimer > 0) player.shrinkTimer -= realDt;
  if (player.slowTimer > 0) player.slowTimer -= realDt;

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
  let spawnParticle: any = undefined;

  if (nearestDist < GRAZE_CONFIG.DISTANCE_THRESHOLD && nearestDist > 0 && nearestObstacle) {
      const intensity = 1 - (nearestDist / GRAZE_CONFIG.DISTANCE_THRESHOLD);
      gameState.currentRisk = Math.min(100, gameState.currentRisk + GRAZE_CONFIG.RISK_GAIN * intensity * dt);
      
      // Spawn Graze Particles
      if (VisualRNG.random() < intensity * 0.5) { 
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
          const spawnAngle = angleToPlayer + Math.PI + (VisualRNG.random() - 0.5); // Slight spread
          const spawnX = player.x + Math.cos(spawnAngle) * player.radius;
          const spawnY = player.y + Math.sin(spawnAngle) * player.radius;

          // Velocity: Away from contact point (towards player center + random)
          // Actually sparks usually fly TANGENT or REFLECTED.
          // Let's make them fly roughly away from the obstacle (angleToPlayer)
          const velocityAngle = angleToPlayer + (VisualRNG.random() - 0.5) * 1.5;

          spawnParticle = {
              id: VisualRNG.id(),
              x: spawnX,
              y: spawnY,
              vx: Math.cos(velocityAngle) * (50 + VisualRNG.random() * 100),
              vy: Math.sin(velocityAngle) * (50 + VisualRNG.random() * 100),
              size: 1 + VisualRNG.random() * 2,
              life: 0.1 + VisualRNG.random() * 0.2, 
              color: VisualRNG.random() > 0.5 ? '#ffff00' : '#ffffff' 
          };
      }
  } else {
      gameState.currentRisk = Math.max(0, gameState.currentRisk - GRAZE_CONFIG.RISK_DECAY * dt);
  }

  if (nearestDist < GRAZE_CONFIG.DISTANCE_THRESHOLD && nearestDist > 0 && nearestObstacle && gameState.isActive && !gameState.isGameOver && gameState.gameMode !== 'practice' && gameState.gameMode !== 'preview' && gameState.gameMode !== 'tutorial') {
      const upgradeMult = 1 + (grazeBonusLevel * CONSTANTS.UPGRADE_BONUS_GRAZE);
      coinsThisFrame = (gameState.currentRisk / 100) * GRAZE_CONFIG.COIN_RATE * upgradeMult * dt;
      gameState.coinsEarned += coinsThisFrame;
      gameState.grazeTime += realDt;
      
      if (!gameState.coinBreakdown) {
          gameState.coinBreakdown = { base: 0, checkpoints: 0, checkpointMult: 0, titansSurvived: 0, titanBonus: 0, isHardcore: false, isDouble: false, isPermDouble: false, grazeCoins: 0, showboatCoins: 0, total: 0 };
      }
      gameState.coinBreakdown.grazeCoins += coinsThisFrame;
  }

  return { coins: coinsThisFrame, spawnParticle };
};

export const getVisualRadius = (player: Player) => {
  let pulseScale = 1.0;
  if (player.shrinkTimer > 0) {
    if (player.shrinkTimer < 2.5) pulseScale = 1 + Math.sin(Date.now() / 40) * 0.2;
    else if (player.shrinkTimer > 29) pulseScale = 1 + Math.sin(Date.now() / 80) * 0.15;
  }
  return player.radius * pulseScale;
};
