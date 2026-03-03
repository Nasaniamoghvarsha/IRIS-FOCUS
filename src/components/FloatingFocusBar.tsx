import React from 'react';
import { StopCircle, Eye, EyeOff, Shield } from 'lucide-react';

interface FloatingFocusBarProps {
    selectedProcess: string | null;
    isFocusActive: boolean;
    isIrisEnabled: boolean;
    onExit: () => void;
}

export const FloatingFocusBar: React.FC<FloatingFocusBarProps> = ({
    selectedProcess,
    isFocusActive,
    isIrisEnabled,
    onExit
}) => {
    return (
        <div className="h-[60px] w-full bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50 flex items-center justify-between px-6 select-none drag-region">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Shield className="text-indigo-500" size={18} />
                    <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">Iris Focus</span>
                </div>

                <div className="h-4 w-[1px] bg-zinc-800 mx-2"></div>

                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${isFocusActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isFocusActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`}></span>
                        {isFocusActive ? 'Focus Active' : 'Paused'}
                    </div>

                    <div className="flex items-center gap-2 text-zinc-300">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Target:</span>
                        <span className="text-xs font-bold truncate max-w-[150px]">{selectedProcess || 'None'}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 no-drag">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    {isIrisEnabled ? (
                        <Eye size={14} className="text-indigo-400" />
                    ) : (
                        <EyeOff size={14} className="text-zinc-500" />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        Iris {isIrisEnabled ? 'On' : 'Off'}
                    </span>
                </div>

                <button
                    onClick={onExit}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 transition-all duration-300 font-bold uppercase tracking-widest text-[10px]"
                >
                    <StopCircle size={14} />
                    Exit Focus Mode
                </button>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .drag-region { -webkit-app-region: drag; }
                .no-drag { -webkit-app-region: no-drag; }
            `}} />
        </div>
    );
};
