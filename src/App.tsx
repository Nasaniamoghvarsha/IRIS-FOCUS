import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CameraView } from './components/CameraView';
import { StatusIndicator } from './components/StatusIndicator';
import { AudioControls } from './components/AudioControls';
import { WindowSelector } from './components/WindowSelector';
import { FloatingFocusBar } from './components/FloatingFocusBar';
import { useGazeState } from './hooks/useGazeState';
import { audioController } from './utils/AudioController';
import { Shield, Terminal, PlayCircle, Monitor } from 'lucide-react';

const App: React.FC = () => {
  // Standard State
  const [isEnabled, setIsEnabled] = useState(false);
  const [threshold, setThreshold] = useState(3);
  const [volume, setVolume] = useState(0.6);
  const [loop, setLoop] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
  const [selectedPid, setSelectedPid] = useState<number | null>(null);
  const [activeWindow, setActiveWindow] = useState<any>(null);
  const [camStatus, setCamStatus] = useState<string>("Initializing...");
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const isFloatingBar = useMemo(() => window.location.hash === '#floating-bar', []);

  const { isLookingAtScreen, updateGaze, stopMusic } = useGazeState(threshold);

  // Electron IPC & State Sync
  useEffect(() => {
    const api = (window as any).electronAPI;
    if (api) {
      console.log("[App] Registering IPC listeners");
      api.onWindowUpdate((win: any) => {
        setActiveWindow(win);
      });
      api.onStateUpdate((state: any) => {
        console.log("[App] Received state update:", state);
        setSelectedProcess(state.selectedProcess);
        setSelectedPid(state.selectedPid);
        setIsFocusMode(state.focusModeEnabled);
        setIsEnabled(state.irisEnabled);
        setThreshold(state.threshold);
        setVolume(state.volume);
      });
    }
  }, [setThreshold, setVolume]);

  // Focus Logic: Auto-pause/resume based on active window
  // Only applies when Focus Mode is ACTIVE. Simply picking a window should NOT pause tracking.
  const isTargetActive = useMemo(() => {
    if (!isFocusMode) return true;
    if (!selectedProcess) return true;

    const activeName = (activeWindow?.name || '').toLowerCase();
    const activePid = activeWindow?.owner?.processId || activeWindow?.pid;
    const target = (selectedProcess || '').toLowerCase();

    // 1. Iris Focus always counts as active
    const irisNames = ['iris focus', 'electron', 'iris-focus', 'vite'];
    const isIris = irisNames.some(n => activeName.includes(n));
    if (isIris) return true;

    // 2. Strict Matching: PID or exact process name
    let matched = false;
    let matchType = 'none';

    if (selectedPid && activePid === selectedPid) {
      matched = true;
      matchType = 'PID';
    } else if (activeName.includes(target) || target.includes(activeName)) {
      matched = true;
      matchType = 'Sub-Name Match';
    }

    console.log(`[FocusCheck] Target: "${target}" (${selectedPid}) | Active: "${activeName}" (${activePid}) | Match: ${matched} (${matchType})`);

    return matched;
  }, [activeWindow, selectedProcess, selectedPid, isFocusMode]);

  // Global Audio Watcher: Immediately kill music if focus is lost OR mode toggled off
  useEffect(() => {
    if (!isTargetActive || !isFocusMode) {
      stopMusic();
    }
  }, [isTargetActive, isFocusMode, stopMusic]);

  // Camera is always enabled when Iris is ON - it doesn't need to know about focus mode.
  // Only the AUDIO (gaze → music trigger) is gated by isTargetActive.
  const isEffectivelyEnabled = useMemo(() => {
    return isEnabled;
  }, [isEnabled]);

  // Force stop music if target becomes inactive
  useEffect(() => {
    if (!isTargetActive) {
      stopMusic();
    }
  }, [isTargetActive, stopMusic]);

  const toggleSession = useCallback(async () => {
    try {
      const api = (window as any).electronAPI;
      if (!isEnabled) {
        setError(null);
        if (!isAudioUnlocked) {
          console.log("[App] Unlocking audio...");
          await audioController.unlockAudio();
          setIsAudioUnlocked(true);
          setAudioReady(true);
          setTimeout(() => setAudioReady(false), 3000);
        }
        setIsEnabled(true);
        if (api) api.updateAppState({ irisEnabled: true });
      } else {
        setIsEnabled(false);
        setIsFocusMode(false);
        if (api) {
          api.updateAppState({ irisEnabled: false, focusModeEnabled: false });
          api.toggleFocusMode(false);
        }
      }
    } catch (err: any) {
      console.error("Session toggle failed:", err);
      setError(`Startup Failed: ${err.message || err}`);
    }
  }, [isEnabled, isAudioUnlocked, setError]);

  const toggleFocusMode = useCallback(() => {
    if (!selectedProcess) {
      setError("Please select a target window first.");
      return;
    }

    const nextState = !isFocusMode;
    setIsFocusMode(nextState);
    const api = (window as any).electronAPI;
    if (api) {
      api.updateAppState({ focusModeEnabled: nextState });
      api.toggleFocusMode(nextState);
      if (nextState) {
        api.focusTargetWindow(selectedProcess);
      }
    }
  }, [isFocusMode, selectedProcess, setError]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggleSession();
      }
      if (e.code === 'Escape') {
        const api = (window as any).electronAPI;
        setIsEnabled(false);
        setIsFocusMode(false);
        if (api) {
          api.updateAppState({ irisEnabled: false, focusModeEnabled: false });
          api.toggleFocusMode(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, isAudioUnlocked, isFocusMode, toggleSession]); // Added toggleSession to dependencies

  const onGazeUpdate = useCallback((looking: boolean) => {
    // User wants the audio penalty to ONLY trigger when in the target window.
    // If they switch elsewhere, the app "pauses" and should be silent.
    if (isFocusMode && !isTargetActive) {
      stopMusic();
      return;
    }
    updateGaze(looking);
  }, [updateGaze, stopMusic, isFocusMode, isTargetActive]);

  const onStatusChange = useCallback((status: string) => {
    setCamStatus(status);
  }, []);

  // Handle Floating Bar View
  if (isFloatingBar) {
    return (
      <div className="flex flex-col h-full bg-zinc-950">
        <FloatingFocusBar
          selectedProcess={selectedProcess}
          isFocusActive={isTargetActive}
          isIrisEnabled={isEnabled}
          onExit={() => {
            setIsFocusMode(false);
            if ((window as any).electronAPI) {
              (window as any).electronAPI.toggleFocusMode(false);
            }
          }}
        />
      </div>
    );
  }

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
          {(window as any).electronAPI && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              Desktop Client Active
            </div>
          )}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Local Processing Only
          </div>
        </div>
      </header>

      {/* Status Notifications */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            {error}
          </div>
        )}
        {audioReady && (
          <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            Audio system ready 🎵
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

        {/* Left Column: Visuals & Focus Control */}
        <div className="space-y-8 flex flex-col items-center lg:items-start animate-fade-in">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <CameraView
              isEnabled={isEffectivelyEnabled}
              onGazeUpdate={onGazeUpdate}
              onError={(msg) => setError(msg)}
              onStatusChange={onStatusChange}
            />

            {!isTargetActive && isEnabled && (
              <div className="absolute inset-0 z-10 bg-zinc-950/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center text-center p-6 border border-zinc-800">
                <Monitor size={48} className="text-zinc-600 mb-4" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Tracking Paused</h3>
                <p className="text-xs text-zinc-500 mt-2">Switch focus back to <span className="text-indigo-400 font-bold">{selectedProcess}</span> to resume.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center lg:items-start gap-4">
            <StatusIndicator
              isEnabled={isEnabled}
              isLookingAtScreen={isLookingAtScreen && isTargetActive}
            />

            <div className="flex flex-wrap gap-3">
              <button
                onClick={toggleSession}
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold uppercase tracking-widest transition-all duration-300 ${isEnabled
                  ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 active:scale-95'
                  }`}
              >
                {isEnabled ? 'Stop Iris' : (
                  <>
                    <PlayCircle size={20} />
                    Start Iris
                  </>
                )}
              </button>

              {(window as any).electronAPI && isEnabled && (
                <button
                  onClick={toggleFocusMode}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 font-bold uppercase tracking-widest transition-all"
                >
                  Enter Focus Mode
                </button>
              )}
            </div>
          </div>

          {/* Debug Panel */}
          <div className="w-full max-w-sm p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 font-mono glass-panel">
            <div className="flex items-center gap-2 mb-4 text-zinc-500">
              <Terminal size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">System Debug</span>
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-600">Active Window:</span>
                <span className="text-indigo-400 max-w-[150px] truncate text-right">{activeWindow?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Camera:</span>
                <span className={camStatus.includes("active") ? "text-emerald-500" : "text-zinc-400"}>{camStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Audio:</span>
                <span className={isAudioUnlocked ? "text-emerald-500" : "text-amber-500"}>{isAudioUnlocked ? "Unlocked" : "Locked"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Gaze:</span>
                <span className={isEnabled ? "text-indigo-400" : "text-zinc-400"}>
                  {isEnabled ? (isLookingAtScreen ? (isTargetActive ? "Focused" : "Paused") : "Away") : "Idle"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Controls & Window Selector */}
        <div className="flex flex-col items-center lg:items-end gap-12 animate-fade-in">
          {(window as any).electronAPI && (
            <WindowSelector
              selectedProcess={selectedProcess}
              onSelect={(p, pid) => {
                setSelectedProcess(p);
                setSelectedPid(pid);
                (window as any).electronAPI.setTargetProcess(p, pid);
              }}
            />
          )}

          <AudioControls
            volume={volume}
            setVolume={setVolume}
            threshold={threshold}
            setThreshold={setThreshold}
            loop={loop}
            setLoop={setLoop}
            onUpload={() => {
              setAudioReady(true);
              setTimeout(() => setAudioReady(false), 3000);
            }}
          />

          <div className="mt-8 flex gap-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            <span>[Space] Toggle</span>
            <span>[Esc] Stop</span>
          </div>
        </div>

      </main>

      <footer className="mt-auto pt-16 text-zinc-600 text-[10px] font-bold uppercase tracking-[0.3em] opacity-50">
        Iris Focus v1.0 • Desktop Client Enabled
      </footer>
    </div>
  );
};

export default App;
