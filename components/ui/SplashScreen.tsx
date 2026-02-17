import React from 'react';

interface SplashScreenProps {
  onStart: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onStart }) => {
  return (
    <div 
        onClick={onStart}
        className="absolute inset-0 z-[70] flex flex-col items-center justify-center cursor-pointer"
    >
         <h1 className="astra-logo text-5xl md:text-7xl mb-8 text-center select-none">
        ASTRA<br/>INFINITY
        </h1>
        <div className="text-[#2ecc71] text-xl font-mono animate-pulse tracking-widest select-none bg-black/50 px-4 py-2 rounded">
            [ CLICK TO INITIALIZE ]
        </div>
    </div>
  );
};

export default SplashScreen;