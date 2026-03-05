import { Player } from '../../../types';

export const drawStandardTrail = (ctx: CanvasRenderingContext2D, player: Player, visualRadius: number, config: any) => {
    const now = Date.now();
    // Standard Line-based trails (Default, Solid Colors, Dashed, Dotted, Rainbow, Plasma)
    
    if (config.id === 'dashed') {
         ctx.setLineDash([15, 15]);
         ctx.lineDashOffset = -now / 10;
    } else if (config.id === 'dotted') {
         ctx.setLineDash([visualRadius/2, visualRadius * 1.5]);
         ctx.lineCap = 'round';
         ctx.lineDashOffset = -now / 10;
    }
    
    ctx.beginPath();
    ctx.moveTo(player.trail[0].x, player.trail[0].y);
    for (let i = 1; i < player.trail.length; i++) {
        ctx.lineTo(player.trail[i].x, player.trail[i].y);
    }
    ctx.lineTo(player.x, player.y);

    ctx.lineWidth = visualRadius * 0.8;
    
    if (config.id === 'rainbow') {
        const gradient = ctx.createLinearGradient(
            player.trail[0].x, player.trail[0].y, 
            player.x, player.y
        );
        for(let i=0; i<=1; i+=0.1) {
            const hue = (now / 5 + i * 360) % 360;
            gradient.addColorStop(i, `hsla(${hue}, 100%, 50%, ${0.2 + i*0.6})`);
        }
        ctx.strokeStyle = gradient;
        ctx.shadowColor = `hsl(${(now / 5) % 360}, 100%, 50%)`;
        ctx.shadowBlur = 15;
        ctx.stroke();

    } else if (config.id === 'plasma') {
        ctx.shadowBlur = 20 + Math.sin(now/100) * 10;
        ctx.shadowColor = config.color;
        ctx.lineWidth = visualRadius * (0.5 + Math.sin(now/50)*0.3); // Pulsing width
        
        const gradient = ctx.createLinearGradient(
            player.trail[0].x, player.trail[0].y, 
            player.x, player.y
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, config.color);
        ctx.strokeStyle = gradient;
        ctx.stroke();

    } else {
        // Solid or Dashed or Dotted
        const gradient = ctx.createLinearGradient(
            player.trail[0].x, player.trail[0].y, 
            player.x, player.y
        );
        
        const c = config.color; 
        gradient.addColorStop(0, `${c}00`); // 0 opacity
        gradient.addColorStop(1, `${c}99`); // High opacity
        
        ctx.strokeStyle = gradient;
        ctx.shadowBlur = 15;
        ctx.shadowColor = config.color;
        ctx.stroke();
    }
};
