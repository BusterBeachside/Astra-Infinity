import { useEffect } from 'react';
import { GameMode, ReplayData, ViewState, UserProgress, GameSettings } from '../types';
import { useGameState } from './useGameState';
import { useGameTutorials } from './useGameTutorials';
import { useGameActions } from './useGameActions';
import { useGameLoop } from './useGameLoop';

interface UseGameEngineProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    containerRef: React.RefObject<HTMLDivElement>;
    uiState: any;
    setUiState: React.Dispatch<React.SetStateAction<any>>;
    viewRef: React.MutableRefObject<ViewState>;
    setView: (view: ViewState) => void;
    userProgressRef: React.MutableRefObject<UserProgress>;
    setUserProgress: (p: UserProgress) => void;
    settingsRef: React.MutableRefObject<GameSettings>;
    activeTutorial: { id: string; title: string; message: string } | null;
    setActiveTutorial: (t: { id: string; title: string; message: string } | null) => void;
    setHsInitials: (s: string) => void;
    keysPressed: React.MutableRefObject<Set<string>>;
    debugMode: React.MutableRefObject<boolean>;
    warpRef: React.RefObject<HTMLDivElement>;
    fpsRef: React.RefObject<HTMLDivElement>;
    timerRef: React.RefObject<HTMLDivElement>;
    riskBarRef: React.RefObject<HTMLDivElement>;
    riskTextRef: React.RefObject<HTMLDivElement>;
    riskContainerRef: React.RefObject<HTMLDivElement>;
    replayTimerRef: React.RefObject<HTMLDivElement>;
    addFloatingText: (x: number, y: number, text: string, subText?: string, color?: string) => void;
}

export const useGameEngine = (props: UseGameEngineProps) => {
    const {
        canvasRef,
        containerRef,
        setUiState,
        viewRef,
        setView,
        userProgressRef,
        setUserProgress,
        settingsRef,
        activeTutorial,
        setActiveTutorial,
        setHsInitials,
        keysPressed,
        debugMode,
        warpRef,
        fpsRef,
        timerRef,
        riskBarRef,
        riskTextRef,
        riskContainerRef,
        replayTimerRef,
        addFloatingText
    } = props;

    const state = useGameState();

    const { checkTutorials } = useGameTutorials({
        userProgressRef,
        setUserProgress,
        activeTutorial,
        setActiveTutorial,
        setUiState
    });

    const actions = useGameActions({
        ...state,
        canvasRef,
        containerRef,
        userProgressRef,
        debugMode,
        setUserProgress,
        setUiState,
        setView,
        setHsInitials
    });

    const loop = useGameLoop({
        ...state,
        canvasRef,
        userProgressRef,
        setUserProgress,
        settingsRef,
        viewRef,
        setUiState,
        warpRef,
        fpsRef,
        timerRef,
        riskBarRef,
        riskTextRef,
        riskContainerRef,
        replayTimerRef,
        keysPressed,
        addFloatingText,
        handleGameOver: actions.handleGameOver,
        checkTutorials
    });

    return {
        ...state,
        ...actions
    };
};
