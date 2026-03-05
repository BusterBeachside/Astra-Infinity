import { Player } from '../../../types';
import { VisualRNG } from '../../rng';

export const drawGlitchTrail = (ctx: CanvasRenderingContext2D, player: Player, visualRadius: number) => {
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#ff0055';
    ctx.lineWidth = visualRadius * 0.5;
    
    ctx.beginPath();
    ctx.moveTo(player.trail[0].x, player.trail[0].y);
    for(let i=1; i<player.trail.length; i++) {
        const p = player.trail[i];
        // Glitch offset
        const offX = VisualRNG.random() > 0.8 ? (VisualRNG.random()-0.5)*15 : 0;
        const offY = VisualRNG.random() > 0.8 ? (VisualRNG.random()-0.5)*15 : 0;
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
};
