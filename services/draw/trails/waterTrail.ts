import { Player } from '../../../types';

export const drawWaterTrail = (ctx: CanvasRenderingContext2D, player: Player, visualRadius: number) => {
    const now = Date.now();
    
    // FANCY WATER: Liquid stream with bubbles
    
    // 1. Draw the main fluid body (tapering stream)
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#3498db';
    
    for (let i = 0; i < player.trail.length - 1; i++) {
        const p1 = player.trail[i];
        const p2 = player.trail[i+1];
        const age = i / player.trail.length; // 0 (tail) -> 1 (head)
        
        // Dynamic width: Tapers at tail, bulges with sine wave
        const wave = Math.sin((now / 100) + (i * 0.3));
        const width = (visualRadius * 0.8 * age) + (wave * 2);
        
        ctx.lineWidth = Math.max(1, width);
        ctx.strokeStyle = `rgba(41, 128, 185, ${0.3 + age * 0.5})`; // Deep blue
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    // 2. Draw inner "highlight" stream (lighter cyan)
    ctx.shadowBlur = 0;
    for (let i = 0; i < player.trail.length - 1; i++) {
        const p1 = player.trail[i];
        const p2 = player.trail[i+1];
        const age = i / player.trail.length;
        
        ctx.lineWidth = Math.max(0.5, visualRadius * 0.4 * age);
        ctx.strokeStyle = `rgba(100, 221, 249, ${0.2 + age * 0.6})`; // Cyan
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    // 3. Bubbles / Foam particles
    const bubblesCount = 15;
    for(let j=0; j<bubblesCount; j++) {
        // Create pseudo-random bubbles based on time/index so they "flow"
        // Using modulo to pick specific spots along the trail
        const indexOffset = Math.floor(((now / 50) + (j * 13)) % player.trail.length);
        if(indexOffset < 0 || indexOffset >= player.trail.length) continue;

        const p = player.trail[indexOffset];
        const age = indexOffset / player.trail.length;
        
        // Jitter position
        const jx = Math.sin(now/200 + j) * (visualRadius * 0.6);
        const jy = Math.cos(now/200 + j) * (visualRadius * 0.6);
        
        const bubbleSize = (Math.sin(now/100 + j) + 2) * 2;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${age * 0.8})`;
        ctx.beginPath();
        ctx.arc(p.x + jx, p.y + jy, bubbleSize, 0, Math.PI*2);
        ctx.fill();
    }
};
