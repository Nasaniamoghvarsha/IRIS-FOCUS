import React, { useState, useEffect } from 'react';
import { Monitor, RefreshCw, CheckCircle2, ChevronRight } from 'lucide-react';

interface WindowInfo {
    name: string;
    title: string;
    pid: number;
}

interface WindowSelectorProps {
    onSelect: (processName: string, pid: number) => void;
    selectedProcess: string | null;
}

export const WindowSelector: React.FC<WindowSelectorProps> = ({ onSelect, selectedProcess }) => {
    const [windows, setWindows] = useState<WindowInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const refreshWindows = async () => {
        setIsLoading(true);
        try {
            // @ts-ignore
            const list = await window.electronAPI.requestWindowList();
            setWindows(list);
        } catch (err) {
            console.error("Failed to get window list:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshWindows();
    }, []);

    return (
        <div className="w-full p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                        <Monitor size={20} />
                    </div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Focus Target</h2>
                </div>
                <button
                    onClick={refreshWindows}
                    className={`p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-all ${isLoading ? 'animate-spin' : ''}`}
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {windows.map((win, idx) => (
                    <button
                        key={`${win.name}-${idx}`}
                        onClick={() => onSelect(win.name, win.pid)}
                        className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${selectedProcess === win.name
                            ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-100'
                            : 'bg-zinc-800/20 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50 hover:border-zinc-600'
                            }`}
                    >
                        <div className="flex items-center gap-3 text-left overflow-hidden">
                            <div className={`w-2 h-2 rounded-full ${selectedProcess === win.name ? 'bg-indigo-400 animate-pulse' : 'bg-zinc-700'}`}></div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold truncate leading-none mb-1 capitalize text-zinc-300">
                                    {win.name}
                                </p>
                                <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">
                                    {win.title}
                                </p>
                            </div>
                        </div>
                        {selectedProcess === win.name ? (
                            <CheckCircle2 size={16} className="text-indigo-400 shrink-0" />
                        ) : (
                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 shrink-0" />
                        )}
                    </button>
                ))}
                {windows.length === 0 && !isLoading && (
                    <div className="py-8 text-center text-zinc-600 text-[10px] uppercase font-bold tracking-widest">
                        No active windows found
                    </div>
                )}
            </div>
        </div>
    );
};
