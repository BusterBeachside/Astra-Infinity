import { GameMode, ReplayData, ViewState, UserProgress, GameState, Player, Obstacle, PowerUp, Particle, Star, LoadoutState } from '../types';
import { CONSTANTS, COLORS } from '../constants';
import * as Logic from '../services/gameLogic';
import * as Storage from '../services/storage';
import { saveReplay } from '../services/storage';
import { RNG, VisualRNG } from '../services/rng';
import { audioManager } from '../services/audioManager';
import { ChallengeService } from '../services/challengeService';
import { getInitialGameState } from './useGameState';

interface UseGameActionsProps {
    gameStateRef: React.MutableRefObject<GameState>;
    playerRef: React.MutableRefObject<Player>;
    starsRef: React.MutableRefObject<Star[]>;
    obstaclesRef: React.MutableRefObject<Obstacle[]>;
    powerupsRef: React.MutableRefObject<PowerUp[]>;
    particlesRef: React.MutableRefObject<Particle[]>;
    activeLoadout: React.MutableRefObject<LoadoutState>;
    replayRecordingRef: React.MutableRefObject<{ seed: number; inputs: any[] } | null>;
    activeReplayRef: React.MutableRefObject<ReplayData | null>;
    replayIndexRef: React.MutableRefObject<number>;
    accumulatorRef: React.MutableRefObject<number>;
    replaySpeedRef: React.MutableRefObject<number>;
    lastRecordedReplayIdRef: React.MutableRefObject<string | null>;
    accumulatedGrazeCoins: React.MutableRefObject<number>;
    visualRiskRef: React.MutableRefObject<number>;
    lastFrameTime: React.MutableRefObject<number>;
    userProgressRef: React.MutableRefObject<UserProgress>;
    debugMode: React.MutableRefObject<boolean>;
    setUserProgress: (p: UserProgress) => void;
    setUiState: (s: any) => void;
    setView: (v: ViewState) => void;
    setHsInitials: (s: string) => void;
}

