import { Player } from '../../../types';

export const drawTronTrail = (ctx: CanvasRenderingContext2D, player: Player, visualRadius: number) => {
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
};
