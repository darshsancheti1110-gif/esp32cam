import React, { useState, useEffect } from 'react';
import { Settings, Shield, Volume2, VolumeX, Cpu, Radio, X, Check, ChevronDown } from 'lucide-react';
import { CameraConfig, ConnectionStatus } from '../types/camera';

interface NavbarProps {
  config: CameraConfig;
  status: ConnectionStatus;
  latencyMs?: number;
  onOpenConfig: () => void;
  onToggleSimulator: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  status,
  latencyMs,
  onOpenConfig,
  onToggleSimulator,
  soundEnabled,
  onToggleSound,
}) => {
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);

  useEffect(() => {
    if (!isModeModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModeModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModeModalOpen]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand & Live Pulsing Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsModeModalOpen(!isModeModalOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-950/60 border border-teal-500/30 text-teal-400 hover:text-teal-300 hover:bg-teal-900/60 hover:border-teal-400/50 shadow-sm shadow-teal-500/10 transition-all cursor-pointer active:scale-95 group shrink-0"
            title="Operating Mode Dropdown (Hardware Live vs Simulator)"
            aria-label="Switch between hardware and simulator mode"
          >
            <Shield className="w-5 h-5 group-hover:scale-105 transition-transform" />
            <ChevronDown className={`w-3.5 h-3.5 text-teal-400 transition-transform duration-200 ${isModeModalOpen ? 'rotate-180' : ''}`} />
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="text-xs sm:text-sm md:text-base font-bold tracking-tight text-zinc-100 whitespace-nowrap shrink-0">
                <span className="sm:hidden">ESP32-CAM Hub</span>
                <span className="hidden sm:inline">ESP32-CAM Security Hub</span>
              </span>

              {/* Live Status Indicator (Styled Red) */}
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono bg-red-600 text-white border border-red-500 shadow-md shadow-red-600/30 font-semibold shrink-0">
                {status === 'connected' && (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    <span className="text-white font-bold tracking-wide text-[11px]">LIVE</span>
                  </>
                )}

                {status === 'simulation' && (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    <span className="text-white font-bold text-[11px]">SIMULATOR</span>
                  </>
                )}

                {status === 'connecting' && (
                  <>
                    <span className="inline-flex rounded-full h-2 w-2 bg-white animate-pulse"></span>
                    <span className="text-white font-bold text-[11px]">PROBING...</span>
                  </>
                )}

                {status === 'offline' && (
                  <>
                    <span className="inline-flex rounded-full h-2 w-2 bg-white"></span>
                    <span className="text-white font-bold text-[11px]">OFFLINE</span>
                  </>
                )}
              </div>
            </div>

            {status === 'connected' && latencyMs !== undefined && (
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                <span className="text-emerald-400">{latencyMs}ms</span>
              </div>
            )}
          </div>
        </div>

        {/* Zone 2: Mode Segmented Switch & Sound Controls */}
        <div className="hidden md:flex items-center gap-3">
          {/* Hardware vs Simulator Segmented Toggle */}
          <div className="flex items-center p-1 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => config.isSimulated && onToggleSimulator()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                !config.isSimulated
                  ? 'bg-emerald-600 text-white border border-emerald-400 shadow-md shadow-emerald-600/30'
                  : 'bg-emerald-950/40 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/50 border border-emerald-500/30'
              }`}
              title="Connect directly to physical ESP32-CAM stream endpoint"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Hardware Live</span>
            </button>
            <button
              type="button"
              onClick={() => !config.isSimulated && onToggleSimulator()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                config.isSimulated
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Use built-in camera simulator to test controls and snapshots without active hardware"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Simulator Mode</span>
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute shutter sounds' : 'Enable shutter sounds'}
            title={soundEnabled ? 'Shutter audio enabled' : 'Shutter audio muted'}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              soundEnabled
                ? 'border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500'
                : 'border-emerald-500/50 bg-emerald-950/50 text-emerald-400 hover:bg-emerald-900/60 hover:text-emerald-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Operating Mode Dropdown (Anchored like Camera Settings, no scrolling needed) */}
      {isModeModalOpen && (
        <>
          {/* Backdrop for click-outside dismissal */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs animate-in fade-in duration-100"
            onClick={() => setIsModeModalOpen(false)}
          />

          {/* Compact Dropdown Card */}
          <div className="absolute top-full left-3 sm:left-6 mt-2 z-50 w-[calc(100vw-1.5rem)] max-w-sm sm:max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150">
            {/* Header: Title on Left, Red Close Button on Top Right */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/70">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-100 tracking-tight">Camera Operating Mode</h3>
                  <p className="text-[10px] text-zinc-400">Select feed source & controller</p>
                </div>
              </div>

              {/* Close Option on the Top Right Corner */}
              <button
                type="button"
                onClick={() => setIsModeModalOpen(false)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 active:scale-95 rounded-lg border border-red-500 shadow-md shadow-red-600/30 transition-all cursor-pointer"
                title="Close (Shortcut: Esc)"
              >
                <X className="w-3.5 h-3.5 text-white" />
                <span>Close</span>
              </button>
            </div>

            {/* In Between: The Two Mode Options (No Scrolling Needed) */}
            <div className="p-3 space-y-2">
              {/* Option 1: Hardware Live Stream */}
              <button
                type="button"
                onClick={() => {
                  if (config.isSimulated) {
                    onToggleSimulator();
                  }
                  setIsModeModalOpen(false);
                }}
                className={`w-full p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                  !config.isSimulated
                    ? 'bg-emerald-950/40 border-emerald-500/70 shadow-sm ring-1 ring-emerald-500/40'
                    : 'bg-zinc-950 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      !config.isSimulated
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Radio className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
                      Hardware Live Stream
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-mono text-zinc-400 truncate">
                      ESP32-CAM · {config.ip}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {!config.isSimulated ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <Check className="w-3 h-3" /> ACTIVE
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium px-2 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      Switch
                    </span>
                  )}
                </div>
              </button>

              {/* Option 2: Interactive Simulator */}
              <button
                type="button"
                onClick={() => {
                  if (!config.isSimulated) {
                    onToggleSimulator();
                  }
                  setIsModeModalOpen(false);
                }}
                className={`w-full p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                  config.isSimulated
                    ? 'bg-teal-950/40 border-teal-500/70 shadow-sm ring-1 ring-teal-500/40'
                    : 'bg-zinc-950 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      config.isSimulated
                        ? 'bg-teal-500 text-zinc-950 font-bold shadow-xs'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
                      Interactive Simulator Mode
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-mono text-zinc-400 truncate">
                      Virtual CCTV Feed & Servos
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {config.isSimulated ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center gap-1">
                      <Check className="w-3 h-3" /> ACTIVE
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium px-2 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      Switch
                    </span>
                  )}
                </div>
              </button>

              {/* Option 3: Camera Connection Setup & IP Config */}
              <div className="pt-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsModeModalOpen(false);
                    onOpenConfig();
                  }}
                  className="w-full p-2.5 sm:p-3 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-850 hover:border-teal-500/40 text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 shrink-0 group-hover:scale-105 transition-transform">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
                        Camera Connection & IP Config
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-mono text-zinc-400 truncate">
                        Configure IP, ports, & RTSP/MJPEG paths
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-[11px] font-semibold text-teal-400 px-2.5 py-1 rounded-lg bg-teal-950/60 border border-teal-500/30">
                    Setup
                  </div>
                </button>
              </div>

              {/* Option 4: Shutter & Servo Audio Feedback Toggle */}
              <div className="pt-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={onToggleSound}
                  className="w-full p-2.5 sm:p-3 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-850 hover:border-emerald-500/40 text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 transition-transform group-hover:scale-105 ${
                        soundEnabled
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </div>
                    <div className="truncate">
                      <div className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
                        Camera Audio Feedback
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-mono text-zinc-400 truncate">
                        {soundEnabled ? 'Mechanical shutter audio enabled' : 'Shutter audio muted'}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                        soundEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {soundEnabled ? 'Enabled' : 'Muted'}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
