import { Obstacle, GameState } from '../../types';
import { CONSTANTS, COLORS } from '../../constants';
import { audioManager } from '../audioManager';
import { RNG } from '../rng';

export const spawnObstacle = (gameState: GameState, obstacles: Obstacle[]) => {
  const { elapsedTime, width, height, titanCooldown, chaosModules } = gameState;
  const isTheyHateYou = chaosModules?.theyHateYou;
  
  const now = isTheyHateYou ? 600 : elapsedTime; // Treat as 10 mins in for difficulty
  const minute = Math.floor(now / 60);
  
  let type: any = 'normal';
  let x = RNG.random() * width;
  let y = -50;
  let vx = 0;
  
  // SPEED BALANCING:
  const speedMultiplier = 1 + (now / 800); 
  
  // Base Speed
  let vy = (220 + RNG.random() * 180) * speedMultiplier;
  
  let color = COLORS.SPIKE;
  let size = 15;
  let life = 0;
  let maxLife = 0;
  
  const roll = RNG.random();

  // Titan Spawn Logic
  const titanCount = obstacles.filter(o => o.type === 'titan').length;
  const maxTitans = now > 360 ? 2 : 1;

  if (now > CONSTANTS.TITAN_START_TIME && titanCooldown <= 0 && titanCount < maxTitans) {
    type = 'titan';
    size = 47;
    color = COLORS.TITAN;
    x = RNG.random() > 0.5 ? -100 : width + 100;
    y = RNG.random() * height * 0.3;
    vy = 0;
    life = 10;
    maxLife = 10;
    gameState.titanCooldown = 20 + RNG.random() * 15;
    audioManager.playSfx('spawn_titan');
  }
  // Side Seeker
  else if (now > 240 && roll < 0.2) {
    type = 'side-seeker';
    color = COLORS.SEEKER;
    const side = RNG.random() > 0.5 ? -50 : width + 50;
    x = side;
    y = (height * 0.2) + (RNG.random() * height * 0.6);
    vx = side < 0 ? 220 : -220;
    vy = 0;
    audioManager.playSfx('spawn_side_seeker');
  }
  else {
    // Weighted Random Selection to ensure variety
    const seekerWeight = Math.min(40, 5 + (minute * 5)); 
    const diagonalWeight = Math.min(30, 2 + (minute * 4)); 
    const normalWeight = 100; 
    
    const totalWeight = normalWeight + (now > 120 ? seekerWeight : 0) + (now > 60 ? diagonalWeight : 0);
    let weightedRoll = RNG.random() * totalWeight;
    
    if (now > 120 && weightedRoll < seekerWeight) {
      type = 'seeker';
      color = COLORS.SEEKER;
      audioManager.playSfx('spawn_seeker');
    } else if (now > 60 && weightedRoll < (seekerWeight + diagonalWeight)) {
      type = 'diagonal';
      color = COLORS.DIAGONAL;
      const side = RNG.random() > 0.5 ? -50 : width + 50;
      x = side;
      y = -50;
      vx = (side < 0 ? 140 : -140) * speedMultiplier; 
      vy = (180 + RNG.random() * 150) * speedMultiplier; 
      audioManager.playSfx('spawn_normal');
    } else {
       // Normal
       audioManager.playSfx('spawn_normal');
    }
  }

  obstacles.push({
    id: RNG.id(),
    x, y, vx, vy, size, type, color, life, maxLife, angle: 0,
    accumulatedAngle: 0,
    showboatCount: 0
  });
  
  return type === 'titan';
};

