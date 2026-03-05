import { Player } from '../../../types';

export const drawRailTrail = (ctx: CanvasRenderingContext2D, player: Player, visualRadius: number, color: string) => {
    // Hyper Rail: Outer shell + Inner Core
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    
    // Outer
    ctx.beginPath();
    ctx.moveTo(player.trail[0].x, player.trail[0].y);
    for(let i=1; i<player.trail.length; i++) {
        ctx.lineTo(player.trail[i].x, player.trail[i].y);
    }
    ctx.lineTo(player.x, player.y);
    ctx.lineWidth = visualRadius;
    ctx.strokeStyle = color;
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
};
