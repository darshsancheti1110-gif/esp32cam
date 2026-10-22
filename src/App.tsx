import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CameraConfig,
  CameraSettings,
  ConnectionStatus,
  EventLogEntry,
  Snapshot,
  FRAMESIZES,
  SavedAnglePreset,
} from './types/camera';
import {
  getStreamUrl,
  sendControlCommand,
  sendServoCommand,
  checkEsp32Connectivity,
  captureFrameToDataUrl,
} from './services/esp32Service';
import { sounds } from './services/soundEffects';
import { Navbar } from './components/Navbar';
import { LiveFeed } from './components/LiveFeed';
import { Toolbar } from './components/Toolbar';
import { CameraControls } from './components/CameraControls';
import { JoystickController } from './components/JoystickController';
import { SnapshotGallery } from './components/SnapshotGallery';
import { ConfigModal } from './components/ConfigModal';
import { LightboxModal } from './components/LightboxModal';
import { Sliders, ChevronDown } from 'lucide-react';

const STORAGE_KEY_CONFIG = 'esp32_cam_config_v1';
const STORAGE_KEY_SNAPSHOTS = 'esp32_cam_snapshots_v1';
const STORAGE_KEY_SAVED_ANGLES = 'esp32_cam_saved_angles_v1';

const DEFAULT_CONFIG: CameraConfig = {
  ip: 'http://192.168.1.15',
  port: 80,
  streamPort: 80,
  streamPath: '/stream',
  capturePath: '/capture',
  controlPath: '/control',
  statusPath: '/status',
  autoReconnect: true,
  isSimulated: true, // Default to simulator on initial load so preview works seamlessly out of the box
};

const DEFAULT_SETTINGS: CameraSettings = {
  framesize: 6, // VGA 640x480
  quality: 12, // JPEG quality (10 - 63)
  brightness: 0, // -2 to 2
  contrast: 0, // -2 to 2
  saturation: 0, // -2 to 2
  special_effect: 0, // Normal
  flash: 0, // Off
  flash_intensity: 255, // 100%
  vflip: 0,
  hmirror: 0,
  aec: 1,
  agc: 1,
  pan: 90,
  tilt: 90,
};

