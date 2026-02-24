
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Player, Obstacle, Star, PowerUp, Particle, GameState, UserProgress, LoadoutState, GameSettings, FloatingText, TrailType, GameMode } from '../types';
import { CONSTANTS, COLORS, GRAZE_CONFIG } from '../constants';
import * as Logic from '../services/gameLogic';
import * as Storage from '../services/storage';
import { drawNetworkBackground, drawStars, drawFloor, drawWarpBackground } from '../services/renderBackground';
import { clearCanvas, drawObstacle, drawPowerUp, drawParticles, drawPlayer, drawHitbox } from '../services/renderGame';
import { audioManager } from '../services/audioManager';
import { ChallengeService } from '../services/challengeService';

import HUD from './HUD';
import SplashScreen from './ui/SplashScreen';
import MainMenu from './ui/MainMenu';
import GameOverScreen from './ui/GameOverScreen';
import Leaderboard from './ui/Leaderboard';
import HighScoreInput from './ui/HighScoreInput';
import OptionsScreen from './ui/OptionsScreen';
import ShopScreen from './ui/ShopScreen';
import LoadoutScreen from './ui/LoadoutScreen';
import CreditsScreen from './ui/CreditsScreen';
import TutorialOverlay from './ui/TutorialOverlay';
import ChallengesOverlay from './ui/ChallengesOverlay';
import HeatmapOverlay from './ui/HeatmapOverlay';

type ViewState = 'splash' | 'menu' | 'game' | 'gameover' | 'highscore_entry' | 'highscore_board' | 'options' | 'shop' | 'loadout' | 'credits';

