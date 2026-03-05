export const drawSaucerSkin = (ctx: CanvasRenderingContext2D, visualRadius: number) => {
    const grad = ctx.createLinearGradient(0, -visualRadius, 0, visualRadius);
    grad.addColorStop(0, '#e0e0e0');
    grad.addColorStop(0.5, '#a0a0a0');
    grad.addColorStop(1, '#808080');
    ctx.fillStyle = grad;
};

export const drawSaucerLights = (ctx: CanvasRenderingContext2D, visualRadius: number) => {
    const now = Date.now();
    const r = visualRadius;
    const lightCount = 8;
    const speed = now / 200;
    for(let i=0; i<lightCount; i++) {
        const angle = (i / lightCount) * Math.PI * 2 + speed;
        // Elliptical path for the rim
        const lx = Math.cos(angle) * r * 1.4; 
        const ly = Math.sin(angle) * r * 0.5;
        
        ctx.beginPath();
        ctx.arc(lx, ly, 2, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? '#ff0000' : '#00ff00';
        ctx.fill();
    }

    // Additional effect for Saucer (sweeping light + rim lights)
    const beamAngle = (now / 500) % (Math.PI * 2);
    const grad = ctx.createLinearGradient(0,0, Math.cos(beamAngle) * r, Math.sin(beamAngle) * r);
    grad.addColorStop(0, 'rgba(255,255,255,0.5)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r*1.4, beamAngle - 0.2, beamAngle + 0.2);
    ctx.stroke();
};
