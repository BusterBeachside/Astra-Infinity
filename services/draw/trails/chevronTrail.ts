import { Player } from '../../../types';

export const drawChevronTrail = (ctx: CanvasRenderingContext2D, player: Player, color: string) => {
    // Directional Arrows
    ctx.shadowBlur = 5;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
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
};
