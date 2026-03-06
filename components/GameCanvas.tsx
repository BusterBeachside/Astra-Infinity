
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Player, Obstacle, Star, PowerUp, Particle, GameState, UserProgress, LoadoutState, GameSettings, FloatingText, TrailType, GameMode, ReplayData, ReplayInputFrame, ViewState } from '../types';
import { CONSTANTS, COLORS, GRAZE_CONFIG } from '../constants';
import * as Logic from '../services/gameLogic';
import * as Storage from '../services/storage';
import { saveReplay } from '../services/storage';
import { RNG, VisualRNG } from '../services/rng';
import { drawNetworkBackground, drawStars, drawFloor, drawWarpBackground } from '../services/renderBackground';
import { clearCanvas, drawObstacle, drawPowerUp, drawParticles } from '../services/renderGame';
import { drawPlayer, drawHitbox } from '../services/renderPlayer';
import { audioManager } from '../services/audioManager';
import { ChallengeService } from '../services/challengeService';
import { supabaseService } from '../services/supabaseService';
import { useGameInput } from '../hooks/useGameInput';
import { useGameEngine } from '../hooks/useGameEngine';

import GameOverlay from './GameOverlay';

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<HTMLDivElement>(null);
  const warpRef = useRef<HTMLDivElement>(null);
  const riskBarRef = useRef<HTMLDivElement>(null);
  const riskTextRef = useRef<HTMLDivElement>(null);
  const riskContainerRef = useRef<HTMLDivElement>(null);
  const replayTimerRef = useRef<HTMLDivElement>(null);
  
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

  // Menu Memory States
  const [leaderboardMode, setLeaderboardMode] = useState<'normal' | 'hardcore' | 'chaos'>('normal');
  const [onlineLeaderboardMode, setOnlineLeaderboardMode] = useState<'normal' | 'hardcore' | 'chaos'>('normal');
  const [replayFilter, setReplayFilter] = useState<GameMode | 'all'>('all');

  // Tutorial State
  const [activeTutorial, setActiveTutorial] = useState<{ id: string; title: string; message: string; nextTimeJump?: number; spawnPowerup?: boolean } | null>(null);

  const [showChallenges, setShowChallenges] = useState(false);
  const [heatmapSettings, setHeatmapSettings] = useState({ visible: false, showNormal: true, showHardcore: true, showChaos: true });

  const [uiState, setUiState] = useState({
    view: 'splash' as ViewState,
    showCheckpoint: false,
    triggerRender: 0,
    isWaitingForStart: false,
    isPaused: false,
    isInitialGate: false,
    loadingMessage: ''
  });
  
  const [returnView, setReturnView] = useState<ViewState>('menu');
  
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [hsInitials, setHsInitials] = useState('');

  const startTutorial = () => {
      playClick();
      pendingModeRef.current = 'tutorial';
      startGame('tutorial');
  };

  const handleTutorialDismiss = () => {
      const gs = gameStateRef.current;
      const tutorial = activeTutorial;
      setActiveTutorial(null);
      
      // Unpause
      if (gs.pauseStartTime) {
          const pauseDuration = Date.now() - gs.pauseStartTime;
          gs.startTime += pauseDuration;
          gs.lastSpawnTime += pauseDuration;
          gs.lastPowerupTime += pauseDuration;
      }
      gs.pauseStartTime = undefined;

      // Handle Tutorial specific actions
      if (tutorial) {
          if (tutorial.nextTimeJump !== undefined) {
              gs.elapsedTime = tutorial.nextTimeJump;
              // Reset last spawn time to trigger immediate spawn after jump if needed
              // or just let it flow.
          }
          if ((tutorial as any).spawnPowerup) {
              (gs as any).spawnTutorialPowerup = true;
          }
      }
      
      gs.isPaused = false;
      setUiState(prev => ({ ...prev, isPaused: false }));
      audioManager.playSfx('menu_close');
  };

  const updateSettings = () => {
      const s = Storage.getGameSettings();
      settingsRef.current = s;
      setSettings(s);
  };

  const setUserProgress = (p: UserProgress | ((prev: UserProgress) => UserProgress)) => {
      const currentP = userProgressRef.current;
      const newP = typeof p === 'function' ? p(currentP) : p;
      
      // Only update if it's actually different (shallow check for performance)
      if (newP === currentP) return;

      userProgressRef.current = newP;
      setUserProgressState(newP);
      Storage.saveUserProgress(newP);
  };

  const syncOnlineData = async () => {
      setUiState(prev => ({ ...prev, loadingMessage: 'SYNCHRONIZING PILOT DATA...' }));
      try {
          const onlineData = await supabaseService.fetchUserData();
          if (onlineData) {
              const newProgress = { 
                  ...userProgressRef.current, 
                  coins: onlineData.progress.coins ?? userProgressRef.current.coins,
                  stats: { ...userProgressRef.current.stats, ...(onlineData.progress.stats || {}) }
              };
              setUserProgress(newProgress);
              
              if (onlineData.settings) {
                  const newSettings = { ...settingsRef.current, ...onlineData.settings };
                  Storage.saveGameSettings(newSettings);
                  setSettings(newSettings);
                  settingsRef.current = newSettings;
              }
          }
      } finally {
          setUiState(prev => ({ ...prev, loadingMessage: '' }));
      }
  };

  const addFloatingText = (x: number, y: number, text: string, subText?: string, color: string = '#ffffff') => {
      const id = VisualRNG.id();
      setFloatingTexts(prev => [...prev, { id, x, y, text, subText, color, life: 1000 }]);
      setTimeout(() => {
          setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
      }, 1000);
  };

  const setView = (newView: ViewState) => {
      // Play menu sound ANY time we enter menu, except initially if already there (though logic prevents that)
      if (newView === 'menu') {
        updateSettings(); // Refresh settings when returning to menu
        setUiState(prev => ({ ...prev, isInitialGate: false }));
        setTimeout(() => {
            audioManager.playSfx('menu_open');
        }, 100);
      }
      
      viewRef.current = newView;
      setUiState(prev => ({ ...prev, view: newView }));
  };

  const {
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
      replaySpeedRef,
      lastRecordedReplayIdRef,
      startGame,
      startPreview,
      startReplay: engineStartReplay,
      startActualGameplay,
      handleGameOver,
      resetResolution
  } = useGameEngine({
      canvasRef,
      containerRef,
      uiState,
      setUiState,
      viewRef,
      setView,
      userProgressRef,
      setUserProgress,
      settingsRef,
      debugMode,
      activeTutorial,
      setActiveTutorial,
      setHsInitials,
      keysPressed,
      warpRef,
      fpsRef,
      timerRef,
      riskBarRef,
      riskTextRef,
      riskContainerRef,
      replayTimerRef,
      addFloatingText
  });

  const startReplay = (replay: ReplayData) => {
      setReturnView(viewRef.current);
      engineStartReplay(replay);
  };

  const handleWatchOnlineReplay = async (path: string) => {
      setUiState(prev => ({ ...prev, loadingMessage: 'DOWNLOADING REPLAY FROM ASTRA_NET...' }));
      setReturnView('online_leaderboard'); // Explicitly return to leaderboard
      try {
          const replay = await supabaseService.downloadReplay(path);
          if (replay) {
              engineStartReplay(replay);
          } else {
              audioManager.playSfx('error');
              setView('online_leaderboard');
          }
      } finally {
          setUiState(prev => ({ ...prev, loadingMessage: '' }));
      }
  };

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
          
          // Reset frame time to prevent huge delta - handled in useGameEngine loop but good to have here if we were managing loop
      }
  }, []);
  
  const playHover = () => audioManager.playSfx('ui_hover');
  const playClick = () => audioManager.playSfx('ui_click');

  const checkDailyReset = useCallback(() => {
    const today = ChallengeService.getTodayString();
    const progress = userProgressRef.current;
    
    if (progress.lastChallengeDate !== today) {
        // Filter out old daily missions
        const nonDaily = progress.activeChallenges.filter(c => c.type !== 'daily');
        
        // Generate new daily missions
        const daily = ChallengeService.generateDailyChallenges(progress.lastChallengeDate, nonDaily, progress);
        
        // If it's a new day, we also refresh repeatable missions to give a fresh start
        const repeatable = ChallengeService.generateRepeatableChallenges(3, daily, progress);
        
        const newProgress = {
            ...progress,
            activeChallenges: [...daily, ...repeatable, ...nonDaily.filter(c => c.type === 'progression')],
            lastChallengeDate: today
        };
        setUserProgress(newProgress);
        
        audioManager.playSfx('checkpoint');
    } else {
        // Even if it's the same day, ensure we have daily missions if they are missing for some reason
        const dailyMissions = progress.activeChallenges.filter(c => c.type === 'daily');
        if (dailyMissions.length === 0) {
            const daily = ChallengeService.generateDailyChallenges("", progress.activeChallenges, progress);
            if (daily.length > 0) {
                setUserProgress({
                    ...progress,
                    activeChallenges: [...progress.activeChallenges, ...daily]
                });
            }
        }
    }
  }, []);

  useEffect(() => {
    if (showChallenges) {
        checkDailyReset();
    }
  }, [showChallenges, checkDailyReset]);

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

    // Initial check
    checkDailyReset();

    // Periodic check every minute for midnight crossing
    const resetInterval = setInterval(checkDailyReset, 60000);

    const handleResize = () => {
      if (gameStateRef.current.isReplay) return;
      
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
    
    const handleVisibilityChange = () => {
        if (document.hidden) {
            audioManager.setMuted(true);
        } else {
            audioManager.setMuted(false);
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

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
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(resetInterval);
      audioManager.stopMusic();
    };
  }, [checkDailyReset]);

  const handleSplashClick = async () => {
      // Ensure audio context is resumed on user gesture
      await audioManager.resumeContext();
      
      if (uiState.view === 'splash') {
          audioManager.playTitleTheme();
          playClick();
          
          // Check if user is already logged in
          const user = await supabaseService.getCurrentUser();
          if (user) {
              await syncOnlineData();
              setView('menu');
          } else {
              setUiState(prev => ({ ...prev, isInitialGate: true }));
              setView('auth');
          }
      } else if (uiState.view === 'gameover') {
          playClick();
          if (gameStateRef.current.isReplay) {
              // Exit replay logic
              gameStateRef.current.isActive = false;
              gameStateRef.current.isReplay = false;
              gameStateRef.current.currentTimeScale = 1.0;
              
              resetResolution();

              setView(returnView);
              audioManager.playTitleTheme();
          } else {
              setView('menu');
              audioManager.playTitleTheme();
          }
      }
  };

  const handlePlayOffline = () => {
      playClick();
      setView('menu');
  };

  const submitHighScore = async () => {
      const gs = gameStateRef.current;
      if (!hsInitials || hsInitials.length !== 3) {
          audioManager.playSfx('error');
          return;
      }
      
      const mode = gs.gameMode as 'normal' | 'hardcore';
      
      const replay: ReplayData | null = replayRecordingRef.current ? {
          id: lastRecordedReplayIdRef.current || `run_${Date.now()}`,
          date: Date.now(),
          seed: replayRecordingRef.current.seed,
          width: gs.width,
          height: gs.height,
          gameMode: gs.gameMode,
          duration: gs.elapsedTime,
          score: gs.elapsedTime,
          grazeTime: gs.grazeTime,
          showboats: gs.totalShowboats,
          upgrades: userProgressRef.current.upgrades,
          loadout: activeLoadout.current,
          chaosModules: gs.chaosModules,
          skinId: userProgressRef.current.equippedSkin,
          trailType: userProgressRef.current.equippedTrail,
          inputs: replayRecordingRef.current.inputs,
          version: '2.4.0'
      } : null;

      // Show loading if we are logged in (as it will sync to cloud)
      const user = await supabaseService.getCurrentUser();
      if (user) {
          setUiState(prev => ({ ...prev, loadingMessage: 'UPLOADING RECORD TO ASTRA_NET...' }));
      }

      const metadata = {
          upgrades: userProgress.upgrades,
          skinId: userProgress.equippedSkin,
          trailType: userProgress.equippedTrail,
          avatarId: userProgressRef.current.stats.totalRuns > 0 ? (await supabaseService.getProfile(user?.id || ''))?.avatar_id : undefined,
          mode,
          chaosModules: gs.chaosModules
      };

      try {
          await Storage.saveHighScore({
              score: gs.elapsedTime, 
              name: hsInitials.toUpperCase(),
              date: new Date().toISOString(),
              replayId: replay?.id,
              metadata
          }, mode, replay);
      } finally {
          setUiState(prev => ({ ...prev, loadingMessage: '' }));
      }
      
      localStorage.setItem('stellar_last_initials', hsInitials.toUpperCase());
      
      audioManager.playSfx('ui_click');
      setView('gameover');
  };

  const initGameSequence = (mode: GameMode) => {
      playClick();
      pendingModeRef.current = mode;
      
      if (mode === 'practice' || mode === 'chaos') {
          setView('chaos_loadout');
      } else {
          // Show loadout screen for normal/hardcore
          setView('loadout');
      }
  };

  useGameInput({
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
  });

  useEffect(() => {
    if (activeTutorial) return;

    const progress = userProgressRef.current;
    const seen = progress.tutorialsSeen || {};
    let newTutorial = null;

    if (uiState.view === 'gameover' && !seen['coins']) {
        newTutorial = {
            id: 'coins',
            title: 'MISSION DEBRIEF',
            message: 'Survival time earns COINS. Use them in the SHOP to upgrade your ship.'
        };
    } else if (uiState.view === 'loadout' && !seen['loadout']) {
        newTutorial = {
            id: 'loadout',
            title: 'Pre-Flight Prep',
            message: 'Equip one-time use modules here to boost your next run.'
        };
    } else if (uiState.view === 'shop' && !seen['shop']) {
        newTutorial = {
            id: 'shop',
            title: 'Galactic Bazaar',
            message: 'Spend your hard-earned coins here on upgrades, new trails, and skins.'
        };
    } else if (showChallenges && !seen['missions']) {
        newTutorial = {
            id: 'missions',
            title: 'Mission Control',
            message: 'Complete Missions for extra COIN rewards. Daily missions reset at midnight. Progression Missions are recommended for both new and seasoned pilots.'
        };
    }

    if (newTutorial) {
        setActiveTutorial(newTutorial);
        const newProgress = { 
            ...progress, 
            tutorialsSeen: { ...seen, [newTutorial.id]: true } 
        };
        setUserProgress(newProgress);
        audioManager.playSfx('menu_open');
    }
  }, [uiState.view, showChallenges, activeTutorial]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden select-none touch-none"
      style={{ 
        touchAction: 'none',
        filter: settings.colorBlindMode !== 'none' ? `url(#${settings.colorBlindMode}-filter)` : 'none'
      }}
    >
      <GameOverlay 
          uiState={uiState}
          gameState={gameStateRef.current}
          userProgress={userProgress}
          player={playerRef.current}
          settings={settings}
          activeTutorial={activeTutorial}
          floatingTexts={floatingTexts}
          hsInitials={hsInitials}
          debugMode={debugMode.current}
          heatmapSettings={heatmapSettings}
          showChallenges={showChallenges}
          shopState={shopState}
          pendingMode={pendingModeRef.current}
          activeReplay={activeReplayRef.current}
          replaySpeed={replaySpeedRef.current}
          
          warpRef={warpRef}
          fpsRef={fpsRef}
          timerRef={timerRef}
          riskBarRef={riskBarRef}
          riskTextRef={riskTextRef}
          riskContainerRef={riskContainerRef}
          replayTimerRef={replayTimerRef}

          setUiState={setUiState}
          setView={setView}
          setUserProgress={setUserProgress}
          setHeatmapSettings={setHeatmapSettings}
          setHsInitials={setHsInitials}
          setShowChallenges={setShowChallenges}
          setActiveTutorial={setActiveTutorial}
          togglePause={togglePause}
          startGame={startGame}
          startPreview={startPreview}
          startReplay={startReplay}
          submitHighScore={submitHighScore}
          playClick={playClick}
          playHover={playHover}
          onDebugToggle={(v) => { debugMode.current = v; setUiState(p => ({...p, triggerRender: p.triggerRender+1})); }}
          handleSplashClick={handleSplashClick}
          initGameSequence={initGameSequence}
          setReplaySpeed={(speed) => { replaySpeedRef.current = speed; setUiState(prev => ({ ...prev, triggerRender: prev.triggerRender + 1 })); }}
          exitReplay={() => {
              gameStateRef.current.isActive = false;
              gameStateRef.current.isReplay = false;
              gameStateRef.current.currentTimeScale = 1.0;
              
              resetResolution();

              setView(returnView);
              audioManager.playTitleTheme();
          }}
          onLoadoutStart={(loadout) => {
              activeLoadout.current = loadout;
              startGame(pendingModeRef.current);
          }}
          onTutorial={startTutorial}
          onTutorialDismiss={handleTutorialDismiss}
          onLoginSuccess={syncOnlineData}
          onPlayOffline={handlePlayOffline}
          onWatchOnlineReplay={handleWatchOnlineReplay}
          leaderboardMode={leaderboardMode}
          setLeaderboardMode={setLeaderboardMode}
          onlineLeaderboardMode={onlineLeaderboardMode}
          setOnlineLeaderboardMode={setOnlineLeaderboardMode}
          replayFilter={replayFilter}
          setReplayFilter={setReplayFilter}
          setShopState={setShopState}
      />
      <canvas ref={canvasRef} className="block w-full h-full object-contain" />
    </div>
  );

};

export default GameCanvas;
