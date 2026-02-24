
import { Player, Obstacle, PowerUp, Particle, GameMode } from '../types';
import { COLORS, TRAIL_CONFIG, SKIN_CONFIG } from '../constants';

export const clearCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.clearRect(0, 0, width, height);
};

export const drawPowerUp = (ctx: CanvasRenderingContext2D, p: PowerUp) => {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 4;
  ctx.fillStyle = p.color;
  
  ctx.beginPath();
  // Draw a star shape
  for (let i = 0; i < 5; i++) {
    ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * 15, -Math.sin((18 + i * 72) / 180 * Math.PI) * 15);
    ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * 7.5, -Math.sin((54 + i * 72) / 180 * Math.PI) * 7.5);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.restore();
};

export const drawObstacle = (ctx: CanvasRenderingContext2D, o: Obstacle) => {
  ctx.save();
  ctx.translate(o.x, o.y);

  let rot = 0;
  if (o.type === 'titan') rot = o.angle - Math.PI / 2;
  else if (o.type === 'side-seeker') rot = o.angle - Math.PI;
  else rot = Math.atan2(o.vy, o.vx) - Math.PI / 2;

  ctx.rotate(rot);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 6;

  if (o.type === 'titan') {
    const glow = (Math.sin(Date.now() / 150) + 1) * 10;
    ctx.shadowBlur = glow;
    ctx.shadowColor = 'red';
    ctx.strokeStyle = `rgb(${glow * 5},0,0)`;
    
    // Pulse effect when low life
    if (o.life < 3) {
      const scale = 1 + Math.sin(Date.now() / 50) * 0.1;
      ctx.scale(scale, scale);
    }
  } else {
    // General visibility boost for standard enemies
    ctx.shadowBlur = 12;
    ctx.shadowColor = o.color;
    ctx.strokeStyle = '#222'; // Dark grey outline instead of pure black
    
    if (o.type === 'side-seeker') {
        ctx.strokeStyle = COLORS.GOLD;
        ctx.lineWidth = 4;
    }
  }

  ctx.fillStyle = o.color;
  ctx.beginPath();
  // Triangle shape
  ctx.moveTo(0, o.size);
  ctx.lineTo(-o.size, -o.size);
  ctx.lineTo(o.size, -o.size);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();

  // Titan Health Ring
  if (o.type === 'titan') {
    ctx.restore(); // Reset rotation for health ring
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.beginPath();
    ctx.arc(0, 0, o.size + 20, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (o.life / o.maxLife)));
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  
  ctx.restore();
};

