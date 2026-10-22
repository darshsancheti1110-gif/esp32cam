import React, { useState } from 'react';
import { X, Check, Globe, HelpCircle, RefreshCw, Cpu, Server } from 'lucide-react';
import { CameraConfig } from '../types/camera';
import { checkEsp32Connectivity, normalizeBaseUrl } from '../services/esp32Service';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CameraConfig;
  onSaveConfig: (newConfig: CameraConfig) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [ip, setIp] = useState(config.ip);
  const [streamPort, setStreamPort] = useState<number | undefined>(config.streamPort || 80);
  const [streamPath, setStreamPath] = useState(config.streamPath);
  const [capturePath, setCapturePath] = useState(config.capturePath);
  const [controlPath, setControlPath] = useState(config.controlPath);
  const [servoPanVar, setServoPanVar] = useState(config.servoPanVar || 'pan');
  const [servoTiltVar, setServoTiltVar] = useState(config.servoTiltVar || 'tilt');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const tempConfig: CameraConfig = {
      ...config,
      ip: normalizeBaseUrl(ip),
      streamPort: streamPort || 80,
      streamPath,
      capturePath,
      controlPath,
      isSimulated: false,
    };

    const isConnected = await checkEsp32Connectivity(tempConfig);
    setIsTesting(false);

    if (isConnected) {
      setTestResult({
        success: true,
        message: `Device reached at ${tempConfig.ip}! Ready for streaming.`,
      });
    } else {
      setTestResult({
        success: false,
        message: `Could not reach ${tempConfig.ip}. Ensure your device is powered on, connected to the same Wi-Fi, or switch to Simulator Mode.`,
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedIp = normalizeBaseUrl(ip);
    onSaveConfig({
      ...config,
      ip: normalizedIp,
      streamPort: streamPort || 80,
      streamPath: streamPath.trim() || '/stream',
      capturePath: capturePath.trim() || '/capture',
      controlPath: controlPath.trim() || '/control',
      servoPanVar: servoPanVar.trim() || 'pan',
      servoTiltVar: servoTiltVar.trim() || 'tilt',
    });
    onClose();
  };

  const applyPreset = (presetIp: string, sPort: number, sPath: string) => {
    setIp(presetIp);
    setStreamPort(sPort);
    setStreamPath(sPath);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="config-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 id="config-modal-title" className="text-base font-semibold text-zinc-100">
                ESP32-CAM Connection Setup
              </h2>
              <p className="text-xs text-zinc-400">Configure base IP address and CameraWebServer endpoints</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto max-h-[calc(85vh-130px)]">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Quick Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('http://192.168.1.15', 80, '/stream')}
                className="px-2.5 py-2 text-xs rounded-lg border border-zinc-800 bg-zinc-950/60 hover:border-teal-500/40 hover:bg-zinc-800/60 text-zinc-300 text-left transition-all"
              >
                <div className="font-semibold text-zinc-200 truncate">Default 192.168.1.15</div>
                <div className="text-[10px] text-zinc-500">Standard port 80</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('http://192.168.4.1', 80, '/stream')}
                className="px-2.5 py-2 text-xs rounded-lg border border-zinc-800 bg-zinc-950/60 hover:border-teal-500/40 hover:bg-zinc-800/60 text-zinc-300 text-left transition-all"
              >
                <div className="font-semibold text-zinc-200 truncate">Access Point AP</div>
                <div className="text-[10px] text-zinc-500">192.168.4.1 default</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('http://192.168.1.15', 81, '/stream')}
                className="px-2.5 py-2 text-xs rounded-lg border border-zinc-800 bg-zinc-950/60 hover:border-teal-500/40 hover:bg-zinc-800/60 text-zinc-300 text-left transition-all"
              >
                <div className="font-semibold text-zinc-200 truncate">Stream Port 81</div>
                <div className="text-[10px] text-zinc-500">Dual server sketch</div>
              </button>
            </div>
          </div>

          {/* Primary Base IP / URL */}
          <div>
            <label htmlFor="esp-ip-input" className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              ESP32-CAM Base IP Address <span className="text-teal-400">*</span>
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Globe className="w-4 h-4" />
              </div>
              <input
                id="esp-ip-input"
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="http://192.168.1.15"
                required
                className="block w-full pl-9 pr-24 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="absolute inset-y-1 right-1 px-3 flex items-center gap-1.5 text-xs font-medium text-teal-400 hover:text-teal-300 bg-zinc-900 hover:bg-zinc-800 rounded-md border border-zinc-800 transition-colors disabled:opacity-50"
              >
                {isTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{isTesting ? 'Testing' : 'Test Ping'}</span>
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              The local IP printed in the Arduino Serial Monitor after Wi-Fi connects.
            </p>
          </div>

          {/* Test Result Message */}
          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs border ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              }`}
            >
              <div className="font-semibold mb-0.5">
                {testResult.success ? 'Device Reachable' : 'Connection Warning'}
              </div>
              <div>{testResult.message}</div>
            </div>
          )}

          {/* Advanced Endpoint Paths Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium"
            >
              <span>{showAdvanced ? 'Hide Custom Endpoints' : 'Customize Endpoints & Ports'}</span>
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-3 p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80 animate-fadeIn text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Stream Port</label>
                  <input
                    type="number"
                    value={streamPort || 80}
                    onChange={(e) => setStreamPort(parseInt(e.target.value) || 80)}
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-md font-mono text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Stream Path</label>
                  <input
                    type="text"
                    value={streamPath}
                    onChange={(e) => setStreamPath(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-md font-mono text-zinc-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Capture Snapshot Path</label>
                  <input
                    type="text"
                    value={capturePath}
                    onChange={(e) => setCapturePath(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-md font-mono text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Control Command Path</label>
                  <input
                    type="text"
                    value={controlPath}
                    onChange={(e) => setControlPath(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-md font-mono text-zinc-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-zinc-800">
                <div>
                  <label className="block text-zinc-400 mb-1">Servo Pan Variable</label>
                  <input
                    type="text"
                    value={servoPanVar}
                    onChange={(e) => setServoPanVar(e.target.value)}
                    placeholder="pan"
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-md font-mono text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Servo Tilt Variable</label>
                  <input
                    type="text"
                    value={servoTiltVar}
                    onChange={(e) => setServoTiltVar(e.target.value)}
                    placeholder="tilt"
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-md font-mono text-zinc-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Browser / Mixed-Content Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400">
            <HelpCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-medium text-zinc-200">Local Network & Browser Security</div>
              <p className="leading-relaxed">
                When accessing local devices (e.g. <code className="text-teal-300">192.168.x.x</code>) from a secure website, modern browsers may require you to allow mixed content for this origin or access the app over HTTP. You can also switch to <strong>Simulator Mode</strong> at any time to test all camera features without hardware.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-teal-400 hover:bg-teal-300 rounded-lg shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
