import { COLORS } from '../../../constants';

export const drawGoldSkin = (ctx: CanvasRenderingContext2D, visualRadius: number) => {
    const now = Date.now();
    // Dynamic metallic shine - slowed down
    const shineAngle = (now / 2000) % (Math.PI * 2);
    const grad = ctx.createLinearGradient(
        -visualRadius * Math.cos(shineAngle), -visualRadius * Math.sin(shineAngle),
        visualRadius * Math.cos(shineAngle), visualRadius * Math.sin(shineAngle)
    );
    
    // Gold palette - more contrast
    grad.addColorStop(0, '#8a6e2f'); // Darker gold
    grad.addColorStop(0.4, '#e6c96a'); // Medium
    grad.addColorStop(0.5, '#fffae0'); // Highlight
    grad.addColorStop(0.6, '#e6c96a'); // Medium
    grad.addColorStop(1, '#8a6e2f'); // Darker gold
    
    ctx.fillStyle = grad;
    
    // Specular highlight - subtle pulse
    ctx.save();
    ctx.beginPath();
    const pulse = 1 + Math.sin(now / 500) * 0.1;
    ctx.arc(-visualRadius * 0.3, -visualRadius * 0.3, visualRadius * 0.4 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.filter = 'blur(5px)';
    ctx.fill();
    ctx.restore();
};
