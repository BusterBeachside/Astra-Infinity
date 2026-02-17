
import { Star, GameState } from '../types';
import { COLORS } from '../constants';

// Connecting Dots (Network) effect for Splash
export const drawNetworkBackground = (ctx: CanvasRenderingContext2D, stars: Star[], width: number, height: number, dt: number) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    
    // Update and draw stars as "nodes"
    const threshold = 100;

    stars.forEach((s, i) => {
        // Float logic
        // s.speed is now px/sec (approx 60-240). 
        // Previously s.speed was px/frame (1-4) and we moved s.speed * 0.2 per frame.
        // To maintain roughly similar speed visual:
        // New move = speed(px/sec) * dt * 0.2
        s.y -= s.speed * dt * 0.2; 
        
        if (s.y < 0) { s.y = height; s.x = Math.random() * width; }
        
        ctx.fillStyle = "rgba(46, 204, 113, 0.5)"; // Greenish
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Connect
        for (let j = i + 1; j < stars.length; j++) {
            const s2 = stars[j];
            const dx = s.x - s2.x;
            const dy = s.y - s2.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < threshold) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(46, 204, 113, ${0.2 * (1 - dist / threshold)})`;
                ctx.lineWidth = 1;
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s2.x, s2.y);
                ctx.stroke();
            }
        }
    });
};

// Warp Speed effect for Main Menu (if needed later) or Light Speed intro
export const drawWarpBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // This is a high-speed radial blur effect
    const cx = width / 2;
    const cy = height / 2;
    const time = Date.now();

    // Composite operation to blend trails
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < 40; i++) {
        const angle = (i / 40) * Math.PI * 2;
        const speed = (Math.sin(time * 0.02 + i) + 2) * 200;
        const length = (Math.cos(time * 0.01 + i) + 2) * 100;
        
        // Offset start from center based on time to simulate travel
        const travel = (time * 2 + i * 100) % (Math.max(width, height));
        
        const x = cx + Math.cos(angle) * travel;
        const y = cy + Math.sin(angle) * travel;

        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;

        const grad = ctx.createLinearGradient(x, y, endX, endY);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.5, 'rgba(100, 200, 255, 0.8)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2 + Math.random() * 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
    
    // Flash Overlay
    ctx.globalCompositeOperation = 'source-over';
    const flash = (Math.sin(time / 50) + 1) / 2;
    ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.1})`;
    ctx.fillRect(0, 0, width, height);
};

export const drawStars = (ctx: CanvasRenderingContext2D, stars: Star[], height: number) => {
  ctx.fillStyle = "white";
  stars.forEach(s => {
    ctx.globalAlpha = s.size / 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
};

export const drawFloor = (ctx: CanvasRenderingContext2D, gameState: GameState) => {
  const { width, height, compressionState, compressionProgress } = gameState;

  // Warning Overlay
  if (compressionState === 1) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(0, height * 0.8, width, height * 0.2);
  }

  // Active Rising Spikes
  if (compressionState === 2) {
    const maxSpikeH = height * 0.2;
    const currentSpikeH = maxSpikeH * compressionProgress;
    const floorY = height - currentSpikeH;

    ctx.fillStyle = 'white';
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x + 20, floorY);
      ctx.lineTo(x + 40, height);
      ctx.fill();
    }
  }
};
