
import React, { useEffect, useState, useRef } from 'react';
import { GameState } from '../../types';
import { formatTime } from '../../services/gameLogic';
import { audioManager } from '../../services/audioManager';

interface GameOverScreenProps {
  gameState: GameState;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ gameState }) => {
  const [displayCoins, setDisplayCoins] = useState(0);
  const bd = gameState.coinBreakdown;

  useEffect(() => {
      if (!bd) return;
      
      let current = 0;
      const total = bd.total;
      // Animate over ~1.5 seconds
      const steps = 30;
      const increment = Math.ceil(total / steps);
      const intervalTime = 50;

      const timer = setInterval(() => {
          current += increment;
          if (current >= total) {
              current = total;
              clearInterval(timer);
          }
          setDisplayCoins(current);
          // Play coin sound occasionally during count
          audioManager.playSfx('coin');
      }, intervalTime);

      return () => clearInterval(timer);
  }, [bd]);

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white bg-black/95 p-8 border-4 border-[#2ecc71] z-[100] max-w-md w-full shadow-[0_0_50px_rgba(46,204,113,0.3)]">
      <h1 className="text-4xl font-bold mb-4 text-red-500 text-glow-red animate-pulse">
        CORE RUPTURED
      </h1>
      
      <div className="mb-6 space-y-4">
          <div className="text-lg font-mono text-gray-300">
             <div>UPTIME: {formatTime(gameState.elapsedTime)}</div>
             <div className="text-sm opacity-70">MODE: {gameState.gameMode === 'hardcore' ? 'HARDCORE' : 'NORMAL'}</div>
          </div>

          <div className="p-4 bg-[#f1c40f]/10 border border-[#f1c40f] rounded">
              <div className="text-[#f1c40f] text-sm font-mono tracking-widest mb-2 border-b border-[#f1c40f]/30 pb-1">REWARDS</div>
              
              {bd && (
                  <div className="text-sm font-mono text-gray-400 space-y-1 text-left mb-3 pl-4">
                      <div className="flex justify-between">
                          <span>BASE COINS</span>
                          <span>{bd.base}</span>
                      </div>
                      
                      {bd.checkpoints > 0 && (
                          <div className="flex justify-between text-[#2ecc71]">
                              <span>CHECKPOINTS ({bd.checkpoints})</span>
                              <span>x{bd.checkpointMult.toFixed(1)}</span>
                          </div>
                      )}
                      
                      {bd.isHardcore && (
                          <div className="flex justify-between text-red-400">
                              <span>HARDCORE MODE</span>
                              <span>x5.0</span>
                          </div>
                      )}

                      {bd.titansSurvived > 0 && (
                          <div className="flex justify-between text-red-600">
                              <span>TITAN BONUS ({bd.titansSurvived})</span>
                              <span>+{bd.titanBonus}</span>
                          </div>
                      )}

                      {bd.isDouble && (
                          <div className="flex justify-between text-blue-400">
                              <span>BOUNTY HUNTER</span>
                              <span>x2.0</span>
                          </div>
                      )}
                  </div>
              )}

              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-[#f1c40f]">
                  <span>+{displayCoins}</span>
                  <div className="w-5 h-5 bg-[#f1c40f] rounded-full shadow-[0_0_10px_#f1c40f]"></div>
              </div>
          </div>
      </div>
      
      <div className="text-sm text-[#2ecc71] animate-bounce cursor-pointer">
         TAP TO REBOOT SYSTEM
      </div>
    </div>
  );
};

export default GameOverScreen;
