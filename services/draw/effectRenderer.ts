import { PowerUp, Particle } from '../../types';

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
