import { useEffect, useCallback } from 'react';
import { GameState, Player, UserProgress, ViewState } from '../types';
import { audioManager } from '../services/audioManager';

interface UseGameInputProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    gameStateRef: React.MutableRefObject<GameState>;
    playerRef: React.MutableRefObject<Player>;
    viewRef: React.MutableRefObject<ViewState>;
    keysPressed: React.MutableRefObject<Set<string>>;
    debugMode: React.MutableRefObject<boolean>;
    activeTutorial: { id: string; title: string; message: string } | null;
    userProgressRef: React.MutableRefObject<UserProgress>;
    setUserProgress: (p: UserProgress) => void;
    setUiState: React.Dispatch<React.SetStateAction<any>>;
    setView: (view: ViewState) => void;
    togglePause: () => void;
    startActualGameplay: () => void;
    submitHighScore: () => void;
    hsInitials: string;
    returnView: ViewState;
}

export const useGameInput = ({
    canvasRef,
    gameStateRef,
    playerRef,
    viewRef,
    keysPressed,
    debugMode,
    activeTutorial,
    userProgressRef,
    setUserProgress,
    setUiState,
    setView,
    togglePause,
    startActualGameplay,
    submitHighScore,
    hsInitials,
    returnView
}: UseGameInputProps) => {

    const playClick = () => audioManager.playSfx('ui_click');

    const handleInteraction = useCallback((clientX: number, clientY: number, isTap: boolean, isTouch: boolean = false) => {
        if (!canvasRef.current) return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;
        const canvasInternalWidth = canvasRef.current.width;
        const canvasInternalHeight = canvasRef.current.height;

        // Calculate scale and offsets for object-fit: contain
        const scale = Math.min(containerWidth / canvasInternalWidth, containerHeight / canvasInternalHeight);
        const offsetX = (containerWidth - canvasInternalWidth * scale) / 2;
        const offsetY = (containerHeight - canvasInternalHeight * scale) / 2;

        // Map client coordinates to internal canvas coordinates
        let x = (clientX - rect.left - offsetX) / scale;
        let y = (clientY - rect.top - offsetY) / scale;

        // Mobile Offset: Hover just above touch point so finger doesn't obscure ship
        if (isTouch && !gameStateRef.current.waitingForInput) {
            y -= 60; 
        }

        const player = playerRef.current;
        const gs = gameStateRef.current;
        
        if (gs.isActive && !gs.isReplay) {
            if (activeTutorial) return; // Prevent interaction while tutorial is active
            
            if (gs.waitingForInput) {
                if (isTap) {
                    const dist = Math.hypot(x - player.x, y - player.y);
                    if (dist < player.radius + 50) {
                        startActualGameplay();
                    }
                }
            } else {
                 player.targetX = x;
                 player.targetY = y;
            }
        } else if (isTap && viewRef.current === 'gameover' && !activeTutorial) {
          playClick();
          gs.isGameOver = false; 
          
          if (gs.isReplay) {
              gs.isReplay = false;
              setView(returnView);
          } else {
              setView('menu');
          }
          audioManager.playTitleTheme();
        }
    }, [activeTutorial, canvasRef, gameStateRef, playerRef, startActualGameplay, viewRef, setView, returnView]);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => handleInteraction(e.clientX, e.clientY, false, false);
        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                handleInteraction(e.touches[0].clientX, e.touches[0].clientY, false, true);
            }
        };
        const onTouchStart = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                handleInteraction(e.touches[0].clientX, e.touches[0].clientY, true, true);
            }
        };
        const onMouseDown = (e: MouseEvent) => handleInteraction(e.clientX, e.clientY, true, false);

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchstart', onTouchStart, { passive: false });
        window.addEventListener('mousedown', onMouseDown);

        const onKeyDown = (e: KeyboardEvent) => {
            keysPressed.current.add(e.key.toLowerCase());

            // Toggle Debug: Shift + D + End
            if (e.shiftKey && keysPressed.current.has('d') && e.key === 'End') {
                e.preventDefault();
                debugMode.current = !debugMode.current;
                setUiState((p: any) => ({...p, triggerRender: p.triggerRender+1}));
                audioManager.playSfx(debugMode.current ? 'menu_open' : 'menu_close');
                console.log("Debug Mode:", debugMode.current);
                return;
            }

            if (viewRef.current === 'highscore_entry' && e.key === 'Enter') {
                submitHighScore();
                return;
            }

            if (e.key === 'Escape') {
                togglePause();
                return;
            }

            if (!debugMode.current || !gameStateRef.current.isActive) return;

            // Debug Commands (Shift + 1-5)
            if (e.shiftKey) {
                const player = playerRef.current;
                const gs = gameStateRef.current;
                
                switch(e.code) {
                    case 'Digit1':
                    case 'Numpad1': // Slow
                        e.preventDefault();
                        player.slowTimer = 10;
                        audioManager.playSfx('powerup_slow');
                        break;
                    case 'Digit2':
                    case 'Numpad2': // Shield
                        e.preventDefault();
                        player.shields++;
                        audioManager.playSfx('powerup_shield');
                        break;
                    case 'Digit3':
                    case 'Numpad3': // Tiny
                        e.preventDefault();
                        player.shrinkTimer = 10;
                        audioManager.playSfx('powerup_shrink');
                        break;
                    case 'Digit4':
                    case 'Numpad4': // Timer jump
                        e.preventDefault();
                        const currentMin = Math.floor(gs.elapsedTime / 60);
                        const targetTime = (currentMin + 1) * 60 - 0.5;
                        const diff = targetTime - gs.elapsedTime;
                        gs.elapsedTime = targetTime;
                        gs.timeOffset += diff;
                        audioManager.playSfx('checkpoint');
                        break;
                    case 'Digit5':
                    case 'Numpad5': // Coins
                        e.preventDefault();
                        userProgressRef.current.coins += 1000;
                        setUserProgress({...userProgressRef.current});
                        audioManager.playSfx('buy');
                        break;
                }
            }
        };

        const onKeyUp = (e: KeyboardEvent) => {
            keysPressed.current.delete(e.key.toLowerCase());
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        return () => {
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('touchmove', onTouchMove);
          window.removeEventListener('touchstart', onTouchStart);
          window.removeEventListener('mousedown', onMouseDown);
          window.removeEventListener('keydown', onKeyDown);
          window.removeEventListener('keyup', onKeyUp);
        };
    }, [handleInteraction, hsInitials, togglePause, setUserProgress, debugMode, gameStateRef, keysPressed, playerRef, setUiState, submitHighScore, userProgressRef, viewRef]);
};

export default useGameInput;
