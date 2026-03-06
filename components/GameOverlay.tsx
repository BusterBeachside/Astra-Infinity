import React from 'react';
import { GameState, UserProgress, GameSettings, Player, FloatingText, GameMode, ReplayData, ViewState, LoadoutState } from '../types';
import { COLORS } from '../constants';
import { formatTime } from '../services/gameLogic';
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
import StatisticsScreen from './ui/StatisticsScreen';
import ReplayMenu from './ui/ReplayMenu';
import ChaosLoadout from './ui/ChaosLoadout';
import AuthOverlay from './ui/AuthOverlay';
import OnlineLeaderboard from './ui/OnlineLeaderboard';
import LoadingOverlay from './ui/LoadingOverlay';

interface GameOverlayProps {
    uiState: {
        view: ViewState;
        showCheckpoint: boolean;
        isPaused: boolean;
        isWaitingForStart: boolean;
        triggerRender: number;
        isInitialGate: boolean;
        loadingMessage: string;
    };
    gameState: GameState;
    userProgress: UserProgress;
    player: Player;
    settings: GameSettings;
    activeTutorial: { id: string; title: string; message: string } | null;
    floatingTexts: FloatingText[];
    hsInitials: string;
    debugMode: boolean;
    heatmapSettings: { visible: boolean; showNormal: boolean; showHardcore: boolean; showChaos: boolean };
    showChallenges: boolean;
    shopState: { tab: 'modules' | 'trails' | 'skins'; scroll: number };
    pendingMode: GameMode;
    activeReplay: ReplayData | null;
    replaySpeed: number;
    
    leaderboardMode: 'normal' | 'hardcore' | 'chaos';
    setLeaderboardMode: (m: 'normal' | 'hardcore' | 'chaos') => void;
    onlineLeaderboardMode: 'normal' | 'hardcore' | 'chaos';
    setOnlineLeaderboardMode: (m: 'normal' | 'hardcore' | 'chaos') => void;
    replayFilter: GameMode | 'all';
    setReplayFilter: (f: GameMode | 'all') => void;
    setShopState: React.Dispatch<React.SetStateAction<{ tab: 'modules' | 'trails' | 'skins'; scroll: number }>>;
    
    // Refs
    warpRef: React.RefObject<HTMLDivElement>;
    fpsRef: React.RefObject<HTMLDivElement>;
    timerRef: React.RefObject<HTMLDivElement>;
    riskBarRef: React.RefObject<HTMLDivElement>;
    riskTextRef: React.RefObject<HTMLDivElement>;
    riskContainerRef: React.RefObject<HTMLDivElement>;
    replayTimerRef: React.RefObject<HTMLDivElement>;

    // Callbacks
    setUiState: React.Dispatch<React.SetStateAction<{
        view: ViewState;
        showCheckpoint: boolean;
        triggerRender: number;
        isWaitingForStart: boolean;
        isPaused: boolean;
        isInitialGate: boolean;
        loadingMessage: string;
    }>>;
    setView: (view: ViewState) => void;
    setUserProgress: (p: UserProgress | ((prev: UserProgress) => UserProgress)) => void;
    setHeatmapSettings: React.Dispatch<React.SetStateAction<{ visible: boolean; showNormal: boolean; showHardcore: boolean; showChaos: boolean }>>;
    setHsInitials: React.Dispatch<React.SetStateAction<string>>;
    setShowChallenges: React.Dispatch<React.SetStateAction<boolean>>;
    setActiveTutorial: (t: { id: string; title: string; message: string } | null) => void;
    togglePause: () => void;
    startGame: (mode: GameMode) => void;
    startPreview: (itemId: string, currentTab: 'modules' | 'trails' | 'skins', currentScroll: number) => void;
    startReplay: (replay: ReplayData) => void;
    submitHighScore: () => void;
    playClick: () => void;
    playHover: () => void;
    onDebugToggle: (v: boolean) => void;
    handleSplashClick: () => void;
    initGameSequence: (mode: GameMode) => void;
    setReplaySpeed: (speed: number) => void;
    exitReplay: () => void;
    onLoadoutStart: (loadout: LoadoutState) => void;
    onTutorial: () => void;
    onTutorialDismiss: () => void;
    onLoginSuccess: () => void;
    onPlayOffline: () => void;
    onWatchOnlineReplay: (path: string) => void;
}

