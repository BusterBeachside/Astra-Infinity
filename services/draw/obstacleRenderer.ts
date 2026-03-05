import { Obstacle } from '../../types';
import { COLORS } from '../../constants';

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
