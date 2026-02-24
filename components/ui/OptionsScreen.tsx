
import React, { useState } from 'react';
import { audioManager } from '../../services/audioManager';
import { GameSettings } from '../../types';
import * as Storage from '../../services/storage';

interface OptionsScreenProps {
    onClose: () => void;
    playClick: () => void;
    playHover: () => void;
}

const Slider: React.FC<{ label: string, value: number, onChange: (v: number) => void }> = ({ label, value, onChange }) => {
    return (
        <div className="flex flex-col w-full mb-6">
            <div className="flex justify-between mb-2 font-mono text-[#f1c40f]">
                <span>{label}</span>
                <span>{Math.round(value * 100)}%</span>
            </div>
            <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#f1c40f]"
            />
        </div>
    );
};

const Toggle: React.FC<{ label: string, value: boolean, onChange: (v: boolean) => void }> = ({ label, value, onChange }) => {
    return (
        <div className="flex justify-between items-center w-full mb-4 cursor-pointer" onClick={() => onChange(!value)}>
            <span className="font-mono text-[#f1c40f]">{label}</span>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${value ? 'bg-[#f1c40f]' : 'bg-gray-700'}`}>
                <div className={`w-4 h-4 bg-black rounded-full shadow-md transform transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
        </div>
    );
};

