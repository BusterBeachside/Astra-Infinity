
import React from 'react';

interface CreditsScreenProps {
    onClose: () => void;
    playClick: () => void;
}

const CreditsScreen: React.FC<CreditsScreenProps> = ({ onClose, playClick }) => {
    return (
        <div className="absolute inset-0 z-[90] flex flex-col items-center justify-center bg-black/95 text-white p-6 backdrop-blur-md">
            <div className="border border-[#2ecc71] p-8 max-w-md w-full relative shadow-[0_0_20px_rgba(46,204,113,0.2)]">
                <h2 className="text-[#2ecc71] text-3xl font-bold mb-8 text-center tracking-widest border-b border-[#2ecc71]/30 pb-4">
                    CREDITS
                </h2>

                <div className="space-y-6 font-mono text-center">
                    <div>
                        <div className="text-gray-500 text-xs mb-1 uppercase tracking-wider">Director / Creative & Game Design Lead</div>
                        <div className="text-white text-lg font-bold">BusterBeachside</div>
                        <div className="text-[#2ecc71] text-xs mt-0.5">(Human)</div>
                    </div>

                    <div>
                        <div className="text-gray-500 text-xs mb-1 uppercase tracking-wider">Programming</div>
                        <div className="text-white text-lg font-bold">Google Gemini</div>
                        <div className="text-[#2ecc71] text-xs mt-0.5">(Via AI Studio)</div>
                    </div>

                    <div>
                        <div className="text-gray-500 text-xs mb-1 uppercase tracking-wider">Music</div>
                        <div className="text-white text-sm">
                            "Title Screen" & "Alpha Wave"<br/>
                            from <span className="text-[#2ecc71]">Planet Puzzle League</span> (Nintendo DS)
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => { playClick(); onClose(); }}
                    className="mt-8 w-full border border-[#2ecc71] text-[#2ecc71] py-3 hover:bg-[#2ecc71] hover:text-black transition-colors font-bold tracking-widest"
                >
                    CLOSE TERMINAL
                </button>
            </div>
        </div>
    );
};

export default CreditsScreen;
