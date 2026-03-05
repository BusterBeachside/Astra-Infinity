import { useCallback, useEffect, useRef } from 'react';
import { GameState, Player, Obstacle, PowerUp, Particle, Star, LoadoutState, ReplayData, ReplayInputFrame, GameSettings, UserProgress, ViewState } from '../types';
import { CONSTANTS, COLORS } from '../constants';
import * as Logic from '../services/gameLogic';
import { RNG, VisualRNG } from '../services/rng';
import { drawNetworkBackground, drawStars, drawFloor, drawWarpBackground } from '../services/renderBackground';
import { clearCanvas, drawObstacle, drawPowerUp, drawParticles } from '../services/renderGame';
import { drawPlayer, drawHitbox } from '../services/renderPlayer';
import { audioManager } from '../services/audioManager';
import { ChallengeService } from '../services/challengeService';

interface UseGameLoopProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
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
    lastFrameTime: React.MutableRefObject<number>;
    lastLoopTime: React.MutableRefObject<number>;
    animationFrameId: React.MutableRefObject<number>;
    visualRiskRef: React.MutableRefObject<number>;
    accumulatedGrazeCoins: React.MutableRefObject<number>;
    lastGrazeSfxTime: React.MutableRefObject<number>;
    userProgressRef: React.MutableRefObject<UserProgress>;
    setUserProgress: (p: UserProgress) => void;
    settingsRef: React.MutableRefObject<GameSettings>;
    viewRef: React.MutableRefObject<ViewState>;
    setUiState: (s: any) => void;
    warpRef: React.RefObject<HTMLDivElement>;
    fpsRef: React.RefObject<HTMLDivElement>;
    timerRef: React.RefObject<HTMLDivElement>;
    riskBarRef: React.RefObject<HTMLDivElement>;
    riskTextRef: React.RefObject<HTMLDivElement>;
    riskContainerRef: React.RefObject<HTMLDivElement>;
    replayTimerRef: React.RefObject<HTMLDivElement>;
    keysPressed: React.MutableRefObject<Set<string>>;
    addFloatingText: (x: number, y: number, text: string, subText?: string, color?: string) => void;
    handleGameOver: () => void;
    checkTutorials: (gs: GameState) => void;
}

