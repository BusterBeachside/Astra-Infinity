
import React, { useState } from 'react';

interface MainMenuProps {
  onStartGame: (mode: 'normal' | 'hardcore' | 'practice') => void;
  onShowLeaderboard: () => void;
  onShowOptions: () => void;
  onShowShop: () => void;
  onShowCredits: () => void;
  onShowChallenges: () => void;
  hasUnclaimedRewards: boolean;
  playHover: () => void;
  coins: number;
}

const generateConsoleLogs = () => {
    const hex = () => Math.floor(Math.random() * 16777215).toString(16).toUpperCase();
    const variable = () => ['addr', 'ptr', 'buffer', 'socket', 'stream', 'core', 'thread'][Math.floor(Math.random()*7)];
    const status = () => ['OK', 'PENDING', 'FAILED', 'BYPASS', 'LOCKED'][Math.floor(Math.random()*5)];
    
    const randomDate = () => {
        const year = 2125 + Math.floor(Math.random() * 100);
        const month = Math.floor(Math.random() * 12) + 1;
        const day = Math.floor(Math.random() * 28) + 1;
        const hour = Math.floor(Math.random() * 24);
        const min = Math.floor(Math.random() * 60);
        const sec = Math.floor(Math.random() * 60);
        return `${year}-${month.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}T${hour.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}Z`;
    };
    
    let output = "";
    
    for(let i=0; i<40; i++) {
        const type = Math.random();
        if (type < 0.3) {
            output += `[${randomDate()}] SYSTEM_CHECK: MODULE_${hex()} ... ${status()}\n`;
        } else if (type < 0.6) {
            output += `function init_driver_${hex()}() {\n`;
            output += `   const ${variable()} = 0x${hex()};\n`;
            output += `   if (${variable()}.isValid()) {\n`;
            output += `       return process_stream(0x${hex()});\n`;
            output += `   }\n`;
            output += `}\n`;
        } else if (type < 0.8) {
             output += `0x${hex()}:  ${hex()} ${hex()} ${hex()} ${hex()}  |  ....\n`;
             output += `0x${hex()}:  ${hex()} ${hex()} ${hex()} ${hex()}  |  ....\n`;
        } else {
            output += `\n`;
        }
    }
    return output;
};

