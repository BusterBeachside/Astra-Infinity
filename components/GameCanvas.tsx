
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Player, Obstacle, Star, PowerUp, Particle, GameState, UserProgress, LoadoutState, GameSettings, FloatingText, TrailType } from '../types';
import { CONSTANTS, COLORS } from '../constants';
import * as Logic from '../services/gameLogic';
import * as Storage from '../services/storage';
import { drawNetworkBackground, drawStars, drawFloor, drawWarpBackground } from '../services/renderBackground';
import { clearCanvas, drawObstacle, drawPowerUp, drawParticles, drawPlayer } from '../services/renderGame';
import { audioManager } from '../services/audioManager';

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

type ViewState = 'splash' | 'menu' | 'game' | 'gameover' | 'highscore_entry' | 'highscore_board' | 'options' | 'shop' | 'loadout' | 'credits';

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<HTMLDivElement>(null);
  const warpRef = useRef<HTMLDivElement>(null);
  
  const animationFrameId = useRef<number>(0);
  const lastFrameTime = useRef<number>(0); // Time of last processed frame
  const lastLoopTime = useRef<number>(0); // Time of last loop execution (for fps calc)
  
  const debugMode = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const viewRef = useRef<ViewState>('splash');
  const pendingModeRef = useRef<'normal' | 'hardcore'>('normal');

  // Persistent User Progress - synced with Ref for GameLoop access
  const userProgressRef = useRef<UserProgress>(Storage.getUserProgress());
  const [userProgress, setUserProgressState] = useState<UserProgress>(userProgressRef.current);
  
  // Game Settings
  const settingsRef = useRef<GameSettings>(Storage.getGameSettings());
  const [settings, setSettings] = useState<GameSettings>(settingsRef.current);

  // Shop State Management
  const [shopState, setShopState] = useState<{ tab: 'modules' | 'trails', scroll: number }>({ tab: 'modules', scroll: 0 });

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
  const gameStateRef = useRef<GameState>({
    isActive: false,
    waitingForInput: false,
    isGameOver: false,
    gameMode: 'normal',
    width: 100, 
    height: 100,
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
    isWarpingIn: false
  });

  const playerRef = useRef<Player>({
    x: 0, y: 0, radius: CONSTANTS.PLAYER_BASE_RADIUS, baseRadius: CONSTANTS.PLAYER_BASE_RADIUS,
    targetX: 0, targetY: 0, lerp: 0.25, shields: 0, shrinkTimer: 0, slowTimer: 0, trail: [], trailType: 'default'
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
    isWaitingForStart: false
  });
  
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  const [hsInitials, setHsInitials] = useState('');

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

    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        canvasRef.current.width = clientWidth;
        canvasRef.current.height = clientHeight;
        gameStateRef.current.width = clientWidth;
        gameStateRef.current.height = clientHeight;
        
        // Center-Bottom alignment fix on resize
        if (!gameStateRef.current.isActive) {
           playerRef.current.x = clientWidth / 2;
           playerRef.current.y = clientHeight * 0.75;
           playerRef.current.targetX = clientWidth / 2;
           playerRef.current.targetY = clientHeight * 0.75;
           
           // Force render to update "Click to engage" position
           setUiState(prev => ({...prev, triggerRender: prev.triggerRender + 1}));
        }

        starsRef.current = Logic.initStars(clientWidth, clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 

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

  const initGameSequence = (mode: 'normal' | 'hardcore') => {
      playClick();
      pendingModeRef.current = mode;
      // Show loadout screen for both modes now
      setView('loadout');
  };

  const startGame = (mode: 'normal' | 'hardcore') => {
    // Determine start time based on Rocket Boost
    const startOffset = activeLoadout.current.rocketBoost ? 60 : 0;
    
    const { width, height } = gameStateRef.current;
    
    audioManager.stopMusic();

    let currentBest = 0;
    const scores = Storage.getHighScores(mode);
    if (scores.length > 0) currentBest = scores[0].score;

    gameStateRef.current = {
      ...gameStateRef.current,
      isActive: true,
      waitingForInput: true, 
      isGameOver: false,
      gameMode: mode,
      startTime: 0, 
      elapsedTime: startOffset,
      timeOffset: startOffset, // If boosted, logic thinks 60s passed
      lastSpawnTime: Date.now(),
      lastPowerupTime: Date.now(),
      lastCheckpointMinute: Math.floor(startOffset / 60),
      compressionState: 0,
      compressionProgress: 0,
      currentTimeScale: 1.0,
      targetTimeScale: 1.0,
      titanCooldown: 0,
      titansSurvived: 0,
      highScore: currentBest,
      coinsEarned: 0,
      isWarpingIn: false // Default false, activated on click
    };

    obstaclesRef.current = [];
    powerupsRef.current = [];
    particlesRef.current = [];
    starsRef.current = Logic.initStars(width, height);
    
    // Reset Player
    const initialShields = activeLoadout.current.startShield ? 1 : 0;
    
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
      trailType: userProgressRef.current.equippedTrail || 'default'
    };

    setUiState(prev => ({ ...prev, isWaitingForStart: true }));
    setView('game');
    lastFrameTime.current = Date.now();
  };
  
  const startPreview = (trailId: TrailType, currentTab: 'modules' | 'trails', currentScroll: number) => {
      const { width, height } = gameStateRef.current;
      audioManager.stopMusic();

      // Save Shop state to resume later
      setShopState({ tab: currentTab, scroll: currentScroll });
      
      gameStateRef.current = {
          ...gameStateRef.current,
          isActive: true,
          waitingForInput: false,
          isGameOver: false,
          gameMode: 'preview',
          startTime: Date.now(),
          elapsedTime: 0,
          currentTimeScale: 1.0,
          targetTimeScale: 1.0,
          compressionState: 0,
          compressionProgress: 0,
          isWarpingIn: false
      };
      
      obstaclesRef.current = [];
      powerupsRef.current = [];
      particlesRef.current = [];
      starsRef.current = Logic.initStars(width, height);
      
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
          trailType: trailId
      };
      
      setUiState(prev => ({ ...prev, isWaitingForStart: false }));
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
    
    // Calculate Coins
    const breakdown = Logic.calculateCoins(
        gs.elapsedTime, 
        gs.gameMode, 
        activeLoadout.current.doubleCoins,
        userProgressRef.current.upgrades.permDoubleCoins,
        gs.titansSurvived
    );
    gs.coinBreakdown = breakdown;
    gs.coinsEarned = breakdown.total;

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
        const isHigh = mode !== 'preview' && Storage.checkIsHighScore(gs.elapsedTime, mode);
        
        if (isHigh) {
            const lastInitials = localStorage.getItem('stellar_last_initials') || '';
            setHsInitials(lastInitials);
            setView('highscore_entry');
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

     if (mode === 'preview') return;
     
     localStorage.setItem('stellar_last_initials', hsInitials.toUpperCase());

     Storage.saveHighScore({
         name: hsInitials.toUpperCase().substring(0, 3),
         score: gs.elapsedTime,
         date: new Date().toLocaleDateString()
     }, mode);
     
     audioManager.playTitleTheme();
     setView('gameover');
  };

  const handleInteraction = useCallback((clientX: number, clientY: number, isTap: boolean) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

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
    const onMouseMove = (e: MouseEvent) => handleInteraction(e.clientX, e.clientY, false);
    const onTouchMove = (e: TouchEvent) => handleInteraction(e.touches[0].clientX, e.touches[0].clientY, false);
    const onTouchStart = (e: TouchEvent) => handleInteraction(e.touches[0].clientX, e.touches[0].clientY, true);
    const onMouseDown = (e: MouseEvent) => handleInteraction(e.clientX, e.clientY, true);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('mousedown', onMouseDown);

    const onKeyDown = (e: KeyboardEvent) => {
        if (viewRef.current === 'highscore_entry' && e.key === 'Enter') {
            submitHighScore();
            return;
        }

        if (!debugMode.current || !gameStateRef.current.isActive) return;
        const key = e.key.toLowerCase();
        if (key === 'z') { playerRef.current.shields++; setUiState(p => ({...p, triggerRender: p.triggerRender+1})); }
        if (key === 'x') { playerRef.current.slowTimer = 10; setUiState(p => ({...p, triggerRender: p.triggerRender+1})); }
        if (key === 'c') { playerRef.current.shrinkTimer = 30; setUiState(p => ({...p, triggerRender: p.triggerRender+1})); }
        if (key === 'a') {
            const currentMin = Math.floor(gameStateRef.current.elapsedTime / 60);
            const targetTime = (currentMin + 1) * 60 - 0.5;
            gameStateRef.current.timeOffset += (targetTime - gameStateRef.current.elapsedTime);
        }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleInteraction, hsInitials]);

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
        gs.targetTimeScale = player.slowTimer > 0 ? 0.4 : 1.0;
        const lerpSpeed = dtRawClamped * 0.5;
        if (gs.currentTimeScale < gs.targetTimeScale) gs.currentTimeScale = Math.min(gs.targetTimeScale, gs.currentTimeScale + lerpSpeed);
        if (gs.currentTimeScale > gs.targetTimeScale) gs.currentTimeScale = Math.max(gs.targetTimeScale, gs.currentTimeScale - lerpSpeed);
    }
    
    if (warpRef.current) {
        const warpOpacity = (!gs.isActive) ? 0 : Math.max(0, 1 - ((gs.currentTimeScale - 0.4) / 0.6));
        warpRef.current.style.opacity = warpOpacity.toString();
    }

    const effectiveDt = dtRawClamped * gs.currentTimeScale;

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
    if (gs.isActive && !gs.waitingForInput) {
      
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

      Logic.updatePlayer(player, gs.width, gs.height, dtRawClamped);
      
      const currSlow = player.slowTimer;
      const currShrink = player.shrinkTimer;

      if (prevSlow > 0 && currSlow <= 0) audioManager.playSfx('slow_up');
      if (prevShrink > 0 && currShrink <= 0) audioManager.playSfx('shrink_up');

      if (Math.ceil(prevSlow) !== Math.ceil(currSlow) || Math.ceil(prevShrink) !== Math.ceil(currShrink)) {
         setUiState(prev => ({ ...prev, triggerRender: prev.triggerRender + 1 }));
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
                        life: 4.0 // Extended life to ensure it crosses screen
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

    } // END ACTIVE GAMEPLAY BLOCK
    
    // Independent Particle Physics
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        
        // Particles move independent of effectiveDt mostly, but respect slow-mo if active, game over slows them too
        const particleDt = (gs.isGameOver ? 0.3 : gs.currentTimeScale) * dtRawClamped;
        
        p.x += p.vx * particleDt;
        p.y += p.vy * particleDt;
        p.life -= particleDt * (gs.isGameOver ? 0.5 : 1.0); 
        
        if (gs.isActive && Math.hypot(player.x - p.x, player.y - p.y) < player.radius + p.size) {
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
            drawPlayer(ctx, player, visualRadius);
            ctx.restore();
        } else {
            drawPlayer(ctx, player, visualRadius);
        }
    }

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
        <HUD 
            gameState={gameStateRef.current} 
            player={playerRef.current} 
            onDebugToggle={(v) => { debugMode.current = v; }}
            timerRef={timerRef}
            floatingTexts={floatingTexts}
        />
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
        <MainMenu 
            onStartGame={initGameSequence} 
            onShowLeaderboard={() => { playClick(); setView('highscore_board'); }}
            onShowOptions={() => { playClick(); setView('options'); }}
            onShowShop={() => { playClick(); setView('shop'); }}
            onShowCredits={() => { playClick(); setView('credits'); }}
            playHover={playHover}
            coins={userProgress.coins}
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
            mode={pendingModeRef.current}
            progress={userProgress}
            onUpdateProgress={setUserProgress}
            onStart={(loadout) => {
                activeLoadout.current = loadout;
                startGame(pendingModeRef.current);
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
            initialMode={gameStateRef.current.gameMode === 'preview' ? 'normal' : gameStateRef.current.gameMode}
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
        <GameOverScreen gameState={gameStateRef.current} />
      )}

      <canvas ref={canvasRef} className="block" />
    </div>
  );
};

export default GameCanvas;
