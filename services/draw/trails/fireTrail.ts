import { Player } from '../../../types';
import { VisualRNG } from '../../rng';

export const drawFireTrail = (ctx: CanvasRenderingContext2D, player: Player, visualRadius: number) => {
    ctx.lineWidth = visualRadius;
    // Draw particles or distinct segments for fire
    for (let i = 0; i < player.trail.length - 1; i++) {
        const p = player.trail[i];
        const age = i / player.trail.length; // 0 (old) to 1 (new)
        // Jitter
        const jx = (VisualRNG.random() - 0.5) * 5;
        const jy = (VisualRNG.random() - 0.5) * 5;
        
        ctx.beginPath();
        ctx.arc(p.x + jx, p.y + jy, visualRadius * age * 0.8, 0, Math.PI*2);
        // Fire colors: Yellow -> Orange -> Red
        ctx.fillStyle = `hsla(${10 + age * 40}, 100%, 50%, ${age})`; 
        ctx.fill();
    }
};