export const useGameActions = ({
    gameStateRef,
    playerRef,
    starsRef,
    obstaclesRef,
    powerupsRef,
    particlesRef,
    activeLoadout,
    replayRecordingRef,
    activeReplayRef,
    replayIndexRef,
    accumulatorRef,
    replaySpeedRef,
    lastRecordedReplayIdRef,
    accumulatedGrazeCoins,
    visualRiskRef,
    lastFrameTime,
    userProgressRef,
    debugMode,
    setUserProgress,
    setUiState,
    setView,
    setHsInitials
}: UseGameActionsProps) => {

    const startGame = (mode: GameMode) => {
        const startOffset = activeLoadout.current.rocketBoost ? 60 : 0;
        
        const seed = Date.now();
        RNG.seed(seed);
        VisualRNG.seed(seed);
        
        replayRecordingRef.current = {
            seed,
            inputs: []
        };
        activeReplayRef.current = null;
        
        const { width, height } = gameStateRef.current;
        
        audioManager.stopMusic();

        let currentBest = 0;
        const scores = (mode === 'normal' || mode === 'hardcore' || mode === 'chaos') ? Storage.getHighScores(mode) : [];
        if (scores.length > 0) currentBest = scores[0].score;

        const isChaos = mode === 'chaos' || mode === 'practice' || mode === 'tutorial';
        const chaos = isChaos ? activeLoadout.current.chaosModules : undefined;

        gameStateRef.current = {
          ...getInitialGameState(width, height),
          isActive: true,
          waitingForInput: true, 
          gameMode: mode,
          startTime: 0, 
          elapsedTime: startOffset,
          timeOffset: startOffset,
          lastSpawnTime: 0,
          lastPowerupTime: 0,
          lastCheckpointMinute: Math.floor(startOffset / 60),
          highScore: currentBest,
          chaosModules: chaos,
          compressionState: (chaos?.theyHateYou) ? 2 : 0,
          compressionProgress: (chaos?.theyHateYou) ? 1 : 0,
          seenTutorials: []
        };

        obstaclesRef.current = [];
        powerupsRef.current = [];
        particlesRef.current = [];
        starsRef.current = Logic.initStars(width, height);
        
        accumulatedGrazeCoins.current = 0;
        visualRiskRef.current = 0;
        
        const initialShields = activeLoadout.current.startShield ? 1 : 0;
        
        ChallengeService.ensureProgressionMission(userProgressRef.current);
        
        playerRef.current = {
          ...playerRef.current,
          x: width / 2, 
          y: height * 0.75,
          radius: CONSTANTS.PLAYER_BASE_RADIUS,
          targetX: width / 2, 
          targetY: height * 0.75,
          shields: initialShields, 
          shrinkTimer: 0, 
          slowTimer: 0,
          trail: [],
          trailType: userProgressRef.current.equippedTrail || 'default',
          skinId: userProgressRef.current.equippedSkin || 'default'
        };

        setUiState((prev: any) => ({ ...prev, isWaitingForStart: true, isPaused: false }));
        setView('game');
        lastFrameTime.current = Date.now();
    };

    const startPreview = (itemId: string, currentTab: 'modules' | 'trails' | 'skins', currentScroll: number) => {
        const { width, height } = gameStateRef.current;
        audioManager.stopMusic();

        const seed = Date.now();
        RNG.seed(seed);
        VisualRNG.seed(seed);
        
        gameStateRef.current = {
            ...getInitialGameState(width, height),
            isActive: true,
            waitingForInput: false,
            isGameOver: false,
            gameMode: 'preview',
            startTime: Date.now(),
            lastSpawnTime: 0,
            lastPowerupTime: 0,
        };
        
        obstaclesRef.current = [];
        powerupsRef.current = [];
        particlesRef.current = [];
        starsRef.current = Logic.initStars(width, height);
        
        const isTrail = currentTab === 'trails';
        const isSkin = currentTab === 'skins';

        playerRef.current = {
            ...playerRef.current,
            x: width / 2,
            y: height / 2,
            targetX: width / 2,
            targetY: height / 2,
            shields: 0,
            shrinkTimer: 0,
            slowTimer: 0,
            trail: [],
            trailType: isTrail ? (itemId as any) : (userProgressRef.current.equippedTrail || 'default'),
            skinId: isSkin ? itemId : (userProgressRef.current.equippedSkin || 'default')
        };
        
        setUiState((prev: any) => ({ ...prev, isWaitingForStart: false, isPaused: false }));
        setView('game');
        lastFrameTime.current = Date.now();
        audioManager.playGameTheme();
    };

    const startReplay = (replay: ReplayData) => {
        const width = replay.width || gameStateRef.current.width;
        const height = replay.height || gameStateRef.current.height;
        audioManager.stopMusic();

        RNG.seed(replay.seed);
        VisualRNG.seed(replay.seed);
        
        activeReplayRef.current = replay;
        replayIndexRef.current = 0;
        accumulatorRef.current = 0;
        replaySpeedRef.current = 1;
        replayRecordingRef.current = null;

        const startOffset = replay.loadout?.rocketBoost ? 60 : 0;

        // Ensure chaos modules are loaded correctly, checking both root and loadout
        const chaosModules = replay.chaosModules || replay.loadout?.chaosModules;

        gameStateRef.current = {
            ...getInitialGameState(width, height),
            isActive: true,
            waitingForInput: false,
            isGameOver: false,
            gameMode: replay.gameMode,
            isReplay: true,
            startTime: 0,
            elapsedTime: startOffset,
            timeOffset: startOffset,
            lastSpawnTime: 0,
            lastPowerupTime: 0,
            lastCheckpointMinute: Math.floor(startOffset / 60),
            chaosModules: chaosModules
        };
        
        obstaclesRef.current = [];
        powerupsRef.current = [];
        particlesRef.current = [];
        starsRef.current = Logic.initStars(width, height);
        
        const initialShields = replay.loadout?.startShield ? 1 : 0;

        playerRef.current = {
            ...playerRef.current,
            x: width / 2,
            y: height * 0.75,
            targetX: width / 2,
            targetY: height * 0.75,
            shields: initialShields,
            shrinkTimer: 0,
            slowTimer: 0,
            trail: [],
            trailType: replay.trailType || 'default',
            skinId: replay.skinId || 'default'
        };

        if (replay.loadout?.rocketBoost) {
            gameStateRef.current.isWarpingIn = true;
            audioManager.playSfx('warp_engage');
            setTimeout(() => {
                if (gameStateRef.current.isActive && gameStateRef.current.isReplay) {
                    gameStateRef.current.isWarpingIn = false;
                }
            }, 1500);
        }

        setUiState((prev: any) => ({ ...prev, isWaitingForStart: false, isPaused: false }));
        setView('game');
        lastFrameTime.current = Date.now();
        audioManager.playGameTheme();
    };

    const startActualGameplay = () => {
        audioManager.playGameTheme();
        gameStateRef.current.waitingForInput = false;
        gameStateRef.current.startTime = Date.now();
        
        setUiState((prev: any) => ({ ...prev, isWaitingForStart: false }));
        audioManager.playSfx('ui_click');

        if (activeLoadout.current.rocketBoost) {
            gameStateRef.current.isWarpingIn = true;
            audioManager.playSfx('warp_engage');
            setTimeout(() => {
                if (gameStateRef.current.isActive) {
                    gameStateRef.current.isWarpingIn = false;
                }
            }, 1500);
        }
    };

    const handleGameOver = () => {
        const gs = gameStateRef.current;
        if (gs.isGameOver) return; 
        
        gs.isActive = false;
        gs.isGameOver = true;
        
        // Use the simulation time (elapsedTime) instead of real-time Date.now() 
        // to ensure consistency with the recorded replay inputs.
        
        const upgrades = (gs.isReplay && activeReplayRef.current?.upgrades) 
            ? activeReplayRef.current.upgrades 
            : userProgressRef.current.upgrades;
            
        const loadout = (gs.isReplay && activeReplayRef.current?.loadout)
            ? activeReplayRef.current.loadout
            : activeLoadout.current;

        const breakdown = Logic.calculateCoins(
            gs.elapsedTime, 
            gs.gameMode, 
            loadout.doubleCoins,
            upgrades.permDoubleCoins,
            gs.titansSurvived,
            (gs as any).coinBreakdown?.grazeCoins || 0,
            gs.showboatCoins || 0,
            gs.chaosModules
        );
        gs.coinBreakdown = breakdown;
        gs.coinsEarned = breakdown.total;

        if (gs.gameMode !== 'preview' && gs.gameMode !== 'practice' && gs.gameMode !== 'tutorial' && !gs.isReplay) {
            ChallengeService.updateProgress(userProgressRef.current, gs, 0);
            ChallengeService.trackCoinGain(userProgressRef.current, breakdown.total);
        }

        const deathRecord = (gs.gameMode === 'normal' || gs.gameMode === 'hardcore' || gs.gameMode === 'chaos') ? {
            x: playerRef.current.x,
            y: playerRef.current.y,
            mode: gs.gameMode as 'normal' | 'hardcore' | 'chaos',
            timestamp: Date.now()
        } : null;

        if (replayRecordingRef.current && (gs.gameMode === 'normal' || gs.gameMode === 'hardcore' || gs.gameMode === 'chaos')) {
            const inputs = replayRecordingRef.current.inputs;
            const startOffset = activeLoadout.current.rocketBoost ? 60 : 0;
            
            // Recalculate duration from inputs to ensure 100% consistency between 
            // the recorded frames and the displayed time/leaderboard score.
            // This fixes discrepancies caused by frame drops or logic gaps.
            const totalRecordedTime = inputs.reduce((acc: number, frame: any) => acc + frame.dt, 0);
            const dtMultiplier = (gs.chaosModules?.brrrrrr) ? 2 : 1;
            const consistentGameTime = startOffset + totalRecordedTime * dtMultiplier;
            const consistentRealDuration = startOffset + totalRecordedTime;

            const replay: ReplayData = {
                id: RNG.id(),
                date: Date.now(),
                seed: replayRecordingRef.current.seed,
                width: gs.width,
                height: gs.height,
                gameMode: gs.gameMode,
                duration: consistentRealDuration, // Use real time duration for replay progress
                score: gs.coinsEarned,
                grazeTime: gs.grazeTime,
                showboats: gs.totalShowboats,
                upgrades: { ...userProgressRef.current.upgrades },
                loadout: { ...activeLoadout.current },
                chaosModules: gs.chaosModules,
                skinId: playerRef.current.skinId,
                trailType: playerRef.current.trailType,
                inputs: replayRecordingRef.current.inputs,
                version: '1.0'
            };
            saveReplay(replay);
            lastRecordedReplayIdRef.current = replay.id;
            
            // Update the game state's elapsed time to match the recorded game time
            gs.elapsedTime = consistentGameTime;
        }

        const stats = userProgressRef.current.stats;
        if (!gs.isReplay) {
            if (gs.gameMode === 'normal') {
                stats.totalTimeNormal += gs.elapsedTime;
            } else if (gs.gameMode === 'hardcore') {
                stats.totalTimeHardcore += gs.elapsedTime;
            } else if (gs.gameMode === 'chaos') {
                stats.totalTimeNormal += gs.elapsedTime; // Count chaos as normal for stats or add new stat?
            }
            
            if (gs.gameMode !== 'preview' && gs.gameMode !== 'practice') {
                stats.totalRuns += 1;
                stats.lifetimeCoinsEarned += breakdown.total;
                stats.totalShowboats += (gs.totalShowboats || 0);
                stats.totalTimeGrazed += (gs.grazeTime || 0);
                stats.grazingCoinsEarned += (breakdown.grazeCoins || 0);
                
                if (gs.lastDeathBy) {
                    stats.deathCounts[gs.lastDeathBy] = (stats.deathCounts[gs.lastDeathBy] || 0) + 1;
                }
            }

            const newProgress = { 
                ...userProgressRef.current, 
                coins: userProgressRef.current.coins + breakdown.total,
                deathHistory: deathRecord ? [...(userProgressRef.current.deathHistory || []), deathRecord].slice(-100) : userProgressRef.current.deathHistory,
                stats
            };
            setUserProgress(newProgress);
        }

        audioManager.stopMusic();
        audioManager.playSfx('game_over');

        const shardCount = 40;
        const p = playerRef.current;
        for(let j=0; j<shardCount; j++) { 
            particlesRef.current.push({ 
                id: VisualRNG.id(),
                x: p.x, y: p.y, 
                vx: Math.cos((Math.PI*2/shardCount)*j) * (120 + VisualRNG.random()*300), 
                vy: Math.sin((Math.PI*2/shardCount)*j) * (120 + VisualRNG.random()*300), 
                size: 3 + VisualRNG.random() * 5, 
                life: 2.0 
            }); 
        }
        
        gs.currentTimeScale = 0.1;

        if (gs.isReplay) {
            gs.isPaused = true;
            setUiState((prev: any) => ({ ...prev, isPaused: true }));
        }

        setTimeout(() => {
            const mode = gs.gameMode;
            if ((mode === 'normal' || mode === 'hardcore' || mode === 'chaos') && !gs.isReplay && !debugMode.current) {
                // Check Chaos Eligibility
                let isEligible = true;
                if (mode === 'chaos') {
                    const modules = gs.chaosModules;
                    if (!modules || !modules.brrrrrr || !modules.theyHateYou || !modules.onTop) {
                        isEligible = false;
                    }
                }

                const isHigh = isEligible && Storage.checkIsHighScore(gs.elapsedTime, mode);
                
                if (isHigh) {
                    const lastInitials = localStorage.getItem('stellar_last_initials') || '';
                    setHsInitials(lastInitials);
                    setView('highscore_entry');
                } else {
                    setView('gameover');
                }
            } else {
                setView('gameover');
            }
        }, 2000);
    };

    return {
        startGame,
        startPreview,
        startReplay,
        startActualGameplay,
        handleGameOver
    };
};
