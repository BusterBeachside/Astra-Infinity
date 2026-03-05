import { Player } from '../../../types';
import { VisualRNG } from '../../rng';

export const drawLightningTrail = (ctx: CanvasRenderingContext2D, player: Player, visualRadius: number, color: string) => {
    // Lightning effect: Blue glow, white core, random jitter every frame
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = visualRadius * 0.4;
    
    ctx.beginPath();
    ctx.moveTo(player.trail[0].x, player.trail[0].y);
    
    // Use a fixed seed-like jitter based on time so it crackles
    // Actually, just random is fine for "crackle" effect on canvas clear
    for(let i=1; i<player.trail.length; i++) {
        const p = player.trail[i];
        const ox = (VisualRNG.random() - 0.5) * 12;
        const oy = (VisualRNG.random() - 0.5) * 12;
        ctx.lineTo(p.x + ox, p.y + oy);
    }
    ctx.lineTo(player.x, player.y);
    ctx.stroke();
    
    // Inner white core for electricity look
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = visualRadius * 0.15;
    ctx.stroke();
};
