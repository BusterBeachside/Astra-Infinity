import { COLORS } from '../../../constants';

export const getStandardFillStyle = (ctx: CanvasRenderingContext2D, skin: any, visualRadius: number) => {
    const now = Date.now();
    if (skin.type === 'animated') {
        return `hsl(${(now / 10) % 360}, 70%, 50%)`;
    } else {
        return skin.themeColor || COLORS.PLAYER;
    }
};

export const drawStandardShape = (ctx: CanvasRenderingContext2D, skin: any, visualRadius: number) => {
    const r = visualRadius;
    switch(skin.shape) {
        case 'fighter':
            ctx.moveTo(0, -r * 1.2);
            ctx.lineTo(-r * 0.8, r * 0.8);
            ctx.lineTo(0, r * 0.4);
            ctx.lineTo(r * 0.8, r * 0.8);
            break;
        case 'bomber':
            ctx.moveTo(0, -r * 0.8);
            ctx.lineTo(-r * 1.2, r * 0.4);
            ctx.lineTo(-r * 0.4, r * 1.2);
            ctx.lineTo(r * 0.4, r * 1.2);
            ctx.lineTo(r * 1.2, r * 0.4);
            break;
        case 'circle':
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            break;
        case 'shard':
            for(let i=0; i<6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const dist = i % 2 === 0 ? r : r * 0.6;
                ctx.lineTo(Math.cos(angle) * dist, Math.sin(angle) * dist);
            }
            break;
        case 'saucer':
            // Main body
            ctx.ellipse(0, 0, r * 1.5, r * 0.6, 0, 0, Math.PI * 2);
            // Cockpit
            ctx.moveTo(-r*0.5, -r*0.5);
            ctx.arc(0, -r*0.5, r*0.5, Math.PI, 0);
            break;
        case 'viper':
            ctx.moveTo(0, -r * 1.3); // Nose
            ctx.lineTo(-r * 0.9, r * 0.5); // Left wing back
            ctx.lineTo(-r * 0.4, r * 0.3); // Left engine indent
            ctx.lineTo(-r * 0.4, r * 1.1); // Left engine back
            ctx.lineTo(0, r * 0.8);
            ctx.lineTo(r * 0.4, r * 1.1); // Right engine back
            ctx.lineTo(r * 0.4, r * 0.3); // Right engine indent
            ctx.lineTo(r * 0.9, r * 0.5); // Right wing back
            break;
        case 'interceptor':
            ctx.moveTo(0, -r * 1.4); // Long nose
            ctx.lineTo(-r * 0.3, -r * 0.2); // Left neck
            ctx.lineTo(-r * 1.2, r * 0.6); // Left wing tip
            ctx.lineTo(-r * 0.4, r * 0.4); // Left wing back
            ctx.lineTo(-r * 0.4, r * 1.2); // Left engine
            ctx.lineTo(0, r * 0.9);
            ctx.lineTo(r * 0.4, r * 1.2); // Right engine
            ctx.lineTo(r * 0.4, r * 0.4); // Right wing back
            ctx.lineTo(r * 1.2, r * 0.6); // Right wing tip
            ctx.lineTo(r * 0.3, -r * 0.2); // Right neck
            break;
        case 'ghost':
            // Same as fighter but will be transparent due to fill style
            ctx.moveTo(0, -r * 1.2);
            ctx.lineTo(-r * 0.8, r * 0.8);
            ctx.lineTo(0, r * 0.4);
            ctx.lineTo(r * 0.8, r * 0.8);
            break;
        default: // triangle
            ctx.moveTo(0, -r);
            ctx.lineTo(-r, r);
            ctx.lineTo(r, r);
    }
};