export const useGameLoop = ({
    canvasRef,
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
    lastFrameTime,
    lastLoopTime,
    animationFrameId,
    visualRiskRef,
    accumulatedGrazeCoins,
    lastGrazeSfxTime,
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
    handleGameOver,
    checkTutorials
}: UseGameLoopProps) => {

    const replayRealTimeRef = useRef(0);

    const gameTick = (dt: number) => {
        const gs = gameStateRef.current;
        const player = playerRef.current;

        const upgrades = (gs.isReplay && activeReplayRef.current?.upgrades) 
            ? activeReplayRef.current.upgrades 
            : userProgressRef.current.upgrades;
  
        if (gs.isActive && !gs.waitingForInput && !gs.isPaused) {
            if ((gs.gameMode === 'normal' || gs.gameMode === 'hardcore') && !gs.isReplay) {
                const stats = userProgressRef.current.stats;
                stats.skinUsage[player.skinId] = (stats.skinUsage[player.skinId] || 0) + dt;
                stats.trailUsage[player.trailType] = (stats.trailUsage[player.trailType] || 0) + dt;
            }
  
            if (!gs.isPaused) {
                gs.targetTimeScale = player.slowTimer > 0 ? 0.4 : 1.0;
                const lerpSpeed = dt * 0.5;
                if (gs.currentTimeScale < gs.targetTimeScale) gs.currentTimeScale = Math.min(gs.targetTimeScale, gs.currentTimeScale + lerpSpeed);
                if (gs.currentTimeScale > gs.targetTimeScale) gs.currentTimeScale = Math.max(gs.targetTimeScale, gs.currentTimeScale - lerpSpeed);
            }
        }
        
        if (warpRef.current) {
            const warpOpacity = (!gs.isActive) ? 0 : Math.max(0, 1 - ((gs.currentTimeScale - 0.4) / 0.6));
            warpRef.current.style.opacity = warpOpacity.toString();
        }
  
        const effectiveDt = (gs.isPaused) ? 0 : dt * gs.currentTimeScale;
  
        const riskLerp = 1 - Math.exp(-10 * dt); 
        visualRiskRef.current += (gs.currentRisk - visualRiskRef.current) * riskLerp;
  
        if (riskContainerRef.current && riskBarRef.current && riskTextRef.current) {
            if (gs.gameMode !== 'practice' && visualRiskRef.current > 0.5) {
                riskContainerRef.current.style.opacity = '1';
                riskBarRef.current.style.width = `${visualRiskRef.current}%`;
                riskTextRef.current.innerText = `RISK LEVEL ${Math.round(visualRiskRef.current)}%`;
            } else {
                riskContainerRef.current.style.opacity = '0';
            }
        }
  
        starsRef.current.forEach(s => {
          const speedMod = settingsRef.current.reduceMotion ? 0.3 : 1.0;
          s.y += s.speed * effectiveDt * speedMod;
          if (gs.isWarpingIn) s.y += s.speed * effectiveDt * 5;
  
          if (s.y > gs.height) {
            s.y = -10;
            s.x = VisualRNG.random() * gs.width;
          }
        });
  
        if (gs.isActive && !gs.waitingForInput && !gs.isPaused) {
          
          const prevSlow = player.slowTimer;
          const prevShrink = player.shrinkTimer;
  
          gs.elapsedTime += dt;
  
          if (timerRef.current) {
              const dtMultiplier = (gs.chaosModules?.brrrrrr) ? 2 : 1;
              const realTime = (gs.elapsedTime - gs.timeOffset) / dtMultiplier;
              timerRef.current.innerText = Logic.formatTime(gs.timeOffset + realTime);
          }
  
          if (gs.gameMode !== 'preview') {
              let currentMinute = Math.floor(gs.elapsedTime / 60);
              if (currentMinute > gs.lastCheckpointMinute) {
                gs.lastCheckpointMinute = currentMinute;
                setUiState((prev: any) => ({ ...prev, showCheckpoint: true }));
                audioManager.playSfx('checkpoint');
                setTimeout(() => setUiState((prev: any) => ({ ...prev, showCheckpoint: false })), 2000);
              }
  
              if (gs.elapsedTime > CONSTANTS.FLOOR_RISING_TIME && gs.compressionState === 0) {
                gs.compressionState = 1; 
                audioManager.playSfx('alarm');
                setTimeout(() => {
                    if(gameStateRef.current.isActive) {
                        gameStateRef.current.compressionState = 2; 
                        setUiState((prev: any) => ({ ...prev, triggerRender: prev.triggerRender + 1 }));
                    }
                }, 3000);
                setUiState((prev: any) => ({ ...prev, triggerRender: prev.triggerRender + 1 }));
              }
              if (gs.compressionState === 2) {
                gs.compressionProgress = Math.min(1, gs.compressionProgress + effectiveDt * 0.5);
                const spikeZoneY = gs.height - (gs.height * 0.2 * gs.compressionProgress);
                if (player.y + player.radius > spikeZoneY) {
                    if (gs.gameMode === 'practice' || gs.gameMode === 'tutorial') {
                        if (Date.now() - (gs as any).lastSpikeDamageTime > 200 || !(gs as any).lastSpikeDamageTime) {
                            audioManager.playSfx('shield_hit');
                            (gs as any).lastSpikeDamageTime = Date.now();
                        }
                    } else {
                        gs.lastDeathBy = 'spikes';
                        handleGameOver();
                    }
                }
              }
  
              if (gs.elapsedTime > CONSTANTS.TITAN_START_TIME && gs.titanCooldown > 0) gs.titanCooldown -= effectiveDt;
  
              const isTheyHateYou = gs.chaosModules?.theyHateYou;
              let spawnRate = isTheyHateYou ? CONSTANTS.SPAWN_RATE_MIN : Math.max(CONSTANTS.SPAWN_RATE_MIN, CONSTANTS.SPAWN_RATE_MAX - (gs.elapsedTime * 2.5));
              
              gs.lastSpawnTime += effectiveDt * 1000;
              
              if (gs.lastSpawnTime > spawnRate) {
                  Logic.spawnObstacle(gs, obstaclesRef.current);
                  gs.lastSpawnTime = 0;
              }

              if ((gs as any).spawnTutorialPowerup) {
                  (gs as any).spawnTutorialPowerup = false;
                  const types: PowerUp['type'][] = ['shield', 'slow', 'shrink'];
                  const idx = RNG.int(0, 3);
                  const color = idx === 0 ? COLORS.PLAYER : idx === 1 ? COLORS.SEEKER : COLORS.GOLD;
                  powerupsRef.current.push({
                    id: RNG.id(),
                    x: gs.width / 2,
                    y: -50,
                    type: types[idx],
                    color
                  });
              }
  
              if (gs.gameMode === 'normal' || (gs.gameMode === 'chaos' && !gs.chaosModules?.onTop)) {
                  gs.lastPowerupTime += effectiveDt * 1000;
                  if (gs.lastPowerupTime > CONSTANTS.POWERUP_INTERVAL) {
                      const types: PowerUp['type'][] = ['shield', 'slow', 'shrink'];
                      const idx = RNG.int(0, 3);
                      const color = idx === 0 ? COLORS.PLAYER : idx === 1 ? COLORS.SEEKER : COLORS.GOLD;
                      powerupsRef.current.push({
                        id: RNG.id(),
                        x: 50 + RNG.random() * (gs.width - 100),
                        y: -50,
                        type: types[idx],
                        color
                      });
                      gs.lastPowerupTime = 0;
                  }
              }
          }
  
          if (gs.gameMode !== 'preview') {
              const updateResult = Logic.updatePlayer(player, gs.width, gs.height, effectiveDt, dt, obstaclesRef.current, gs, upgrades.grazeBonus);
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
                      
                      if (!gs.isReplay && gs.gameMode !== 'tutorial') {
                          const coinResult = ChallengeService.trackCoinGain(userProgressRef.current, amount);
                          if (coinResult.completed) {
                              audioManager.playSfx('challenge_complete');
                              addFloatingText(player.x, player.y, "CHALLENGE COMPLETE", "CHECK MISSION LOG", COLORS.GOLD);
                              setUserProgress({...userProgressRef.current});
                          }
                      }
                  }
              }
          } else {
              const updateResult = Logic.updatePlayer(player, gs.width, gs.height, effectiveDt, dt, [], gs, 0);
              if (updateResult.spawnParticle) {
                  particlesRef.current.push(updateResult.spawnParticle);
              }
          }
  
          for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
            const o = obstaclesRef.current[i];
            
            if (upgrades.showboat && gs.gameMode !== 'preview' && gs.gameMode !== 'practice' && gs.gameMode !== 'tutorial') {
                 const dx = player.x - o.x;
                 const dy = player.y - o.y;
                 const currentAngle = Math.atan2(dy, dx);
                 
                 if (o.lastPlayerAngle !== undefined) {
                     let delta = currentAngle - o.lastPlayerAngle;
                     if (delta > Math.PI) delta -= 2 * Math.PI;
                     if (delta < -Math.PI) delta += 2 * Math.PI;
                     
                     o.accumulatedAngle = (o.accumulatedAngle || 0) + delta;
                     
                     if (Math.abs(o.accumulatedAngle) >= Math.PI * 2) {
                         audioManager.playSfx('coin');
                         
                         o.showboatCount = (o.showboatCount || 0) + 1;
                         
                         const reward = o.showboatCount;
                         
                         gs.showboatCoins = (gs.showboatCoins || 0) + reward;
                         gs.totalShowboats = (gs.totalShowboats || 0) + 1;
                         
                         if (!gs.isReplay) {
                             userProgressRef.current.coins += reward;
                             setUserProgress({...userProgressRef.current});
                         }
                         
                         addFloatingText(player.x, player.y - 30, `SHOWBOAT x${o.showboatCount}`, `+${reward} COINS`, COLORS.GOLD);
                         
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
                o.x += Math.cos(angle) * 100 * effectiveDt;
                o.y += Math.sin(angle) * 100 * effectiveDt;
                o.life -= effectiveDt;
                
                if (o.life <= 0) {
                    gs.titansSurvived++;
  
                    audioManager.playSfx('explosion_titan');
                    const shardCount = Math.min(15, 5 + Math.max(0, Math.floor(gs.elapsedTime/60) - 3));
                    for(let j=0; j<shardCount; j++) { 
                        particlesRef.current.push({ 
                            id: VisualRNG.id(),
                            x: o.x, y: o.y, 
                            vx: Math.cos((Math.PI*2/shardCount)*j)*150, 
                            vy: Math.sin((Math.PI*2/shardCount)*j)*150, 
                            size: 10, 
                            life: 4.0,
                            isDangerous: gs.gameMode !== 'practice'
                        }); 
                    }
                    obstaclesRef.current.splice(i, 1); 
                    continue;
                }
            } else if (o.type === 'seeker') {
                const accel = 450 * effectiveDt;
                if (player.x > o.x) o.vx = Math.min(180, o.vx + accel);
                else o.vx = Math.max(-180, o.vx - accel);
            } else if (o.type === 'side-seeker') {
                const accel = 450 * effectiveDt;
                if (player.y > o.y) o.vy = Math.min(180, o.vy + accel);
                else o.vy = Math.max(-180, o.vy - accel);
                
                o.angle = Math.atan2(o.vy, o.vx) + Math.PI/2;
            }
  
            o.x += o.vx * effectiveDt;
            o.y += o.vy * effectiveDt;
  
            if (Math.hypot(player.x - o.x, player.y - o.y) < player.radius + o.size * 0.75) {
                if (gs.gameMode === 'practice' || gs.gameMode === 'tutorial') {
                    obstaclesRef.current.splice(i, 1);
                    audioManager.playSfx('shield_hit');
                    continue;
                }
                const dmg = o.type === 'titan' ? 2 : 1;
                if (player.shields >= dmg) {
                    player.shields -= dmg;
                    audioManager.playSfx('shield_hit');
                    obstaclesRef.current.splice(i, 1);
                    setUiState((prev: any) => ({...prev, triggerRender: prev.triggerRender + 1}));
                } else {
                    gs.lastDeathBy = o.type;
                    handleGameOver();
                }
            }
  
            if (o.y > gs.height + 200 || o.x < -300 || o.x > gs.width + 300 || o.y < -200) {
               obstaclesRef.current.splice(i, 1);
            }
          }
  
          for (let i = powerupsRef.current.length - 1; i >= 0; i--) {
            const p = powerupsRef.current[i];
            p.y += 120 * effectiveDt;
            
            if (Math.hypot(player.x - p.x, player.y - p.y) < player.radius + 20) {
                gs.powerupsCollected++;
                if (gs.gameMode !== 'practice' && gs.gameMode !== 'preview' && gs.gameMode !== 'tutorial' && !gs.isReplay) {
                    const puResult = ChallengeService.onCollectPowerup(userProgressRef.current, gs);
                    if (puResult.completed) {
                        audioManager.playSfx('challenge_complete');
                        addFloatingText(player.x, player.y, "CHALLENGE COMPLETE", "CHECK MISSION LOG", COLORS.GOLD);
                        setUserProgress({...userProgressRef.current});
                    }
                }
  
                if (p.type === 'shield') { 
                    const maxShields = CONSTANTS.BASE_MAX_SHIELDS + (upgrades.maxShields * CONSTANTS.UPGRADE_BONUS_SHIELD);
                    if (player.shields < maxShields) {
                        player.shields++; 
                        audioManager.playSfx('powerup'); 
                    } else {
                         audioManager.playSfx('coin');
                         const refundAmount = 10;
                         if (!gs.isReplay && gs.gameMode !== 'tutorial') {
                             userProgressRef.current.coins += refundAmount;
                             const coinResult = ChallengeService.trackCoinGain(userProgressRef.current, refundAmount);
                             if (coinResult.completed) {
                                 audioManager.playSfx('challenge_complete');
                                 addFloatingText(player.x, player.y, "CHALLENGE COMPLETE", "CHECK MISSION LOG", COLORS.GOLD);
                             }
                             setUserProgress({...userProgressRef.current});
                         }
                         addFloatingText(player.x, player.y, "MAX SHIELD", `+${refundAmount} COINS`, COLORS.GOLD);
                    }
                }
                else if (p.type === 'slow') { 
                    player.slowTimer = CONSTANTS.BASE_DURATION_SLOW + (upgrades.durationSlow * CONSTANTS.UPGRADE_BONUS_DURATION); 
                    audioManager.playSfx('slow_down'); 
                }
                else if (p.type === 'shrink') { 
                    player.shrinkTimer = CONSTANTS.BASE_DURATION_SHRINK + (upgrades.durationShrink * CONSTANTS.UPGRADE_BONUS_DURATION);
                    audioManager.playSfx('shrink_down'); 
                }
                
                powerupsRef.current.splice(i, 1);
                setUiState((prev: any) => ({...prev, triggerRender: prev.triggerRender + 1}));
            } else if (p.y > gs.height + 50) {
                 powerupsRef.current.splice(i, 1);
            }
          }
  
          if (gs.isActive && !gs.isGameOver && !gs.isPaused && gs.gameMode !== 'preview' && gs.gameMode !== 'practice' && gs.gameMode !== 'tutorial' && !gs.isReplay) {
              const { updated, completedCount } = ChallengeService.updateProgress(userProgressRef.current, gs, effectiveDt);
              if (updated) {
                  if (completedCount > 0) {
                      audioManager.playSfx('challenge_complete');
                      addFloatingText(player.x, player.y, "CHALLENGE COMPLETE", "CHECK MISSION LOG", COLORS.GOLD);
                  }
                  setUserProgress({...userProgressRef.current});
              }
          }
  
          if (!gs.isPaused && gs.gameMode === 'preview') {
          } else if (!gs.isPaused && gs.waitingForInput) {
              Logic.updatePlayer(player, gs.width, gs.height, effectiveDt, dt, [], gs, 0);
          }
          
          const currSlow = player.slowTimer;
          const currShrink = player.shrinkTimer;
  
          if (prevSlow > 0 && currSlow <= 0) audioManager.playSfx('slow_up');
          if (prevShrink > 0 && currShrink <= 0) audioManager.playSfx('shrink_up');
  
          if (Math.ceil(prevSlow) !== Math.ceil(currSlow) || Math.ceil(prevShrink) !== Math.ceil(currShrink)) {
             setUiState((prev: any) => ({ ...prev, triggerRender: prev.triggerRender + 1 }));
          }
  
          if (player.skinId === 'gold' && VisualRNG.random() < 0.3) {
              const angle = VisualRNG.random() * Math.PI * 2;
              const dist = VisualRNG.random() * player.radius;
              particlesRef.current.push({
                  id: `sparkle-${Date.now()}-${VisualRNG.random()}`,
                  x: player.x + Math.cos(angle) * dist,
                  y: player.y + Math.sin(angle) * dist,
                  vx: (VisualRNG.random() - 0.5) * 20,
                  vy: (VisualRNG.random() - 0.5) * 20,
                  size: 2 + VisualRNG.random() * 3,
                  life: 0.5 + VisualRNG.random() * 0.5,
                  maxLife: 1.0,
                  color: '#FFFFFF'
              });
          }
  
        }
        
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];
            
            const particleDt = (gs.isGameOver ? 0.3 : gs.currentTimeScale) * dt;
            
            p.x += p.vx * particleDt;
            p.y += p.vy * particleDt;
            p.life -= particleDt * (gs.isGameOver ? 0.5 : 1.0); 
            
            if (gs.isActive && p.isDangerous && Math.hypot(player.x - p.x, player.y - p.y) < player.radius + p.size) {
                if (gs.gameMode === 'practice' || gs.gameMode === 'tutorial') {
                    particlesRef.current.splice(i, 1);
                    audioManager.playSfx('shield_hit');
                    continue;
                }
                if (player.shields > 0) {
                        player.shields--;
                        audioManager.playSfx('shield_hit');
                        particlesRef.current.splice(i, 1);
                        setUiState((prev: any) => ({...prev, triggerRender: prev.triggerRender + 1}));
                } else {
                        gs.lastDeathBy = 'titan_explosion';
                        handleGameOver();
                }
            } else if (p.life <= 0 || p.x < -100 || p.x > gs.width + 100 || p.y < -100 || p.y > gs.height + 100) {
                particlesRef.current.splice(i, 1);
            }
        }
        
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
  
        clearCanvas(ctx, gs.width, gs.height);
  
        if (gs.isWarpingIn) {
            drawWarpBackground(ctx, gs.width, gs.height);
        }
  
        drawStars(ctx, starsRef.current, gs.height);
        drawFloor(ctx, gs);
  
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
            obstaclesRef.current.forEach(o => {
                drawHitbox(ctx, o.x, o.y, o.size * 0.75);
            });
            drawHitbox(ctx, player.x, player.y, player.radius);

            // Spike Hitbox
            if (gs.compressionState > 0) {
                const spikeZoneY = gs.height - (gs.height * 0.2 * gs.compressionProgress);
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(0, spikeZoneY, gs.width, gs.height - spikeZoneY);
                ctx.setLineDash([]);
                
                // Fill with very subtle red
                ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
                ctx.fillRect(0, spikeZoneY, gs.width, gs.height - spikeZoneY);
            }
        }
    };

    const update = useCallback((timestamp: number) => {
        if (!canvasRef.current) return;
  
        const now = Date.now();
        const targetFps = settingsRef.current.frameLimit;
        const interval = targetFps > 0 ? 1000 / targetFps : 0;
        
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
  
        if (settingsRef.current.showFps && fpsRef.current) {
            const fps = Math.round(1000 / (now - lastFrameTime.current));
            fpsRef.current.innerText = `FPS: ${fps}`;
        }
        
        const dtRaw = (now - lastFrameTime.current) / 1000;
        const dtRawClamped = Math.min(dtRaw, 0.1); 
        lastFrameTime.current = now;
  
        const currentView = viewRef.current;
        const gs = gameStateRef.current;

        const chaos = gs.chaosModules;
        const dtMultiplier = (chaos?.brrrrrr) ? 2 : 1;
        const dt = dtRawClamped * dtMultiplier;

        if (gs.isActive && !gs.waitingForInput && !gs.isPaused && !gs.isReplay && currentView === 'game') {
            checkTutorials(gs);
        }

        if (currentView !== 'game') {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                drawNetworkBackground(ctx, starsRef.current, gs.width, gs.height, dtRawClamped);
            }
            animationFrameId.current = requestAnimationFrame(update);
            return;
        }
  
        if (gs.isReplay && activeReplayRef.current && !gs.isPaused) {
            if (replayIndexRef.current === 0) replayRealTimeRef.current = 0;
            
            const replay = activeReplayRef.current;
            const inputs = replay.inputs as ReplayInputFrame[];
            
            accumulatorRef.current += dtRawClamped * replaySpeedRef.current;
  
            while (replayIndexRef.current < inputs.length) {
                const frame = inputs[replayIndexRef.current];
                const frameDt = frame.dt;
  
                if (accumulatorRef.current >= frameDt) {
                    if (frame.x !== undefined) playerRef.current.targetX = frame.x;
                    if (frame.y !== undefined) playerRef.current.targetY = frame.y;
                    
                    replayRealTimeRef.current += frameDt;
                    gameTick(frameDt * dtMultiplier);
                    accumulatorRef.current -= frameDt;
                    replayIndexRef.current++;
 
                    if (replayTimerRef.current) {
                        replayTimerRef.current.innerText = `${Logic.formatTime(gs.timeOffset + replayRealTimeRef.current)} / ${Logic.formatTime(replay.duration)}`;
                    }
                } else {
                    break; 
                }
            }
  
            if (replayIndexRef.current >= inputs.length) {
                if (!gs.isGameOver) {
                    gs.isPaused = true;
                    setUiState((prev: any) => ({ ...prev, isPaused: true }));
                } else {
                    gameTick(dtRawClamped);
                }
            }
        } else {
            if (replayRecordingRef.current && gs.isActive && !gs.waitingForInput && !gs.isPaused) {
                 replayRecordingRef.current.inputs.push({
                     dt: dtRawClamped,
                     x: playerRef.current.targetX,
                     y: playerRef.current.targetY
                 });
            }
            
            gameTick(dt);
        }
  
        animationFrameId.current = requestAnimationFrame(update);
    }, [canvasRef, settingsRef, viewRef, fpsRef, setUiState, checkTutorials, gameTick]);

    useEffect(() => {
        lastFrameTime.current = Date.now();
        lastLoopTime.current = Date.now();
        animationFrameId.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationFrameId.current);
    }, [update]);

    return { gameTick, update };
};