export const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player, visualRadius: number, gameMode: GameMode) => {
  // Draw Glowing Trail
  if (player.trail && player.trail.length > 1) {
    const config = TRAIL_CONFIG.find(t => t.id === player.trailType) || TRAIL_CONFIG[0];
    const now = Date.now();
    
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // -- TRAIL STYLE LOGIC --

    if (config.id === 'fire') {
         ctx.lineWidth = visualRadius;
         // Draw particles or distinct segments for fire
         for (let i = 0; i < player.trail.length - 1; i++) {
             const p = player.trail[i];
             const age = i / player.trail.length; // 0 (old) to 1 (new)
             // Jitter
             const jx = (Math.random() - 0.5) * 5;
             const jy = (Math.random() - 0.5) * 5;
             
             ctx.beginPath();
             ctx.arc(p.x + jx, p.y + jy, visualRadius * age * 0.8, 0, Math.PI*2);
             // Fire colors: Yellow -> Orange -> Red
             const hue = 60 * age; 
             ctx.fillStyle = `hsla(${10 + age * 40}, 100%, 50%, ${age})`; 
             ctx.fill();
         }

    } else if (config.id === 'water') {
         // FANCY WATER: Liquid stream with bubbles
         
         // 1. Draw the main fluid body (tapering stream)
         ctx.shadowBlur = 10;
         ctx.shadowColor = '#3498db';
         
         for (let i = 0; i < player.trail.length - 1; i++) {
             const p1 = player.trail[i];
             const p2 = player.trail[i+1];
             const age = i / player.trail.length; // 0 (tail) -> 1 (head)
             
             // Dynamic width: Tapers at tail, bulges with sine wave
             const wave = Math.sin((now / 100) + (i * 0.3));
             const width = (visualRadius * 0.8 * age) + (wave * 2);
             
             ctx.lineWidth = Math.max(1, width);
             ctx.strokeStyle = `rgba(41, 128, 185, ${0.3 + age * 0.5})`; // Deep blue
             
             ctx.beginPath();
             ctx.moveTo(p1.x, p1.y);
             ctx.lineTo(p2.x, p2.y);
             ctx.stroke();
         }

         // 2. Draw inner "highlight" stream (lighter cyan)
         ctx.shadowBlur = 0;
         for (let i = 0; i < player.trail.length - 1; i++) {
             const p1 = player.trail[i];
             const p2 = player.trail[i+1];
             const age = i / player.trail.length;
             
             ctx.lineWidth = Math.max(0.5, visualRadius * 0.4 * age);
             ctx.strokeStyle = `rgba(100, 221, 249, ${0.2 + age * 0.6})`; // Cyan
             
             ctx.beginPath();
             ctx.moveTo(p1.x, p1.y);
             ctx.lineTo(p2.x, p2.y);
             ctx.stroke();
         }

         // 3. Bubbles / Foam particles
         const bubblesCount = 15;
         for(let j=0; j<bubblesCount; j++) {
             // Create pseudo-random bubbles based on time/index so they "flow"
             // Using modulo to pick specific spots along the trail
             const indexOffset = Math.floor(((now / 50) + (j * 13)) % player.trail.length);
             if(indexOffset < 0 || indexOffset >= player.trail.length) continue;

             const p = player.trail[indexOffset];
             const age = indexOffset / player.trail.length;
             
             // Jitter position
             const jx = Math.sin(now/200 + j) * (visualRadius * 0.6);
             const jy = Math.cos(now/200 + j) * (visualRadius * 0.6);
             
             const bubbleSize = (Math.sin(now/100 + j) + 2) * 2;
             
             ctx.fillStyle = `rgba(255, 255, 255, ${age * 0.8})`;
             ctx.beginPath();
             ctx.arc(p.x + jx, p.y + jy, bubbleSize, 0, Math.PI*2);
             ctx.fill();
         }

    } else if (config.id === 'tron') {
         ctx.shadowBlur = 10;
         ctx.shadowColor = '#00ffff';
         ctx.strokeStyle = '#00ffff';
         ctx.lineWidth = visualRadius * 0.6;
         
         ctx.beginPath();
         // Connect points with straight lines (no curve)
         ctx.moveTo(player.trail[0].x, player.trail[0].y);
         for(let i=1; i<player.trail.length; i++) {
             ctx.lineTo(player.trail[i].x, player.trail[i].y);
         }
         ctx.lineTo(player.x, player.y);
         ctx.stroke();
         
         // Draw square nodes
         ctx.fillStyle = '#fff';
         for(let i=0; i<player.trail.length; i+=3) {
             const p = player.trail[i];
             ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
         }

    } else if (config.id === 'rail') {
         // Hyper Rail: Outer shell + Inner Core
         ctx.shadowBlur = 10;
         ctx.shadowColor = config.color;
         
         // Outer
         ctx.beginPath();
         ctx.moveTo(player.trail[0].x, player.trail[0].y);
         for(let i=1; i<player.trail.length; i++) {
             ctx.lineTo(player.trail[i].x, player.trail[i].y);
         }
         ctx.lineTo(player.x, player.y);
         ctx.lineWidth = visualRadius;
         ctx.strokeStyle = config.color;
         ctx.stroke();

         // Inner
         ctx.beginPath();
         ctx.moveTo(player.trail[0].x, player.trail[0].y);
         for(let i=1; i<player.trail.length; i++) {
             ctx.lineTo(player.trail[i].x, player.trail[i].y);
         }
         ctx.lineTo(player.x, player.y);
         ctx.lineWidth = visualRadius * 0.3;
         ctx.strokeStyle = 'white';
         ctx.stroke();

    } else if (config.id === 'chain') {
         // Chain Links: Interlocked ellipses
         ctx.shadowBlur = 0;
         ctx.strokeStyle = '#bdc3c7'; // Silver
         ctx.lineWidth = 3;

         for (let i = 0; i < player.trail.length - 1; i++) { 
             // Draw links more densely than points
             const p1 = player.trail[i];
             const p2 = player.trail[i+1];
             const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
             
             ctx.save();
             ctx.translate(p1.x, p1.y);
             ctx.rotate(angle);
             
             // Alternating link orientation
             if (i % 2 === 0) {
                 // Open link
                 ctx.beginPath();
                 ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
                 ctx.stroke();
             } else {
                 // Side view link (filled rounded rect approximation)
                 ctx.fillStyle = '#95a5a6'; // Darker silver
                 ctx.beginPath();
                 ctx.roundRect(-6, -2, 12, 4, 2);
                 ctx.fill();
             }
             
             ctx.restore();
         }

    } else if (config.id === 'chevron') {
         // Directional Arrows
         ctx.shadowBlur = 5;
         ctx.shadowColor = config.color;
         ctx.strokeStyle = config.color;
         ctx.lineWidth = 2;
         
         for (let i = 0; i < player.trail.length - 1; i+=2) { 
            const p1 = player.trail[i];
            const p2 = player.trail[i+1];
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            
            ctx.save();
            ctx.translate(p1.x, p1.y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(-5, -5);
            ctx.lineTo(0, 0);
            ctx.lineTo(-5, 5);
            ctx.stroke();
            ctx.restore();
        }

    } else if (config.id === 'glitch') {
         ctx.shadowBlur = 5;
         ctx.shadowColor = '#ff0055';
         ctx.lineWidth = visualRadius * 0.5;
         
         ctx.beginPath();
         ctx.moveTo(player.trail[0].x, player.trail[0].y);
         for(let i=1; i<player.trail.length; i++) {
             const p = player.trail[i];
             // Glitch offset
             const offX = Math.random() > 0.8 ? (Math.random()-0.5)*15 : 0;
             const offY = Math.random() > 0.8 ? (Math.random()-0.5)*15 : 0;
             ctx.lineTo(p.x + offX, p.y + offY);
         }
         ctx.lineTo(player.x, player.y);
         
         ctx.strokeStyle = `rgba(255, 0, 85, 0.8)`;
         ctx.stroke();

         // Secondary chromatic aberration line
         ctx.beginPath();
         ctx.moveTo(player.trail[0].x + 4, player.trail[0].y);
         for(let i=1; i<player.trail.length; i++) {
             ctx.lineTo(player.trail[i].x + 4, player.trail[i].y);
         }
         ctx.lineTo(player.x + 4, player.y);
         ctx.strokeStyle = `rgba(0, 255, 255, 0.5)`;
         ctx.stroke();

    } else if (config.id === 'lightning') {
         // Lightning effect: Blue glow, white core, random jitter every frame
         ctx.shadowBlur = 15;
         ctx.shadowColor = config.color;
         ctx.strokeStyle = config.color;
         ctx.lineWidth = visualRadius * 0.4;
         
         ctx.beginPath();
         ctx.moveTo(player.trail[0].x, player.trail[0].y);
         
         // Use a fixed seed-like jitter based on time so it crackles
         // Actually, just random is fine for "crackle" effect on canvas clear
         for(let i=1; i<player.trail.length; i++) {
             const p = player.trail[i];
             const ox = (Math.random() - 0.5) * 12;
             const oy = (Math.random() - 0.5) * 12;
             ctx.lineTo(p.x + ox, p.y + oy);
         }
         ctx.lineTo(player.x, player.y);
         ctx.stroke();
         
         // Inner white core for electricity look
         ctx.shadowBlur = 0;
         ctx.strokeStyle = '#ffffff';
         ctx.lineWidth = visualRadius * 0.15;
         ctx.stroke();

    } else if (config.id === 'matrix') {
        // MATRIX THEME: Stream of characters
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#00ff00';
        
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 1. Draw trail as series of changing characters
        for (let i = 0; i < player.trail.length; i++) {
            const p = player.trail[i];
            const age = i / player.trail.length; // 0 (old) to 1 (new)
            
            // Skip some points to prevent overcrowding
            if (i % 2 !== 0) continue;

            const alpha = age;
            
            // Pseudo-random character based on time+index
            const charIndex = Math.floor((now / 100 + i * 5) % 96);
            const char = String.fromCharCode(0x30A0 + charIndex);
            
            ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
            ctx.fillText(char, p.x, p.y);
            
            // 2. "Digital Rain" effect: Occasional falling char
            // Use pseudo-random check based on time and index
            if ((i + Math.floor(now/300)) % 12 === 0) {
                 const fallSpeed = 0.1; // px per ms
                 const fallDist = ((now * fallSpeed) + (i * 20)) % 80; // Loop 0-80px down
                 const fallAlpha = alpha * (1 - fallDist/80);
                 
                 if (fallAlpha > 0.1) {
                     ctx.fillStyle = `rgba(0, 255, 0, ${fallAlpha})`;
                     ctx.fillText(char, p.x, p.y + fallDist);
                 }
            }
        }
        
        // 3. Faint connecting line
        ctx.strokeStyle = `rgba(0, 255, 0, 0.2)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(player.trail[0].x, player.trail[0].y);
        for(let i=1; i<player.trail.length; i++) {
             ctx.lineTo(player.trail[i].x, player.trail[i].y);
        }
        ctx.lineTo(player.x, player.y);
        ctx.stroke();

    } else if (config.id === 'fortune') {
        // FORTUNE THEME: Falling coins
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#f1c40f';
        
        for (let i = 0; i < player.trail.length; i++) {
            const p = player.trail[i];
            const age = i / player.trail.length;
            
            // Skip points to space out coins
            if (i % 3 !== 0) continue;

            // Coin falling effect
            const fallSpeed = 0.05;
            const fallDist = ((now * fallSpeed) + (i * 10)) % 40;
            const alpha = age * (1 - fallDist/40);
            
            if (alpha > 0.1) {
                ctx.fillStyle = `rgba(241, 196, 15, ${alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y + fallDist, 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Inner shine
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
                ctx.beginPath();
                ctx.arc(p.x - 1, p.y + fallDist - 1, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }

    } else {
        // Standard Line-based trails (Default, Solid Colors, Dashed, Dotted, Rainbow, Plasma)
        
        if (config.id === 'dashed') {
             ctx.setLineDash([15, 15]);
             ctx.lineDashOffset = -now / 10;
        } else if (config.id === 'dotted') {
             ctx.setLineDash([visualRadius/2, visualRadius * 1.5]);
             ctx.lineCap = 'round';
             ctx.lineDashOffset = -now / 10;
        }
        
        ctx.beginPath();
        ctx.moveTo(player.trail[0].x, player.trail[0].y);
        for (let i = 1; i < player.trail.length; i++) {
            ctx.lineTo(player.trail[i].x, player.trail[i].y);
        }
        ctx.lineTo(player.x, player.y);

        ctx.lineWidth = visualRadius * 0.8;
        
        if (config.id === 'rainbow') {
            const gradient = ctx.createLinearGradient(
                player.trail[0].x, player.trail[0].y, 
                player.x, player.y
            );
            for(let i=0; i<=1; i+=0.1) {
                const hue = (now / 5 + i * 360) % 360;
                gradient.addColorStop(i, `hsla(${hue}, 100%, 50%, ${0.2 + i*0.6})`);
            }
            ctx.strokeStyle = gradient;
            ctx.shadowColor = `hsl(${(now / 5) % 360}, 100%, 50%)`;
            ctx.shadowBlur = 15;
            ctx.stroke();

        } else if (config.id === 'plasma') {
            ctx.shadowBlur = 20 + Math.sin(now/100) * 10;
            ctx.shadowColor = config.color;
            ctx.lineWidth = visualRadius * (0.5 + Math.sin(now/50)*0.3); // Pulsing width
            
            const gradient = ctx.createLinearGradient(
                player.trail[0].x, player.trail[0].y, 
                player.x, player.y
            );
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, config.color);
            ctx.strokeStyle = gradient;
            ctx.stroke();

        } else {
            // Solid or Dashed or Dotted
            const gradient = ctx.createLinearGradient(
                player.trail[0].x, player.trail[0].y, 
                player.x, player.y
            );
            
            const c = config.color; 
            gradient.addColorStop(0, `${c}00`); // 0 opacity
            gradient.addColorStop(1, `${c}99`); // High opacity
            
            ctx.strokeStyle = gradient;
            ctx.shadowBlur = 15;
            ctx.shadowColor = config.color;
            ctx.stroke();
        }
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
      // Dynamic metallic shine - slowed down
      const shineAngle = (now / 2000) % (Math.PI * 2);
      const grad = ctx.createLinearGradient(
          -visualRadius * Math.cos(shineAngle), -visualRadius * Math.sin(shineAngle),
          visualRadius * Math.cos(shineAngle), visualRadius * Math.sin(shineAngle)
      );
      
      // Gold palette - more contrast
      grad.addColorStop(0, '#8a6e2f'); // Darker gold
      grad.addColorStop(0.4, '#e6c96a'); // Medium
      grad.addColorStop(0.5, '#fffae0'); // Highlight
      grad.addColorStop(0.6, '#e6c96a'); // Medium
      grad.addColorStop(1, '#8a6e2f'); // Darker gold
      
      ctx.fillStyle = grad;
      
      // Specular highlight - subtle pulse
      ctx.save();
      ctx.beginPath();
      const pulse = 1 + Math.sin(now / 500) * 0.1;
      ctx.arc(-visualRadius * 0.3, -visualRadius * 0.3, visualRadius * 0.4 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.filter = 'blur(5px)';
      ctx.fill();
      ctx.restore();


  } else if (skin.id === 'saucer') {
      const grad = ctx.createLinearGradient(0, -visualRadius, 0, visualRadius);
      grad.addColorStop(0, '#e0e0e0');
      grad.addColorStop(0.5, '#a0a0a0');
      grad.addColorStop(1, '#808080');
      ctx.fillStyle = grad;
  } else if (skin.id === 'ghost') {
      ctx.globalAlpha = 0.4 + Math.sin(now / 300) * 0.2;
      ctx.fillStyle = '#a0d8ef';
  } else if (skin.id === 'glitch') {
      // Glitch effect: flickering colors
      ctx.fillStyle = Math.random() > 0.8 ? '#00ffff' : '#ff0055';
  } else if (skin.type === 'animated') {
      ctx.fillStyle = `hsl(${(now / 10) % 360}, 70%, 50%)`;
  } else if (skin.type === 'pattern') {
      const patternSize = 10;
      // const off = (now / 50) % patternSize; // Unused
      const c = skin.themeColor || '#34495e';
      const grad = ctx.createLinearGradient(-visualRadius, -visualRadius, visualRadius, visualRadius);
      grad.addColorStop(0, c);
      grad.addColorStop(0.5, '#ffffff'); // Shine
      grad.addColorStop(1, c);
      ctx.fillStyle = grad;
  } else {
      ctx.fillStyle = skin.themeColor || COLORS.PLAYER;
  }

  ctx.beginPath();
  const r = visualRadius;
  
  // Shape Drawing
  if (skin.id === 'glitch') {
      const segments = 8;
      for(let i=0; i<segments; i++) {
          const angle1 = (i/segments) * Math.PI * 2;
          const angle2 = ((i+1)/segments) * Math.PI * 2;
          const jitter = Math.random() > 0.7 ? (1 + (Math.random()-0.5)*0.4) : 1;
          ctx.moveTo(0,0);
          ctx.lineTo(Math.cos(angle1) * r * jitter, Math.sin(angle1) * r * jitter);
          ctx.lineTo(Math.cos(angle2) * r * jitter, Math.sin(angle2) * r * jitter);
      }
  } else {
      switch(skin.shape) {
          case 'fighter':
              ctx.moveTo(0, -r * 1.2);
              ctx.lineTo(-r * 0.8, r * 0.8);
              ctx.lineTo(0, r * 0.4);
              ctx.lineTo(r * 0.8, r * 0.8);
              break;
          case 'bomber':
              ctx.moveTo(0, -r * 0.8);
              ctx.lineTo(-r * 1.2, r * 0.4);
              ctx.lineTo(-r * 0.4, r * 1.2);
              ctx.lineTo(r * 0.4, r * 1.2);
              ctx.lineTo(r * 1.2, r * 0.4);
              break;
          case 'circle':
              ctx.arc(0, 0, r, 0, Math.PI * 2);
              break;
          case 'shard':
              for(let i=0; i<6; i++) {
                  const angle = (i / 6) * Math.PI * 2;
                  const dist = i % 2 === 0 ? r : r * 0.6;
                  ctx.lineTo(Math.cos(angle) * dist, Math.sin(angle) * dist);
              }
              break;
          case 'saucer':
              // Main body
              ctx.ellipse(0, 0, r * 1.5, r * 0.6, 0, 0, Math.PI * 2);
              // Cockpit
              ctx.moveTo(-r*0.5, -r*0.5);
              ctx.arc(0, -r*0.5, r*0.5, Math.PI, 0);
              break;
          case 'viper':
              ctx.moveTo(0, -r * 1.3); // Nose
              ctx.lineTo(-r * 0.9, r * 0.5); // Left wing back
              ctx.lineTo(-r * 0.4, r * 0.3); // Left engine indent
              ctx.lineTo(-r * 0.4, r * 1.1); // Left engine back
              ctx.lineTo(0, r * 0.8);
              ctx.lineTo(r * 0.4, r * 1.1); // Right engine back
              ctx.lineTo(r * 0.4, r * 0.3); // Right engine indent
              ctx.lineTo(r * 0.9, r * 0.5); // Right wing back
              break;
          case 'ghost':
              // Same as fighter but will be transparent due to fill style
              ctx.moveTo(0, -r * 1.2);
              ctx.lineTo(-r * 0.8, r * 0.8);
              ctx.lineTo(0, r * 0.4);
              ctx.lineTo(r * 0.8, r * 0.8);
              break;
          default: // triangle
              ctx.moveTo(0, -r);
              ctx.lineTo(-r, r);
              ctx.lineTo(r, r);
      }
  }
  
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Pattern overlay for 'pattern' type (Clipped to ship shape)
  if (skin.type === 'pattern') {
      ctx.save();
      ctx.shadowBlur = 0; // No shadow for pattern
      ctx.clip(); // Clip to the current path (ship shape)

      if (skin.id === 'hex') {
          // Hexagon Pattern
          const hexSize = 8;
          ctx.strokeStyle = 'rgba(0,0,0,0.3)';
          ctx.lineWidth = 1;
          
          // Draw a grid of hexes
          for(let y = -r; y < r; y += hexSize * 0.866) { // sin(60)
              const offset = (Math.floor(y / (hexSize * 0.866)) % 2 === 0) ? 0 : hexSize * 0.5;
              for(let x = -r; x < r; x += hexSize) {
                  ctx.beginPath();
                  for(let i=0; i<6; i++) {
                      const angle = (i/6) * Math.PI * 2;
                      const hx = (x + offset) + Math.cos(angle) * (hexSize * 0.55);
                      const hy = y + Math.sin(angle) * (hexSize * 0.55);
                      if (i===0) ctx.moveTo(hx, hy);
                      else ctx.lineTo(hx, hy);
                  }
                  ctx.closePath();
                  ctx.stroke();
              }
          }
      } else if (skin.id === 'circuit') {
          // Circuit Board Pattern
          ctx.strokeStyle = skin.themeColor || '#00ff00';
          ctx.lineWidth = 1;
          ctx.lineCap = 'round';
          
          // Draw a grid-like circuit pattern
          const step = 6;
          for(let i = -r; i < r; i += step) {
              if (Math.random() > 0.6) {
                  ctx.beginPath();
                  ctx.moveTo(i, -r);
                  ctx.lineTo(i, r);
                  ctx.stroke();
              }
              if (Math.random() > 0.6) {
                  ctx.beginPath();
                  ctx.moveTo(-r, i);
                  ctx.lineTo(r, i);
                  ctx.stroke();
              }
          }

          // Random nodes and components
          for(let i = 0; i < 12; i++) {
              const nx = (Math.random() - 0.5) * r * 1.5;
              const ny = (Math.random() - 0.5) * r * 1.5;
              
              if (Math.random() > 0.5) {
                  // Node dot
                  ctx.fillStyle = skin.themeColor || '#00ff00';
                  ctx.beginPath();
                  ctx.arc(nx, ny, 1.5, 0, Math.PI * 2);
                  ctx.fill();
              } else {
                  // Small chip
                  ctx.fillStyle = '#111';
                  ctx.fillRect(nx - 2, ny - 2, 4, 4);
                  ctx.strokeStyle = skin.themeColor || '#00ff00';
                  ctx.strokeRect(nx - 2, ny - 2, 4, 4);
              }
          }
      } else if (skin.id === 'zebra') {
          // Zebra Stripes
          ctx.fillStyle = '#000000';
          
          // Draw irregular stripes
          // Use a larger range to ensure coverage
          for(let i = -r * 1.5; i < r * 1.5; i += 8) {
              ctx.beginPath();
              // Wobbly stripe
              const w = 3 + Math.sin(i * 0.5) * 1.5;
              const tilt = i * 0.2; // Slight diagonal tilt
              
              // Ensure we draw well outside the clip area so no connecting lines are visible
              ctx.moveTo(i + tilt, -r * 2);
              ctx.lineTo(i + w + tilt, -r * 2);
              ctx.lineTo(i + w - tilt, r * 2);
              ctx.lineTo(i - tilt, r * 2);
              ctx.fill();
          }
      } else {
          // Default Shard/Stripes
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          ctx.lineWidth = 2;
          for(let i=-r*2; i<r*2; i+=8) {
              ctx.beginPath();
              ctx.moveTo(i, -r);
              ctx.lineTo(i + r, r);
              ctx.stroke();
          }
      }
      ctx.restore();
  }

  // Saucer lights
  if (skin.id === 'saucer') {
      const lightCount = 8;
      const speed = now / 200;
      for(let i=0; i<lightCount; i++) {
          const angle = (i / lightCount) * Math.PI * 2 + speed;
          // Elliptical path for the rim
          const lx = Math.cos(angle) * r * 1.4; 
          const ly = Math.sin(angle) * r * 0.5;
          
          ctx.beginPath();
          ctx.arc(lx, ly, 2, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? '#ff0000' : '#00ff00';
          ctx.fill();
      }
  }

  // Additional effect for Saucer (sweeping light + rim lights)
  if (skin.id === 'saucer') {
      const beamAngle = (now / 500) % (Math.PI * 2);
      const grad = ctx.createLinearGradient(0,0, Math.cos(beamAngle) * r, Math.sin(beamAngle) * r);
      grad.addColorStop(0, 'rgba(255,255,255,0.5)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r*1.4, beamAngle - 0.2, beamAngle + 0.2);
      ctx.stroke();
  }
  
  // Ghost Afterimages
  if (skin.id === 'ghost') {
      // We can't easily draw afterimages without history here, but we can draw a "echo"
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.scale(1.2, 1.2);
      ctx.strokeStyle = '#a0d8ef';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
  }

  ctx.restore();
  
  // Reset shadow for subsequent draws
  ctx.shadowBlur = 0;
};

export const drawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
  particles.forEach(p => {
    ctx.fillStyle = p.color || '#ff4444';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1; // Thinner stroke for particles
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();
  });
};

export const drawHitbox = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
  ctx.fill();
  ctx.restore();
};
