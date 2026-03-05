import React, { useEffect, useState, useMemo } from 'react';
import { ReplayData, GameMode } from '../../types';
import { getReplays, deleteReplay } from '../../services/storage';
import { compressReplay } from '../../services/replayCompression';

interface ReplayMenuProps {
    onPlayReplay: (replay: ReplayData) => void;
    onClose: () => void;
    playClick: () => void;
    playHover: () => void;
}

type SortField = 'date' | 'duration' | 'grazeTime' | 'score' | 'showboats' | 'size';

const ReplayMenu: React.FC<ReplayMenuProps> = ({ onPlayReplay, onClose, playClick, playHover }) => {
    const [replays, setReplays] = useState<ReplayData[]>([]);
    const [sortBy, setSortBy] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [filterMode, setFilterMode] = useState<GameMode | 'all'>('all');

    useEffect(() => {
        setReplays(getReplays());
    }, []);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteReplay(id);
        setReplays(getReplays());
        playClick();
    };

    const filteredAndSortedReplays = useMemo(() => {
        let result = replays.map(r => {
            const compressed = compressReplay(r);
            return {
                ...r,
                size: JSON.stringify(compressed).length
            };
        });

        // Filter
        if (filterMode !== 'all') {
            result = result.filter(r => r.gameMode === filterMode);
        }

        // Sort
        result.sort((a, b) => {
            let valA = a[sortBy] ?? 0;
            let valB = b[sortBy] ?? 0;

            if (sortBy === 'date') {
                valA = a.date;
                valB = b.date;
            }

            if (sortOrder === 'asc') {
                return (valA as number) - (valB as number);
            } else {
                return (valB as number) - (valA as number);
            }
        });

        return result;
    }, [replays, sortBy, sortOrder, filterMode]);

    const totalStorage = useMemo(() => {
        return replays.reduce((acc, r) => acc + JSON.stringify(compressReplay(r)).length, 0);
    }, [replays]);

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        return `${(bytes / 1024).toFixed(1)} KB`;
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        
        if (seconds < 60) {
            const s = Math.floor(seconds);
            const ms = Math.floor((seconds * 10) % 10);
            return `${s}.${ms}s`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 text-white font-mono p-4">
            <h2 className="text-4xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 tracking-widest filter drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                FLIGHT LOGS
            </h2>

            {/* Controls */}
            <div className="w-full max-w-2xl mb-6 space-y-4 bg-gray-900/80 p-4 border border-gray-800 rounded-lg">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 uppercase">Sort By:</span>
                        <select 
                            value={sortBy}
                            onChange={(e) => { playClick(); setSortBy(e.target.value as SortField); }}
                            className="bg-black border border-gray-700 text-cyan-400 text-sm p-1 focus:outline-none focus:border-cyan-500"
                        >
                            <option value="date">LATEST</option>
                            <option value="duration">TIME</option>
                            <option value="grazeTime">GRAZING</option>
                            <option value="score">COINS</option>
                            <option value="showboats">SHOWBOATS</option>
                            <option value="size">FILE SIZE</option>
                        </select>
                        <button 
                            onClick={() => { playClick(); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}
                            className="p-1 border border-gray-700 hover:border-cyan-500 text-cyan-400 transition-colors"
                            title={sortOrder === 'asc' ? "Ascending" : "Descending"}
                        >
                            {sortOrder === 'asc' ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 4h13M3 8h9M3 12h5M13 12l5 5 5-5M18 7v10"/></svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 4h13M3 8h9M3 12h5M13 17l5-5 5 5M18 17V7"/></svg>
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 uppercase">Filter:</span>
                        <div className="flex border border-gray-700 rounded overflow-hidden">
                            {(['all', 'normal', 'hardcore'] as const).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => { playClick(); setFilterMode(mode); }}
                                    className={`px-3 py-1 text-xs uppercase transition-colors ${filterMode === mode ? 'bg-cyan-600 text-white' : 'bg-black text-gray-400 hover:bg-gray-900'}`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">
                        Total Storage: <span className="text-cyan-500">{formatSize(totalStorage)}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">
                        Logs: <span className="text-cyan-500">{replays.length} / 20</span>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-2xl h-[50vh] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {filteredAndSortedReplays.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20">NO FLIGHT DATA MATCHES CRITERIA</div>
                ) : (
                    filteredAndSortedReplays.map((replay) => (
                        <div 
                            key={replay.id}
                            onClick={() => { playClick(); onPlayReplay(replay); }}
                            onMouseEnter={playHover}
                            className="group relative bg-gray-900/50 border border-gray-700 hover:border-cyan-500 p-4 cursor-pointer transition-all duration-200 hover:bg-gray-800"
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex-1">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                                        <div className="text-white">TIME: <span className="text-cyan-400">{formatDuration(replay.duration)}</span></div>
                                        <div className="text-white">COINS: <span className="text-yellow-400">{Math.floor(replay.score)}</span></div>
                                        <div className="text-white">GRAZE: <span className="text-orange-400">{formatDuration(replay.grazeTime || 0)}</span></div>
                                        <div className="text-white">SHOW: <span className="text-cyan-400">{replay.showboats || 0}</span></div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="text-[10px] text-gray-500">
                                            {new Date(replay.date).toLocaleDateString()} {new Date(replay.date).toLocaleTimeString()}
                                        </div>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${replay.gameMode === 'hardcore' ? 'border-red-500/50 text-red-500/70' : 'border-blue-500/50 text-blue-500/70'} uppercase font-bold`}>
                                            {replay.gameMode}
                                        </span>
                                        <div className="text-[10px] text-gray-600 uppercase">
                                            Size: {formatSize(replay.size)}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => handleDelete(replay.id, e)}
                                    className="p-2 text-gray-500 hover:text-red-500 transition-colors z-10 ml-4"
                                    title="Delete Replay"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                    </svg>
                                </button>
                            </div>
                            
                            {/* Hover Effect */}
                            <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                    ))
                )}
            </div>

            <button 
                onClick={() => { playClick(); onClose(); }}
                onMouseEnter={playHover}
                className="mt-8 px-8 py-3 bg-gray-800 border border-gray-600 hover:bg-gray-700 hover:border-white transition-all text-lg font-bold"
            >
                BACK
            </button>
        </div>
    );
};

export default ReplayMenu;
