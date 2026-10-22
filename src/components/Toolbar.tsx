import React from 'react';
import {
  Camera,
  Flashlight,
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye,
  EyeOff,
  Images,
} from 'lucide-react';

interface ToolbarProps {
  flashlightOn: boolean;
  isFullscreen: boolean;
  zoomLevel?: number;
  showHud: boolean;
  isCapturing: boolean;
  isFlashLoading: boolean;
  vflip?: boolean;
  hmirror?: boolean;
  isGalleryOpen?: boolean;
  snapshotsCount?: number;
  onSnapshot: () => void;
  onToggleGallery?: () => void;
  onToggleFlashlight: () => void;
  onToggleFullscreen: () => void;
  onRefreshStream: () => void;
  onChangeZoom?: (level: number) => void;
  onToggleHud: () => void;
  onToggleVflip?: () => void;
  onToggleHmirror?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  flashlightOn,
  isFullscreen,
  showHud,
  isCapturing,
  isFlashLoading,
  isGalleryOpen = false,
  snapshotsCount = 0,
  onSnapshot,
  onToggleGallery,
  onToggleFlashlight,
  onToggleFullscreen,
  onRefreshStream,
  onToggleHud,
}) => {

  return (
    <div className="w-full bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-2 sm:p-3.5 shadow-xl flex items-center justify-between gap-1.5 sm:gap-3 overflow-x-auto no-scrollbar sm:overflow-visible">
      {/* Primary Key Action: Snapshot & Flashlight */}
      <div className="flex items-center gap-1 sm:gap-2.5 min-w-0">
        {/* Snapshot Button */}
        <button
          type="button"
          onClick={onSnapshot}
          disabled={isCapturing}
          className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-[11px] sm:text-xs font-bold text-zinc-950 bg-teal-400 hover:bg-teal-300 active:scale-98 rounded-lg shadow-md shadow-teal-500/20 transition-all disabled:opacity-50 cursor-pointer shrink-0"
          title="Capture high-resolution snapshot frame (Shortcut: Space)"
        >
          <Camera className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isCapturing ? 'animate-bounce' : ''}`} />
          <span className="whitespace-nowrap">{isCapturing ? 'Capturing...' : 'Snapshot'}</span>
        </button>

        {/* Gallery Toggle Button (Visible when snapshots exist) */}
        {snapshotsCount > 0 && onToggleGallery && (
          <button
            type="button"
            onClick={onToggleGallery}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2.5 text-[11px] sm:text-xs font-semibold rounded-lg border transition-all cursor-pointer shrink-0 ${
              isGalleryOpen
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-sm shadow-teal-500/20'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750 hover:text-white'
            }`}
            title={isGalleryOpen ? 'Hide Snapshot Gallery' : 'View Captured Snapshots'}
          >
            <Images className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="whitespace-nowrap">Gallery ({snapshotsCount})</span>
          </button>
        )}

        {/* Flashlight Toggle Button */}
        <button
          type="button"
          onClick={onToggleFlashlight}
          disabled={isFlashLoading}
          className={`p-1.5 sm:p-2 text-xs font-bold rounded-lg border transition-all cursor-pointer active:scale-98 shrink-0 flex items-center justify-center ${
            flashlightOn
              ? 'bg-yellow-300 hover:bg-yellow-200 text-zinc-950 border-yellow-200 shadow-lg shadow-yellow-400/40 ring-1 sm:ring-2 ring-yellow-400'
              : 'bg-yellow-400 hover:bg-yellow-300 text-zinc-950 border-yellow-500/40 shadow-md shadow-yellow-500/20'
          }`}
          title={flashlightOn ? 'Turn Flashlight OFF (/control?var=flash&val=0)' : 'Turn Flashlight ON (/control?var=flash&val=1)'}
          aria-label={flashlightOn ? 'Flashlight is ON' : 'Flashlight is OFF'}
        >
          <Flashlight
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-950 shrink-0 ${
              flashlightOn ? 'fill-zinc-950 animate-pulse' : 'fill-zinc-950/20'
            }`}
          />
        </button>
      </div>

      {/* Secondary Quick Toggles: HUD, Stream Reconnect, Fullscreen */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* HUD / OSD Toggle */}
        <button
          type="button"
          onClick={onToggleHud}
          className={`p-1.5 sm:p-2 rounded-lg border transition-colors shrink-0 ${
            showHud
              ? 'bg-teal-500/15 text-teal-400 border-teal-500/30'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
          }`}
          title={showHud ? 'Hide CCTV HUD Telemetry' : 'Show CCTV HUD Telemetry'}
        >
          {showHud ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>

        {/* Stream Reconnect Button */}
        <button
          type="button"
          onClick={onRefreshStream}
          className="p-1.5 sm:p-2.5 text-white bg-red-600 hover:bg-red-500 active:scale-98 border border-red-500 rounded-lg transition-all shadow-md shadow-red-600/30 cursor-pointer shrink-0"
          title="Force reconnect / refresh stream buffer"
        >
          <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </button>

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 shadow-md shadow-emerald-600/30 rounded-lg transition-all cursor-pointer active:scale-95 shrink-0"
          title="Toggle Fullscreen (Shortcut: F)"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              <span className="hidden sm:inline">Exit Fullscreen</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              <span className="hidden sm:inline">Fullscreen</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
