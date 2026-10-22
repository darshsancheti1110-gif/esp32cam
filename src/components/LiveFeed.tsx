import React, { useState, useEffect, useRef } from 'react';
import {
  CameraConfig,
  CameraSettings,
  FRAMESIZES,
  SPECIAL_EFFECTS,
} from '../types/camera';
import { CameraSimulator } from './CameraSimulator';
import { AlertTriangle, RefreshCw, Zap, Crosshair } from 'lucide-react';

interface LiveFeedProps {
  config: CameraConfig;
  settings: CameraSettings;
  streamUrl: string;
  isFlashActive: boolean;
  isShutterFlashing: boolean;
  zoomLevel: number;
  showHud: boolean;
  onRefreshStream: () => void;
  onSwitchToSimulator: () => void;
  onElementReady: (el: HTMLImageElement | HTMLCanvasElement) => void;
}

export const LiveFeed: React.FC<LiveFeedProps> = ({
  config,
  settings,
  streamUrl,
  isFlashActive,
  isShutterFlashing,
  zoomLevel,
  showHud,
  onRefreshStream,
  onSwitchToSimulator,
  onElementReady,
}) => {
  const [streamError, setStreamError] = useState(false);
  const [isStreamLoading, setIsStreamLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [fps, setFps] = useState(24);

  // Pan offsets for digital zoom
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Live ticking clock for OSD
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      setCurrentTime(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 50);
    return () => clearInterval(interval);
  }, []);

  // Frame counter simulation / measurement
  useEffect(() => {
    const fpsInterval = setInterval(() => {
      // Small realistic variation in FPS
      const base = settings.framesize > 8 ? 12 : 24;
      const jitter = (Math.random() - 0.5) * 2;
      setFps(Math.round((base + jitter) * 10) / 10);
    }, 1200);
    return () => clearInterval(fpsInterval);
  }, [settings.framesize]);

  // Reset pan when zoom is 1
  useEffect(() => {
    if (zoomLevel <= 1) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [zoomLevel]);

  // Handle stream image load/error
  const handleImageLoad = () => {
    setIsStreamLoading(false);
    setStreamError(false);
    if (imgRef.current) {
      onElementReady(imgRef.current);
    }
  };

  const handleImageError = () => {
    setIsStreamLoading(false);
    setStreamError(true);
  };

  // Reset error when stream URL changes
  useEffect(() => {
    if (!config.isSimulated) {
      setIsStreamLoading(true);
      setStreamError(false);
    }
  }, [streamUrl, config.isSimulated]);

  // Pan drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    const maxOffset = (zoomLevel - 1) * 160;
    const newX = Math.max(-maxOffset, Math.min(maxOffset, e.clientX - dragStartRef.current.x));
    const newY = Math.max(-maxOffset, Math.min(maxOffset, e.clientY - dragStartRef.current.y));
    setPanOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Resolution info
  const currentFramesize = FRAMESIZES.find((f) => f.value === settings.framesize) || FRAMESIZES[4];
  const currentEffect = SPECIAL_EFFECTS.find((e) => e.id === settings.special_effect) || SPECIAL_EFFECTS[0];

  // Client-side CSS filters for preview & hardware mirroring
  let cssFilter = `brightness(${100 + settings.brightness * 20}%) contrast(${100 + settings.contrast * 25}%) saturate(${100 + settings.saturation * 25}%)`;
  if (settings.special_effect === 1) cssFilter += ' invert(100%)';
  if (settings.special_effect === 2) cssFilter += ' grayscale(100%)';
  if (settings.special_effect === 3) cssFilter += ' sepia(100%) hue-rotate(320deg) saturate(300%)';
  if (settings.special_effect === 4) cssFilter += ' sepia(100%) hue-rotate(80deg) saturate(300%)';
  if (settings.special_effect === 5) cssFilter += ' sepia(100%) hue-rotate(180deg) saturate(300%)';
  if (settings.special_effect === 6) cssFilter += ' sepia(90%)';

  const transformStyle = `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px) ${
    settings.vflip ? 'scaleY(-1)' : ''
  } ${settings.hmirror ? 'scaleX(-1)' : ''}`.trim();

  return (
    <div
      ref={containerRef}
      id="cctv-viewport-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full aspect-4/3 sm:aspect-16/10 lg:aspect-16/9 bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl select-none group ${
        zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
      }`}
    >
      {/* Subtle Scanline Overlay */}
      <div className="absolute inset-0 cctv-scanlines z-10 pointer-events-none opacity-40" />

      {/* Crosshair grid overlay if HUD enabled */}
      {showHud && (
        <div className="absolute inset-0 cctv-grid z-10 pointer-events-none opacity-60" />
      )}

      {/* Tactical HUD Corner Reticles */}
      {showHud && (
        <div className="absolute inset-0 z-20 pointer-events-none p-4 sm:p-6 flex flex-col justify-between">
          <div className="flex justify-between">
            <div className="w-6 h-6 border-t-2 border-l-2 border-teal-500/70" />
            <div className="w-6 h-6 border-t-2 border-r-2 border-teal-500/70" />
          </div>
          {/* Central Target Crosshair */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Crosshair className="w-10 h-10 text-teal-400/25 animate-pulse" />
          </div>
          <div className="flex justify-between">
            <div className="w-6 h-6 border-b-2 border-l-2 border-teal-500/70" />
            <div className="w-6 h-6 border-b-2 border-r-2 border-teal-500/70" />
          </div>
        </div>
      )}

      {/* Main Video Element: Live Stream <img> OR Simulator Canvas */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-zinc-950">
        {!config.isSimulated ? (
          <>
            {/* The specified live stream <img> pointing to ${espIp}/stream */}
            <img
              ref={imgRef}
              src={streamUrl}
              alt="ESP32-CAM Live Video Stream"
              crossOrigin="anonymous"
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{
                filter: cssFilter,
                transform: transformStyle,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
              className="w-full h-full object-contain pointer-events-none"
            />

            {/* Loading Skeleton */}
            {isStreamLoading && !streamError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 z-20 space-y-3">
                <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
                <div className="text-xs font-mono text-zinc-400 tracking-wider">
                  CONNECTING TO MJPEG FEED...
                </div>
                <div className="text-[11px] font-mono text-zinc-600 truncate max-w-xs">
                  {streamUrl}
                </div>
              </div>
            )}

            {/* Error / Offline State */}
            {streamError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 z-20 p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400 mb-3">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-zinc-200 mb-1">
                  Cannot Connect to ESP32 Stream
                </h3>
                <p className="text-xs text-zinc-400 max-w-md mb-4 font-mono leading-relaxed">
                  Target stream endpoint <code className="text-teal-400">{streamUrl}</code> did not respond. Verify your ESP32 is powered on and connected to the same Wi-Fi.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={onRefreshStream}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Stream</span>
                  </button>
                  <button
                    type="button"
                    onClick={onSwitchToSimulator}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-950 bg-teal-400 hover:bg-teal-300 rounded-lg shadow-md transition-all"
                  >
                    <span>Switch to Simulator Mode</span>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              transform: transformStyle,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className="w-full h-full"
          >
            <CameraSimulator
              settings={settings}
              flashlightOn={isFlashActive}
              onRefReady={onElementReady}
            />
          </div>
        )}
      </div>

      {/* Flashlight Beam Visual Effect */}
      {isFlashActive && (
        <div
          className="absolute inset-0 pointer-events-none z-15 mix-blend-screen opacity-70 animate-pulse transition-opacity duration-300"
          style={{
            background:
              'radial-gradient(circle at center, rgba(254, 240, 138, 0.45) 0%, rgba(253, 224, 71, 0.15) 45%, rgba(0, 0, 0, 0) 75%)',
          }}
        />
      )}

      {/* Snapshot Shutter Flash Keyframe Effect */}
      {isShutterFlashing && (
        <div className="absolute inset-0 bg-white pointer-events-none z-30 opacity-90 animate-shutterFlash" />
      )}

      {/* On-Screen Display (OSD) Telemetry HUD */}
      {showHud && (
        <div className="absolute inset-0 z-25 pointer-events-none p-3 sm:p-5 flex flex-col justify-between font-mono text-[11px] sm:text-xs">
          {/* Top Bar OSD */}
          <div className="flex items-start justify-between text-zinc-300 bg-zinc-950/40 backdrop-blur-xs p-2 rounded-lg border border-zinc-800/40">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 font-bold text-red-500 tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
                REC
              </span>
              <span className="text-zinc-500">|</span>
              <span className="text-zinc-200 font-semibold">CAM-01 [ENTRANCE HUB]</span>
              <span className="text-zinc-500">|</span>
              <span className="text-teal-400 font-semibold">{currentFramesize.name}</span>
            </div>

            <div className="text-right text-emerald-400 font-semibold tabular-nums">
              {currentTime}
            </div>
          </div>

          {/* Bottom Bar OSD */}
          <div className="flex items-end justify-between text-zinc-300 bg-zinc-950/40 backdrop-blur-xs p-2 rounded-lg border border-zinc-800/40">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-zinc-400">
              <span className="text-teal-300 font-medium tabular-nums">{fps} FPS</span>
              <span>·</span>
              <span>RES: {currentFramesize.resolution}</span>
              <span>·</span>
              <span className="text-teal-300 font-semibold">PT: {settings.pan ?? 90}°/{settings.tilt ?? 90}°</span>
              <span>·</span>
              <span>Q: {settings.quality}</span>
              {settings.special_effect !== 0 && (
                <>
                  <span>·</span>
                  <span className="text-amber-400">FX: {currentEffect.label}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isFlashActive && (
                <div className="flex items-center gap-1 text-yellow-300 font-semibold animate-pulse">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>FLASH ON</span>
                </div>
              )}
              {zoomLevel > 1 && (
                <span className="text-teal-400 font-bold bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-500/30">
                  ZOOM {zoomLevel.toFixed(1)}x
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
