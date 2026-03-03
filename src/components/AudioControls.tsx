import React from 'react';
import { Upload, Repeat, Volume2 } from 'lucide-react';
import { audioController } from '../utils/AudioController';

interface AudioControlsProps {
    volume: number;
    setVolume: (val: number) => void;
    threshold: number;
    setThreshold: (val: number) => void;
    loop: boolean;
    setLoop: (val: boolean) => void;
    onUpload?: () => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
    volume,
    setVolume,
    threshold,
    setThreshold,
    loop,
    setLoop,
    onUpload,
}) => {
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            audioController.loadAudio(file);
            onUpload?.();
        }
    };

    return (
        <div className="w-full max-w-md space-y-8 p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl shadow-2xl">
            <div className="space-y-6">
                {/* Upload Section */}
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                            <Upload size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold">Concentration Music</p>
                            <p className="text-xs text-zinc-500">Upload MP3 for focus</p>
                        </div>
                        <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
                    </label>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setLoop(!loop)}
                            className={`p-3 rounded-2xl transition-all ${loop ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-100'}`}
                        >
                            <Repeat size={20} />
                        </button>
                    </div>
                </div>

                <hr className="border-zinc-800" />

                {/* Controls Section */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                            <span>Threshold</span>
                            <span className="text-zinc-100">{threshold}s</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={threshold}
                            onChange={(e) => setThreshold(Number(e.target.value))}
                            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                            <span>Volume</span>
                            <span className="text-zinc-100">{Math.round(volume * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Volume2 size={16} className="text-zinc-500" />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={volume}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setVolume(val);
                                    audioController.setVolume(val);
                                }}
                                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
