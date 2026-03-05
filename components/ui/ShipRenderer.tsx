
import React, { useEffect, useRef } from 'react';
import { SKIN_CONFIG, COLORS } from '../../constants';
import { drawStandardShape, getStandardFillStyle } from '../../services/draw/skins/standardSkin';
import { drawGoldSkin } from '../../services/draw/skins/goldSkin';
import { drawSaucerSkin, drawSaucerLights } from '../../services/draw/skins/saucerSkin';
import { drawGhostSkin, drawGhostAfterimages } from '../../services/draw/skins/ghostSkin';
import { drawGlitchSkin } from '../../services/draw/skins/glitchSkin';
import { drawPatternSkin, drawPatternOverlay } from '../../services/draw/skins/patternSkin';


interface ShipRendererProps {
    skinId: string;
    size?: number;
    className?: string;
}

export const ShipRenderer: React.FC<ShipRendererProps> = ({ skinId, size = 40, className = "" }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);

    const skin = SKIN_CONFIG.find(s => s.id === skinId) || SKIN_CONFIG[0];

    const render = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const r = size * 0.28;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(centerX, centerY);

        // Glow/Shadow
        const now = Date.now();
        ctx.shadowBlur = 10;
        if (skin.themeColor) {
            ctx.shadowColor = skin.themeColor;
        } else {
            ctx.shadowColor = skin.type === 'animated' ? `hsl(${(now / 10) % 360}, 100%, 50%)` : 'rgba(255,255,255,0.2)';
        }
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;

        // Fill Style
        if (skin.id === 'gold') {
            drawGoldSkin(ctx, r);
        } else if (skin.id === 'saucer') {
            drawSaucerSkin(ctx, r);
        } else if (skin.id === 'ghost') {
            drawGhostSkin(ctx);
        } else if (skin.id === 'glitch') {
            drawGlitchSkin(ctx, r);
        } else if (skin.type === 'pattern') {
            drawPatternSkin(ctx, r, skin);
        } else {
            ctx.fillStyle = getStandardFillStyle(ctx, skin, r);
        }

        // Path logic
        if (skin.id === 'glitch') {
            // Glitch path is handled inside drawGlitchSkin but we need to fill/stroke it
            // Actually drawGlitchSkin in glitchSkin.ts calls beginPath() but doesn't fill/stroke
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.beginPath();
            drawStandardShape(ctx, skin, r);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // Overlays
        if (skin.type === 'pattern') {
            drawPatternOverlay(ctx, r, skin);
        }
        if (skin.id === 'saucer') {
            drawSaucerLights(ctx, r);
        }
        if (skin.id === 'ghost') {
            drawGhostAfterimages(ctx);
        }

        ctx.restore();
        
        if (skin.type === 'animated' || skin.id === 'gold' || skin.id === 'saucer' || skin.id === 'glitch' || skin.id === 'ghost') {
            requestRef.current = requestAnimationFrame(render);
        }
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(requestRef.current);
    }, [skinId, size]);

    return (
        <canvas 
            ref={canvasRef} 
            width={size} 
            height={size} 
            className={className}
            style={{ width: size, height: size }}
        />
    );
};
