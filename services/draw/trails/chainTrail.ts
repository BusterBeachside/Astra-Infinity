import { Player } from '../../../types';

export const drawChainTrail = (ctx: CanvasRenderingContext2D, player: Player) => {
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
};