const MainMenu: React.FC<MainMenuProps> = ({ 
    onStartGame, onShowLeaderboard, onShowOptions, onShowShop, onShowCredits, 
    onShowChallenges, hasUnclaimedRewards, playHover, coins 
}) => {
  const [consoleLog] = useState(generateConsoleLogs());
  const [menuView, setMenuView] = useState<'main' | 'play'>('main');

  return (
    <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center backdrop-blur-[1px]">
        <div className="monitor-frame menu-animate-enter relative w-[320px] md:w-[400px] min-h-[600px] py-8 flex flex-col items-center justify-between rounded-xl overflow-hidden shadow-2xl">
            
            <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none z-0">
                <div className="scrolling-code text-[#00ff00] font-mono text-xs leading-4 whitespace-pre p-2">
                    {consoleLog + "\n" + consoleLog}
                </div>
            </div>

            <div className="scanlines absolute inset-0 z-0 opacity-30"></div>
            
            <div className="absolute top-4 left-4 z-20">
                <button
                    onClick={onShowChallenges}
                    onMouseEnter={playHover}
                    className={`px-3 py-1 font-mono font-bold text-[10px] transition-all ${
                        hasUnclaimedRewards
                        ? 'bg-yellow-500 text-black border border-white animate-pulse shadow-[0_0_10px_rgba(241,196,15,0.5)]'
                        : 'bg-blue-500/20 border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-black'
                    }`}
                >
                    {hasUnclaimedRewards ? 'CLAIM!' : 'CHALLENGES'}
                </button>
            </div>

            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 text-[#f1c40f] font-mono font-bold text-xs">
                <span>{coins}</span>
                <div className="w-3 h-3 bg-[#f1c40f] rounded-full shadow-[0_0_5px_#f1c40f]"></div>
            </div>

            {/* Header Section */}
            <div className="relative z-10 flex flex-col items-center mt-4">
                <h1 className="astra-logo text-3xl md:text-4xl text-center select-none menu-item-pop" style={{ animationDelay: '0.4s' }}>
                ASTRA<br/>INFINITY
                </h1>
            </div>
            
            {/* Buttons Section */}
            <div className="relative z-10 flex flex-col gap-3 w-72 my-4">
                {menuView === 'main' ? (
                    <>
                        <button 
                            onClick={() => { setMenuView('play'); playHover(); }}
                            onMouseEnter={playHover}
                            className="group w-full px-6 py-4 border border-[#2ecc71] bg-black/60 text-[#2ecc71] font-mono font-bold text-xl hover:bg-[#2ecc71] hover:text-black transition-all duration-150 shadow-[0_0_15px_rgba(46,204,113,0.2)] flex flex-col items-center menu-item-pop"
                            style={{ animationDelay: '0.5s' }}
                        >
                            <span>PLAY</span>
                        </button>
                        
                        <button 
                            onClick={onShowShop}
                            onMouseEnter={playHover}
                            className="group w-full px-6 py-3 border border-[#9b59b6] bg-black/60 text-[#9b59b6] font-mono font-bold text-lg hover:bg-[#9b59b6] hover:text-black transition-all duration-150 shadow-[0_0_10px_rgba(155,89,182,0.1)] flex flex-col items-start menu-item-pop"
                            style={{ animationDelay: '0.6s' }}
                        >
                            <span>GALACTIC BAZAAR</span>
                            <span className="text-[10px] font-normal opacity-70 mt-1">PURCHASE MODULES, TRAILS, AND SKINS</span>
                        </button>

                        <button 
                            onClick={onShowLeaderboard}
                            onMouseEnter={playHover}
                            className="group w-full px-6 py-3 border border-[#3498db] bg-black/60 text-[#3498db] font-mono font-bold text-lg hover:bg-[#3498db] hover:text-black transition-all duration-150 shadow-[0_0_10px_rgba(52,152,219,0.1)] flex flex-col items-start menu-item-pop"
                            style={{ animationDelay: '0.7s' }}
                        >
                            <span>DATA ARCHIVES</span>
                            <span className="text-[10px] font-normal opacity-70 mt-1">ACCESS PREVIOUS FLIGHT RECORDS</span>
                        </button>

                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={onShowOptions}
                                onMouseEnter={playHover}
                                className="group flex-1 px-4 py-3 border border-[#f1c40f] bg-black/60 text-[#f1c40f] font-mono font-bold text-sm hover:bg-[#f1c40f] hover:text-black transition-all duration-150 shadow-[0_0_10px_rgba(241,196,15,0.1)] flex flex-col items-center justify-center menu-item-pop"
                                style={{ animationDelay: '0.8s' }}
                            >
                                <span>CONFIG</span>
                            </button>

                            <button 
                                onClick={onShowCredits}
                                onMouseEnter={playHover}
                                className="group flex-1 px-4 py-3 border border-gray-500 bg-black/60 text-gray-500 font-mono font-bold text-sm hover:bg-gray-500 hover:text-black transition-all duration-150 shadow-[0_0_10px_rgba(156,163,175,0.1)] flex flex-col items-center justify-center menu-item-pop"
                                style={{ animationDelay: '0.85s' }}
                            >
                                <span>CREDITS</span>
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <button 
                            onClick={() => onStartGame('normal')}
                            onMouseEnter={playHover}
                            className="group w-full px-6 py-3 border border-[#2ecc71] bg-black/60 text-[#2ecc71] font-mono font-bold text-lg hover:bg-[#2ecc71] hover:text-black transition-all duration-150 shadow-[0_0_10px_rgba(46,204,113,0.1)] flex flex-col items-start menu-item-pop"
                            style={{ animationDelay: '0.1s' }}
                        >
                            <span>START MISSION</span>
                            <span className="text-[10px] font-normal opacity-70 mt-1">STANDARD PROTOCOL // SHIELDS: ONLINE</span>
                        </button>
                        
                        <button 
                            onClick={() => onStartGame('hardcore')}
                            onMouseEnter={playHover}
                            className="group w-full px-6 py-3 border border-red-500 bg-black/60 text-red-500 font-mono font-bold text-lg hover:bg-red-500 hover:text-black transition-all duration-150 shadow-[0_0_10px_rgba(239,68,68,0.1)] flex flex-col items-start menu-item-pop"
                            style={{ animationDelay: '0.2s' }}
                        >
                            <span>HARDCORE PROTOCOL</span>
                            <span className="text-[10px] font-normal opacity-70 mt-1">VOID IMMINENT // NO POWERUPS</span>
                        </button>

                        <button 
                            onClick={() => onStartGame('practice')}
                            onMouseEnter={playHover}
                            className="group w-full px-6 py-3 border border-blue-400 bg-black/60 text-blue-400 font-mono font-bold text-lg hover:bg-blue-400 hover:text-black transition-all duration-150 shadow-[0_0_10px_rgba(96,165,250,0.1)] flex flex-col items-start menu-item-pop"
                            style={{ animationDelay: '0.3s' }}
                        >
                            <span>PRACTICE MODE</span>
                            <span className="text-[10px] font-normal opacity-70 mt-1">NO DAMAGE // SKILL REFINEMENT</span>
                        </button>

                        <button 
                            onClick={() => { setMenuView('main'); playHover(); }}
                            onMouseEnter={playHover}
                            className="group w-full px-6 py-2 border border-gray-500 bg-black/60 text-gray-500 font-mono font-bold text-sm hover:bg-gray-500 hover:text-black transition-all duration-150 flex flex-col items-center menu-item-pop"
                            style={{ animationDelay: '0.4s' }}
                        >
                            <span>BACK</span>
                        </button>
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="relative z-10 text-center menu-item-pop opacity-50 mb-2" style={{ animationDelay: '0.9s' }}>
                <span className="text-[10px] font-mono text-gray-600 tracking-[0.2em]">ASTRA_OS v2.4.0 // READY</span>
            </div>
        </div>
    </div>
  );
};

export default MainMenu;
