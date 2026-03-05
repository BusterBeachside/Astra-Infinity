
import { Player, GameMode } from '../types';
import { TRAIL_CONFIG, SKIN_CONFIG, COLORS } from '../constants';
import { drawFireTrail } from './draw/trails/fireTrail';
import { drawWaterTrail } from './draw/trails/waterTrail';
import { drawTronTrail } from './draw/trails/tronTrail';
import { drawRailTrail } from './draw/trails/railTrail';
import { drawChainTrail } from './draw/trails/chainTrail';
import { drawChevronTrail } from './draw/trails/chevronTrail';
import { drawGlitchTrail } from './draw/trails/glitchTrail';
import { drawLightningTrail } from './draw/trails/lightningTrail';
import { drawMatrixTrail } from './draw/trails/matrixTrail';
import { drawFortuneTrail } from './draw/trails/fortuneTrail';
import { drawStandardTrail } from './draw/trails/standardTrail';

import { drawGoldSkin } from './draw/skins/goldSkin';
import { drawSaucerSkin, drawSaucerLights } from './draw/skins/saucerSkin';
import { drawGhostSkin, drawGhostAfterimages } from './draw/skins/ghostSkin';
import { drawGlitchSkin } from './draw/skins/glitchSkin';
import { drawPatternSkin, drawPatternOverlay } from './draw/skins/patternSkin';
import { drawStandardShape, getStandardFillStyle } from './draw/skins/standardSkin';
import { VisualRNG } from './rng';

export const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player, visualRadius: number, gameMode: GameMode) => {
  // Draw Glowing Trail
  if (player.trail && player.trail.length > 1) {
    const config = TRAIL_CONFIG.find(t => t.id === player.trailType) || TRAIL_CONFIG[0];
    
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // -- TRAIL STYLE LOGIC --
    switch (config.id) {
        case 'fire':
            drawFireTrail(ctx, player, visualRadius);
            break;
        case 'water':
            drawWaterTrail(ctx, player, visualRadius);
            break;
        case 'tron':
            drawTronTrail(ctx, player, visualRadius);
            break;
        case 'rail':
            drawRailTrail(ctx, player, visualRadius, config.color);
            break;
        case 'chain':
            drawChainTrail(ctx, player);
            break;
        case 'chevron':
            drawChevronTrail(ctx, player, config.color);
            break;
        case 'glitch':
            drawGlitchTrail(ctx, player, visualRadius);
            break;
        case 'lightning':
            drawLightningTrail(ctx, player, visualRadius, config.color);
            break;
        case 'matrix':
            drawMatrixTrail(ctx, player);
            break;
        case 'fortune':
            drawFortuneTrail(ctx, player);
            break;
        default:
            drawStandardTrail(ctx, player, visualRadius, config);
            break;
    }

    ctx.restore();
  }

  // Shield rings
  for (let i = 0; i < player.shields; i++) {
    ctx.beginPath();
    ctx.arc(player.x, player.y, visualRadius + 12 + (i * 8), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(46, 204, 113, ${0.8 / (i + 1)})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Core
  ctx.save();
  ctx.translate(player.x, player.y);
  
  const skin = SKIN_CONFIG.find(s => s.id === player.skinId) || SKIN_CONFIG[0];
  const now = Date.now();

  // Glow/Shadow
  if (gameMode === 'hardcore') {
      const pulse = Math.sin(now / 200);
      ctx.shadowBlur = 15 + pulse * 5;
      ctx.shadowColor = 'red';
      ctx.strokeStyle = `rgba(255, 0, 0, ${0.8 + pulse * 0.2})`;
      ctx.lineWidth = 3 + pulse;
  } else {
      ctx.shadowBlur = 10;
      // Use themeColor if available, otherwise fallback to rainbow for animated or white for others
      if (skin.themeColor) {
          ctx.shadowColor = skin.themeColor;
      } else {
          ctx.shadowColor = skin.type === 'animated' ? `hsl(${(now / 10) % 360}, 100%, 50%)` : 'rgba(255,255,255,0.2)';
      }
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
  }

  // Fill Style
  if (skin.id === 'gold') {
      drawGoldSkin(ctx, visualRadius);
  } else if (skin.id === 'saucer') {
      drawSaucerSkin(ctx, visualRadius);
  } else if (skin.id === 'ghost') {
      drawGhostSkin(ctx);
  } else if (skin.id === 'glitch') {
      drawGlitchSkin(ctx, visualRadius);
  } else if (skin.type === 'pattern') {
      drawPatternSkin(ctx, visualRadius, skin);
  } else {
      ctx.fillStyle = getStandardFillStyle(ctx, skin, visualRadius);
  }

  ctx.beginPath();
  
  // Shape Drawing
  
  // 1. Set Fill Style (already done above)
  
  // 2. Define Path
  if (skin.id === 'glitch') {
      // Glitch path logic is unique
       const r = visualRadius;
       const segments = 8;
       for(let i=0; i<segments; i++) {
           const angle1 = (i/segments) * Math.PI * 2;
           const angle2 = ((i+1)/segments) * Math.PI * 2;
           const jitter = VisualRNG.random() > 0.7 ? (1 + (VisualRNG.random()-0.5)*0.4) : 1;
           if (i===0) ctx.moveTo(Math.cos(angle1) * r * jitter, Math.sin(angle1) * r * jitter);
           else ctx.lineTo(Math.cos(angle1) * r * jitter, Math.sin(angle1) * r * jitter);
           ctx.lineTo(Math.cos(angle2) * r * jitter, Math.sin(angle2) * r * jitter);
       }
  } else {
      drawStandardShape(ctx, skin, visualRadius);
  }
  
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Pattern overlay for 'pattern' type (Clipped to ship shape)
  if (skin.type === 'pattern') {
      drawPatternOverlay(ctx, visualRadius, skin);
  }

  // Saucer lights
  if (skin.id === 'saucer') {
      drawSaucerLights(ctx, visualRadius);
  }
  
  // Ghost Afterimages
  if (skin.id === 'ghost') {
      drawGhostAfterimages(ctx);
  }

  ctx.restore();
  
  // Reset shadow for subsequent draws
  ctx.shadowBlur = 0;
};

export const drawHitbox = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
  ctx.fill();
  ctx.restore();
};