const GameOverlay: React.FC<GameOverlayProps> = ({
    uiState, gameState, userProgress, player, settings, activeTutorial, floatingTexts,
    hsInitials, debugMode, heatmapSettings, showChallenges, shopState, pendingMode,
    activeReplay, replaySpeed,
    leaderboardMode, setLeaderboardMode, onlineLeaderboardMode, setOnlineLeaderboardMode,
    replayFilter, setReplayFilter, setShopState,
    warpRef, fpsRef, timerRef, riskBarRef, riskTextRef, riskContainerRef, replayTimerRef,
    setUiState, setView, setUserProgress, setHeatmapSettings, setHsInitials,
    setShowChallenges, setActiveTutorial, togglePause, startGame, startPreview,
    startReplay, submitHighScore, playClick, playHover, onDebugToggle,
    handleSplashClick, initGameSequence, setReplaySpeed, exitReplay, onLoadoutStart,
    onTutorial, onTutorialDismiss,
    onLoginSuccess, onPlayOffline, onWatchOnlineReplay
}) => {
    return (
        <>
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
                    {gameState.gameMode === 'practice' && heatmapSettings.visible && (
                        <HeatmapOverlay 
                            deaths={userProgress.deathHistory || []}
                            showNormal={heatmapSettings.showNormal}
                            showHardcore={heatmapSettings.showHardcore}
                            showChaos={heatmapSettings.showChaos}
                            width={gameState.width}
                            height={gameState.height}
                        />
                    )}
                    <HUD 
                        gameState={gameState} 
                        visualRisk={gameState.currentRisk} // Using gameState risk as visualRisk isn't passed, but HUD logic handles it. Wait, HUD takes visualRisk prop.
                        // Actually HUD takes visualRisk which is a ref in GameCanvas. We need to pass that ref value or state.
                        // In GameCanvas, visualRiskRef.current is passed. But that's a ref, not state.
                        // HUD uses it for rendering? No, HUD is a React component. It needs state to re-render.
                        // Ah, HUD is re-rendered by parent re-renders.
                        // We need to pass visualRisk from GameCanvas.
                        // Let's assume for now we pass gameState.currentRisk or we need to add visualRisk to props.
                        // GameCanvas passes visualRiskRef.current.
                        player={player} 
                        onDebugToggle={onDebugToggle}
                        timerRef={timerRef}
                        floatingTexts={floatingTexts}
                        heatmapSettings={gameState.gameMode === 'practice' ? heatmapSettings : undefined}
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
                                    gameState.isPaused = false;
                                    audioManager.playSfx('ui_click');
                                }}
                                className="bg-white text-black px-8 py-3 font-mono font-bold hover:bg-gray-200 transition-colors mb-4 min-w-[200px]"
                            >
                                RESUME
                            </button>
                            
                            <button
                                onClick={() => {
                                    setUiState(prev => ({ ...prev, isPaused: false }));
                                    gameState.isPaused = false;
                                    gameState.isActive = false;
                                    gameState.currentTimeScale = 1.0;
                                    if (warpRef.current) warpRef.current.style.opacity = '0';
                                    setView('menu');
                                    audioManager.playTitleTheme();
                                }}
                                className="bg-red-500/20 border border-red-500 text-red-500 px-8 py-3 font-mono font-bold hover:bg-red-500 hover:text-white transition-colors min-w-[200px]"
                            >
                                ABORT RUN
                            </button>
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
            {uiState.view === 'game' && gameState.gameMode === 'preview' && (
                <div className="absolute top-5 right-5 z-[60]">
                     <button
                          onClick={() => {
                              gameState.isActive = false; 
                              gameState.gameMode = 'normal'; // Reset logic state
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
                      left: player.x,
                      top: player.y - 80, 
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
                      onShowStatistics={() => { playClick(); setView('statistics'); }}
                      onShowReplays={() => { playClick(); setView('replays'); }}
                      onShowOptions={() => { playClick(); setView('options'); }}
                      onShowShop={() => { playClick(); setView('shop'); }}
                      onShowCredits={() => { playClick(); setView('credits'); }}
                      onShowChallenges={() => { setShowChallenges(true); playClick(); }}
                      onShowAuth={() => { playClick(); setView('auth'); }}
                      onShowOnlineLeaderboard={() => { playClick(); setView('online_leaderboard'); }}
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
                      const result = ChallengeService.rerollChallenge(id, userProgress);
                      if (result.success && result.newChallenge) {
                          audioManager.playSfx('menu_select');
                          setUserProgress({...userProgress});
                      } else {
                          audioManager.playSfx('error');
                      }
                  }}
                  onClaim={(id) => {
                      setUserProgress(prev => {
                          const challenge = prev.activeChallenges.find(c => c.id === id);
                          if (!challenge || !challenge.completed || challenge.claimed) return prev;
                          
                          // Create a shallow copy of the challenge to mark as claimed
                          // (Though we are about to replace it if it's repeatable, 
                          // marking it claimed is good practice for the intermediate state)
                          const updatedChallenge = { ...challenge, claimed: true };
                          
                          let newChallenges = prev.activeChallenges.map(c => c.id === id ? updatedChallenge : c);
                          let newProgressionIndex = prev.progressionMissionIndex;

                          if (challenge.type === 'repeatable') {
                              const idx = newChallenges.findIndex(c => c.id === id);
                              if (idx !== -1) {
                                  newChallenges[idx] = ChallengeService.generateSingleRepeatableChallenge(newChallenges, prev);
                              }
                          } else if (challenge.type === 'progression') {
                               newChallenges = newChallenges.filter(c => c.id !== id);
                               newProgressionIndex = (newProgressionIndex || 0) + 1;
                               
                               // Add next mission
                               const tempProgress = { 
                                   ...prev, 
                                   activeChallenges: newChallenges, 
                                   progressionMissionIndex: newProgressionIndex 
                               };
                               ChallengeService.ensureProgressionMission(tempProgress);
                               newChallenges = tempProgress.activeChallenges;
                          }

                          audioManager.playSfx('coin');
                          
                          return {
                              ...prev,
                              activeChallenges: newChallenges,
                              coins: prev.coins + challenge.reward,
                              stats: {
                                  ...prev.stats,
                                  lifetimeCoinsEarned: (prev.stats.lifetimeCoinsEarned || 0) + challenge.reward
                              },
                              progressionMissionIndex: newProgressionIndex
                          };
                      });
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
                  onStateChange={(tab, scroll) => setShopState({ tab, scroll })}
              />
            )}

            {uiState.view === 'loadout' && (
                <LoadoutScreen
                  mode={pendingMode === 'hardcore' ? 'hardcore' : 'normal'}
                  progress={userProgress}
                  onUpdateProgress={setUserProgress}
                  onStart={onLoadoutStart}
                  onCancel={() => setView('menu')}
                  onTutorial={onTutorial}
                  playClick={playClick}
                />
            )}

            {uiState.view === 'chaos_loadout' && (
                <ChaosLoadout
                    mode={pendingMode}
                    onStart={(modules) => {
                        onLoadoutStart({
                            startShield: false,
                            rocketBoost: false,
                            doubleCoins: false,
                            chaosModules: modules
                        });
                    }}
                    onCancel={() => setView('menu')}
                    playClick={playClick}
                    playHover={playHover}
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

            {uiState.view === 'statistics' && (
              <StatisticsScreen 
                  progress={userProgress}
                  onClose={() => setView('menu')}
                  playClick={playClick}
                  playHover={playHover}
              />
            )}

            {uiState.view === 'highscore_board' && (
              <Leaderboard 
                  initialMode={leaderboardMode}
                  onModeChange={setLeaderboardMode}
                  onClose={() => setView('menu')}
                  onWatchReplay={startReplay}
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

            {uiState.view === 'replays' && (
                <ReplayMenu 
                    onPlayReplay={startReplay}
                    onClose={() => setView('menu')}
                    playClick={playClick}
                    playHover={playHover}
                    initialFilter={replayFilter}
                    onFilterChange={setReplayFilter}
                />
            )}

            {uiState.view === 'auth' && (
                <AuthOverlay 
                    onClose={() => setView('menu')}
                    onLoginSuccess={onLoginSuccess}
                    userProgress={userProgress}
                    onShowLeaderboard={() => { playClick(); setView('online_leaderboard'); }}
                    onPlayOffline={uiState.isInitialGate ? onPlayOffline : undefined}
                    isInitialGate={uiState.isInitialGate}
                />
            )}

            {uiState.view === 'online_leaderboard' && (
                <OnlineLeaderboard 
                    initialMode={onlineLeaderboardMode}
                    onModeChange={setOnlineLeaderboardMode}
                    onClose={() => setView('menu')}
                    onWatchReplay={onWatchOnlineReplay}
                />
            )}

            {uiState.loadingMessage && (
                <LoadingOverlay message={uiState.loadingMessage} />
            )}

            {/* Replay Controls Overlay */}
            {gameState.isReplay && uiState.view === 'game' && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center gap-2 pointer-events-auto">
                    <div className="flex items-center gap-4 bg-black/80 border border-cyan-500/50 p-2 rounded-lg backdrop-blur-sm">
                        <button 
                            onClick={() => {
                                const newPaused = !uiState.isPaused;
                                setUiState(prev => ({ ...prev, isPaused: newPaused }));
                                gameState.isPaused = newPaused;
                            }}
                            className="text-cyan-400 hover:text-white transition-colors"
                        >
                            {uiState.isPaused ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                            )}
                        </button>
                        
                        <div className="flex gap-1">
                            {[0.5, 1, 2, 4].map(speed => (
                                <button
                                    key={speed}
                                    onClick={() => setReplaySpeed(speed)}
                                    className={`px-2 py-1 text-xs font-mono font-bold rounded ${replaySpeed === speed ? 'bg-cyan-500 text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                >
                                    {speed}x
                                </button>
                            ))}
                        </div>

                        <div 
                            ref={replayTimerRef}
                            className="text-cyan-400 font-mono text-xs"
                        >
                            {activeReplay ? (
                                `${formatTime(gameState.elapsedTime)} / ${formatTime(activeReplay.duration)}`
                            ) : '-- / --'}
                        </div>

                        <button 
                            onClick={exitReplay}
                            disabled={gameState.isGameOver}
                            className={`text-xs font-bold border px-2 py-1 rounded transition-all ${
                                gameState.isGameOver 
                                ? 'text-gray-600 border-gray-800 cursor-not-allowed' 
                                : 'text-red-400 hover:text-red-200 border-red-500/50 hover:bg-red-500/20'
                            }`}
                        >
                            EXIT
                        </button>
                    </div>
                    <div className="text-cyan-500/50 text-[10px] font-mono tracking-widest animate-pulse">REPLAY MODE ACTIVE</div>
                </div>
            )}

            {uiState.view === 'gameover' && (
              <GameOverScreen 
                  gameState={gameState} 
                  isTutorialActive={!!activeTutorial} 
                  isReplaying={gameState.isReplay}
              />
            )}

            {debugMode && (
                <div className="absolute bottom-1 left-1 text-red-600 font-mono font-black text-xl z-[100] animate-pulse pointer-events-none select-none">
                    [!D!]
                </div>
            )}

            {activeTutorial && (
                <TutorialOverlay 
                    title={activeTutorial.title}
                    message={activeTutorial.message}
                    onDismiss={() => {
                        onTutorialDismiss();
                    }}
                />
            )}
        </>
    );
};

export default GameOverlay;
