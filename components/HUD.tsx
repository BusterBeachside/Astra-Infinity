
import React from 'react';
import { Player, GameState, FloatingText } from '../types';
import { formatTime } from '../services/gameLogic';

// Toggle for developer to re-enable debug mode in code
const ENABLE_DEBUG_UI = false; 

interface HUDProps {
  gameState: GameState;
  player: Player;
  onDebugToggle: (checked: boolean) => void;
  timerRef: React.RefObject<HTMLDivElement>;
  floatingTexts: FloatingText[];
}

const HUD: React.FC<HUDProps> = ({ gameState, player, onDebugToggle, timerRef, floatingTexts }) => {
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
