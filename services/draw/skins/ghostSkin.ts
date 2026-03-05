export const drawGhostSkin = (ctx: CanvasRenderingContext2D) => {
    const now = Date.now();
    ctx.globalAlpha = 0.4 + Math.sin(now / 300) * 0.2;
    ctx.fillStyle = '#a0d8ef';
};

export const drawGhostAfterimages = (ctx: CanvasRenderingContext2D) => {
    // We can't easily draw afterimages without history here, but we can draw a "echo"
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.scale(1.2, 1.2);
    ctx.strokeStyle = '#a0d8ef';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
};
