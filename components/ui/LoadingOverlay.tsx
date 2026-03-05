import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';

interface LoadingOverlayProps {
    message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'LOADING...' }) => {
    return (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-6"
            >
                <div className="relative">
                    <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="text-blue-400 font-mono text-sm tracking-[0.3em] font-bold animate-pulse uppercase">
                        {message}
                    </div>
                    <div className="w-48 h-1 bg-gray-900 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            className="w-full h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        />
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoadingOverlay;
