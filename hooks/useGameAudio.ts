import { useEffect, useRef } from 'react';
import { audioManager } from '../services/audioManager';

export const useGameAudio = (
    settings: any // Using any to avoid circular dependency if settings type is complex, but ideally GameSettings
) => {
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            audioManager.init();
            initialized.current = true;
        }
        
        // Update audio manager settings when settings change
        // Assuming audioManager has methods to set volume/mute
        // audioManager.setMute(!settings.soundEnabled); 
        // (Implementation depends on audioManager capabilities)
    }, [settings]);

    const resumeAudio = () => {
        if (audioManager.context.state === 'suspended') {
            audioManager.context.resume();
        }
    };

    return { resumeAudio };
};