const OptionsScreen: React.FC<OptionsScreenProps> = ({ onClose, playClick, playHover }) => {
    // Audio State
    const [master, setMaster] = useState(audioManager.masterVolume);
    const [music, setMusic] = useState(audioManager.musicVolume);
    const [sfx, setSfx] = useState(audioManager.sfxVolume);

    // Game Settings State
    const [gameSettings, setGameSettings] = useState<GameSettings>(Storage.getGameSettings());
    const [confirmWipe, setConfirmWipe] = useState<number>(0);

    const handleMasterChange = (v: number) => {
        setMaster(v);
        audioManager.masterVolume = v;
        audioManager.updateVolumes();
    };

    const handleMusicChange = (v: number) => {
        setMusic(v);
        audioManager.musicVolume = v;
        audioManager.updateVolumes();
    };

    const handleSfxChange = (v: number) => {
        setSfx(v);
        audioManager.sfxVolume = v;
        audioManager.updateVolumes();
    };

    const updateGameSettings = (newSettings: Partial<GameSettings>) => {
        const updated = { ...gameSettings, ...newSettings };
        setGameSettings(updated);
        Storage.saveGameSettings(updated);
        // Note: GameCanvas pulls from Storage/Events, but for this simple app, 
        // passing changes back or reloading might be needed. 
        // We will assume GameCanvas re-reads settings on close or periodically.
        // Actually, better to just save to storage here and have GameCanvas read it.
    };

    return (
        <div className="absolute inset-0 z-[80] flex flex-col items-center justify-center bg-black/95 text-white p-6">
             <h2 className="text-[#f1c40f] text-3xl font-bold mb-6 tracking-widest border-b-2 border-[#f1c40f] pb-2">
                 SYSTEM CONFIG
             </h2>
             
             <div className="w-full max-w-sm h-[60vh] overflow-y-auto pr-2">
                 <div className="p-6 border border-[#333] bg-black/50 rounded-lg shadow-2xl mb-4">
                     <h3 className="text-gray-400 font-mono text-sm mb-4 border-b border-gray-700 pb-1">AUDIO</h3>
                     <Slider label="MASTER OUTPUT" value={master} onChange={handleMasterChange} />
                     <Slider label="MUSIC LEVEL" value={music} onChange={handleMusicChange} />
                     <Slider label="SFX LEVEL" value={sfx} onChange={(v) => { handleSfxChange(v); if(Math.random() > 0.8) audioManager.playSfx('ui_click'); }} />
                 </div>

                 <div className="p-6 border border-[#333] bg-black/50 rounded-lg shadow-2xl mb-4">
                     <h3 className="text-gray-400 font-mono text-sm mb-4 border-b border-gray-700 pb-1">DISPLAY</h3>
                     <div className="flex justify-between items-center w-full mb-4 cursor-pointer" onClick={() => { updateGameSettings({ reduceMotion: !gameSettings.reduceMotion }); playClick(); }}>
                        <span className="font-mono text-[#f1c40f]">REDUCE MOTION</span>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${gameSettings.reduceMotion ? 'bg-[#f1c40f]' : 'bg-gray-700'}`}>
                            <div className={`w-4 h-4 bg-black rounded-full shadow-md transform transition-transform ${gameSettings.reduceMotion ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                     </div>
                     <div className="flex justify-between items-center w-full mb-4 cursor-pointer" onClick={() => { updateGameSettings({ showFps: !gameSettings.showFps }); playClick(); }}>
                        <span className="font-mono text-[#f1c40f]">SHOW FPS</span>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${gameSettings.showFps ? 'bg-[#f1c40f]' : 'bg-gray-700'}`}>
                            <div className={`w-4 h-4 bg-black rounded-full shadow-md transform transition-transform ${gameSettings.showFps ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                     </div>
                     <div className="flex justify-between items-center w-full mb-4 cursor-pointer" onClick={() => { updateGameSettings({ showHitboxes: !gameSettings.showHitboxes }); playClick(); }}>
                        <span className="font-mono text-[#f1c40f]">DISPLAY HITBOXES</span>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${gameSettings.showHitboxes ? 'bg-[#f1c40f]' : 'bg-gray-700'}`}>
                            <div className={`w-4 h-4 bg-black rounded-full shadow-md transform transition-transform ${gameSettings.showHitboxes ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                     </div>
                     
                     <div className="flex flex-col w-full mb-2">
                        <span className="font-mono text-[#f1c40f] mb-2">FRAME LIMIT</span>
                        <div className="flex gap-2">
                            {[0, 60, 30].map(limit => (
                                <button
                                    key={limit}
                                    onClick={() => { updateGameSettings({ frameLimit: limit }); playClick(); }}
                                    className={`flex-1 py-1 font-mono text-sm border ${
                                        gameSettings.frameLimit === limit 
                                        ? 'bg-[#f1c40f] text-black border-[#f1c40f]' 
                                        : 'text-gray-400 border-gray-700 hover:border-[#f1c40f]'
                                    }`}
                                >
                                    {limit === 0 ? 'MAX' : limit}
                                </button>
                            ))}
                        </div>
                     </div>
                 </div>

                 {/* DANGER ZONE */}
                 <div className="p-6 border border-red-900 bg-red-950/30 rounded-lg shadow-2xl mb-4">
                     <h3 className="text-red-500 font-mono text-sm mb-4 border-b border-red-900 pb-1 font-bold">DANGER ZONE</h3>
                     
                     {!confirmWipe ? (
                         <button 
                             onClick={() => { setConfirmWipe(1); playClick(); }}
                             className="w-full py-3 bg-red-900/20 border border-red-600 text-red-500 font-mono font-bold hover:bg-red-600 hover:text-black transition-colors"
                         >
                             ERASE ALL DATA
                         </button>
                     ) : confirmWipe === 1 ? (
                         <div className="flex flex-col gap-2">
                             <p className="text-red-400 text-xs font-mono text-center mb-2">WARNING: THIS IS IRREVERSIBLE.</p>
                             <button 
                                 onClick={() => { setConfirmWipe(2); playClick(); }}
                                 className="w-full py-2 bg-red-600 text-black font-mono font-bold hover:bg-red-500"
                             >
                                 I AM SURE
                             </button>
                             <button 
                                 onClick={() => { setConfirmWipe(0); playClick(); }}
                                 className="w-full py-2 border border-gray-600 text-gray-400 font-mono hover:bg-gray-800"
                             >
                                 CANCEL
                             </button>
                         </div>
                     ) : (
                         <div className="flex flex-col gap-2">
                             <p className="text-red-500 text-xs font-mono text-center mb-2 font-bold animate-pulse">FINAL CONFIRMATION: DELETE EVERYTHING?</p>
                             <button 
                                 onClick={() => { 
                                     localStorage.clear(); 
                                     window.location.reload(); 
                                 }}
                                 className="w-full py-3 bg-red-600 text-black font-mono font-black hover:bg-red-500 border-2 border-red-400"
                             >
                                 YES, WIPE DATA
                             </button>
                             <button 
                                 onClick={() => { setConfirmWipe(0); playClick(); }}
                                 className="w-full py-2 border border-gray-600 text-gray-400 font-mono hover:bg-gray-800"
                             >
                                 CANCEL
                             </button>
                         </div>
                     )}
                 </div>
             </div>

             <button 
              onClick={() => { playClick(); onClose(); }}
              onMouseEnter={playHover}
              className="mt-6 text-[#f1c40f] border border-[#f1c40f] px-8 py-3 hover:bg-[#f1c40f] hover:text-black transition-colors font-bold font-mono"
             >
                 APPLY & RETURN
             </button>
        </div>
    );
};

export default OptionsScreen;