const getInitialGameState = (width: number, height: number): GameState => ({
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
    currentRisk: 0,
    coinBreakdown: undefined,
    showboatCoins: 0,
    totalShowboats: 0,
    powerupsCollected: 0,
    grazeTime: 0
});

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<HTMLDivElement>(null);
  const warpRef = useRef<HTMLDivElement>(null);
  const riskBarRef = useRef<HTMLDivElement>(null);
  const riskTextRef = useRef<HTMLDivElement>(null);
  const riskContainerRef = useRef<HTMLDivElement>(null);
  
  const animationFrameId = useRef<number>(0);
  const lastFrameTime = useRef<number>(0); // Time of last processed frame
  const lastLoopTime = useRef<number>(0); // Time of last loop execution (for fps calc)
  
  const debugMode = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const viewRef = useRef<ViewState>('splash');
  const pendingModeRef = useRef<GameMode>('normal');
  const keysPressed = useRef<Set<string>>(new Set());

  // Persistent User Progress - synced with Ref for GameLoop access
  const userProgressRef = useRef<UserProgress>(Storage.getUserProgress());
  const [userProgress, setUserProgressState] = useState<UserProgress>(userProgressRef.current);
  
  // Game Settings
  const settingsRef = useRef<GameSettings>(Storage.getGameSettings());
  const [settings, setSettings] = useState<GameSettings>(settingsRef.current);

  // Shop State Management
  const [shopState, setShopState] = useState<{ tab: 'modules' | 'trails' | 'skins', scroll: number }>({ tab: 'modules', scroll: 0 });

  // Tutorial State
  const [activeTutorial, setActiveTutorial] = useState<{ id: string; title: string; message: string } | null>(null);

  const [showChallenges, setShowChallenges] = useState(false);
  const [heatmapSettings, setHeatmapSettings] = useState({ visible: false, showNormal: true, showHardcore: true });

  const lastGrazeSfxTime = useRef<number>(0);
  const accumulatedGrazeCoins = useRef<number>(0);
  const visualRiskRef = useRef<number>(0);

  const setUserProgress = (p: UserProgress) => {
      setUserProgressState(p);
      userProgressRef.current = p;
      Storage.saveUserProgress(p);
  };
  
  const updateSettings = () => {
      const s = Storage.getGameSettings();
      settingsRef.current = s;
      setSettings(s);
  };

  // Current Run Loadout
  const activeLoadout = useRef<LoadoutState>({ startShield: false, rocketBoost: false, doubleCoins: false });

  // Use Refs for mutable game state
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
  
  // UI State
  const [uiState, setUiState] = useState({
    view: 'splash' as ViewState,
    showCheckpoint: false,
    triggerRender: 0,
    isWaitingForStart: false,
    isPaused: false
  });
  
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  const [hsInitials, setHsInitials] = useState('');

  const togglePause = useCallback(() => {
      if (viewRef.current !== 'game' || gameStateRef.current.isGameOver || gameStateRef.current.waitingForInput) return;
      
      const newPaused = !gameStateRef.current.isPaused;
      gameStateRef.current.isPaused = newPaused;
      setUiState(prev => ({ ...prev, isPaused: newPaused }));
      
      if (newPaused) {
          audioManager.playSfx('menu_open');
          gameStateRef.current.pauseStartTime = Date.now();
      } else {
          audioManager.playSfx('menu_close');
          
          if (gameStateRef.current.pauseStartTime) {
              const pauseDuration = Date.now() - gameStateRef.current.pauseStartTime;
              gameStateRef.current.startTime += pauseDuration;
              gameStateRef.current.lastSpawnTime += pauseDuration;
              gameStateRef.current.lastPowerupTime += pauseDuration;
          }
          gameStateRef.current.pauseStartTime = undefined;
          
          lastFrameTime.current = Date.now(); // Reset frame time to prevent huge delta
      }
  }, []);

  const addFloatingText = (x: number, y: number, text: string, subText?: string, color: string = '#ffffff') => {
      const id = Date.now().toString() + Math.random().toString();
      setFloatingTexts(prev => [...prev, { id, x, y, text, subText, color, life: 1000 }]);
      setTimeout(() => {
          setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
      }, 1000);
  };

  const setView = (newView: ViewState) => {
      // Play menu sound ANY time we enter menu, except initially if already there (though logic prevents that)
      if (newView === 'menu') {
        updateSettings(); // Refresh settings when returning to menu
        setTimeout(() => {
            audioManager.playSfx('menu_open');
        }, 100);
      }
      
      viewRef.current = newView;
      setUiState(prev => ({ ...prev, view: newView }));
  };
  
  const playHover = () => audioManager.playSfx('ui_hover');
  const playClick = () => audioManager.playSfx('ui_click');

  // --- Initialization ---
  useEffect(() => {
    const initAudio = async () => {
        const startPath = 'title_start.ogg';
        const loopPath = 'title_loop.ogg';
        await audioManager.loadTracks(startPath, loopPath);
    };
    initAudio();

    const scores = Storage.getHighScores('normal');
    if (scores.length > 0) {
        gameStateRef.current.highScore = scores[0].score;
    }

    // Initialize Challenges
    const today = new Date().toISOString().split('T')[0];
    if (userProgressRef.current.lastChallengeDate !== today) {
        const daily = ChallengeService.generateDailyChallenges(userProgressRef.current.lastChallengeDate, []);
        const repeatable = ChallengeService.generateRepeatableChallenges(3, daily);
        const newProgress = {
            ...userProgressRef.current,
            activeChallenges: [...daily, ...repeatable],
            lastChallengeDate: today
        };
        setUserProgress(newProgress);
    }

    const handleResize = () => {
      // Use window.innerHeight/Width as fallback if container is weirdly zero
      // This helps on mobile where 100dvh might be tricky with iframes
      const width = containerRef.current?.clientWidth || window.innerWidth;
      const height = containerRef.current?.clientHeight || window.innerHeight;

      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
      
      gameStateRef.current.width = width;
      gameStateRef.current.height = height;
        
      // Center-Bottom alignment fix on resize
      if (!gameStateRef.current.isActive) {
           playerRef.current.x = width / 2;
           playerRef.current.y = height * 0.75;
           playerRef.current.targetX = width / 2;
           playerRef.current.targetY = height * 0.75;
           
           // Force render to update "Click to engage" position
           setUiState(prev => ({...prev, triggerRender: prev.triggerRender + 1}));
      }

      starsRef.current = Logic.initStars(width, height);
    };
    window.addEventListener('resize', handleResize);
    // Call resize on a slight delay to allow layout to settle (fixes mobile itch issue)
    setTimeout(handleResize, 100);
    setTimeout(handleResize, 500);
    handleResize(); 

    // Ensure progression mission is active on load
    const p = userProgressRef.current;
    ChallengeService.ensureProgressionMission(p);
    setUserProgress({...p});

    return () => {
      window.removeEventListener('resize', handleResize);
      audioManager.stopMusic();
    };
  }, []);

  const handleSplashClick = async () => {
      // Ensure audio context is resumed on user gesture
      await audioManager.resumeContext();
      audioManager.playTitleTheme();
      playClick();
      setView('menu');
  };

  const initGameSequence = (mode: GameMode) => {
      playClick();
      if (mode === 'practice') {
          activeLoadout.current = { startShield: false, rocketBoost: false, doubleCoins: false };
          startGame('practice');
          return;
      }
      pendingModeRef.current = mode;
      // Show loadout screen for both modes now
      setView('loadout');
  };

  const startGame = (mode: GameMode) => {
    // Determine start time based on Rocket Boost
    const startOffset = activeLoadout.current.rocketBoost ? 60 : 0;
    
    const { width, height } = gameStateRef.current;
    
    audioManager.stopMusic();

    let currentBest = 0;
    const scores = (mode === 'normal' || mode === 'hardcore') ? Storage.getHighScores(mode) : [];
    if (scores.length > 0) currentBest = scores[0].score;

    gameStateRef.current = {
      ...getInitialGameState(width, height),
      isActive: true,
      waitingForInput: true, 
      gameMode: mode,
      startTime: 0, 
      elapsedTime: startOffset,
      timeOffset: startOffset, // If boosted, logic thinks 60s passed
      lastSpawnTime: Date.now(),
      lastPowerupTime: Date.now(),
      lastCheckpointMinute: Math.floor(startOffset / 60),
      highScore: currentBest,
    };

    obstaclesRef.current = [];
    powerupsRef.current = [];
    particlesRef.current = [];
    starsRef.current = Logic.initStars(width, height);
    
    accumulatedGrazeCoins.current = 0;
    visualRiskRef.current = 0;
    
    // Reset Player
    const initialShields = activeLoadout.current.startShield ? 1 : 0;
    
    // Ensure we have a progression mission active
    ChallengeService.ensureProgressionMission(userProgressRef.current);
    
    playerRef.current = {
      ...playerRef.current,
      x: width / 2, 
      y: height * 0.75, // Center-Bottom
      targetX: width / 2, 
      targetY: height * 0.75,
      shields: initialShields, 
      shrinkTimer: 0, 
      slowTimer: 0,
      trail: [],
      trailType: userProgressRef.current.equippedTrail || 'default',
      skinId: userProgressRef.current.equippedSkin || 'default'
    };

    setUiState(prev => ({ ...prev, isWaitingForStart: true, isPaused: false }));
    setView('game');
    lastFrameTime.current = Date.now();
  };
  
  const startPreview = (itemId: string, currentTab: 'modules' | 'trails' | 'skins', currentScroll: number) => {
      const { width, height } = gameStateRef.current;
      audioManager.stopMusic();

      // Save Shop state to resume later
      setShopState({ tab: currentTab, scroll: currentScroll });
      
      gameStateRef.current = {
          ...getInitialGameState(width, height),
          isActive: true,
          waitingForInput: false,
          isGameOver: false,
          gameMode: 'preview',
          startTime: Date.now(),
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
          trailType: isTrail ? (itemId as TrailType) : (userProgressRef.current.equippedTrail || 'default'),
          skinId: isSkin ? itemId : (userProgressRef.current.equippedSkin || 'default')
      };
      
      setUiState(prev => ({ ...prev, isWaitingForStart: false, isPaused: false }));
      setView('game');
      lastFrameTime.current = Date.now();
      audioManager.playGameTheme();
  };

  const startActualGameplay = () => {
      audioManager.playGameTheme();
      gameStateRef.current.waitingForInput = false;
      gameStateRef.current.startTime = Date.now();
      gameStateRef.current.lastSpawnTime = Date.now();
      gameStateRef.current.lastPowerupTime = Date.now();
      
      setUiState(prev => ({ ...prev, isWaitingForStart: false }));
      audioManager.playSfx('ui_click');

      // Check for Rocket Boost to trigger Warp Animation + Sound
      if (activeLoadout.current.rocketBoost) {
          gameStateRef.current.isWarpingIn = true;
          audioManager.playSfx('warp_engage');
          // Turn off visual warp after 1.5s
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
    
    // Calculate final elapsed time
    if (!gs.waitingForInput && gs.startTime > 0) {
        gs.elapsedTime = ((Date.now() - gs.startTime) / 1000) + gs.timeOffset;
    }

    // Calculate Coins
    const breakdown = Logic.calculateCoins(
        gs.elapsedTime, 
        gs.gameMode, 
        activeLoadout.current.doubleCoins,
        userProgressRef.current.upgrades.permDoubleCoins,
        gs.titansSurvived,
        (gs as any).coinBreakdown?.grazeCoins || 0,
        gs.showboatCoins || 0
    );
    gs.coinBreakdown = breakdown;
    gs.coinsEarned = breakdown.total;

    // Update Challenges one last time with final stats
    if (gs.gameMode !== 'preview' && gs.gameMode !== 'practice') {
        // Update progress for single-run missions (survive_single, collect_coins_single, etc.)
        ChallengeService.updateProgress(userProgressRef.current, gs, 0);
        // Track the final bulk coin gain for cumulative missions
        ChallengeService.trackCoinGain(userProgressRef.current, breakdown.total);
    }

    // Save Progress
    const newProgress = { ...userProgressRef.current, coins: userProgressRef.current.coins + breakdown.total };
    setUserProgress(newProgress);

    // SFX
    audioManager.stopMusic();
    audioManager.playSfx('game_over');

    // Death particles
    const shardCount = 40;
    const p = playerRef.current;
    for(let j=0; j<shardCount; j++) { 
        particlesRef.current.push({ 
            id: Math.random().toString(),
            x: p.x, y: p.y, 
            // Scale velocity for time-based movement (~120-420 px/sec)
            vx: Math.cos((Math.PI*2/shardCount)*j) * (120 + Math.random()*300), 
            vy: Math.sin((Math.PI*2/shardCount)*j) * (120 + Math.random()*300), 
            size: 3 + Math.random() * 5, 
            life: 2.0 
        }); 
    }
    
    gs.currentTimeScale = 0.1;

    setTimeout(() => {
        const mode = gs.gameMode;
        // Check mode is valid before checking high score
        if (mode === 'normal' || mode === 'hardcore') {
            const isHigh = Storage.checkIsHighScore(gs.elapsedTime, mode);
            
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

  const submitHighScore = () => {
     playClick();
     if (!hsInitials.trim()) return;
     const gs = gameStateRef.current;
     const mode = gs.gameMode;

     if (mode === 'preview' || mode === 'practice') return;
     
     localStorage.setItem('stellar_last_initials', hsInitials.toUpperCase());

     Storage.saveHighScore({
         name: hsInitials.toUpperCase().substring(0, 3),
         score: gs.elapsedTime,
         date: new Date().toLocaleDateString()
     }, mode);
     
     audioManager.playTitleTheme();
     setView('gameover');
  };

  const handleInteraction = useCallback((clientX: number, clientY: number, isTap: boolean, isTouch: boolean = false) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    let y = clientY - rect.top;

    // Mobile Offset: Hover just above touch point so finger doesn't obscure ship
    if (isTouch && !gameStateRef.current.waitingForInput) {
        y -= 60; 
    }

    const player = playerRef.current;
    const gs = gameStateRef.current;
    
    if (gs.isActive) {
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
    } else if (isTap && viewRef.current === 'gameover') {
      playClick();
      gs.isGameOver = false; 
      setView('menu');
      audioManager.playTitleTheme();
    }
  }, []);

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

        // Toggle Debug: Ctrl + D + End
        if (e.ctrlKey && keysPressed.current.has('d') && e.key === 'End') {
            e.preventDefault();
            debugMode.current = !debugMode.current;
            setUiState(p => ({...p, triggerRender: p.triggerRender+1}));
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
                case 'Digit1': // Slow
                    player.slowTimer = 10;
                    audioManager.playSfx('powerup_slow');
                    break;
                case 'Digit2': // Shield
                    player.shields++;
                    audioManager.playSfx('powerup_shield');
                    break;
                case 'Digit3': // Tiny
                    player.shrinkTimer = 10;
                    audioManager.playSfx('powerup_shrink');
                    break;
                case 'Digit4': // Timer jump
                    const currentMin = Math.floor(gs.elapsedTime / 60);
                    const targetTime = (currentMin + 1) * 60 - 0.5;
                    gs.timeOffset += (targetTime - gs.elapsedTime);
                    break;
                case 'Digit5': // Coins
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
  }, [handleInteraction, hsInitials, togglePause, setUserProgress]);

  useEffect(() => {
    if (uiState.view === 'gameover' && !activeTutorial) {
        const progress = userProgressRef.current;
        if (!progress.tutorialsSeen['coins']) {
            setActiveTutorial({
                id: 'coins',
                title: 'MISSION DEBRIEF',
                message: 'Survival time earns COINS. Use them in the SHOP to upgrade your ship.'
            });
            const newProgress = { 
                ...progress, 
                tutorialsSeen: { ...progress.tutorialsSeen, 'coins': true } 
            };
            setUserProgress(newProgress);
            audioManager.playSfx('menu_open');
        }
    }
  }, [uiState.view, activeTutorial]);

  const checkTutorials = (gs: GameState) => {
      if (gs.gameMode === 'preview' || gs.isPaused || activeTutorial) return;

      const progress = userProgressRef.current;
      const seen = progress.tutorialsSeen || {};
      const now = gs.elapsedTime;

      let tutorialId = '';
      let title = '';
      let message = '';

      if (gs.gameMode === 'hardcore') {
          if (!seen['hardcore_intro'] && now > 0.5) {
              tutorialId = 'hardcore_intro';
              title = 'HARDCORE MODE ENGAGED';
              message = 'No powerups. Increased spawn rates. 3x Coin Multiplier. Good luck.';
          }
      } else {
          // Normal Mode Tutorials
          if (!seen['intro'] && now > 0.5) {
              tutorialId = 'intro';
              title = 'MISSION START';
              message = 'Drag to pilot your ship. Avoid red obstacles. Survive as long as possible.';
          } else if (!seen['powerup'] && now > 15) {
              tutorialId = 'powerup';
              title = 'SUPPLY DROP DETECTED';
              message = 'Collect colored modules for temporary upgrades. Green=Shield, Blue=Slow, Yellow=Shrink.';
          } else if (!seen['floor_hazard'] && gs.compressionState === 1) {
              tutorialId = 'floor_hazard';
              title = 'ENVIRONMENTAL HAZARD';
              message = 'Space compression detected. Avoid the rising floor boundary.';
          } else if (!seen['diagonal'] && now > 60) {
              tutorialId = 'diagonal';
              title = 'WARNING: ANOMALY DETECTED';
              message = 'Debris patterns changing. Watch the corners.';
          } else if (!seen['seeker'] && now > 120) {
              tutorialId = 'seeker';
              title = 'THREAT ALERT: SEEKER DRONES';
              message = 'Enemy units locking on. Evasive maneuvers recommended.';
          } else if (!seen['titan'] && now > CONSTANTS.TITAN_START_TIME) {
              tutorialId = 'titan';
              title = 'WARNING: TITAN CLASS DETECTED';
              message = 'Massive pursuer detected. Outlast its energy reserves and evade the final detonation.';
          } else if (!seen['side_seeker'] && now > 240) {
              tutorialId = 'side_seeker';
              title = 'WARNING: LATERAL INCURSION';
              message = 'Enemies attacking from flanks.';
          }
      }

      if (tutorialId) {
          // Trigger Tutorial
          gs.isPaused = true;
          setUiState(prev => ({ ...prev, isPaused: true }));
          
          setActiveTutorial({ id: tutorialId, title, message });
          
          // Mark as seen immediately so it doesn't trigger again
          const newProgress = { 
              ...progress, 
              tutorialsSeen: { ...seen, [tutorialId]: true } 
          };
          setUserProgress(newProgress);
          
          audioManager.playSfx('menu_open'); 
      }
  };

  const update = (timestamp: number) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // --- Frame Limiter Logic ---
    const now = Date.now();
    const targetFps = settingsRef.current.frameLimit;
    const interval = targetFps > 0 ? 1000 / targetFps : 0;
    
    // If strict limiting is needed we skip frames, but if 0 (uncapped) we proceed
    if (interval > 0) {
        const delta = now - lastLoopTime.current;
        if (delta < interval) {
            animationFrameId.current = requestAnimationFrame(update);
            return;
        }
        lastLoopTime.current = now - (delta % interval);
    } else {
        lastLoopTime.current = now;
    }

    // --- FPS Counter ---
    if (settingsRef.current.showFps && fpsRef.current) {
        // Simple smoothing
        const fps = Math.round(1000 / (now - lastFrameTime.current));
        fpsRef.current.innerText = `FPS: ${fps}`;
    }
    
    const dtRaw = (now - lastFrameTime.current) / 1000;
    // Cap dtRaw to prevent huge jumps if tab was inactive. 0.1s max frame time.
    const dtRawClamped = Math.min(dtRaw, 0.1); 
    lastFrameTime.current = now;

    const currentView = viewRef.current;
    const gs = gameStateRef.current;

    if (currentView !== 'game') {
        // Pass delta time to ensure background speed is frame-independent
        drawNetworkBackground(ctx, starsRef.current, gs.width, gs.height, dtRawClamped);
        animationFrameId.current = requestAnimationFrame(update);
        return;
    }

    // --- In Game Rendering ---
    
    const player = playerRef.current;
    
    if (gs.isActive) {
        checkTutorials(gs);
        
        if (!gs.isPaused) {
            gs.targetTimeScale = player.slowTimer > 0 ? 0.4 : 1.0;
            const lerpSpeed = dtRawClamped * 0.5;
            if (gs.currentTimeScale < gs.targetTimeScale) gs.currentTimeScale = Math.min(gs.targetTimeScale, gs.currentTimeScale + lerpSpeed);
            if (gs.currentTimeScale > gs.targetTimeScale) gs.currentTimeScale = Math.max(gs.targetTimeScale, gs.currentTimeScale - lerpSpeed);
        }
    }
    
    if (warpRef.current) {
        const warpOpacity = (!gs.isActive) ? 0 : Math.max(0, 1 - ((gs.currentTimeScale - 0.4) / 0.6));
        warpRef.current.style.opacity = warpOpacity.toString();
    }

    // Effective DT is 0 if paused
    const effectiveDt = (gs.isPaused) ? 0 : dtRawClamped * gs.currentTimeScale;

    // Lerp Visual Risk
    const riskLerp = 1 - Math.exp(-10 * dtRawClamped); // Faster lerp (was 5)
    visualRiskRef.current += (gs.currentRisk - visualRiskRef.current) * riskLerp;

    // Update Risk Meter DOM
    if (riskContainerRef.current && riskBarRef.current && riskTextRef.current) {
        if (gs.gameMode !== 'practice' && visualRiskRef.current > 0.5) {
            riskContainerRef.current.style.opacity = '1';
            riskBarRef.current.style.width = `${visualRiskRef.current}%`;
            riskTextRef.current.innerText = `RISK LEVEL ${Math.floor(visualRiskRef.current)}%`;
        } else {
            riskContainerRef.current.style.opacity = '0';
        }
    }

    clearCanvas(ctx, gs.width, gs.height);

    // Warp Speed Overlay if rocket boost active at start
    if (gs.isWarpingIn) {
        drawWarpBackground(ctx, gs.width, gs.height);
    }

    // Reduced Motion: Stars move slower or not at parallax depth speed
    starsRef.current.forEach(s => {
      const speedMod = settingsRef.current.reduceMotion ? 0.3 : 1.0;
      // Stars speed is now px/sec. Scale by effectiveDt (which includes warp)
      s.y += s.speed * effectiveDt * speedMod;
      if (gs.isWarpingIn) s.y += s.speed * effectiveDt * 5; // Extra fast during warp

      if (s.y > gs.height) {
        s.y = -10;
        s.x = Math.random() * gs.width;
      }
    });
    drawStars(ctx, starsRef.current, gs.height);
    drawFloor(ctx, gs);

    // --- GAMEPLAY UPDATE BLOCK ---
    if (gs.isActive && !gs.waitingForInput && !gs.isPaused) {
      
      const prevSlow = player.slowTimer;
      const prevShrink = player.shrinkTimer;

      gs.elapsedTime = ((Date.now() - gs.startTime) / 1000) + gs.timeOffset;
      if (timerRef.current) timerRef.current.innerText = Logic.formatTime(gs.elapsedTime);

      // --- GAME LOGIC (ONLY IF NOT PREVIEW) ---
      if (gs.gameMode !== 'preview') {
          // Checkpoint
          let currentMinute = Math.floor(gs.elapsedTime / 60);
          if (currentMinute > gs.lastCheckpointMinute) {
            gs.lastCheckpointMinute = currentMinute;
            setUiState(prev => ({ ...prev, showCheckpoint: true }));
            audioManager.playSfx('checkpoint');
            setTimeout(() => setUiState(prev => ({ ...prev, showCheckpoint: false })), 2000);
          }

          // Rising Floor
          if (gs.elapsedTime > CONSTANTS.FLOOR_RISING_TIME && gs.compressionState === 0) {
            gs.compressionState = 1; 
            audioManager.playSfx('alarm');
            setTimeout(() => {
                if(gameStateRef.current.isActive) gameStateRef.current.compressionState = 2; 
            }, 3000);
            setUiState(prev => ({ ...prev, triggerRender: prev.triggerRender + 1 }));
          }
          if (gs.compressionState === 2) {
            gs.compressionProgress = Math.min(1, gs.compressionProgress + effectiveDt * 0.5);
            const spikeZoneY = gs.height - (gs.height * 0.2 * gs.compressionProgress);
            if (player.y + player.radius > spikeZoneY) handleGameOver();
          }

          // Spawning
          if (gs.elapsedTime > CONSTANTS.TITAN_START_TIME && gs.titanCooldown > 0) gs.titanCooldown -= effectiveDt;

          let spawnRate = Math.max(CONSTANTS.SPAWN_RATE_MIN, CONSTANTS.SPAWN_RATE_MAX - (gs.elapsedTime * 2.5));
          spawnRate = spawnRate / gs.currentTimeScale;

          if (Date.now() - gs.lastSpawnTime > spawnRate) {
            obstaclesRef.current.push(Logic.spawnObstacle(gs, obstaclesRef.current));
            gs.lastSpawnTime = Date.now();
          }

          // Powerups
          if (gs.gameMode === 'normal' && Date.now() - gs.lastPowerupTime > CONSTANTS.POWERUP_INTERVAL) {
            const types: PowerUp['type'][] = ['shield', 'slow', 'shrink'];
            const idx = Math.floor(Math.random() * 3);
            const color = idx === 0 ? COLORS.PLAYER : idx === 1 ? COLORS.SEEKER : COLORS.GOLD;
            powerupsRef.current.push({
              id: Math.random().toString(),
              x: 50 + Math.random() * (gs.width - 100),
              y: -50,
              type: types[idx],
              color
            });
            gs.lastPowerupTime = Date.now();
          }
      }

      // --- GRAZING LOGIC ---
      if (gs.gameMode !== 'preview') {
          // Logic moved to gameLogic.ts updatePlayer, but we need to handle particle spawning here if returned
          // However, updatePlayer is called earlier. Let's check if we need to sync anything.
          // Actually, updatePlayer in gameLogic.ts handles risk update and coin calculation.
          // But wait, updatePlayer is called above at line ~866:
          // const playerUpdateResult = Logic.updatePlayer(...)
          
          // We need to capture the result from updatePlayer call earlier.
          // Let's go back and modify where updatePlayer is called.
      }

      // Obstacles Physics
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const o = obstaclesRef.current[i];
        
        // Showboat Logic (Continuous + Stacking)
        if (userProgressRef.current.upgrades.showboat && gs.gameMode !== 'preview') {
             const dx = player.x - o.x;
             const dy = player.y - o.y;
             const currentAngle = Math.atan2(dy, dx);
             
             if (o.lastPlayerAngle !== undefined) {
                 let delta = currentAngle - o.lastPlayerAngle;
                 // Normalize delta to [-PI, PI] to handle wrap-around
                 if (delta > Math.PI) delta -= 2 * Math.PI;
                 if (delta < -Math.PI) delta += 2 * Math.PI;
                 
                 o.accumulatedAngle = (o.accumulatedAngle || 0) + delta;
                 
                 // Check full circle (2 PI)
                 if (Math.abs(o.accumulatedAngle) >= Math.PI * 2) {
                     // Trigger reward
                     audioManager.playSfx('coin');
                     
                     // Increment stack count
                     o.showboatCount = (o.showboatCount || 0) + 1;
                     
                     // Reward = stack count
                     const reward = o.showboatCount;
                     
                     gs.showboatCoins = (gs.showboatCoins || 0) + reward;
                     gs.totalShowboats = (gs.totalShowboats || 0) + 1;
                     userProgressRef.current.coins += reward;
                     setUserProgress({...userProgressRef.current}); // trigger save/render
                     addFloatingText(player.x, player.y - 30, `SHOWBOAT x${o.showboatCount}`, `+${reward} COINS`, COLORS.GOLD);
                     
                     // Reset accumulated angle by subtracting 2 PI (preserving direction for next lap)
                     o.accumulatedAngle -= Math.PI * 2 * Math.sign(o.accumulatedAngle);
                 }
             }
             o.lastPlayerAngle = currentAngle;
        }

        if (o.type === 'titan') {
            const dx = player.x - o.x;
            const dy = player.y - o.y;
            const angle = Math.atan2(dy, dx); 
            o.angle = angle;
            // Scale velocity for time-based: 100 px/sec (approx 1.6 px/frame)
            o.x += Math.cos(angle) * 100 * effectiveDt;
            o.y += Math.sin(angle) * 100 * effectiveDt;
            o.life -= effectiveDt;
            
            if (o.life <= 0) {
                // TITAN SURVIVED LOGIC:
                gs.titansSurvived++;

                audioManager.playSfx('explosion_titan');
                const shardCount = Math.min(15, 5 + Math.max(0, Math.floor(gs.elapsedTime/60) - 3));
                for(let j=0; j<shardCount; j++) { 
                    particlesRef.current.push({ 
                        id: Math.random().toString(),
                        x: o.x, y: o.y, 
                        vx: Math.cos((Math.PI*2/shardCount)*j)*150, 
                        vy: Math.sin((Math.PI*2/shardCount)*j)*150, 
                        size: 10, 
                        life: 4.0, // Extended life to ensure it crosses screen
                        isDangerous: true
                    }); 
                }
                obstaclesRef.current.splice(i, 1); 
                continue;
            }
        } else if (o.type === 'seeker') {
             // Acceleration approx 450 px/sec^2
            const accel = 450 * effectiveDt;
            if (player.x > o.x) o.vx = Math.min(180, o.vx + accel); // Max speed 180
            else o.vx = Math.max(-180, o.vx - accel);
        } else if (o.type === 'side-seeker') {
            // Acceleration for side-seeker y-axis
            const accel = 450 * effectiveDt;
            if (player.y > o.y) o.vy = Math.min(180, o.vy + accel); // Max speed 180
            else o.vy = Math.max(-180, o.vy - accel);
            
            o.angle = Math.atan2(o.vy, o.vx) + Math.PI/2;
        }

        o.x += o.vx * effectiveDt;
        o.y += o.vy * effectiveDt;

        // Collision
        if (Math.hypot(player.x - o.x, player.y - o.y) < player.radius + o.size * 0.75) {
            if (gs.gameMode === 'practice') {
                obstaclesRef.current.splice(i, 1);
                audioManager.playSfx('shield_hit');
                continue;
            }
            const dmg = o.type === 'titan' ? 2 : 1;
            if (player.shields >= dmg) {
                player.shields -= dmg;
                audioManager.playSfx('shield_hit');
                obstaclesRef.current.splice(i, 1);
                setUiState(prev => ({...prev, triggerRender: prev.triggerRender + 1}));
            } else {
                handleGameOver();
            }
        }

        if (o.y > gs.height + 200 || o.x < -300 || o.x > gs.width + 300 || o.y < -200) {
           obstaclesRef.current.splice(i, 1);
        }
      }

      // Powerups Physics
      for (let i = powerupsRef.current.length - 1; i >= 0; i--) {
        const p = powerupsRef.current[i];
        // 120 px/sec (approx 2.0 px/frame)
        p.y += 120 * effectiveDt;
        
        if (Math.hypot(player.x - p.x, player.y - p.y) < player.radius + 20) {
            // Track Collection
            gs.powerupsCollected++;
            if (gs.gameMode !== 'practice' && gs.gameMode !== 'preview') {
                if (ChallengeService.onCollectPowerup(userProgressRef.current, gs)) {
                    audioManager.playSfx('challenge_complete');
                    addFloatingText(player.x, player.y, "CHALLENGE COMPLETE", "CHECK MISSION LOG", COLORS.GOLD);
                    setUserProgress({...userProgressRef.current});
                }
            }

            if (p.type === 'shield') { 
                const maxShields = CONSTANTS.BASE_MAX_SHIELDS + (userProgressRef.current.upgrades.maxShields * CONSTANTS.UPGRADE_BONUS_SHIELD);
                if (player.shields < maxShields) {
                    player.shields++; 
                    audioManager.playSfx('powerup'); 
                } else {
                     // Max Shields Logic - Refund with Coins
                     audioManager.playSfx('coin');
                     const refundAmount = 10;
                     userProgressRef.current.coins += refundAmount;
                     if (ChallengeService.trackCoinGain(userProgressRef.current, refundAmount)) {
                         audioManager.playSfx('challenge_complete');
                         addFloatingText(player.x, player.y, "CHALLENGE COMPLETE", "CHECK MISSION LOG", COLORS.GOLD);
                     }
                     setUserProgress({...userProgressRef.current}); // Update state to trigger save
                     addFloatingText(player.x, player.y, "MAX SHIELD", `+${refundAmount} COINS`, COLORS.GOLD);
                }
            }
            else if (p.type === 'slow') { 
                player.slowTimer = CONSTANTS.BASE_DURATION_SLOW + (userProgressRef.current.upgrades.durationSlow * CONSTANTS.UPGRADE_BONUS_DURATION); 
                audioManager.playSfx('slow_down'); 
            }
            else if (p.type === 'shrink') { 
                player.shrinkTimer = CONSTANTS.BASE_DURATION_SHRINK + (userProgressRef.current.upgrades.durationShrink * CONSTANTS.UPGRADE_BONUS_DURATION);
                audioManager.playSfx('shrink_down'); 
            }
            
            powerupsRef.current.splice(i, 1);
            setUiState(prev => ({...prev, triggerRender: prev.triggerRender + 1}));
        } else if (p.y > gs.height + 50) {
             powerupsRef.current.splice(i, 1);
        }
      }



      // Update Challenges
      if (gs.isActive && !gs.isGameOver && gs.gameMode !== 'preview' && gs.gameMode !== 'practice') {
          const { updated, completedCount } = ChallengeService.updateProgress(userProgressRef.current, gs, dtRawClamped);
          if (updated) {
              if (completedCount > 0) {
                  audioManager.playSfx('challenge_complete'); // Use new sound
                  addFloatingText(player.x, player.y, "CHALLENGE COMPLETE", "CHECK MISSION LOG", COLORS.GOLD);
              }
              setUserProgress({...userProgressRef.current});
          }
      }

      // Always draw player (even if paused)
      if (!gs.isPaused) {
          const updateResult = Logic.updatePlayer(player, gs.width, gs.height, dtRawClamped, obstaclesRef.current, gs, userProgressRef.current.upgrades.grazeBonus);
          const grazeCoins = updateResult.coins;
          
          if (updateResult.spawnParticle) {
              particlesRef.current.push(updateResult.spawnParticle);
          }

          if (grazeCoins > 0) {
              if (Date.now() - lastGrazeSfxTime.current > 150) {
                  audioManager.playSfx('graze');
                  lastGrazeSfxTime.current = Date.now();
              }
              accumulatedGrazeCoins.current += grazeCoins;
              if (accumulatedGrazeCoins.current >= 1) {
                  const amount = Math.floor(accumulatedGrazeCoins.current);
                  addFloatingText(player.x, player.y, `+${amount}`, "", COLORS.GOLD);
                  accumulatedGrazeCoins.current -= amount;
                  
                  // Update challenges
                  if (ChallengeService.trackCoinGain(userProgressRef.current, amount)) {
                      audioManager.playSfx('challenge_complete');
                      addFloatingText(player.x, player.y, "CHALLENGE COMPLETE", "CHECK MISSION LOG", COLORS.GOLD);
                      setUserProgress({...userProgressRef.current});
                  }
              }
          }
      }
      
      const currSlow = player.slowTimer;
      const currShrink = player.shrinkTimer;

      if (prevSlow > 0 && currSlow <= 0) audioManager.playSfx('slow_up');
      if (prevShrink > 0 && currShrink <= 0) audioManager.playSfx('shrink_up');

      if (Math.ceil(prevSlow) !== Math.ceil(currSlow) || Math.ceil(prevShrink) !== Math.ceil(currShrink)) {
         setUiState(prev => ({ ...prev, triggerRender: prev.triggerRender + 1 }));
      }

      // Gold Skin Sparkles
      if (player.skinId === 'gold' && Math.random() < 0.3) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * player.radius;
          particlesRef.current.push({
              id: `sparkle-${Date.now()}-${Math.random()}`,
              x: player.x + Math.cos(angle) * dist,
              y: player.y + Math.sin(angle) * dist,
              vx: (Math.random() - 0.5) * 20,
              vy: (Math.random() - 0.5) * 20,
              size: 2 + Math.random() * 3,
              life: 0.5 + Math.random() * 0.5,
              maxLife: 1.0,
              color: '#FFFFFF'
          });
      }

    } // END ACTIVE GAMEPLAY BLOCK
    
    // Independent Particle Physics
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        
        // Particles move independent of effectiveDt mostly, but respect slow-mo if active, game over slows them too
        const particleDt = (gs.isGameOver ? 0.3 : gs.currentTimeScale) * dtRawClamped;
        
        p.x += p.vx * particleDt;
        p.y += p.vy * particleDt;
        p.life -= particleDt * (gs.isGameOver ? 0.5 : 1.0); 
        
        if (gs.isActive && p.isDangerous && Math.hypot(player.x - p.x, player.y - p.y) < player.radius + p.size) {
            if (player.shields > 0) {
                    player.shields--;
                    audioManager.playSfx('shield_hit');
                    particlesRef.current.splice(i, 1);
                    setUiState(prev => ({...prev, triggerRender: prev.triggerRender + 1}));
            } else {
                    handleGameOver();
            }
        } else if (p.life <= 0 || p.x < -100 || p.x > gs.width + 100 || p.y < -100 || p.y > gs.height + 100) {
            particlesRef.current.splice(i, 1);
        }
    }
    
    obstaclesRef.current.forEach(o => drawObstacle(ctx, o));
    powerupsRef.current.forEach(p => drawPowerUp(ctx, p));
    drawParticles(ctx, particlesRef.current);

    if (!gs.isGameOver) {
        let visualRadius = Logic.getVisualRadius(player);
        if (gs.waitingForInput) {
            const pulse = 1 + Math.sin(Date.now() / 200) * 0.2;
            visualRadius *= pulse;
            
            ctx.save();
            ctx.shadowBlur = 20 + Math.sin(Date.now() / 200) * 10;
            ctx.shadowColor = COLORS.PLAYER;
            drawPlayer(ctx, player, visualRadius, gs.gameMode as any);
            ctx.restore();
        } else {
            drawPlayer(ctx, player, visualRadius, gs.gameMode as any);
        }
    }

    const ctrlPressed = keysPressed.current.has('control');
    const showHitboxes = settingsRef.current.showHitboxes !== ctrlPressed;

    if (showHitboxes && !gs.isGameOver && gs.isActive) {
        // Obstacle hitboxes
        obstaclesRef.current.forEach(o => {
            drawHitbox(ctx, o.x, o.y, o.size * 0.75);
        });
        // Player hitbox (on top of everything)
        drawHitbox(ctx, player.x, player.y, player.radius);
    }

    // Pause Overlay handled in React now
    // if (gs.isPaused) { ... }

    animationFrameId.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    lastFrameTime.current = Date.now();
    lastLoopTime.current = Date.now();
    animationFrameId.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId.current);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <div 
        ref={warpRef}
        className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-100"
        style={{ 
            background: `radial-gradient(circle, transparent 10%, ${COLORS.WARP} 100%)`,
            opacity: 0
        }}
      />
      
      {/* FPS Counter (Always Visible if enabled) */}
      <div 
        ref={fpsRef} 
        className={`absolute top-2 left-2 text-[#00ff00] font-mono text-xs z-[100] pointer-events-none ${settings.showFps ? 'block' : 'hidden'}`}
      >
        FPS: --
      </div>

      {uiState.view === 'game' && !uiState.isWaitingForStart && (
        <>
            {gameStateRef.current.gameMode === 'practice' && heatmapSettings.visible && (
                <HeatmapOverlay 
                    deaths={userProgress.deathHistory || []}
                    showNormal={heatmapSettings.showNormal}
                    showHardcore={heatmapSettings.showHardcore}
                    width={gameStateRef.current.width}
                    height={gameStateRef.current.height}
                />
            )}
            <HUD 
                gameState={gameStateRef.current} 
                visualRisk={visualRiskRef.current}
                player={playerRef.current} 
                onDebugToggle={(v) => { debugMode.current = v; }}
                timerRef={timerRef}
                floatingTexts={floatingTexts}
                heatmapSettings={gameStateRef.current.gameMode === 'practice' ? heatmapSettings : undefined}
                onUpdateHeatmap={setHeatmapSettings}
                riskBarRef={riskBarRef}
                riskTextRef={riskTextRef}
                riskContainerRef={riskContainerRef}
            />
            {/* Pause Overlay */}
            {uiState.isPaused && (
                <div className="absolute inset-0 z-[90] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="text-4xl font-black text-white mb-8 tracking-widest">PAUSED</div>
                    
                    <button
                        onClick={() => {
                            setUiState(prev => ({ ...prev, isPaused: false }));
                            gameStateRef.current.isPaused = false;
                            audioManager.playSfx('ui_click');
                        }}
                        className="bg-white text-black px-8 py-3 font-mono font-bold hover:bg-gray-200 transition-colors mb-4 min-w-[200px]"
                    >
                        RESUME
                    </button>
                    
                    <button
                        onClick={() => {
                            setUiState(prev => ({ ...prev, isPaused: false }));
                            gameStateRef.current.isPaused = false;
                            setView('menu');
                            audioManager.playTitleTheme();
                        }}
                        className="bg-red-500/20 border border-red-500 text-red-500 px-8 py-3 font-mono font-bold hover:bg-red-500 hover:text-white transition-colors min-w-[200px]"
                    >
                        ABORT RUN
                    </button>
                    
                    {gameStateRef.current.gameMode === 'practice' && (
                        <button
                            onClick={() => {
                                setUiState(prev => ({ ...prev, isPaused: false }));
                                gameStateRef.current.isPaused = false;
                                setView('menu');
                                audioManager.playTitleTheme();
                            }}
                            className="mt-4 bg-blue-500/20 border border-blue-500 text-blue-500 px-8 py-3 font-mono font-bold hover:bg-blue-500 hover:text-white transition-colors min-w-[200px]"
                        >
                            EXIT PRACTICE
                        </button>
                    )}
                </div>
            )}

            {/* Pause Button */}
            <button 
                onClick={(e) => {
                    e.stopPropagation(); // Prevent game interaction
                    togglePause();
                }}
                className="absolute top-5 right-5 z-[60] text-white/70 hover:text-white transition-colors"
                aria-label={uiState.isPaused ? "Resume" : "Pause"}
            >
                {uiState.isPaused ? (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                )}
            </button>
        </>
      )}
      
      {/* Preview Mode Overlay - ensure we check view AND mode */}
      {uiState.view === 'game' && gameStateRef.current.gameMode === 'preview' && (
          <div className="absolute top-5 right-5 z-[60]">
               <button
                    onClick={() => {
                        gameStateRef.current.isActive = false; 
                        gameStateRef.current.gameMode = 'normal'; // Reset logic state
                        audioManager.playSfx('ui_click');
                        audioManager.playTitleTheme();
                        setView('shop');
                    }}
                    className="bg-black/80 border border-red-500 text-red-500 px-4 py-2 font-mono font-bold hover:bg-red-500 hover:text-white transition-colors animate-pulse"
               >
                   EXIT PREVIEW
               </button>
          </div>
      )}

      {uiState.isWaitingForStart && (
          <div 
            className="absolute z-50 pointer-events-none"
            style={{
                left: playerRef.current.x,
                top: playerRef.current.y - 80, 
                transform: 'translateX(-50%)' // Center the container horizontally on player X
            }}
          >
              <div className="flex flex-col items-center gap-2 animate-bounce text-[#2ecc71]">
                  <span className="text-xl font-mono font-bold text-glow whitespace-nowrap">CLICK TO ENGAGE</span>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                  </svg>
              </div>
          </div>
      )}

      {/* Checkpoint Msg */}
      <div 
        className={`absolute bottom-32 left-1/2 -translate-x-1/2 text-[#f1c40f] text-2xl font-bold text-glow-gold transition-opacity duration-300 pointer-events-none z-50 ${uiState.showCheckpoint ? 'opacity-100' : 'opacity-0'}`}
      >
        CHECKPOINT REACHED
      </div>

      {uiState.view === 'splash' && (
        <SplashScreen onStart={handleSplashClick} />
      )}

      {uiState.view === 'menu' && (
        <>
            <MainMenu 
                onStartGame={initGameSequence} 
                onShowLeaderboard={() => { playClick(); setView('highscore_board'); }}
                onShowOptions={() => { playClick(); setView('options'); }}
                onShowShop={() => { playClick(); setView('shop'); }}
                onShowCredits={() => { playClick(); setView('credits'); }}
                onShowChallenges={() => { setShowChallenges(true); playClick(); }}
                hasUnclaimedRewards={userProgress.activeChallenges.some(c => c.completed && !c.claimed)}
                playHover={playHover}
                coins={userProgress.coins}
            />
        </>
      )}

      {showChallenges && (
          <ChallengesOverlay 
            challenges={userProgress.activeChallenges} 
            progressionIndex={userProgress.progressionMissionIndex || 0}
            userCoins={userProgress.coins}
            onClose={() => setShowChallenges(false)} 
            onReroll={(id) => {
                const result = ChallengeService.rerollChallenge(id, userProgressRef.current);
                if (result.success && result.newChallenge) {
                    audioManager.playSfx('menu_select');
                    setUserProgress({...userProgressRef.current});
                } else {
                    audioManager.playSfx('error');
                }
            }}
            onClaim={(id) => {
                const challenge = userProgressRef.current.activeChallenges.find(c => c.id === id);
                if (challenge && challenge.completed && !challenge.claimed) {
                    challenge.claimed = true;
                    
                    let newChallenges = [...userProgressRef.current.activeChallenges];
                    let newProgressionIndex = userProgressRef.current.progressionMissionIndex;

                    if (challenge.type === 'repeatable') {
                        const idx = newChallenges.findIndex(c => c.id === id);
                        if (idx !== -1) {
                            newChallenges[idx] = ChallengeService.generateSingleRepeatableChallenge(newChallenges, userProgressRef.current);
                        }
                    } else if (challenge.type === 'progression') {
                         newChallenges = newChallenges.filter(c => c.id !== id);
                         newProgressionIndex = (newProgressionIndex || 0) + 1;
                         
                         // Add next mission
                         const tempProgress = { 
                             ...userProgressRef.current, 
                             activeChallenges: newChallenges, 
                             progressionMissionIndex: newProgressionIndex 
                         };
                         ChallengeService.ensureProgressionMission(tempProgress);
                         newChallenges = tempProgress.activeChallenges;
                    }

                    const newProgress = {
                        ...userProgressRef.current,
                        activeChallenges: newChallenges,
                        coins: userProgressRef.current.coins + challenge.reward,
                        progressionMissionIndex: newProgressionIndex
                    };
                    setUserProgress(newProgress);
                    audioManager.playSfx('coin');
                }
            }}
          />
      )}

      {uiState.view === 'shop' && (
        <ShopScreen 
            progress={userProgress}
            onUpdateProgress={setUserProgress}
            onClose={() => setView('menu')}
            onPreview={startPreview}
            playClick={playClick}
            playHover={playHover}
            initialTab={shopState.tab}
            initialScroll={shopState.scroll}
        />
      )}

      {uiState.view === 'loadout' && (
          <LoadoutScreen
            mode={pendingModeRef.current === 'hardcore' ? 'hardcore' : 'normal'}
            progress={userProgress}
            onUpdateProgress={setUserProgress}
            onStart={(loadout) => {
                activeLoadout.current = loadout;
                startGame(pendingModeRef.current === 'hardcore' ? 'hardcore' : 'normal');
            }}
            onCancel={() => setView('menu')}
            playClick={playClick}
          />
      )}

      {uiState.view === 'options' && (
        <OptionsScreen 
            onClose={() => { setView('menu'); }}
            playClick={playClick}
            playHover={playHover}
        />
      )}

      {uiState.view === 'highscore_entry' && (
        <HighScoreInput 
            initials={hsInitials} 
            setInitials={setHsInitials} 
            onSubmit={submitHighScore} 
            playHover={playHover}
        />
      )}

      {uiState.view === 'highscore_board' && (
        <Leaderboard 
            initialMode={(gameStateRef.current.gameMode === 'preview' || gameStateRef.current.gameMode === 'practice') ? 'normal' : gameStateRef.current.gameMode}
            onClose={() => setView('menu')}
            playClick={playClick}
            playHover={playHover}
        />
      )}

      {uiState.view === 'credits' && (
        <CreditsScreen 
            onClose={() => setView('menu')}
            playClick={playClick}
        />
      )}

      {uiState.view === 'gameover' && (
        <GameOverScreen gameState={gameStateRef.current} isTutorialActive={!!activeTutorial} />
      )}

      {debugMode.current && (
          <div className="absolute bottom-1 left-1 text-red-600 font-mono font-black text-xl z-[100] animate-pulse pointer-events-none select-none">
              [!D!]
          </div>
      )}

      {activeTutorial && (
          <TutorialOverlay 
              title={activeTutorial.title}
              message={activeTutorial.message}
              onDismiss={() => {
                  setActiveTutorial(null);
                  // Unpause
                  gameStateRef.current.isPaused = false;
                  setUiState(prev => ({ ...prev, isPaused: false }));
                  audioManager.playSfx('menu_close');
                  lastFrameTime.current = Date.now(); // Reset frame time so we don't jump
              }}
          />
      )}

      <canvas ref={canvasRef} className="block" />
    </div>
  );
};

export default GameCanvas;