export default function App() {
  // Config state
  const [config, setConfig] = useState<CameraConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return DEFAULT_CONFIG;
  });

  // Camera Sensor Settings
  const [settings, setSettings] = useState<CameraSettings>(DEFAULT_SETTINGS);

  // Connectivity & Telemetry
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    config.isSimulated ? 'simulation' : 'connecting'
  );
  const [latencyMs, setLatencyMs] = useState<number | undefined>(undefined);
  const [streamCacheBuster, setStreamCacheBuster] = useState(0);

  // Video Viewport & UX State
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showHud, setShowHud] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);
  const [isFlashLoading, setIsFlashLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Command feedback & Modals
  const [lastCommand, setLastCommand] = useState<{
    url: string;
    success: boolean;
    time: string;
  } | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [isCameraControlsOpen, setIsCameraControlsOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Snapshots & Logs
  const [snapshots, setSnapshots] = useState<Snapshot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SNAPSHOTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  // Saved Angle Presets (Pan & Tilt positions)
  const [savedAngles, setSavedAngles] = useState<SavedAnglePreset[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_ANGLES);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  const [logs, setLogs] = useState<EventLogEntry[]>([]);

  // Video element reference (img or canvas)
  const activeElementRef = useRef<HTMLImageElement | HTMLCanvasElement | null>(null);

  // Save config changes to localStorage
  const handleSaveConfig = (newConfig: CameraConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(newConfig));
    } catch {
      // Ignore
    }
    addLog('info', `Camera configuration updated: ${newConfig.ip}`);
  };

  // Add Log Entry
  const addLog = useCallback(
    (type: EventLogEntry['type'], message: string, details?: string) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      const entry: EventLogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: timeStr,
        type,
        message,
        details,
      };
      setLogs((prev) => [entry, ...prev.slice(0, 99)]);
    },
    []
  );

  // Periodic Connectivity Probe
  useEffect(() => {
    if (config.isSimulated) {
      setConnectionStatus('simulation');
      setLatencyMs(undefined);
      return;
    }

    let isMounted = true;
    const probe = async () => {
      const start = performance.now();
      const ok = await checkEsp32Connectivity(config);
      const duration = Math.round(performance.now() - start);

      if (!isMounted) return;

      if (ok) {
        setConnectionStatus('connected');
        setLatencyMs(duration);
      } else {
        setConnectionStatus('offline');
        setLatencyMs(undefined);
      }
    };

    probe();
    const interval = setInterval(probe, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [config]);

  // Handle Fullscreen change
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Update Settings & Send ESP32 Command
  const handleUpdateSetting = async <K extends keyof CameraSettings>(
    key: K,
    val: CameraSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: val }));

    const result = await sendControlCommand(config, String(key), Number(val));
    const nowTime = new Date().toLocaleTimeString();

    setLastCommand({
      url: result.url,
      success: result.success,
      time: nowTime,
    });

    if (result.success) {
      addLog(
        'command',
        `Adjusted sensor register [${String(key)}=${val}]`,
        config.isSimulated ? 'Simulated' : result.url
      );
    } else {
      addLog('error', `Failed to set [${String(key)}]`, result.error || 'Network error');
    }
  };

  // Reset Settings to Default
  const handleResetSettings = async () => {
    setSettings(DEFAULT_SETTINGS);
    sounds.playBeep(440, 0.05);
    addLog('info', 'Reset all camera settings to factory defaults');

    // Also reset servos to center (90°, 90°)
    sendServoCommand(config, 90, 90).catch(() => {});

    // Trigger settings reset in parallel
    await Promise.allSettled([
      sendControlCommand(config, 'framesize', DEFAULT_SETTINGS.framesize),
      sendControlCommand(config, 'quality', DEFAULT_SETTINGS.quality),
      sendControlCommand(config, 'brightness', DEFAULT_SETTINGS.brightness),
      sendControlCommand(config, 'contrast', DEFAULT_SETTINGS.contrast),
      sendControlCommand(config, 'saturation', DEFAULT_SETTINGS.saturation),
      sendControlCommand(config, 'special_effect', DEFAULT_SETTINGS.special_effect),
      sendControlCommand(config, 'vflip', DEFAULT_SETTINGS.vflip),
      sendControlCommand(config, 'hmirror', DEFAULT_SETTINGS.hmirror),
      sendControlCommand(config, 'aec', DEFAULT_SETTINGS.aec),
      sendControlCommand(config, 'agc', DEFAULT_SETTINGS.agc),
    ]);

    setLastCommand({
      url: `${config.ip}/control (defaults)`,
      success: true,
      time: new Date().toLocaleTimeString(),
    });
  };

  // Toggle Flashlight
  const handleToggleFlashlight = async () => {
    const nextVal = settings.flash === 1 ? 0 : 1;
    setIsFlashLoading(true);
    sounds.playBeep(nextVal ? 700 : 350, 0.06);

    setSettings((prev) => ({ ...prev, flash: nextVal }));
    const result = await sendControlCommand(config, 'flash', nextVal);
    setIsFlashLoading(false);

    setLastCommand({
      url: result.url,
      success: result.success,
      time: new Date().toLocaleTimeString(),
    });

    if (result.success) {
      addLog(
        'command',
        nextVal === 1 ? 'High-power flashlight enabled' : 'Flashlight disabled',
        config.isSimulated ? 'Simulated LED' : result.url
      );
    } else {
      addLog('error', 'Flashlight toggle failed', result.error);
    }
  };

  // Handle Servo Pan & Tilt Change
  const handlePanTiltChange = async (newPan: number, newTilt: number) => {
    setSettings((prev) => ({ ...prev, pan: newPan, tilt: newTilt }));
    const result = await sendServoCommand(config, newPan, newTilt);
    setLastCommand({
      url: result.url,
      success: result.success,
      time: new Date().toLocaleTimeString(),
    });
  };

  // Save Angle Preset
  const handleSaveAngle = (name?: string, panVal?: number, tiltVal?: number) => {
    const targetPan = panVal !== undefined ? panVal : settings.pan;
    const targetTilt = tiltVal !== undefined ? tiltVal : settings.tilt;
    const newPreset: SavedAnglePreset = {
      id: `angle_${Date.now()}`,
      name: name || `Saved Angle (${targetPan}°, ${targetTilt}°)`,
      pan: targetPan,
      tilt: targetTilt,
      timestamp: new Date().toLocaleTimeString(),
    };

    setSavedAngles((prev) => {
      const updated = [newPreset, ...prev.filter((item) => item.id !== newPreset.id)].slice(0, 5);
      try {
        localStorage.setItem(STORAGE_KEY_SAVED_ANGLES, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });

    sounds.playBeep(880, 0.08);
    addLog('command', `Saved servo angle preset: Pan ${targetPan}°, Tilt ${targetTilt}°`);
  };

  // Delete Saved Angle Preset & Reset
  const handleDeleteAngle = (id?: string) => {
    setSavedAngles((prev) => {
      const updated = id ? prev.filter((item) => item.id !== id) : [];
      try {
        localStorage.setItem(STORAGE_KEY_SAVED_ANGLES, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });

    // Reset servo angle to center (90°, 90°)
    handlePanTiltChange(90, 90);
    sounds.playBeep(330, 0.06);
    addLog('command', 'Deleted saved servo angle and reset servos to center (90°, 90°)');
  };

  // Reset Servo Angle to Center (90°, 90°)
  const handleResetServoAngle = () => {
    handlePanTiltChange(90, 90);
    sounds.playBeep(520, 0.05);
    addLog('command', 'Reset servo angle to center (90°, 90°)');
  };

  // Capture Snapshot
  const handleSnapshot = () => {
    if (!activeElementRef.current || isCapturing) return;

    setIsGalleryOpen(true);
    setIsCapturing(true);
    setIsShutterFlashing(true);
    sounds.playShutter();

    setTimeout(() => {
      setIsShutterFlashing(false);
    }, 180);

    try {
      const currentRes =
        FRAMESIZES.find((f) => f.value === settings.framesize)?.name || 'VGA';
      const dataUrl = captureFrameToDataUrl(activeElementRef.current);

      if (dataUrl) {
        const now = new Date();
        const formattedTime = now.toLocaleString();
        const newSnapshot: Snapshot = {
          id: `snap_${Date.now()}`,
          timestamp: now.toISOString(),
          formattedTime,
          dataUrl,
          resolution: currentRes,
          source: config.isSimulated ? 'simulator' : 'live',
        };

        const updated = [newSnapshot, ...snapshots.slice(0, 29)];
        setSnapshots(updated);
        try {
          localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(updated));
        } catch {
          // If storage full, remove older ones
          const pruned = [newSnapshot, ...snapshots.slice(0, 10)];
          try {
            localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(pruned));
          } catch {
            // Ignore quota
          }
        }

        addLog('success', `Snapshot captured: ${currentRes}`, formattedTime);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog('error', 'Snapshot capture failed', msg);
    } finally {
      setIsCapturing(false);
    }
  };

  // Download Snapshot
  const handleDownloadSnapshot = (snap: Snapshot) => {
    const a = document.createElement('a');
    a.href = snap.dataUrl;
    const cleanTime = snap.timestamp.replace(/[:.]/g, '-');
    a.download = `ESP32_CAM_${cleanTime}.jpg`;
    a.click();
    addLog('info', `Downloaded snapshot ${snap.id}`);
  };

  // Delete Snapshot
  const handleDeleteSnapshot = (id: string) => {
    const updated = snapshots.filter((s) => s.id !== id);
    setSnapshots(updated);
    try {
      localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(updated));
    } catch {
      // Ignore
    }
    addLog('info', `Deleted snapshot ${id}`);
  };

  // Clear All Snapshots
  const handleClearAllSnapshots = () => {
    setSnapshots([]);
    try {
      localStorage.removeItem(STORAGE_KEY_SNAPSHOTS);
    } catch {
      // Ignore
    }
    addLog('info', 'Cleared snapshot gallery');
  };

  // Refresh Stream
  const handleRefreshStream = () => {
    setStreamCacheBuster(Date.now());
    sounds.playBeep(600, 0.05);
    addLog('info', 'Stream buffer refreshed (cache buster applied)');
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    const elem = document.getElementById('cctv-viewport-container');
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Toggle Simulator Mode
  const handleToggleSimulator = () => {
    const nextVal = !config.isSimulated;
    const updatedConfig = { ...config, isSimulated: nextVal };
    setConfig(updatedConfig);
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updatedConfig));
    } catch {
      // Ignore
    }
    sounds.playBeep(nextVal ? 520 : 740, 0.07);
    addLog(
      'info',
      nextVal ? 'Switched to Interactive Simulator' : `Switched to Hardware Live Stream (${config.ip})`
    );
  };

  // Keyboard Shortcuts (Space=Snapshot, F=Fullscreen, L=Flash, R=Refresh)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if inside an input or select
      if (
        ['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleSnapshot();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        handleToggleFlashlight();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRefreshStream();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSettings((prev) => {
          const nextPan = Math.max(0, prev.pan - 5);
          sendServoCommand(config, nextPan, prev.tilt);
          return { ...prev, pan: nextPan };
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSettings((prev) => {
          const nextPan = Math.min(180, prev.pan + 5);
          sendServoCommand(config, nextPan, prev.tilt);
          return { ...prev, pan: nextPan };
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSettings((prev) => {
          const nextTilt = Math.min(180, prev.tilt + 5);
          sendServoCommand(config, prev.pan, nextTilt);
          return { ...prev, tilt: nextTilt };
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSettings((prev) => {
          const nextTilt = Math.max(0, prev.tilt - 5);
          sendServoCommand(config, prev.pan, nextTilt);
          return { ...prev, tilt: nextTilt };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const streamUrl = getStreamUrl(config, streamCacheBuster > 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased selection:bg-teal-500/30 selection:text-teal-200">
      {/* Top Navigation Bar */}
      <Navbar
        config={config}
        status={connectionStatus}
        latencyMs={latencyMs}
        onOpenConfig={() => setIsConfigOpen(true)}
        onToggleSimulator={handleToggleSimulator}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          sounds.enabled = !soundEnabled;
          setSoundEnabled(!soundEnabled);
        }}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* 2-Column Responsive Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left/Center Column: Live Feed (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Live Feed Container */}
            <LiveFeed
              config={config}
              settings={settings}
              streamUrl={streamUrl}
              isFlashActive={settings.flash === 1}
              isShutterFlashing={isShutterFlashing}
              zoomLevel={zoomLevel}
              showHud={showHud}
              onRefreshStream={handleRefreshStream}
              onSwitchToSimulator={handleToggleSimulator}
              onElementReady={(el) => {
                activeElementRef.current = el;
              }}
            />
          </div>

          {/* Right Column: Joystick (Pan & Tilt) -> Toolbar -> Security Snapshot -> Camera Controls (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-5">
            {/* 1. Pan & Tilt Servo Control (Joystick) */}
            <JoystickController
              pan={settings.pan}
              tilt={settings.tilt}
              onPanTiltChange={handlePanTiltChange}
              savedAngle={savedAngles[0] || null}
              onSaveAngle={handleSaveAngle}
            />

            {/* 2. Action Toolbar (moved below Pan & Tilt Servo Control) */}
            <Toolbar
              flashlightOn={settings.flash === 1}
              isFullscreen={isFullscreen}
              showHud={showHud}
              isCapturing={isCapturing}
              isFlashLoading={isFlashLoading}
              isGalleryOpen={isGalleryOpen}
              snapshotsCount={snapshots.length}
              onSnapshot={handleSnapshot}
              onToggleGallery={() => setIsGalleryOpen(!isGalleryOpen)}
              onToggleFlashlight={handleToggleFlashlight}
              onToggleFullscreen={handleToggleFullscreen}
              onRefreshStream={handleRefreshStream}
              onToggleHud={() => setShowHud(!showHud)}
            />

            {/* 2. Security Snapshot Gallery (shown only when snapshot is clicked or toggled) */}
            {isGalleryOpen && (
              <div className="transition-all animate-in fade-in zoom-in-95 duration-200">
                <SnapshotGallery
                  snapshots={snapshots}
                  onSelectSnapshot={(snap) => setSelectedSnapshot(snap)}
                  onDeleteSnapshot={handleDeleteSnapshot}
                  onClearAll={handleClearAllSnapshots}
                  onDownloadSnapshot={handleDownloadSnapshot}
                  onClose={() => setIsGalleryOpen(false)}
                />
              </div>
            )}

            {/* 3. Camera Settings Controls: Button trigger on current place that opens it when clicked */}
            {!isCameraControlsOpen ? (
              <button
                type="button"
                onClick={() => setIsCameraControlsOpen(true)}
                className="w-full flex items-center justify-between p-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-teal-500/40 rounded-2xl shadow-xl transition-all group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 group-hover:scale-105 transition-transform">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                      <span>Camera Settings</span>
                      {savedAngles[0] && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-500/40">
                          Saved: {savedAngles[0].pan}°, {savedAngles[0].tilt}°
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-400 group-hover:text-teal-300 px-3 py-1.5 rounded-lg bg-teal-950/60 border border-teal-500/30 shrink-0 shadow-xs">
                  <span>Open Settings</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </button>
            ) : (
              <div className="space-y-2">
                <CameraControls
                  settings={settings}
                  onUpdateSetting={handleUpdateSetting}
                  onResetSettings={handleResetSettings}
                  onClose={() => setIsCameraControlsOpen(false)}
                  onPanTiltChange={handlePanTiltChange}
                  savedAngles={savedAngles}
                  onSaveAngle={handleSaveAngle}
                  onDeleteAngle={handleDeleteAngle}
                  onResetServoAngle={handleResetServoAngle}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Configuration Modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />

      {/* Snapshot Lightbox Modal */}
      <LightboxModal
        snapshot={selectedSnapshot}
        onClose={() => setSelectedSnapshot(null)}
        onDelete={handleDeleteSnapshot}
        onDownload={handleDownloadSnapshot}
      />
    </div>
  );
}
