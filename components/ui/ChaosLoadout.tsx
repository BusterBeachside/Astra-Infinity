
import React, { useState } from 'react';
import { ChaosModules } from '../../types';

interface ChaosLoadoutProps {
  onStart: (modules: ChaosModules) => void;
  onCancel: () => void;
  playClick: () => void;
  playHover: () => void;
  mode: string;
}

const ChaosLoadout: React.FC<ChaosLoadoutProps> = ({ onStart, onCancel, playClick, playHover, mode }) => {
  const [modules, setModules] = useState<ChaosModules>({
    brrrrrr: false,
    theyHateYou: false,
    onTop: false
  });

  const toggleModule = (key: keyof ChaosModules) => {
    playClick();
    setModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isPractice = mode === 'practice';
  const canStart = isPractice || modules.brrrrrr || modules.theyHateYou || modules.onTop;

  const calculateMultiplier = () => {
    let mult = 1;
    if (modules.brrrrrr) mult *= 2;
    if (modules.theyHateYou) mult *= 5;
    if (modules.onTop) mult *= 3;
    return mult;
  };

  return (
    <div className="absolute inset-0 z-[70] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="monitor-frame relative w-[340px] md:w-[420px] p-8 rounded-xl border-2 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.3)] flex flex-col items-center">
        <div className="scanlines absolute inset-0 z-0 opacity-20 pointer-events-none"></div>
        
        <h2 className="text-2xl font-mono font-black text-orange-500 mb-2 tracking-tighter animate-pulse">
          CHAOS MODULE SELECTION
        </h2>
        <p className="text-[10px] font-mono text-orange-500/70 mb-6 text-center">
          WARNING: EXPERIMENTAL MODULES MAY CAUSE REALITY DESYNC
        </p>

        <div className="flex flex-col gap-4 w-full mb-8">
          {/* Module 1 */}
          <button
            onClick={() => toggleModule('brrrrrr')}
            onMouseEnter={playHover}
            className={`group relative p-4 border-2 transition-all duration-200 flex flex-col items-start ${
              modules.brrrrrr 
              ? 'border-orange-500 bg-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
              : 'border-white/10 bg-white/5 hover:border-orange-500/50'
            }`}
          >
            <div className="flex justify-between w-full items-center mb-1">
              <span className={`font-mono font-bold ${modules.brrrrrr ? 'text-orange-400' : 'text-white'}`}>
                Haha, Spaceship Go Brrrrrr
              </span>
              <span className="text-xs font-mono font-black text-orange-500">x2</span>
            </div>
            <span className="text-[10px] font-mono text-white/60 text-left">
              Game is played at double speed.
            </span>
            {modules.brrrrrr && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
            )}
          </button>

          {/* Module 2 */}
          <button
            onClick={() => toggleModule('theyHateYou')}
            onMouseEnter={playHover}
            className={`group relative p-4 border-2 transition-all duration-200 flex flex-col items-start ${
              modules.theyHateYou 
              ? 'border-orange-500 bg-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
              : 'border-white/10 bg-white/5 hover:border-orange-500/50'
            }`}
          >
            <div className="flex justify-between w-full items-center mb-1">
              <span className={`font-mono font-bold ${modules.theyHateYou ? 'text-orange-400' : 'text-white'}`}>
                They REALLY Don't Like you.
              </span>
              <span className="text-xs font-mono font-black text-orange-500">x5</span>
            </div>
            <span className="text-[10px] font-mono text-white/60 text-left">
              Start at maximum difficulty. Spikes active immediately.
            </span>
            {modules.theyHateYou && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
            )}
          </button>

          {/* Module 3 */}
          <button
            onClick={() => toggleModule('onTop')}
            onMouseEnter={playHover}
            className={`group relative p-4 border-2 transition-all duration-200 flex flex-col items-start ${
              modules.onTop 
              ? 'border-orange-500 bg-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
              : 'border-white/10 bg-white/5 hover:border-orange-500/50'
            }`}
          >
            <div className="flex justify-between w-full items-center mb-1">
              <span className={`font-mono font-bold ${modules.onTop ? 'text-orange-400' : 'text-white'}`}>
                And On Top Of That...
              </span>
              <span className="text-xs font-mono font-black text-orange-500">x3</span>
            </div>
            <span className="text-[10px] font-mono text-white/60 text-left">
              Hardcore Mode active. No powerups will spawn.
            </span>
            {modules.onTop && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
            )}
          </button>
        </div>

        <div className="w-full flex flex-col items-center gap-4">
          <div className="flex flex-col items-center">
             <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Total Multiplier</span>
             <span className="text-3xl font-mono font-black text-orange-500">x{calculateMultiplier()}</span>
          </div>

          <div className="flex gap-4 w-full">
            <button
              onClick={onCancel}
              onMouseEnter={playHover}
              className="flex-1 py-3 border border-white/20 text-white/60 font-mono font-bold hover:bg-white/10 transition-all"
            >
              ABORT
            </button>
            <button
              disabled={!canStart}
              onClick={() => onStart(modules)}
              onMouseEnter={playHover}
              className={`flex-1 py-3 font-mono font-bold transition-all ${
                canStart 
                ? 'bg-orange-500 text-black hover:bg-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.4)]' 
                : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
            >
              ENGAGE
            </button>
          </div>
        </div>

        {!canStart && !isPractice && (
          <p className="mt-4 text-[10px] font-mono text-red-500 animate-pulse">
            SELECT AT LEAST ONE MODULE TO PROCEED
          </p>
        )}
      </div>
    </div>
  );
};

export default ChaosLoadout;
