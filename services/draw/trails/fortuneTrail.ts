import { Player } from '../../../types';

export const drawFortuneTrail = (ctx: CanvasRenderingContext2D, player: Player) => {
    const now = Date.now();
    // FORTUNE THEME: Falling coins
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#f1c40f';
    
    for (let i = 0; i < player.trail.length; i++) {
        const p = player.trail[i];
        const age = i / player.trail.length;
        
        // Skip points to space out coins
        if (i % 3 !== 0) continue;

        // Coin falling effect
        const fallSpeed = 0.05;
        const fallDist = ((now * fallSpeed) + (i * 10)) % 40;
        const alpha = age * (1 - fallDist/40);
        
        if (alpha > 0.1) {
            ctx.fillStyle = `rgba(241, 196, 15, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y + fallDist, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner shine
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(p.x - 1, p.y + fallDist - 1, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};
