
import React from 'react';
import { SKIN_CONFIG, COLORS } from '../../constants';
import { ShipRenderer } from './ShipRenderer';

import { User } from 'lucide-react';

interface AvatarIconProps {
    avatarId: string;
    avatarUrl?: string;
    size?: number;
    className?: string;
}

export const AvatarIcon: React.FC<AvatarIconProps> = ({ avatarId, avatarUrl, size = 32, className = "" }) => {
    // Check if it's a ship skin
    const skin = SKIN_CONFIG.find(s => s.id === avatarId);
    
    if (skin) {
        return (
            <div 
                className={`flex items-center justify-center rounded-full bg-black/60 border border-white/20 ${className}`}
                style={{ width: size, height: size }}
            >
                <ShipRenderer skinId={skin.id} size={size} />
            </div>
        );
    }

    if (avatarUrl && !avatarId) {
        return (
            <div 
                className={`flex items-center justify-center rounded-full overflow-hidden bg-black/60 border border-white/20 ${className}`}
                style={{ width: size, height: size }}
            >
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
        );
    }

    // Check if it's an enemy
    switch (avatarId) {
        case 'enemy_normal':
            return (
                <div className={`flex items-center justify-center rounded-full bg-black/40 border border-white/10 ${className}`} style={{ width: size, height: size }}>
                    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 40 40">
                        <polygon points="20,35 5,5 35,5" fill={COLORS.SPIKE} />
                    </svg>
                </div>
            );
        case 'enemy_diagonal':
            return (
                <div className={`flex items-center justify-center rounded-full bg-black/40 border border-white/10 ${className}`} style={{ width: size, height: size }}>
                    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 40 40">
                        <polygon points="20,35 5,5 35,5" fill={COLORS.DIAGONAL} transform="rotate(45 20 20)" />
                    </svg>
                </div>
            );
        case 'enemy_seeker':
            return (
                <div className={`flex items-center justify-center rounded-full bg-black/40 border border-white/10 ${className}`} style={{ width: size, height: size }}>
                    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 40 40">
                        <polygon points="20,35 5,5 35,5" fill={COLORS.SEEKER} />
                    </svg>
                </div>
            );
        case 'enemy_side_seeker':
            return (
                <div className={`flex items-center justify-center rounded-full bg-black/40 border border-white/10 ${className}`} style={{ width: size, height: size }}>
                    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 40 40">
                        <polygon points="5,20 35,5 35,35" fill={COLORS.SEEKER} stroke="#f1c40f" strokeWidth="2" />
                    </svg>
                </div>
            );
        case 'enemy_titan':
            return (
                <div className={`flex items-center justify-center rounded-full bg-black/40 border border-white/10 ${className}`} style={{ width: size, height: size }}>
                    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 40 40">
                        <polygon points="20,5 5,35 35,35" fill={COLORS.TITAN} />
                        <polygon points="20,5 5,35 35,35" fill="none" stroke="#ff0000" strokeWidth="2" />
                    </svg>
                </div>
            );
        case 'enemy_spikes':
            return (
                <div className={`flex items-center justify-center rounded-full bg-black/40 border border-white/10 ${className}`} style={{ width: size, height: size }}>
                    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 40 40">
                        <path d="M0,40 L10,10 L20,40 L30,10 L40,40 Z" fill="#ffffff" />
                    </svg>
                </div>
            );
        case 'enemy_titan_explosion':
            return (
                <div className={`flex items-center justify-center rounded-full bg-black/40 border border-white/10 ${className}`} style={{ width: size, height: size }}>
                    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="18" fill="none" stroke={COLORS.TITAN} strokeWidth="2" strokeDasharray="4 2" />
                        <circle cx="20" cy="20" r="8" fill={COLORS.TITAN} />
                    </svg>
                </div>
            );
        default:
            return (
                <div className={`flex items-center justify-center rounded-full bg-black/60 border border-white/20 ${className}`} style={{ width: size, height: size }}>
                    <User className="w-1/2 h-1/2 text-gray-600" />
                </div>
            );
    }
};
