import { useRef } from 'react';
import { Player, Obstacle, Star, PowerUp, Particle, GameState, LoadoutState, ReplayData, ReplayInputFrame } from '../types';
import { CONSTANTS } from '../constants';

export const getInitialGameState = (width: number, height: number): GameState => ({
    isActive: false,
    waitingForInput: false,
    isGameOver: false,
    gameMode: 'normal',
    width, 
    height,
    startTime: 0,
    elapsedTime: 0,
    timeOffset: 0,
    lastSpawnTime: 0,
    lastPowerupTime: 0,
    lastCheckpointMinute: 0,
    titanCooldown: 0,
    titansSurvived: 0,
    compressionState: 0,
    compressionProgress: 0,
    currentTimeScale: 1.0,
    targetTimeScale: 1.0,
    highScore: 0,
    coinsEarned: 0,
    isWarpingIn: false,
    isPaused: false,
    isReplay: false,
    currentRisk: 0,
    coinBreakdown: undefined,
    showboatCoins: 0,
    totalShowboats: 0,
    powerupsCollected: 0,
    grazeTime: 0,
    seenTutorials: []
});

export const useGameState = () => {
    const gameStateRef = useRef<GameState>(getInitialGameState(100, 100));
    
    const playerRef = useRef<Player>({
        x: 0, y: 0, radius: CONSTANTS.PLAYER_BASE_RADIUS, baseRadius: CONSTANTS.PLAYER_BASE_RADIUS,
        targetX: 0, targetY: 0, lerp: 0.25, shields: 0, shrinkTimer: 0, slowTimer: 0, trail: [], trailType: 'default',
        grazeMultiplier: 1,
        skinId: 'default'
    });

    const starsRef = useRef<Star[]>([]);
    const obstaclesRef = useRef<Obstacle[]>([]);
    const powerupsRef = useRef<PowerUp[]>([]);
    const particlesRef = useRef<Particle[]>([]);

    const activeLoadout = useRef<LoadoutState>({ startShield: false, rocketBoost: false, doubleCoins: false });
    
    // Replay Refs
    const accumulatorRef = useRef<number>(0);
    const replayRecordingRef = useRef<{ seed: number; inputs: ReplayInputFrame[] } | null>(null);
    const activeReplayRef = useRef<ReplayData | null>(null);
    const replayIndexRef = useRef<number>(0);
    const replaySpeedRef = useRef<number>(1);
    const lastRecordedReplayIdRef = useRef<string | null>(null);

    const lastGrazeSfxTime = useRef<number>(0);
    const accumulatedGrazeCoins = useRef<number>(0);
    const visualRiskRef = useRef<number>(0);

    const animationFrameId = useRef<number>(0);
    const lastFrameTime = useRef<number>(0);
    const lastLoopTime = useRef<number>(0);

    return {
        gameStateRef,
        playerRef,
        starsRef,
        obstaclesRef,
        powerupsRef,
        particlesRef,
        activeLoadout,
        accumulatorRef,
        replayRecordingRef,
        activeReplayRef,
        replayIndexRef,
        replaySpeedRef,
        lastRecordedReplayIdRef,
        lastGrazeSfxTime,
        accumulatedGrazeCoins,
        visualRiskRef,
        animationFrameId,
        lastFrameTime,
        lastLoopTime
    };
};
