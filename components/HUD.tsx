
import React from 'react';
import { Player, GameState, FloatingText } from '../types';
import { formatTime } from '../services/gameLogic';

// Toggle for developer to re-enable debug mode in code
const ENABLE_DEBUG_UI = false; 

interface HUDProps {
  gameState: GameState;
  visualRisk: number;
  player: Player;
  onDebugToggle: (checked: boolean) => void;
  timerRef: React.RefObject<HTMLDivElement>;
  floatingTexts: FloatingText[];
  heatmapSettings?: { visible: boolean; showNormal: boolean; showHardcore: boolean };
  onUpdateHeatmap?: (settings: { visible: boolean; showNormal: boolean; showHardcore: boolean }) => void;
  riskBarRef?: React.RefObject<HTMLDivElement>;
  riskTextRef?: React.RefObject<HTMLDivElement>;
  riskContainerRef?: React.RefObject<HTMLDivElement>;
}

const HUD: React.FC<HUDProps> = ({ gameState, visualRisk, player, onDebugToggle, timerRef, floatingTexts, heatmapSettings, onUpdateHeatmap, riskBarRef, riskTextRef, riskContainerRef }) => {
  return (
    <>
      {/* Debug Panel */}
      {ENABLE_DEBUG_UI && (
        <div className="absolute top-5 right-5 text-white bg-black/70 p-2 border border-gray-600 z-50 text-xs pointer-events-auto">
            <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" onChange={(e) => onDebugToggle(e.target.checked)} />
            DEBUG MODE
            </label>
            <div className="mt-1 opacity-70">
            Z:Shield | X:Warp | C:Tiny | A:+1min
            </div>
        </div>
      )}

      {/* High Score */}
      <div className="absolute top-5 left-5 text-sm text-white/70 z-40">
        BEST: <span>{formatTime(gameState.highScore)}</span>
      </div>

      {/* Risk Meter */}
      {gameState.gameMode !== 'practice' && (
          <div 
            ref={riskContainerRef}
            className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-6 bg-black/50 border border-red-900/50 rounded-full overflow-hidden z-40 transition-opacity duration-300"
            style={{ opacity: 0 }} // Initially hidden
          >
              <div 
                  ref={riskBarRef}
                  className="h-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-75"
                  style={{ width: '0%' }}
              />
              <div 
                ref={riskTextRef}
                className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tracking-widest text-white/80 drop-shadow-md"
              >
                  RISK LEVEL 0%
              </div>
          </div>
      )}

      {/* Heatmap Controls (Practice Mode Only) */}
      {heatmapSettings && onUpdateHeatmap && (
          <div className="absolute top-20 right-5 flex flex-col items-end gap-2 z-50">
              <button 
                  onClick={() => onUpdateHeatmap({ ...heatmapSettings, visible: !heatmapSettings.visible })}
                  className={`px-4 py-1 font-mono text-xs border transition-colors ${heatmapSettings.visible ? 'bg-blue-500 text-black border-blue-500' : 'bg-black/60 text-blue-500 border-blue-500 hover:bg-blue-500/20'}`}
              >
                  HEATMAP: {heatmapSettings.visible ? 'ON' : 'OFF'}
              </button>
              
              {heatmapSettings.visible && (
                  <div className="flex gap-2">
                      <button 
                          onClick={() => onUpdateHeatmap({ ...heatmapSettings, showNormal: !heatmapSettings.showNormal })}
                          className={`px-2 py-0.5 font-mono text-[10px] border transition-colors ${heatmapSettings.showNormal ? 'bg-[#2ecc71] text-black border-[#2ecc71]' : 'bg-black/60 text-[#2ecc71] border-[#2ecc71]'}`}
                      >
                          NORMAL
                      </button>
                      <button 
                          onClick={() => onUpdateHeatmap({ ...heatmapSettings, showHardcore: !heatmapSettings.showHardcore })}
                          className={`px-2 py-0.5 font-mono text-[10px] border transition-colors ${heatmapSettings.showHardcore ? 'bg-[#e74c3c] text-black border-[#e74c3c]' : 'bg-black/60 text-[#e74c3c] border-[#e74c3c]'}`}
                      >
                          HARDCORE
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* Timer */}
      <div 
        ref={timerRef}
        className="absolute bottom-5 right-5 text-4xl font-black text-white pointer-events-none z-50 text-glow"
      >
        00:00.0
      </div>

      {/* Active Effects */}
      <div className="absolute bottom-5 left-5 pointer-events-none z-50 flex flex-col items-start gap-1">
        {player.shields > 0 && (
          <div className="px-3 py-1 bg-black/90 border-2 border-[#2ecc71] text-[#2ecc71] font-bold rounded shadow-lg text-sm">
            SHIELDS x{player.shields}
          </div>
        )}
        {player.slowTimer > 0 && (
          <div className="px-3 py-1 bg-black/90 border-2 border-[#3498db] text-[#3498db] font-bold rounded shadow-lg text-sm">
            WARP DRIVE {Math.ceil(player.slowTimer)}s
          </div>
        )}
        {player.shrinkTimer > 0 && (
          <div className="px-3 py-1 bg-black/90 border-2 border-[#f1c40f] text-[#f1c40f] font-bold rounded shadow-lg text-sm">
            COMPRESSION {Math.ceil(player.shrinkTimer)}s
          </div>
        )}
      </div>

      {/* Warning Banner */}
      {gameState.compressionState === 1 && (
        <div className="absolute top-1/4 w-full text-center text-red-600 text-5xl font-black tracking-[10px] pointer-events-none z-10 text-glow-red animate-pulse">
          VOID PROTOCOL
        </div>
      )}

      {/* Floating Texts */}
      {floatingTexts.map(ft => (
          <div 
            key={ft.id}
            className="absolute pointer-events-none z-50 text-center whitespace-pre animate-[floatUp_1s_ease-out_forwards]"
            style={{ 
                left: ft.x, 
                top: ft.y, 
                transform: 'translate(-50%, -50%)',
                color: ft.color,
                textShadow: `0 0 5px ${ft.color}`
            }}
          >
              <div className="font-bold text-lg">{ft.text}</div>
              {ft.subText && <div className="text-xs text-white">{ft.subText}</div>}
          </div>
      ))}
      <style>{`
        @keyframes floatUp {
            0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -150%) scale(1.2); }
        }
      `}</style>
    </>
  );
};

export default HUD;
