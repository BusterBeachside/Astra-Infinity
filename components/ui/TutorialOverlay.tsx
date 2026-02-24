import React from 'react';

interface TutorialOverlayProps {
    title: string;
    message: string;
    onDismiss: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ title, message, onDismiss }) => {
    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm menu-animate-enter">
            <div className="w-[90%] max-w-md border-2 border-[#00ff00] bg-black p-6 rounded-lg shadow-[0_0_20px_rgba(0,255,0,0.3)] relative overflow-hidden">
                
                {/* Scanlines */}
                <div className="absolute inset-0 pointer-events-none opacity-10" 
                     style={{ background: 'linear-gradient(rgba(0,255,0,0.1) 50%, transparent 50%)', backgroundSize: '100% 4px' }}>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-4 border-b border-[#00ff00]/50 pb-2">
                    <h2 className="text-[#00ff00] font-mono font-bold text-xl tracking-widest animate-pulse">
                        INCOMING TRANSMISSION
                    </h2>
                    <div className="w-3 h-3 bg-[#00ff00] rounded-full animate-ping"></div>
                </div>

                {/* Content */}
                <div className="mb-6">
                    <h3 className="text-white font-mono font-bold text-lg mb-2">{title}</h3>
                    <p className="text-[#00ff00]/80 font-mono text-sm leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer / Action */}
                <button 
                    onClick={onDismiss}
                    className="w-full py-3 bg-[#00ff00]/20 border border-[#00ff00] text-[#00ff00] font-mono font-bold hover:bg-[#00ff00] hover:text-black transition-all duration-200 group"
                >
                    <span className="group-hover:hidden">[ ACKNOWLEDGE ]</span>
                    <span className="hidden group-hover:block">[ RESUME MISSION ]</span>
                </button>

                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00ff00]"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00ff00]"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00ff00]"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00ff00]"></div>
            </div>
        </div>
    );
};

export default TutorialOverlay;
