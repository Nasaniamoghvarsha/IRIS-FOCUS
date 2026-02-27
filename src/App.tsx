import React, { useState, useEffect, useCallback } from 'react';
import { CameraView } from './components/CameraView';
import { StatusIndicator } from './components/StatusIndicator';
import { AudioControls } from './components/AudioControls';
import { useGazeState } from './hooks/useGazeState';
import { audioController } from './utils/AudioController';
import { Shield, Info, AlertCircle, Terminal, PlayCircle } from 'lucide-react';

const App: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [threshold, setThreshold] = useState(3);
  const [volume, setVolume] = useState(0.6);
  const [loop, setLoop] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [camStatus, setCamStatus] = useState("Idle");
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

  const { isLookingAtScreen, updateGaze } = useGazeState(threshold);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggleSession();
      }
      if (e.code === 'Escape') {
        setIsEnabled(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, isAudioUnlocked]); // Threshold changes handled by useCallback deps if needed

  const toggleSession = useCallback(async () => {
    try {
      if (!isEnabled) {
        setError(null);
        if (!isAudioUnlocked) {
          await audioController.unlockAudio();
          setIsAudioUnlocked(true);
        }
        setIsEnabled(true);
      } else {
        setIsEnabled(false);
      }
    } catch (err: any) {
      console.error("Session toggle failed:", err);
      setError(`Startup Failed: ${err.message || err}`);
    }
  }, [isEnabled, isAudioUnlocked]);

  // Memoized handlers to prevent CameraView from re-triggering its effect loop
  const onGazeUpdate = useCallback((looking: boolean) => {
    updateGaze(looking);
  }, [updateGaze]);

  const onErrorCallback = useCallback((msg: string | null) => {
    setError(msg);
  }, []);

  const onStatusChange = useCallback((status: string) => {
    setCamStatus(status);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center p-6 sm:p-12 overflow-x-hidden">
      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-16">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">IRIS FOCUS</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Privacy-First Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Local Processing Only
          </div>
          <button className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors">
            <Info size={20} />
          </button>
        </div>
      </header>

      {/* Error Notification */}
      {error && (
        <div className="w-full max-w-4xl mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/50 text-red-500 flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <main className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

        {/* Left Column: Visuals */}
        <div className="space-y-8 flex flex-col items-center lg:items-start animate-fade-in">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <CameraView
              isEnabled={isEnabled}
              onGazeUpdate={onGazeUpdate}
              onError={onErrorCallback}
              onStatusChange={onStatusChange}
            />
          </div>

          <div className="flex flex-col items-center lg:items-start gap-4">
            <StatusIndicator isEnabled={isEnabled} isLookingAtScreen={isLookingAtScreen} />

            <button
              onClick={toggleSession}
              className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold uppercase tracking-widest transition-all duration-300 ${isEnabled
                  ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 active:scale-95'
                }`}
            >
              {isEnabled ? (
                <>Stop Tracking</>
              ) : (
                <>
                  <PlayCircle size={20} />
                  Start Focus Session
                </>
              )}
            </button>
          </div>

          {/* Debug Panel */}
          <div className="w-full max-w-sm p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 font-mono glass-panel">
            <div className="flex items-center gap-2 mb-4 text-zinc-500">
              <Terminal size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">System Debug</span>
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-600">Camera:</span>
                <span className={camStatus.includes("active") ? "text-emerald-500" : "text-zinc-400"}>{camStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Audio:</span>
                <span className={isAudioUnlocked ? "text-emerald-500" : "text-amber-500"}>{isAudioUnlocked ? "Unlocked" : "Locked"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Gaze State:</span>
                <span className={isEnabled ? "text-indigo-400" : "text-zinc-400"}>
                  {isEnabled ? (isLookingAtScreen ? "Focused" : "Away") : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Controls */}
        <div className="flex flex-col items-center lg:items-end animate-fade-in">
          <AudioControls
            volume={volume}
            setVolume={setVolume}
            threshold={threshold}
            setThreshold={setThreshold}
            loop={loop}
            setLoop={setLoop}
          />

          <div className="mt-8 flex gap-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            <span>[Space] Toggle</span>
            <span>[Esc] Disable</span>
          </div>
        </div>

      </main>

      <footer className="mt-auto pt-16 text-zinc-600 text-[10px] font-bold uppercase tracking-[0.3em] opacity-50">
        No Data Leaves Your Device
      </footer>
    </div>
  );
};

export default App;
