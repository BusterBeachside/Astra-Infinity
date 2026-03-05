import { VisualRNG } from '../../rng';

export const drawGlitchSkin = (ctx: CanvasRenderingContext2D, visualRadius: number) => {
    // Glitch effect: flickering colors
    ctx.fillStyle = VisualRNG.random() > 0.8 ? '#00ffff' : '#ff0055';
    
    ctx.beginPath();
    const r = visualRadius;
    const segments = 8;
    for(let i=0; i<segments; i++) {
        const angle1 = (i/segments) * Math.PI * 2;
        const angle2 = ((i+1)/segments) * Math.PI * 2;
        const jitter = VisualRNG.random() > 0.7 ? (1 + (VisualRNG.random()-0.5)*0.4) : 1;
        ctx.moveTo(0,0);
        ctx.lineTo(Math.cos(angle1) * r * jitter, Math.sin(angle1) * r * jitter);
        ctx.lineTo(Math.cos(angle2) * r * jitter, Math.sin(angle2) * r * jitter);
    }
};
