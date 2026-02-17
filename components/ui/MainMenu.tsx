
import React, { useState } from 'react';

interface MainMenuProps {
  onStartGame: (mode: 'normal' | 'hardcore') => void;
  onShowLeaderboard: () => void;
  onShowOptions: () => void;
  onShowShop: () => void;
  onShowCredits: () => void;
  playHover: () => void;
  coins: number;
}

const generateConsoleLogs = () => {
    const hex = () => Math.floor(Math.random() * 16777215).toString(16).toUpperCase();
    const variable = () => ['addr', 'ptr', 'buffer', 'socket', 'stream', 'core', 'thread'][Math.floor(Math.random()*7)];
    const status = () => ['OK', 'PENDING', 'FAILED', 'BYPASS', 'LOCKED'][Math.floor(Math.random()*5)];
    
    let output = "";
    
    for(let i=0; i<40; i++) {
        const type = Math.random();
        if (type < 0.3) {
            output += `[${new Date().toISOString()}] SYSTEM_CHECK: MODULE_${hex()} ... ${status()}\n`;
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

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onShowLeaderboard, onShowOptions, onShowShop, onShowCredits, playHover, coins }) => {
  const [consoleLog] = useState(generateConsoleLogs());

  return (
    <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center backdrop-blur-[1px]">
        <div className="monitor-frame menu-animate-enter relative w-[320px] md:w-[400px] h-[600px] flex flex-col items-center justify-center rounded-xl overflow-hidden shadow-2xl">
            
            <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none z-0">
                <div className="scrolling-code text-[#00ff00] font-mono text-xs leading-4 whitespace-pre p-2">
                    {consoleLog + "\n" + consoleLog}
                </div>
            </div>

            <div className="scanlines absolute inset-0 z-0 opacity-30"></div>
            
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 text-[#f1c40f] font-mono font-bold">
                <span>{coins}</span>
                <div className="w-3 h-3 bg-[#f1c40f] rounded-full shadow-[0_0_5px_#f1c40f]"></div>
            </div>

            <h1 className="astra-logo relative z-10 text-3xl md:text-4xl mb-4 text-center select-none menu-item-pop" style={{ animationDelay: '0.4s' }}>
            ASTRA<br/>INFINITY
            </h1>
            
            <div className="relative z-10 flex flex-col gap-3 w-72 mt-2">
                <button 
                    onClick={() => onStartGame('normal')}
                    onMouseEnter={playHover}
                    className="group w-full px-6 py-3 border border-[#2ecc71] bg-black/60 text-[#2ecc71] font-mono font-bold text-lg hover:bg-[#2ecc71] hover:text-black transition-all duration-150 shadow-[0_0_10px_rgba(46,204,113,0.1)] flex flex-col items-start menu-item-pop"
                    style={{ animationDelay: '0.5s' }}
                >
                    <span>START MISSION</span>
                    <span className="text-[10px] font-normal opacity-70 mt-1">STANDARD PROTOCOL // SHIELDS: ONLINE</span>
                </button>
                
                <button 
                    onClick={() => onStartGame('hardcore')}
                    onMouseEnter={playHover}
                    className="group w-full px-6 py-3 border border-red-500 bg-black/60 text-red-500 font-mono font-bold text-lg hover:bg-red-500 hover:text-black transition-all duration-150 shadow-[0_0_10px_rgba(239,68,68,0.1)] flex flex-col items-start menu-item-pop"
                    style={{ animationDelay: '0.6s' }}
                >
                    <span>HARDCORE PROTOCOL</span>
                    <span className="text-[10px] font-normal opacity-70 mt-1">VOID IMMINENT // NO POWERUPS</span>
                </button>
                
                <button 
                    onClick={onShowShop}
                    onMouseEnter={playHover}
                    className="group w-full px-6 py-3 border border-[#9b59b6] bg-black/60 text-[#9b59b6] font-mono font-bold text-lg hover:bg-[#9b59b6] hover:text-black transition-all duration-150 shadow-[0_0_10px_rgba(155,89,182,0.1)] flex flex-col items-start menu-item-pop"
                    style={{ animationDelay: '0.65s' }}
                >
                    <span>UPGRADE MODULES</span>
                    <span className="text-[10px] font-normal opacity-70 mt-1">ENHANCE CORE SYSTEMS</span>
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

                <button 
                    onClick={onShowOptions}
                    onMouseEnter={playHover}
                    className="group w-full px-6 py-3 border border-[#f1c40f] bg-black/60 text-[#f1c40f] font-mono font-bold text-lg hover:bg-[#f1c40f] hover:text-black transition-all duration-150 shadow-[0_0_10px_rgba(241,196,15,0.1)] flex flex-col items-start menu-item-pop"
                    style={{ animationDelay: '0.8s' }}
                >
                    <span>SYSTEM CONFIG</span>
                    <span className="text-[10px] font-normal opacity-70 mt-1">AUDIO // DISPLAY</span>
                </button>
            </div>

            <div className="absolute bottom-4 left-0 w-full text-center z-20 menu-item-pop" style={{ animationDelay: '0.9s' }}>
                <button 
                    onClick={onShowCredits}
                    onMouseEnter={playHover}
                    className="text-gray-500 text-xs font-mono hover:text-[#2ecc71] transition-colors tracking-widest"
                >
                    [ CREDITS ]
                </button>
            </div>
        </div>
    </div>
  );
};

export default MainMenu;
