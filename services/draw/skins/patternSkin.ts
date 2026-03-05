
import { drawStandardShape } from './standardSkin';

export const drawPatternSkin = (ctx: CanvasRenderingContext2D, visualRadius: number, skin: any) => {
    const c = skin.themeColor || '#34495e';
    const grad = ctx.createLinearGradient(-visualRadius, -visualRadius, visualRadius, visualRadius);
    grad.addColorStop(0, c);
    grad.addColorStop(0.5, '#ffffff'); // Shine
    grad.addColorStop(1, c);
    ctx.fillStyle = grad;
};

export const drawPatternOverlay = (ctx: CanvasRenderingContext2D, visualRadius: number, skin: any) => {
    const r = visualRadius;
    ctx.save();
    ctx.shadowBlur = 0; // No shadow for pattern
    
    // Explicitly redefine the path for clipping to ensure stability
    ctx.beginPath();
    drawStandardShape(ctx, skin, r);
    ctx.closePath();
    ctx.clip(); // Clip to the current path (ship shape)

    // Seed the RNG with a hash of the skin ID to ensure the pattern is stable across frames
    let seed = 0;
    for (let i = 0; i < skin.id.length; i++) {
        seed = ((seed << 5) - seed) + skin.id.charCodeAt(i);
        seed |= 0; // Convert to 32bit integer
    }
    
    // Local deterministic RNG for the pattern to avoid affecting global VisualRNG state
    let state = Math.abs(seed) || 12345;
    const localRandom = () => {
        let t = (state += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    if (skin.id === 'hex') {
        // Hexagon Pattern
        const hexSize = 8;
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        
        // Draw a grid of hexes
        for(let y = -r; y < r; y += hexSize * 0.866) { // sin(60)
            const offset = (Math.floor(y / (hexSize * 0.866)) % 2 === 0) ? 0 : hexSize * 0.5;
            for(let x = -r; x < r; x += hexSize) {
                ctx.beginPath();
                for(let i=0; i<6; i++) {
                    const angle = (i/6) * Math.PI * 2;
                    const hx = (x + offset) + Math.cos(angle) * (hexSize * 0.55);
                    const hy = y + Math.sin(angle) * (hexSize * 0.55);
                    if (i===0) ctx.moveTo(hx, hy);
                    else ctx.lineTo(hx, hy);
                }
                ctx.closePath();
                ctx.stroke();
            }
        }
    } else if (skin.id === 'circuit') {
        // Circuit Board Pattern
        ctx.strokeStyle = skin.themeColor || '#00ff00';
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        
        // Draw a grid-like circuit pattern
        const step = 6;
        for(let i = -r; i < r; i += step) {
            if (localRandom() > 0.6) {
                ctx.beginPath();
                ctx.moveTo(i, -r);
                ctx.lineTo(i, r);
                ctx.stroke();
            }
            if (localRandom() > 0.6) {
                ctx.beginPath();
                ctx.moveTo(-r, i);
                ctx.lineTo(r, i);
                ctx.stroke();
            }
        }

        // Random nodes and components
        for(let i = 0; i < 12; i++) {
            const nx = (localRandom() - 0.5) * r * 1.5;
            const ny = (localRandom() - 0.5) * r * 1.5;
            
            if (localRandom() > 0.5) {
                // Node dot
                ctx.fillStyle = skin.themeColor || '#00ff00';
                ctx.beginPath();
                ctx.arc(nx, ny, 1.5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Small chip
                ctx.fillStyle = '#111';
                ctx.fillRect(nx - 2, ny - 2, 4, 4);
                ctx.strokeStyle = skin.themeColor || '#00ff00';
                ctx.strokeRect(nx - 2, ny - 2, 4, 4);
            }
        }
    } else if (skin.id === 'zebra') {
        // Zebra Stripes
        ctx.fillStyle = '#000000';
        
        // Draw irregular stripes
        // Use a larger range to ensure coverage
        for(let i = -r * 1.5; i < r * 1.5; i += 8) {
            ctx.beginPath();
            // Wobbly stripe
            const w = 3 + Math.sin(i * 0.5) * 1.5;
            const tilt = i * 0.2; // Slight diagonal tilt
            
            // Ensure we draw well outside the clip area so no connecting lines are visible
            ctx.moveTo(i + tilt, -r * 2);
            ctx.lineTo(i + w + tilt, -r * 2);
            ctx.lineTo(i + w - tilt, r * 2);
            ctx.lineTo(i - tilt, r * 2);
            ctx.fill();
        }
    } else if (skin.id === 'camo') {
        // Military Camouflage
        const colors = ['#3e4c1e', '#2d3616', '#5d6d31', '#1a1f0c'];
        for (let i = 0; i < 25; i++) {
            ctx.fillStyle = colors[i % colors.length];
            const cx = (localRandom() - 0.5) * r * 2.5;
            const cy = (localRandom() - 0.5) * r * 2.5;
            const size = 4 + localRandom() * 8;
            
            ctx.beginPath();
            // Draw an irregular blob
            for (let a = 0; a < Math.PI * 2; a += 0.5) {
                const dist = size * (0.8 + localRandom() * 0.4);
                const x = cx + Math.cos(a) * dist;
                const y = cy + Math.sin(a) * dist;
                if (a === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
        }
    } else if (skin.id === 'digital') {
        // Digital Camo / Grid
        const colors = ['#2980b9', '#3498db', '#1a5276'];
        const gridSize = 4;
        for (let x = -r * 1.5; x < r * 1.5; x += gridSize) {
            for (let y = -r * 1.5; y < r * 1.5; y += gridSize) {
                if (localRandom() > 0.6) {
                    ctx.fillStyle = colors[Math.floor(localRandom() * colors.length)];
                    ctx.fillRect(x, y, gridSize, gridSize);
                }
            }
        }
    } else if (skin.id === 'carbon') {
        // Carbon Fiber Weave
        ctx.fillStyle = '#111';
        ctx.fillRect(-r * 2, -r * 2, r * 4, r * 4);
        
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        const step = 4;
        for (let i = -r * 2; i < r * 2; i += step) {
            ctx.beginPath();
            ctx.moveTo(i, -r * 2);
            ctx.lineTo(i + r * 4, r * 2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(i, r * 2);
            ctx.lineTo(i + r * 4, -r * 2);
            ctx.stroke();
        }
        
        // Add some highlights
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let i = -r * 2; i < r * 2; i += step * 2) {
            ctx.beginPath();
            ctx.moveTo(i, -r * 2);
            ctx.lineTo(i + r * 4, r * 2);
            ctx.stroke();
        }
    } else {
        // Default Shard/Stripes
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2;
        for(let i=-r*2; i<r*2; i+=8) {
            ctx.beginPath();
            ctx.moveTo(i, -r);
            ctx.lineTo(i + r, r);
            ctx.stroke();
        }
    }
    ctx.restore();
};
