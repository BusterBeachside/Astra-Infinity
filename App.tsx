import React from 'react';
import GameCanvas from './components/GameCanvas';

const App: React.FC = () => {
  return (
    <div className="flex justify-center items-center w-full h-[100dvh] bg-[#111] overflow-hidden">
      <div className="relative w-full h-full max-w-[480px] bg-[#050505] shadow-2xl overflow-hidden text-white select-none touch-none ring-1 ring-white/10">
        <GameCanvas />
      </div>
    </div>
  );
};

export default App;