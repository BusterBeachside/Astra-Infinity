
import { Player, Obstacle, PowerUp, Particle } from '../types';
import { COLORS, TRAIL_CONFIG } from '../constants';

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
  } else if (o.type === 'side-seeker') {
    ctx.strokeStyle = COLORS.GOLD;
    ctx.lineWidth = 4;
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

export const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player, visualRadius: number) => {
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
  ctx.beginPath();
  ctx.arc(player.x, player.y, visualRadius, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.PLAYER;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fill();
};

export const drawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
  particles.forEach(p => {
    ctx.fillStyle = '#ff4444';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();
  });
};
