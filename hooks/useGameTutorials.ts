import { GameState, UserProgress } from '../types';
import { audioManager } from '../services/audioManager';
import { tutorialService } from '../services/tutorialService';

interface UseGameTutorialsProps {
    userProgressRef: React.MutableRefObject<UserProgress>;
    setUserProgress: (p: UserProgress) => void;
    activeTutorial: any;
    setActiveTutorial: (t: any) => void;
    setUiState: (s: any) => void;
}

export const useGameTutorials = ({
    userProgressRef,
    setUserProgress,
    activeTutorial,
    setActiveTutorial,
    setUiState
}: UseGameTutorialsProps) => {
    const checkTutorials = (gs: GameState) => {
        // Only show in-game tutorials in dedicated 'tutorial' mode
        if (gs.gameMode !== 'tutorial' || gs.isPaused || activeTutorial || gs.isReplay) return;
  
        const progress = userProgressRef.current;
        const seen = progress.tutorialsSeen || {};
        
        // Use session-based tracking for tutorial mode so they repeat every time the mode is entered
        if (!gs.seenTutorials) gs.seenTutorials = [];
        const seenIds = new Set(gs.seenTutorials);

        const nextStep = tutorialService.getNextStep(gs, seenIds);
  
        if (nextStep) {
            gs.isPaused = true;
            gs.pauseStartTime = Date.now();
            setUiState((prev: any) => ({ ...prev, isPaused: true }));
            
            setActiveTutorial({ 
                id: nextStep.id, 
                title: nextStep.title, 
                message: nextStep.message,
                nextTimeJump: nextStep.nextTimeJump,
                spawnPowerup: (nextStep as any).spawnPowerup
            });
            
            // Track in session
            gs.seenTutorials.push(nextStep.id);
            
            // Do NOT save in-game tutorials to persistent progress anymore
            // Only menu tutorials (handled elsewhere) should be saved
            
            audioManager.playSfx('menu_open'); 
        }
    };

    return { checkTutorials };
};
