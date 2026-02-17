import React from 'react';

interface HighScoreInputProps {
  initials: string;
  setInitials: (s: string) => void;
  onSubmit: () => void;
  playHover: () => void;
}

const HighScoreInput: React.FC<HighScoreInputProps> = ({ initials, setInitials, onSubmit, playHover }) => {
  return (
    <div className="absolute inset-0 z-[80] flex flex-col items-center justify-center bg-black/90 text-white">
        <h2 className="text-[#f1c40f] text-3xl font-bold mb-8 text-glow-gold">NEW RECORD</h2>
        <div className="text-xl font-mono mb-4">ENTER INITIALS</div>
        <input 
            type="text" 
            maxLength={3} 
            value={initials}
            onChange={(e) => setInitials(e.target.value.toUpperCase())}
            className="bg-black border-2 border-[#f1c40f] text-center text-5xl font-mono w-40 p-2 mb-8 text-[#f1c40f] outline-none tracking-widest uppercase"
            autoFocus
            placeholder='___'
        />
        <button 
            onClick={onSubmit}
            onMouseEnter={playHover}
            className="px-8 py-3 bg-[#f1c40f] text-black font-bold text-xl rounded hover:bg-white transition-colors"
        >
            SUBMIT
        </button>
    </div>
  );
};

export default HighScoreInput;