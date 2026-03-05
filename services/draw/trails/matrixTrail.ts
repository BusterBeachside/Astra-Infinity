import { Player } from '../../../types';

export const drawMatrixTrail = (ctx: CanvasRenderingContext2D, player: Player) => {
    const now = Date.now();
    // MATRIX THEME: Stream of characters
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#00ff00';
    
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 1. Draw trail as series of changing characters
    for (let i = 0; i < player.trail.length; i++) {
        const p = player.trail[i];
        const age = i / player.trail.length; // 0 (old) to 1 (new)
        
        // Skip some points to prevent overcrowding
        if (i % 2 !== 0) continue;

        const alpha = age;
        
        // Pseudo-random character based on time+index
        const charIndex = Math.floor((now / 100 + i * 5) % 96);
        const char = String.fromCharCode(0x30A0 + charIndex);
        
        ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
        ctx.fillText(char, p.x, p.y);
        
        // 2. "Digital Rain" effect: Occasional falling char
        // Use pseudo-random check based on time and index
        if ((i + Math.floor(now/300)) % 12 === 0) {
             const fallSpeed = 0.1; // px per ms
             const fallDist = ((now * fallSpeed) + (i * 20)) % 80; // Loop 0-80px down
             const fallAlpha = alpha * (1 - fallDist/80);
             
             if (fallAlpha > 0.1) {
                 ctx.fillStyle = `rgba(0, 255, 0, ${fallAlpha})`;
                 ctx.fillText(char, p.x, p.y + fallDist);
             }
        }
    }
    
    // 3. Faint connecting line
    ctx.strokeStyle = `rgba(0, 255, 0, 0.2)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(player.trail[0].x, player.trail[0].y);
    for(let i=1; i<player.trail.length; i++) {
         ctx.lineTo(player.trail[i].x, player.trail[i].y);
    }
    ctx.lineTo(player.x, player.y);
    ctx.stroke();
};
