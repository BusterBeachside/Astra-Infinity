
import React from 'react';
import { DeathRecord } from '../../types';

interface HeatmapOverlayProps {
    deaths: DeathRecord[];
    showNormal: boolean;
    showHardcore: boolean;
    width: number;
    height: number;
}

const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({ deaths, showNormal, showHardcore, width, height }) => {
    const filteredDeaths = deaths.filter(d => {
        if (d.mode === 'normal' && showNormal) return true;
        if (d.mode === 'hardcore' && showHardcore) return true;
        return false;
    });

    return (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            <svg width={width} height={height} className="opacity-60">
                <defs>
                    <radialGradient id="gradNormal">
                        <stop offset="0%" stopColor="#2ecc71" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#2ecc71" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="gradHardcore">
                        <stop offset="0%" stopColor="#e74c3c" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#e74c3c" stopOpacity="0" />
                    </radialGradient>
                </defs>
                {filteredDeaths.map((d, i) => (
                    <circle 
                        key={i}
                        cx={d.x}
                        cy={d.y}
                        r={15}
                        fill={d.mode === 'normal' ? 'url(#gradNormal)' : 'url(#gradHardcore)'}
                    />
                ))}
            </svg>
        </div>
    );
};

export default HeatmapOverlay;
